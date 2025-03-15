"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Camera, Upload, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useSpeech } from "@/hooks/use-speech"
import { processImageWithNebius } from "@/lib/utils"
import { SpeakableElement } from "./SpeakableElement"

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
  const { speak } = useSpeech()

  const announceStatus = useCallback((message: string) => {
    speak(message)
  }, [speak])

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  const startCamera = async () => {
    announceStatus('Starting camera. Please wait.')
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const error = 'Your browser does not support camera access'
      toast({
        title: "Camera Error",
        description: error,
        variant: "destructive",
      })
      announceStatus(error)
      return
    }

    setIsCameraLoading(true)
    setShowVideo(true)
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      streamRef.current = stream
      
      if (!videoRef.current) {
        throw new Error('Video element not initialized')
      }
      
      videoRef.current.srcObject = stream
      videoRef.current.style.display = 'block'
      
      await new Promise((resolve, reject) => {
        if (!videoRef.current) return reject('No video element')
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
            .then(() => {
              setIsCapturing(true)
              setIsCameraLoading(false)
              announceStatus('Camera is ready. Press Space or Enter to take a photo.')
              resolve(true)
            })
            .catch(err => reject(err))
        }
      })
    } catch (err) {
      setShowVideo(false)
      const error = err instanceof DOMException && err.name === "NotAllowedError"
        ? "Camera access denied. Please grant permission."
        : `Could not access camera: ${err instanceof Error ? err.message : String(err)}`
      
      toast({
        title: "Camera Error",
        description: error,
        variant: "destructive",
      })
      announceStatus(error)
      setIsCameraLoading(false)
      stopCamera()
    }
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsCapturing(false)
    setShowVideo(false)
    announceStatus('Camera stopped')
  }, [announceStatus])

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    
    announceStatus('Taking photo')
    const video = videoRef.current
    const canvas = canvasRef.current
    
    canvas.width = video.videoWidth || video.clientWidth
    canvas.height = video.videoHeight || video.clientHeight
    
    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      processImage(canvas.toDataURL("image/jpeg", 0.9))
    }
  }, [announceStatus])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      announceStatus('Processing uploaded image')
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          processImage(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }, [announceStatus])

  const processImage = async (imageData: string) => {
    setIsProcessing(true)
    announceStatus('Processing image. Please wait.')
    
    try {
      const result = await processImageWithNebius(imageData)
      if (result.success && result.productName && result.expiryDate) {
        onImageProcessed({
          productName: result.productName,
          expiryDate: result.expiryDate,
        })
        announceStatus('Image processed successfully')
        toast({
          title: "Success",
          description: "Image processed successfully",
        })
      } else {
        throw new Error(result.error || "Failed to process image")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process image"
      announceStatus('Error: ' + errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      stopCamera()
    }
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isCapturing && !isProcessing && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault()
        captureImage()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isCapturing, isProcessing, captureImage])

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div 
          className="flex flex-col items-center space-y-6"
          role="region"
          aria-label="Image capture section"
        >
          <SpeakableElement text="Camera viewfinder area. When camera is active, this will show the live camera feed.">
            <div
              className="relative w-full max-w-md aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 border-primary"
              role="region"
              aria-label="Camera viewfinder"
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
                    style={{ display: 'block' }}
                    aria-label="Live camera feed"
                  />
                  {isCapturing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                      <SpeakableElement text="Take photo button. Captures the current camera view. You can also press Space or Enter to take a photo.">
                        <Button 
                          className="bg-white hover:bg-gray-100 text-black font-bold py-3 px-6 rounded-full shadow-lg z-10"
                          onClick={captureImage} 
                          disabled={isProcessing}
                          aria-label="Take photo. Press Space or Enter"
                        >
                          <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
                          Take Photo
                        </Button>
                      </SpeakableElement>
                    </div>
                  )}
                </>
              ) : (
                <div 
                  className="flex items-center justify-center w-full h-full"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-xl text-center px-4 text-white">
                    {isCameraLoading
                      ? "Initializing camera..."
                      : isProcessing
                        ? "Processing image..."
                        : "Capture or upload an image of a product to read its expiry date"}
                  </p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
            </div>
          </SpeakableElement>

          {isProcessing && (
            <div 
              className="flex items-center justify-center gap-2"
              role="status"
              aria-live="polite"
            >
              <RefreshCw className="w-6 h-6 animate-spin" aria-hidden="true" />
              <span className="text-lg">Processing image...</span>
            </div>
          )}

          <div 
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md"
            role="group"
            aria-label="Image capture controls"
          >
            {!isCapturing ? (
              <SpeakableElement text="Open Camera button. Activates your device camera to take a photo of a medicine product.">
                <Button 
                  size="lg" 
                  className="h-16 text-lg" 
                  onClick={startCamera} 
                  disabled={isProcessing || isCameraLoading}
                  aria-label={isCameraLoading ? "Starting Camera..." : "Open Camera"}
                >
                  <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
                  {isCameraLoading ? "Starting Camera..." : "Open Camera"}
                </Button>
              </SpeakableElement>
            ) : (
              <SpeakableElement text="Cancel button. Stops the camera and returns to the initial screen.">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-16 text-lg"
                  onClick={stopCamera}
                  disabled={isProcessing}
                  aria-label="Stop camera"
                >
                  <X className="w-6 h-6 mr-2" aria-hidden="true" />
                  Cancel
                </Button>
              </SpeakableElement>
            )}
            
            <SpeakableElement text="Upload Image button. Opens file picker to select a product photo from your device.">
              <Button
                variant="outline"
                size="lg"
                className="h-16 text-lg"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing || isCapturing}
                aria-label="Upload product image"
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
              aria-label="File input for uploading product image"
              tabIndex={-1}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
