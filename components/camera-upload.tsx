"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Camera, Upload, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface CameraUploadProps {
  onImageProcessed: (result: { productName: string; expiryDate: string }) => void
}

export function CameraUpload({ onImageProcessed }: CameraUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCapturing(true)
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      })
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track) => track.stop())
      videoRef.current.srcObject = null
      setIsCapturing(false)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)

        processImage(canvasRef.current.toDataURL("image/png"))
      }
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

  const processImage = (imageData: string) => {
    setIsProcessing(true)

    // Simulate processing with a timeout
    // In a real app, this would call an API to process the image
    setTimeout(() => {
      setIsProcessing(false)
      stopCamera()

      // Mock result - in a real app this would come from the API
      onImageProcessed({
        productName: "Sample Medicine",
        expiryDate: "2025-12-31",
      })
    }, 2000)
  }

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          <div
            className="relative w-full max-w-md aspect-[4/3] bg-muted rounded-lg overflow-hidden border-2 border-primary"
            aria-live="polite"
          >
            {isCapturing ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  aria-label="Camera viewfinder"
                />
                <div className="absolute inset-0 border-4 border-dashed border-primary-foreground opacity-50 m-4 pointer-events-none"></div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-xl text-center px-4">
                  {isProcessing
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
              <Button size="lg" className="h-16 text-lg" onClick={startCamera} disabled={isProcessing}>
                <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
                Open Camera
              </Button>
            ) : (
              <Button size="lg" className="h-16 text-lg" onClick={captureImage} disabled={isProcessing}>
                <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
                Capture Image
              </Button>
            )}

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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              aria-label="Upload product image"
            />
          </div>

          {isCapturing && (
            <Button variant="outline" size="lg" className="h-12 text-lg" onClick={stopCamera}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

