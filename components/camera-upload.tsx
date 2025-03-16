"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Camera, Upload, RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { processImageWithNebius } from "@/lib/utils"
import { SpeakableElement } from "@/components/speakable-element"
import { useElementSpeech } from "@/hooks/useElementSpeech"

// Define proper types for medication information
interface DetailedMedicineInfo {
  basic_information?: {
    medicine_name?: string;
    expiry_date?: string;
    manufacturer?: string;
    batch_lot_number?: string;
    manufacturing_date?: string;
    retail_price_mrp?: string;
    barcode_id_numbers?: string;
  };
  composition?: {
    active_ingredients?: string;
    inactive_ingredients_excipients?: string;
  };
  usage_information?: {
    indications?: string;
    storage_instructions?: string;
    dosage_instructions?: string;
    route_of_administration?: string;
    frequency_and_duration?: string;
    benefits_summary?: string;
    additional_information?: string;
  };
  clinical_information?: {
    contraindications?: string;
    side_effects_adverse_reactions?: string;
    drug_interactions?: string;
    warnings_and_precautions?: string;
    special_populations?: string;
    precautions?: string;
  };
  other_details?: {
    regulatory_information?: string;
    prescription_status?: string;
    additional_information?: string;
  };
}

export interface ProcessedImageResult {
  success: boolean;
  productName?: string;
  expiryDate?: string;
  expired?: boolean;
  detailedInfo?: DetailedMedicineInfo;
  rawText?: string;
  error?: string;
  noText?: boolean;
  message?: string;
}

interface CameraUploadProps {
  onImageProcessed: (result: ProcessedImageResult) => void;
}

