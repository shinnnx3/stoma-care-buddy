import { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Camera, RotateCcw, Check, X, ImagePlus } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
      setCameraStarted(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError("카메라 접근이 거부되었습니다. 갤러리에서 사진을 선택하거나 브라우저 설정에서 카메라 권한을 허용해주세요.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setCapturedBlob(blob);
              setCapturedImage(URL.createObjectURL(blob));
              stopCamera();
            }
          },
          "image/jpeg",
          0.9
        );
      }
    }
  }, [stopCamera]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      stopCamera();
      setCapturedBlob(file);
      setCapturedImage(URL.createObjectURL(file));
    }
  }, [stopCamera]);

  const openGallery = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCapturedBlob(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedBlob) {
      onCapture(capturedBlob);
    }
  }, [capturedBlob, onCapture]);

  const handleCancel = useCallback(() => {
    stopCamera();
    onCancel();
  }, [stopCamera, onCancel]);

  // Hidden file input for gallery selection
  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/*"
      onChange={handleFileSelect}
      className="hidden"
    />
  );

  if (error && !capturedImage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6">
        {fileInput}
        <div className="text-center">
          <div className="mb-4 rounded-full bg-destructive/10 p-4 inline-block">
            <Camera className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">카메라 접근 오류</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Button variant="hero" onClick={openGallery}>
              <ImagePlus className="mr-2 h-5 w-5" />
              갤러리에서 선택
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground">
      {fileInput}
      <div className="relative flex-1 overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay guide */}
        {!capturedImage && cameraStarted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-4 border-primary/50 rounded-3xl">
              <div className="absolute -top-13 left-1/2 -translate-x-1/2 bg-foreground/80 text-background px-3 py-1 rounded-full text-sm">
                A4지와 장루를 함께 찍어주세요.
              </div>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 rounded-full bg-foreground/50 text-background hover:bg-foreground/70 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Controls */}
      <div className="bg-foreground p-6 pb-24 safe-area-inset-bottom">
        <div className="flex items-center justify-center gap-6">
          {capturedImage ? (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={retakePhoto}
                className="bg-background/10 border-background/30 text-background hover:bg-background/20"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                다시 선택
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={confirmPhoto}
              >
                <Check className="mr-2 h-5 w-5" />
                사용하기
              </Button>
            </>
          ) : (
            <>
              {/* Gallery button */}
              <button
                onClick={openGallery}
                className="w-14 h-14 rounded-full bg-background/20 flex items-center justify-center hover:bg-background/30 active:scale-95 transition-all"
              >
                <ImagePlus className="h-6 w-6 text-background" />
              </button>

              {/* Capture button */}
              <button
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-background flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
              >
                <div className="w-16 h-16 rounded-full border-4 border-primary" />
              </button>

              {/* Spacer for balance */}
              <div className="w-14 h-14" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
