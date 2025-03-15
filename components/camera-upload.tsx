"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Camera, Upload, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { processImageWithNebius } from "@/lib/utils"
import { SpeakableElement } from "@/components/speakable-element"

interface CameraUploadProps {
  onImageProcessed: (result: { productName: string; expiryDate: string }) => void
}

export function CameraUpload({ onImageProcessed }: CameraUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const { toast } = useToast()

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const startCamera = async () => {
    console.log('Starting camera initialization...');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Browser API check failed: mediaDevices not supported');
      toast({
        title: "Camera Error",
        description: "Your browser doesn't support camera access",
        variant: "destructive",
      })
      return
    }

    setIsCameraLoading(true)
    setShowVideo(true)  // Show the video element first

    // Small delay to ensure video element is mounted
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      console.log('Requesting camera stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      })
      console.log('Camera stream obtained:', stream.getVideoTracks()[0].getSettings());
      
      streamRef.current = stream
      
      if (!videoRef.current) {
        console.error('Video element reference not found');
        throw new Error('Video element not initialized');
      }

      console.log('Setting video source...');
      videoRef.current.srcObject = stream
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        if (!videoRef.current) return reject('No video element');
        
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, attempting playback...');
          videoRef.current?.play()
            .then(() => {
              console.log('Video playback started successfully');
              setIsCapturing(true)
              setIsCameraLoading(false)
              resolve(true)
            })
            .catch(err => {
              console.error("Error playing video:", err)
              reject(err)
            })
        }
      })
    } catch (err) {
      console.error("Camera initialization error:", err);
      setShowVideo(false)
      toast({
        title: "Camera Error",
        description: err instanceof DOMException && err.name === "NotAllowedError" 
          ? "Camera access denied. Please grant permission." 
          : `Could not access camera: ${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      })
      setIsCameraLoading(false)
      stopCamera()
    }
  }

  const stopCamera = () => {
    console.log('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop()
      });
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsCapturing(false)
    setShowVideo(false)
    console.log('Camera stopped');
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    
    // Ensure dimensions are set correctly
    canvas.width = video.videoWidth || video.clientWidth
    canvas.height = video.videoHeight || video.clientHeight
    
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      processImage(canvas.toDataURL("image/jpeg", 0.9)) // Better compression
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          processImage(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const processImage = async (imageData: string) => {
    setIsProcessing(true)

    try {
      const result = await processImageWithNebius(imageData)

      if (result.success && result.productName && result.expiryDate) {
        onImageProcessed({
          productName: result.productName,
          expiryDate: result.expiryDate,
        })
        toast({
          title: "Success",
          description: "Image processed successfully",
        })
      } else {
        throw new Error(result.error || "Failed to process image")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      stopCamera()
    }
  }

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          <div
            className="relative w-full max-w-md aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 border-primary"
            aria-live="polite"
          >
            {showVideo ? (
              <>
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
                {isCapturing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                    <SpeakableElement text="Take a photo of the product">
                      <Button 
                        className="bg-white hover:bg-gray-100 text-black font-bold py-3 px-6 rounded-full shadow-lg z-10"
                        onClick={captureImage} 
                        disabled={isProcessing}
                      >
                        <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
                        Take Photo
                      </Button>
                    </SpeakableElement>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-xl text-center px-4 text-white">
                  {isCameraLoading
                    ? "Initializing camera..."
                    : isProcessing
                      ? "Processing image..."
                      : "Capture or upload an image of a product to read its expiry date"}
                </p>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="text-lg">Processing image...</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            {!isCapturing ? (
              <SpeakableElement text="Open camera to take a photo">
                <Button 
                  size="lg" 
                  className="h-16 text-lg" 
                  onClick={startCamera} 
                  disabled={isProcessing || isCameraLoading}
                >
                  <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
                  {isCameraLoading ? "Starting Camera..." : "Open Camera"}
                </Button>
              </SpeakableElement>
            ) : (
              <SpeakableElement text="Cancel photo capture">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 text-lg"
                  onClick={stopCamera}
                  disabled={isProcessing}
                >
                  <X className="w-6 h-6 mr-2" aria-hidden="true" />
                  Cancel
                </Button>
              </SpeakableElement>
            )}
            
            <SpeakableElement text="Upload an existing product image">
              <Button
                variant="outline"
                size="lg"
                className="h-16 text-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isCapturing}
              >
                <Upload className="w-6 h-6 mr-2" aria-hidden="true" />
                Upload Image
              </Button>
            </SpeakableElement>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              aria-label="Upload product image"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
