import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;
  private readonly textModel: string;
  private readonly visionModel: string;

  constructor(private config: ConfigService) {
    this.baseUrl = config.get('OLLAMA_URL', 'http://localhost:11434');
    this.textModel = config.get('OLLAMA_TEXT_MODEL', 'llama3.1:8b');
    this.visionModel = config.get('OLLAMA_VISION_MODEL', 'llava:7b');
  }

  /**
   * Text generation with llama3.1:8b
   */
  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: this.textModel,
          messages,
          stream: false,
          options: { temperature: 0.3, num_predict: 1024 },
        },
        { timeout: 60000 },
      );

      return response.data.message?.content || '';
    } catch (error) {
      this.logger.error(`Ollama text generation failed: ${error.message}`);
      return 'AI tahlil mavjud emas (Ollama offline)';
    }
  }

  /**
   * Vision analysis with llava:7b - analyze tree images
   */
  async analyzeImage(imageBase64: string, question: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.visionModel,
          prompt: question,
          images: [imageBase64],
          stream: false,
          options: { temperature: 0.2, num_predict: 512 },
        },
        { timeout: 90000 },
      );

      return response.data.response || '';
    } catch (error) {
      this.logger.error(`Ollama vision analysis failed: ${error.message}`);
      return 'Rasm tahlili mavjud emas (llava offline)';
    }
  }

  /**
   * Analyze tree health from CV results
   */
  async analyzeTreeHealth(cvResult: {
    treeCount: number;
    healthScore: number;
    ndvi: number;
    detections: any[];
  }): Promise<string> {
    const prompt = `
Daraxt monitoring natijalarini o'zbek tilida tahlil qiling:
- Aniqlangan daraxtlar soni: ${cvResult.treeCount}
- Sog'liq ko'rsatkichi: ${cvResult.healthScore}/100
- O'simlik indeksi (NDVI): ${cvResult.ndvi.toFixed(2)}
- Aniqlangan ob'ektlar: ${JSON.stringify(cvResult.detections)}

Qisqacha (2-3 gap) xulosa bering: daraxt holati qanday, xavotirli holatlar bormi, tavsiyalar nima?
`;
    return this.generate(prompt, 'Siz ekologiya va daraxt salomatligi bo\'yicha mutaxasssissiz.');
  }

  /**
   * Analyze fraud patterns
   */
  async analyzeFraudRisk(data: {
    stateReported: number;
    detected: number;
    healthScore: number;
    exifMismatch: boolean;
    gpsDistance: number;
  }): Promise<{ riskLevel: string; explanation: string; recommendation: string }> {
    const prompt = `
Quyidagi ma'lumotlar asosida firibgarlik xavfini baholang:
- Davlat hisobotidagi daraxtlar: ${data.stateReported}
- Haqiqatda aniqlangan: ${data.detected}
- Sog'liq ko'rsatkichi: ${data.healthScore}/100
- EXIF ma'lumot nomuvofiqlik: ${data.exifMismatch ? 'Ha' : 'Yo\'q'}
- GPS masofasi (m): ${data.gpsDistance}

JSON formatida javob bering:
{"riskLevel": "low|medium|high", "explanation": "...", "recommendation": "..."}
`;
    try {
      const response = await this.generate(prompt, 'Siz korrupsiyaga qarshi kurash mutaxasssissiz.');
      const jsonMatch = response.match(/\{[^}]+\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {}
    return {
      riskLevel: data.detected < data.stateReported * 0.5 ? 'high' : 'low',
      explanation: 'Avtomatik baholash',
      recommendation: 'Qo\'shimcha tekshiruv tavsiya etiladi',
    };
  }

  /**
   * Generate fraud report narrative
   */
  async generateFraudReport(evidence: {
    location: string;
    stateReported: number;
    detected: number;
    healthScore: number;
    photos: string[];
    timestamp: string;
    blockchainHash: string;
  }): Promise<string> {
    const prompt = `
Quyidagi dalillar asosida rasmiy firibgarlik hisobotini o'zbek tilida tuzing:

Joylashuv: ${evidence.location}
Holat: Davlat ${evidence.stateReported} ta daraxt ekilganligini bildiradi, aslida ${evidence.detected} ta aniqlandi
Sog'liq: ${evidence.healthScore}/100
Sana: ${evidence.timestamp}
Blockchain tasdiq: ${evidence.blockchainHash.slice(0, 16)}...

Hisobot quyidagi bo'limlarni o'z ichiga olsin:
1. Xulosa
2. Aniqlangan nomuvofiqliklar
3. Taqdim etilgan dalillar
4. Tavsiyalar
5. Mas'ul organlar uchun harakat qadamlari
`;
    return this.generate(prompt, 'Siz yuridik hujjat mutaxassississiz. Rasmiy, aniq va dalilga asoslangan tilda yozing.');
  }

  /**
   * Check if Ollama is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return response.data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }
}
