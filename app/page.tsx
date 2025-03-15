"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { CameraUpload } from "@/components/camera-upload"
import { ResultsDisplay } from "@/components/results-display"
import { History } from "@/components/history"
import { AccessibilityControls } from "@/components/accessibility-controls"

export default function Home() {
  const [fontSizeClass, setFontSizeClass] = useState("text-base")
  const [highContrast, setHighContrast] = useState(false)
  const [scanResult, setScanResult] = useState<{
    productName: string
    expiryDate: string
  } | null>(null)

  const handleImageProcessed = (result: { productName: string; expiryDate: string }) => {
    setScanResult(result)
  }

  return (
    <main className={`min-h-screen ${fontSizeClass} ${highContrast ? "high-contrast" : ""}`}>
      <Header />
      <div className="container px-4 py-6 mx-auto max-w-4xl">
        <AccessibilityControls
          onFontSizeChange={setFontSizeClass}
          onContrastToggle={setHighContrast}
          highContrast={highContrast}
        />

        <Tabs defaultValue="scan" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 h-14">
            <TabsTrigger value="scan" className="text-lg py-4">
              Scan Product
            </TabsTrigger>
            <TabsTrigger value="history" className="text-lg py-4">
              History
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="scan"
            className="mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {!scanResult ? (
              <CameraUpload onImageProcessed={handleImageProcessed} />
            ) : (
              <ResultsDisplay
                result={scanResult}
                onSave={() => setScanResult(null)}
                onCancel={() => setScanResult(null)}
              />
            )}
          </TabsContent>
          <TabsContent
            value="history"
            className="mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <History />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

