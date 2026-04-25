import { useState, useRef, useCallback, useEffect } from 'react';

interface CameraState {
  isActive: boolean;
  error: string | null;
  hasPermission: boolean | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    isActive: false,
    error: null,
    hasPermission: null,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const start = useCallback(async (facingMode: 'environment' | 'user' = 'environment') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setState({ isActive: true, error: null, hasPermission: true });
    } catch (err: any) {
      const error = err.name === 'NotAllowedError'
        ? 'Kameraga ruxsat berilmagan'
        : err.name === 'NotFoundError'
        ? 'Kamera topilmadi'
        : 'Kamera xatoligi';

      setState({ isActive: false, error, hasPermission: false });
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(s => ({ ...s, isActive: false }));
  }, []);

  const capturePhoto = useCallback((quality = 0.85): string | null => {
    if (!videoRef.current) return null;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', quality);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return {
    ...state,
    videoRef,
    start,
    stop,
    capturePhoto,
  };
}
