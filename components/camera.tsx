import { useRef, useEffect, useState } from 'react';

interface CameraProps {
  onCapture: (imageData: string) => void;
}

export function Camera({ onCapture }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Camera component mounted, initializing...');
    const currentVideo = videoRef.current;
    
    const startCamera = async () => {
      console.log('Checking browser compatibility...');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Browser does not support camera access');
        setIsLoading(false);
        return;
      }

      console.log('Browser supports camera access, requesting permissions...');
      try {
        const constraints = {
          video: { 
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        };
        console.log('Requesting stream with constraints:', constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera stream obtained successfully:', stream.getVideoTracks()[0].getSettings());
        
        if (currentVideo) {
          console.log('Setting video source object...');
          currentVideo.srcObject = stream;
          
          currentVideo.onloadedmetadata = () => {
            console.log('Video metadata loaded, attempting to play...');
            currentVideo?.play()
              .then(() => {
                console.log('Video playing successfully');
                setIsStreaming(true);
                setIsLoading(false);
              })
              .catch(err => {
                console.error('Error playing video:', err);
                setIsLoading(false);
              });
          };

          currentVideo.onerror = (err) => {
            console.error('Video element error:', err);
          };
        } else {
          console.error('Video element reference not found');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (err instanceof DOMException) {
          console.log('DOMException details:', {
            name: err.name,
            message: err.message,
            code: err.code
          });
        }
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      console.log('Cleaning up camera resources...');
      if (currentVideo?.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
      }
    };
  }, []);

  const captureImage = () => {
    console.log('Attempting to capture image...');
    if (!videoRef.current || !isStreaming) {
      console.log('Cannot capture: video not ready or not streaming');
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    
    console.log(`Canvas dimensions set to: ${canvas.width}x${canvas.height}`);
    
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      console.log('Image captured successfully');
      onCapture(imageData);
    } else {
      console.error('Failed to get canvas context');
    }
  };

  return (
    <div className="relative w-full h-[60vh] max-w-md mx-auto bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          <p>Initializing camera...</p>
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        controls={false}
        webkit-playsinline="true"
        className="absolute inset-0 w-full h-full object-cover"
        aria-label="Camera viewfinder"
      />
      {isStreaming && (
        <div className="absolute inset-x-0 bottom-4 flex justify-center">
          <button
            onClick={captureImage}
            className="bg-white rounded-full p-4 shadow-lg hover:bg-gray-100 transition-colors"
            aria-label="Take photo"
          >
            <div className="w-12 h-12 rounded-full border-4 border-gray-800" />
          </button>
        </div>
      )}
    </div>
  );
}
