import { useState, useEffect } from "react";
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";

export function useFaceApi() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadModels() {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsLoaded(true);
      } catch (err: any) {
        console.error("Failed to load face-api models", err);
        setError("Could not load face recognition models. Please check your connection.");
      }
    }
    loadModels();
  }, []);

  const getFaceDescriptor = async (videoElement: HTMLVideoElement): Promise<number[] | null> => {
    if (!isLoaded) return null;
    
    try {
      const detection = await faceapi
        .detectSingleFace(videoElement)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) return null;
      
      // Convert Float32Array to standard JS Array of numbers
      return Array.from(detection.descriptor);
    } catch (err) {
      console.error("Error during face detection", err);
      return null;
    }
  };

  return { isLoaded, error, getFaceDescriptor, faceapi };
}
