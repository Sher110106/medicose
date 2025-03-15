"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { CameraUpload } from "@/components/camera-upload"
import { ResultsDisplay } from "@/components/results-display"
import { History } from "@/components/history"
import { AccessibilityControls } from "@/components/accessibility-controls"
import { useSpeech } from "@/hooks/use-speech"
import { SpeakableElement } from "@/components/SpeakableElement"

export default function Home() {
  const [fontSizeClass, setFontSizeClass] = useState("text-base")
  const [highContrast, setHighContrast] = useState(false)
  const [scanResult, setScanResult] = useState<{
    productName: string
    expiryDate: string
  } | null>(null)

  const { speak } = useSpeech({ 
    delay: 400,
    rate: 1,
    volume: 1
  })

  const handleImageProcessed = (result: { productName: string; expiryDate: string }) => {
    setScanResult(result)
    // Announce the result to screen readers
    speak(`Product detected: ${result.productName}. Expiry date: ${result.expiryDate}`)
  }

  return (
    <main 
      id="main-content"
      className={`min-h-screen ${fontSizeClass} ${highContrast ? "high-contrast" : ""}`}
      role="main"
      aria-label="Medicine expiry date scanner"
    >
      <Header />
      <div className="container px-4 py-6 mx-auto max-w-4xl">
        <SpeakableElement text="Accessibility controls section. Adjust font size and contrast settings here.">
          <AccessibilityControls
            onFontSizeChange={setFontSizeClass}
            onContrastToggle={setHighContrast}
            highContrast={highContrast}
          />
        </SpeakableElement>

        <Tabs defaultValue="scan" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 h-14" aria-label="Application features">
            <SpeakableElement text="Scan Product tab. Click to scan a new medicine product.">
              <TabsTrigger 
                value="scan" 
                className="text-lg py-4"
                aria-label="Scan Product tab"
              >
                Scan Product
              </TabsTrigger>
            </SpeakableElement>
            <SpeakableElement text="Scan History tab. Click to view your previous scans.">
              <TabsTrigger 
                value="history" 
                className="text-lg py-4"
                aria-label="Scan History tab"
              >
                History
              </TabsTrigger>
            </SpeakableElement>
          </TabsList>
          <TabsContent
            value="scan"
            className="mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            role="tabpanel"
            aria-label="Product scanning section"
          >
            {!scanResult ? (
              <SpeakableElement text="Camera upload section. Take a photo or upload an image of your medicine packaging.">
                <CameraUpload onImageProcessed={handleImageProcessed} />
              </SpeakableElement>
            ) : (
              <SpeakableElement text="Results display section. Shows the detected product name and expiry date.">
                <ResultsDisplay
                  result={scanResult}
                  onSave={() => {
                    speak("Result saved successfully")
                    setScanResult(null)
                  }}
                  onCancel={() => {
                    speak("Scan cancelled")
                    setScanResult(null)
                  }}
                />
              </SpeakableElement>
            )}
          </TabsContent>
          <TabsContent
            value="history"
            className="mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            role="tabpanel"
            aria-label="Scan history section"
          >
            <SpeakableElement text="History section. View your previous medicine scans.">
              <History />
            </SpeakableElement>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

