import { pipeline } from '@huggingface/transformers';

interface DetectedFace {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  embedding?: number[];
  verifiedPerson?: {
    name: string;
    id: string;
    role: string;
    confidence: number;
  };
}

interface StoredPerson {
  id: string;
  name: string;
  role: string;
  faceEmbedding?: number[];
  image?: string;
}

class FaceVerificationService {
  private faceDetector: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize face detection model
      this.faceDetector = await pipeline(
        'object-detection',
        'Xenova/yolos-tiny',
        { device: 'webgpu' }
      );
      
      this.isInitialized = true;
      console.log('Face verification service initialized');
    } catch (error) {
      console.error('Failed to initialize face verification:', error);
      this.isInitialized = false;
    }
  }

  // Simulate face embedding generation
  generateFaceEmbedding(faceData: { x: number; y: number; width: number; height: number }): number[] {
    // In a real implementation, this would extract facial features
    // For simulation, we generate a consistent embedding based on face properties
    const seed = faceData.x + faceData.y + faceData.width + faceData.height;
    const embedding: number[] = [];
    
    for (let i = 0; i < 128; i++) {
      embedding.push(Math.sin(seed + i) * Math.cos(seed * i));
    }
    
    return embedding;
  }

  // Calculate similarity between two face embeddings
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    return Math.max(0, Math.min(1, similarity));
  }

  // Verify faces against stored database
  verifyFaces(detectedFaces: DetectedFace[], storedPersons: StoredPerson[]): DetectedFace[] {
    if (!this.isInitialized || storedPersons.length === 0) {
      return detectedFaces;
    }

    const SIMILARITY_THRESHOLD = 0.7;

    return detectedFaces.map(face => {
      // Generate embedding for detected face
      const faceEmbedding = this.generateFaceEmbedding(face);
      face.embedding = faceEmbedding;

      let bestMatch: StoredPerson | null = null;
      let bestSimilarity = 0;

      // Compare with all stored persons
      for (const person of storedPersons) {
        if (!person.faceEmbedding) {
          // Generate embedding for stored person if not available
          person.faceEmbedding = this.generateFaceEmbedding({
            x: 100 + Math.random() * 100,
            y: 100 + Math.random() * 100,
            width: 60,
            height: 80
          });
        }

        const similarity = this.calculateSimilarity(faceEmbedding, person.faceEmbedding);
        
        if (similarity > bestSimilarity && similarity > SIMILARITY_THRESHOLD) {
          bestMatch = person;
          bestSimilarity = similarity;
        }
      }

      // Add verification result
      if (bestMatch) {
        face.verifiedPerson = {
          name: bestMatch.name,
          id: bestMatch.id,
          role: bestMatch.role,
          confidence: bestSimilarity
        };
      }

      return face;
    });
  }

  // Simulate face detection for camera feed
  detectFacesInFrame(frameCount: number, cameraId: string): DetectedFace[] {
    const time = frameCount * 0.1;
    const faces: DetectedFace[] = [];

    // Simulate 1-3 faces per camera
    const numFaces = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numFaces; i++) {
      faces.push({
        id: i + 1,
        x: 80 + Math.sin(time + i) * 60 + Math.random() * 100,
        y: 60 + Math.cos(time * 0.5 + i) * 40 + Math.random() * 80,
        width: 50 + Math.random() * 20,
        height: 65 + Math.random() * 25,
        confidence: 0.75 + Math.random() * 0.2
      });
    }

    return faces;
  }
}

export const faceVerificationService = new FaceVerificationService();
export type { DetectedFace, StoredPerson };