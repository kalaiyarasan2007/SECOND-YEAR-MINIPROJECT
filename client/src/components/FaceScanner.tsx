import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { useFaceApi } from "@/hooks/use-face-api";
import { Button } from "@/components/ui/button";
import { Loader2, ScanFace, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FaceScannerProps {
  onCapture: (descriptor: number[]) => void;
  buttonText?: string;
  isProcessing?: boolean;
}

export function FaceScanner({ onCapture, buttonText = "Capture Face", isProcessing = false }: FaceScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLoaded, error: modelError, getFaceDescriptor, faceapi } = useFaceApi();
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [status, setStatus] = useState<"idle" | "detecting" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  // Draw overlay if needed (optional enhancement)
  useEffect(() => {
    let interval: any;
    
    const drawOverlay = async () => {
      if (!webcamRef.current?.video || !canvasRef.current || !isLoaded) return;
      const video = webcamRef.current.video;
      
      if (video.readyState === 4) {
        const detection = await faceapi.detectSingleFace(video);
        const canvas = canvasRef.current;
        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);
        
        if (detection) {
          const resizedDetections = faceapi.resizeResults(detection, displaySize);
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
          faceapi.draw.drawDetections(canvas, resizedDetections);
        } else {
          canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };

    if (isLoaded && status === "idle") {
      interval = setInterval(drawOverlay, 200);
    }
    
    return () => clearInterval(interval);
  }, [isLoaded, status, faceapi]);

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current?.video) return;
    
    setStatus("detecting");
    setStatusMessage("Scanning face...");
    setIsDetecting(true);
    
    try {
      const descriptor = await getFaceDescriptor(webcamRef.current.video);
      
      if (descriptor) {
        setStatus("success");
        setStatusMessage("Face captured successfully!");
        onCapture(descriptor);
        // Reset after 3 seconds so they can try again if needed
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMessage("No face detected. Please face the camera clearly and ensure good lighting.");
        setTimeout(() => setStatus("idle"), 4000);
      }
    } catch (err) {
      setStatus("error");
      setStatusMessage("An error occurred during scanning.");
    } finally {
      setIsDetecting(false);
    }
  }, [getFaceDescriptor, onCapture]);

  if (modelError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{modelError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full max-w-md mx-auto">
      <div className="relative rounded-2xl overflow-hidden shadow-xl border-4 border-muted bg-black aspect-video w-full flex items-center justify-center">
        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center text-white space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Loading AI Models...</p>
          </div>
        ) : (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "user" }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            
            {status === "success" && (
              <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in">
                <CheckCircle2 className="w-16 h-16 text-green-500 bg-white rounded-full" />
              </div>
            )}
            
            {status === "error" && (
              <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center z-10 animate-in fade-in">
                <AlertCircle className="w-16 h-16 text-red-500 bg-white rounded-full" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="text-center h-6 text-sm font-medium text-muted-foreground">
        {statusMessage}
      </div>

      <Button 
        onClick={handleCapture} 
        disabled={!isLoaded || isDetecting || isProcessing || status === "success"}
        className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all bg-gradient-to-r from-primary to-indigo-600 rounded-xl"
      >
        {isDetecting || isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="mr-2 h-5 w-5" />
            Captured
          </>
        ) : (
          <>
            <ScanFace className="mr-2 h-5 w-5" />
            {buttonText}
          </>
        )}
      </Button>
    </div>
  );
}