export function CameraUpload({ onImageProcessed }: CameraUploadProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCameraLoading, setIsCameraLoading] = useState(false)
  const [showVideo, setShowVideo] = useState(false)
  const [cameraStatus, setCameraStatus] = useState("")
  const [lastGuidanceTime, setLastGuidanceTime] = useState(0)
  const [isFirstCapture, setIsFirstCapture] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const guidanceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()
  const { speakText } = useElementSpeech()

  // Clean up camera and timers on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
      
      if (guidanceTimerRef.current) {
        clearInterval(guidanceTimerRef.current)
      }
    }
  }, [])

  // Announce camera status changes to screen readers
  useEffect(() => {
    if (cameraStatus) {
      // Use ARIA live region for immediate announcements
      const statusElement = document.getElementById('camera-status')
      if (statusElement) {
        statusElement.textContent = cameraStatus
      }
      
      // Also use speech synthesis for additional support
      speakText(cameraStatus)
    }
  }, [cameraStatus, speakText])

  const startCamera = async () => {
    console.log('Starting camera initialization...');
    setCameraStatus("Starting camera. Please wait.")
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Browser API check failed: mediaDevices not supported');
      setCameraStatus("Your browser doesn't support camera access. Please try uploading an image instead.")
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
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      console.log('Camera stream obtained:', stream.getVideoTracks()[0].getSettings());
      
      streamRef.current = stream
      
      if (!videoRef.current) {
        console.error('Video element reference not found');
        setCameraStatus("Camera initialization failed. Please try again.")
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
              
              // Provide guidance for first-time users
              if (isFirstCapture) {
                setCameraStatus("Camera ready. Hold your device about 6 inches from the medicine packaging. Make sure the text is visible in the frame.")
                setIsFirstCapture(false)
              } else {
                setCameraStatus("Camera ready. Point at medicine packaging.")
              }
              
              // Start periodic guidance
              startGuidanceTimer()
              
              resolve(true)
            })
            .catch(err => {
              console.error("Error playing video:", err)
              setCameraStatus("Error starting camera. Please try again.")
              reject(err)
            })
        }
      })
    } catch (err) {
      console.error("Camera initialization error:", err);
      setShowVideo(false)
      
      const errorMessage = err instanceof DOMException && err.name === "NotAllowedError" 
        ? "Camera access denied. Please grant permission." 
        : `Could not access camera: ${err instanceof Error ? err.message : String(err)}`
      
      setCameraStatus(errorMessage)
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      setIsCameraLoading(false)
      stopCamera()
    }
  }

  // Provide audio guidance for camera positioning
  const startGuidanceTimer = () => {
    // Clear any existing timer
    if (guidanceTimerRef.current) {
      clearInterval(guidanceTimerRef.current)
    }
    
    // Set up guidance timer to provide periodic tips
    guidanceTimerRef.current = setInterval(() => {
      // Don't provide guidance too frequently
      const now = Date.now()
      if (now - lastGuidanceTime < 5000) return
      
      // Check if we're capturing and video is available
      if (!isCapturing || !videoRef.current) return
      
      // Alternate between different guidance messages
      const guidanceMessages = [
        "Hold the camera steady and ensure good lighting",
        "Position the medicine packaging in the center of the screen",
        "Make sure the text on the packaging is clearly visible",
        "The expiry date is often printed on the back or side of the packaging"
      ]
      
      // Select a random message
      const messageIndex = Math.floor(Math.random() * guidanceMessages.length)
      setCameraStatus(guidanceMessages[messageIndex])
      
      setLastGuidanceTime(now)
    }, 7000) // Provide guidance every 7 seconds
  }
  
  const stopCamera = () => {
    console.log('Stopping camera...');
    
    // Clear guidance timer
    if (guidanceTimerRef.current) {
      clearInterval(guidanceTimerRef.current)
      guidanceTimerRef.current = null
    }
    
    // Stop all camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop()
      });
      streamRef.current = null
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsCapturing(false)
    setShowVideo(false)
    setCameraStatus("Camera stopped")
    console.log('Camera stopped');
  }

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    setCameraStatus("Taking photo. Please hold still.")
    
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
      setCameraStatus(`File selected: ${file.name}. Processing image.`)
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
    setCameraStatus("Processing image. This may take a few moments.")
    
    try {
      const result = await processImageWithNebius(imageData)
      if (result.success) {
        // Create a more appropriate status message based on what's detected
        let statusMessage = `Successfully identified: ${result.productName || "Unknown Medicine"}`;
        
        // Add expiry date info if available and not "Not detected"
        if (result.expiryDate && result.expiryDate !== "Not detected") {
          statusMessage += `, expiry date: ${result.expiryDate}`;
        } else if (result.expiryDate === "Not detected") {
          statusMessage += `, expiry date not detected`;
        }
        
        setCameraStatus(statusMessage);
        
        onImageProcessed(result)
        toast({
          title: "Success",
          description: "Image processed successfully",
        })
      } else {
        setCameraStatus("Could not process image. Please try again with better lighting or a clearer image.")
        throw new Error(result.error || "Failed to process image")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to process image"
      setCameraStatus(`Error: ${errorMessage}. Please try again.`)
      
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

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Hidden status element for screen readers */}
          <div 
            id="camera-status" 
            className="sr-only" 
            aria-live="assertive"
            role="status"
          >
            {cameraStatus}
          </div>
          
          <div
            className="relative w-full max-w-md aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 border-primary"
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
                
                {/* Camera guide overlay - helps with visual alignment */}
                <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/50 m-8" aria-hidden="true" />
                
                {isCapturing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
                    <SpeakableElement text="Take a photo of the product" isInteractive={true}>
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
              <RefreshCw className="w-6 h-6 animate-spin" aria-hidden="true" />
              <span className="text-lg">Processing image...</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            {!isCapturing ? (
              <SpeakableElement text="Open camera to take a photo" isInteractive={true}>
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
              <SpeakableElement text="Cancel photo capture" isInteractive={true}>
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
            
            <SpeakableElement text="Upload an existing product image" isInteractive={true}>
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
