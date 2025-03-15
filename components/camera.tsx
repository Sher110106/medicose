"use client"

import { useRef, useEffect, useState, useCallback } from 'react';
import { useSpeech } from '@/hooks/use-speech';

interface CameraProps {
  onCapture: (imageData: string) => void;
}

export function Camera({ onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const { speak } = useSpeech();

  const announceStatus = useCallback((message: string) => {
    speak(message);
  }, [speak]);

  useEffect(() => {
    const currentVideo = videoRef.current;
    
    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const error = 'Your browser does not support camera access';
        setCameraError(error);
        announceStatus(error);
        setIsLoading(false);
        return;
      }

      try {
        const constraints = {
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (currentVideo) {
          currentVideo.srcObject = stream;
          currentVideo.style.display = 'block'; // Ensure video is visible
          currentVideo.style.transform = 'scaleX(-1)'; // Mirror the video if using front camera
          
          currentVideo.onloadedmetadata = () => {
            currentVideo?.play()
              .then(() => {
                setIsStreaming(true);
                setIsLoading(false);
                announceStatus('Camera is ready. Press Space or Enter to take a photo.');
              })
              .catch(err => {
                const error = 'Unable to start video stream';
                setCameraError(error);
                announceStatus(error);
                setIsLoading(false);
              });
          };
        }
      } catch (err) {
        const error = 'Unable to access camera. Please ensure camera permissions are granted.';
        setCameraError(error);
        announceStatus(error);
        setIsLoading(false);
      }
    };

    announceStatus('Initializing camera. Please wait.');
    startCamera();

    return () => {
      if (currentVideo?.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [announceStatus]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !isStreaming) {
      announceStatus('Camera is not ready yet');
      return;
    }

    announceStatus('Taking photo');
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      announceStatus('Photo captured successfully');
      onCapture(imageData);
    } else {
      announceStatus('Failed to capture photo');
    }
  }, [isStreaming, onCapture, announceStatus]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'Enter') && isStreaming) {
        e.preventDefault();
        captureImage();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isStreaming, captureImage]);

  return (
    <div 
      className="relative w-full h-[60vh] max-w-md mx-auto bg-black"
      role="region"
      aria-label="Camera viewfinder"
    >
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-white"
          role="status"
          aria-live="polite"
        >
          <p>Initializing camera...</p>
        </div>
      )}

      {cameraError && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-white bg-red-900 p-4"
          role="alert"
          aria-live="assertive"
        >
          <p>{cameraError}</p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        controls={false}
        webkit-playsinline="true"
        className="absolute inset-0 w-full h-full object-cover bg-black"
        style={{ display: 'block' }}
        aria-label="Live camera feed"
      />

      {isStreaming && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <button
            onClick={captureImage}
            className="bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            aria-label="Take photo. Press Space or Enter"
            role="button"
          >
            <div 
              className="w-12 h-12 rounded-full border-4 border-gray-800"
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      <div 
        className="sr-only"
        aria-live="polite"
        role="status"
      >
        {isStreaming ? 'Camera is active and ready to take photos' : 'Camera is initializing'}
      </div>
    </div>
  );
}
