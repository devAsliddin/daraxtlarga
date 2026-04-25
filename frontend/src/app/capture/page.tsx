'use client';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Camera, CheckCircle, AlertTriangle, Coins, ArrowLeft, RotateCcw, Map } from 'lucide-react';

const MAX_PHOTOS = 3;
const CAPTURE_MAX_WIDTH = 960;
const CAPTURE_JPEG_QUALITY = 0.72;
const CAPTURE_RADIUS_M = 500;

type Step = 'liveness' | 'camera' | 'analyzing' | 'result';

interface LivenessChallenge {
  id: string;
  instruction: string;
  emoji: string;
}

interface TreeLocation {
  id: string;
  lat: number;
  lng: number;
  status: 'PENDING' | 'VERIFIED' | 'DISPUTED' | 'FRAUD';
}

function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CHALLENGES: LivenessChallenge[] = [
  { id: 'blink', instruction: 'Ko\'zingizni yumib oching', emoji: '👁️' },
  { id: 'turn-left', instruction: 'Chapga qareng', emoji: '⬅️' },
  { id: 'turn-right', instruction: 'O\'ngga qareng', emoji: '➡️' },
  { id: 'smile', instruction: 'Kuling', emoji: '😊' },
  { id: 'nod', instruction: 'Boshingizni qimirlatib ko\'rsating', emoji: '👆' },
];

function CaptureContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, addTokens } = useAuthStore();

  const requestedTreeId = params.get('treeId');
  const requestedLat = Number.parseFloat(params.get('lat') || '');
  const requestedLng = Number.parseFloat(params.get('lng') || '');
  const [autoTree, setAutoTree] = useState<TreeLocation | null>(null);
  const [resolvingTree, setResolvingTree] = useState(!requestedTreeId);

  const treeId = requestedTreeId || autoTree?.id || null;
  const lat = Number.isFinite(requestedLat) ? requestedLat : autoTree?.lat ?? 41.2995;
  const lng = Number.isFinite(requestedLng) ? requestedLng : autoTree?.lng ?? 69.2401;

  const [step, setStep] = useState<Step>('liveness');
  const [challenges, setChallenges] = useState<LivenessChallenge[]>([]);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [userGps, setUserGps] = useState<{ lat: number; lng: number } | null>(null);
  const [result, setResult] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Select 3 random challenges
  useEffect(() => {
    const shuffled = [...CHALLENGES].sort(() => Math.random() - 0.5).slice(0, 3);
    setChallenges(shuffled);
  }, []);

  // Get GPS
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserGps({ lat, lng }), // Use tree location as fallback for demo
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [lat, lng]);

  useEffect(() => {
    if (requestedTreeId) {
      setResolvingTree(false);
      return;
    }

    let cancelled = false;

    const getCurrentPosition = () =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 12000 },
        );
      });

    const resolveTreeFromLocation = async () => {
      setResolvingTree(true);

      try {
        const gps = await getCurrentPosition();
        if (cancelled) return;
        if (gps) setUserGps(gps);

        const { data } = await api.get('/trees/map');
        if (cancelled) return;

        const candidates = (data as TreeLocation[]).filter(
          (tree) => tree.status === 'PENDING' || tree.status === 'DISPUTED',
        );

        if (gps) {
          const nearest = candidates
            .map((tree) => ({
              tree,
              distance: getDistanceMeters(gps.lat, gps.lng, tree.lat, tree.lng),
            }))
            .sort((a, b) => a.distance - b.distance)[0];

          if (nearest && nearest.distance <= CAPTURE_RADIUS_M) {
            setAutoTree(nearest.tree);
            localStorage.setItem('yq:selected-tree', JSON.stringify(nearest.tree));
            toast.success(`Yaqin lokatsiya tanlandi: ${Math.round(nearest.distance)} m`);
            return;
          }
        }

        const savedRaw = localStorage.getItem('yq:selected-tree');
        const saved = savedRaw ? JSON.parse(savedRaw) as TreeLocation : null;
        const savedCandidate = saved ? candidates.find((tree) => tree.id === saved.id) : null;

        if (!gps && savedCandidate) {
          setAutoTree(savedCandidate);
          return;
        }

        setAutoTree(null);
      } catch {
        setAutoTree(null);
      } finally {
        if (!cancelled) setResolvingTree(false);
      }
    };

    resolveTreeFromLocation();

    return () => {
      cancelled = true;
    };
  }, [requestedTreeId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      toast.error('Kameraga kirish imkoni yo\'q');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const createCompressedImage = (canvas: HTMLCanvasElement) => {
    const originalWidth = canvas.width;
    const originalHeight = canvas.height;
    const maxDimension = Math.max(originalWidth, originalHeight);

    if (maxDimension <= CAPTURE_MAX_WIDTH) {
      return canvas.toDataURL('image/jpeg', CAPTURE_JPEG_QUALITY);
    }

    const scale = CAPTURE_MAX_WIDTH / maxDimension;
    const resizedCanvas = document.createElement('canvas');
    resizedCanvas.width = Math.round(originalWidth * scale);
    resizedCanvas.height = Math.round(originalHeight * scale);

    const resizedContext = resizedCanvas.getContext('2d');
    resizedContext?.drawImage(canvas, 0, 0, resizedCanvas.width, resizedCanvas.height);

    return resizedCanvas.toDataURL('image/jpeg', CAPTURE_JPEG_QUALITY);
  };

  useEffect(() => {
    if (step === 'camera') startCamera();
    return () => stopCamera();
  }, [step]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    const dataUrl = createCompressedImage(canvas);
    setPhotos(prev => [...prev, dataUrl]);
    toast.success(`Rasm ${photos.length + 1} olindi!`);
  };

  const submitVerification = async () => {
    if (!treeId || !userGps) {
      toast.error('Ma\'lumot yetarli emas');
      return;
    }

    setStep('analyzing');
    try {
      const { data } = await api.post('/trees/verify', {
        treeLocationId: treeId,
        photos: photos.length > 0 ? photos : ['data:image/jpeg;base64,/9j/mock'],
        livenessProof: {
          challenges: completedChallenges,
          completed: true,
          timestamp: new Date().toISOString(),
        },
        gpsLat: userGps.lat,
        gpsLng: userGps.lng,
      });

      setResult(data);
      setStep('result');
      // Update in-memory balance so header shows correct number immediately
      if (data.tokensEarned > 0) {
        addTokens(data.tokensEarned, data.tokensEarned * 10);
      }
    } catch (err: any) {
      setStep('camera');
      toast.error(err.response?.data?.message || 'Tekshiruv xatoligi');
    }
  };

  const completeChallenge = () => {
    const current = challenges[currentChallenge];
    setCompletedChallenges(prev => [...prev, current.id]);

    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge(prev => prev + 1);
    } else {
      // All challenges done
      setTimeout(() => setStep('camera'), 500);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-gray-400 mb-4">Skanning qilish uchun kiring</p>
          <button onClick={() => router.push('/auth/login')} className="btn-primary">
            Kirish
          </button>
        </div>
      </div>
    );
  }

  if (resolvingTree) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <header className="flex items-center gap-3 px-4 pb-3 bg-gray-900 border-b border-gray-800" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-white">Daraxt Skanning</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-5 animate-pulse">📍</div>
          <h2 className="text-2xl font-bold mb-3 text-white">Lokatsiya aniqlanmoqda</h2>
          <p className="text-gray-400 leading-relaxed max-w-xs">
            Oldingizdagi eng yaqin tekshiriladigan daraxt nuqtasi qidirilmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (!treeId) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        <header className="flex items-center gap-3 px-4 pb-3 bg-gray-900 border-b border-gray-800" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-white">Daraxt Skanning</h1>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-7xl mb-5">🗺️</div>
          <h2 className="text-2xl font-bold mb-3 text-white">Daraxt tanlang</h2>
          <p className="text-gray-400 mb-8 leading-relaxed max-w-xs">
            Skanning qilish uchun xaritadan daraxt joylashuvini tanlang va u yerdan kamerani oching
          </p>
          <button
            onClick={() => router.push('/map')}
            className="btn-primary px-8 py-4 text-lg flex items-center gap-2"
          >
            <Map size={20} />
            Xaritaga o'tish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pb-3 bg-gray-900 border-b border-gray-800" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-white">Daraxt Skanning</h1>
        {step === 'camera' && (
          <div className="ml-auto flex gap-1">
            {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < photos.length ? 'bg-primary-500 scale-110' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        )}
      </header>

      <div className="flex-1 flex flex-col">
        {/* STEP 1: Liveness Detection */}
        {step === 'liveness' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="text-6xl mb-4">🎭</div>
            <h2 className="text-2xl font-bold mb-2">Liveness Tekshiruvi</h2>
            <p className="text-gray-400 mb-8">
              Siz haqiqiy odamligingizni tasdiqlash uchun 3 ta vazifani bajaring
            </p>

            {/* Progress */}
            <div className="flex gap-2 mb-8">
              {challenges.map((c, i) => (
                <div
                  key={c.id}
                  className={`w-10 h-2 rounded-full transition-all duration-300 ${
                    i < completedChallenges.length ? 'bg-primary-500' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {challenges[currentChallenge] && (
              <motion.div
                key={currentChallenge}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="card text-center mb-6 w-full"
              >
                <div className="text-7xl mb-4">{challenges[currentChallenge].emoji}</div>
                <p className="text-xl font-semibold text-white">
                  {challenges[currentChallenge].instruction}
                </p>
              </motion.div>
            )}

            <button onClick={completeChallenge} className="btn-primary px-8 py-4 text-lg">
              <CheckCircle size={20} />
              Bajardim ({currentChallenge + 1}/{challenges.length})
            </button>
          </motion.div>
        )}

        {/* STEP 2: Camera Capture */}
        {step === 'camera' && (
          <div className="flex-1 flex flex-col">
            <div className="relative flex-1 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-primary-400 rounded-2xl w-3/4 aspect-square opacity-60" />
              </div>

              {/* Instructions */}
              <div className="absolute top-4 left-4 right-4 bg-black/60 rounded-xl px-3 py-2">
                <p className="text-white text-sm text-center">
                  Daraxtni ramkaga joylashtiring va rasm oling
                </p>
                <p className="text-gray-400 text-xs text-center">
                  {photos.length}/{MAX_PHOTOS} rasm (kamida 1 ta kerak)
                </p>
              </div>

              {/* Captured thumbnails */}
              {photos.length > 0 && (
                <div className="absolute bottom-4 left-4 flex gap-2">
                  {photos.map((p, i) => (
                    <img
                      key={i}
                      src={p}
                      className="w-16 h-16 rounded-lg border-2 border-primary-500 object-cover"
                      alt={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-gray-900 px-6 pt-5 flex items-center justify-between" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
              <button
                onClick={() => setPhotos([])}
                className="btn-secondary p-3"
                disabled={photos.length === 0}
              >
                <RotateCcw size={20} />
              </button>

              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl active:scale-95 transition-transform"
                disabled={photos.length >= MAX_PHOTOS}
              >
                <Camera size={32} className="text-gray-900" />
              </button>

              <button
                onClick={submitVerification}
                className="btn-primary px-4 py-3"
                disabled={photos.length === 0}
              >
                Yuborish
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Analyzing */}
        {step === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="text-7xl mb-6 animate-pulse">🤖</div>
            <h2 className="text-2xl font-bold mb-2">AI Tahlil</h2>
            <p className="text-gray-400 mb-8">
              Computer Vision daraxtlarni tekshirmoqda...
            </p>
            <div className="space-y-3 w-full max-w-xs">
              {[
                'YOLOv8 — daraxt aniqlash',
                'MobileNetV3 — sog\'liq baholash',
                'NDVI — o\'simlik indeksi',
                'Blockchain — yozib olish',
              ].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-3 bg-gray-900 rounded-xl p-3"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
                  <span className="text-sm text-gray-300">{step}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP 4: Result */}
        {step === 'result' && result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-y-auto p-4 pb-8"
          >
            {/* Token reward */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="text-center mb-6"
            >
              <div className="text-7xl mb-3">
                {result.newStatus === 'FRAUD' ? '🚨' : result.newStatus === 'DISPUTED' ? '⚠️' : '🎉'}
              </div>
              {result.tokensEarned > 0 && (
                <div className="relative inline-block">
                  {/* Floating coins animation */}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                      animate={{
                        opacity: 0,
                        y: -60 - Math.random() * 40,
                        x: (i % 2 === 0 ? 1 : -1) * (20 + Math.random() * 30),
                        scale: 0.5,
                      }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 text-yellow-400 text-xl pointer-events-none"
                    >
                      🪙
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                    className="inline-flex items-center gap-2 bg-primary-900/50 border border-primary-700 rounded-2xl px-6 py-3"
                  >
                    <Coins className="text-primary-400" size={24} />
                    <span className="text-2xl font-black text-primary-300">
                      +{result.tokensEarned} GT
                    </span>
                  </motion.div>
                </div>
              )}
              {result.newStatus === 'VERIFIED' && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-green-400 text-sm font-semibold mt-3"
                >
                  Balans yangilandi: {(user?.totalTokens ?? 0).toFixed(0)} GT
                </motion.p>
              )}
            </motion.div>

            {/* CV Results */}
            <div className="card mb-4">
              <h3 className="font-bold mb-3 text-gray-200">Computer Vision Natijasi</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-800 rounded-xl p-3">
                  <div className="text-2xl font-bold text-primary-400">
                    {result.verification?.treeCount ?? 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500">Daraxt</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <div className="text-2xl font-bold text-green-400">
                    {result.verification?.healthScore ?? 'N/A'}%
                  </div>
                  <div className="text-xs text-gray-500">Sog'liq</div>
                </div>
                <div className="bg-gray-800 rounded-xl p-3">
                  <div className={`text-sm font-bold ${
                    result.newStatus === 'VERIFIED' ? 'text-green-400' :
                    result.newStatus === 'FRAUD' ? 'text-red-400' : 'text-orange-400'
                  }`}>
                    {result.newStatus === 'VERIFIED' ? '✅' :
                     result.newStatus === 'FRAUD' ? '🚨' : '⚠️'}
                  </div>
                  <div className="text-xs text-gray-500">Holat</div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            {result.aiAnalysis && (
              <div className="card mb-4">
                <h3 className="font-bold mb-2 text-gray-200 flex items-center gap-2">
                  🤖 AI Tahlili
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{result.aiAnalysis}</p>
              </div>
            )}

            {/* Blockchain proof */}
            {result.blockchainHash && (
              <div className="card mb-4">
                <h3 className="font-bold mb-2 text-gray-200 flex items-center gap-2">
                  ⛓️ Blockchain Tasdiq
                </h3>
                <p className="text-xs font-mono text-primary-400 break-all">
                  {result.blockchainHash}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {(result.newStatus === 'FRAUD' || result.newStatus === 'DISPUTED') && (
                <button
                  onClick={() => router.push(`/reports/new?treeId=${treeId}`)}
                  className="w-full bg-red-900/50 border border-red-700 text-red-300 font-semibold py-3 rounded-xl flex items-center justify-center gap-2"
                >
                  <AlertTriangle size={18} />
                  Hisobot yuborish
                </button>
              )}
              <button onClick={() => router.push('/map')} className="btn-primary w-full">
                Xaritaga qaytish
              </button>
              <button onClick={() => router.push('/quests')} className="btn-secondary w-full">
                Vazifalarni ko'rish
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="animate-spin text-4xl">🌀</div></div>}>
      <CaptureContent />
    </Suspense>
  );
}
