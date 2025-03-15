"use client"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { CameraUpload } from "@/components/camera-upload"
import { ResultsDisplay } from "@/components/results-display"
import { History } from "@/components/history"
import { SpeakableElement } from "@/components/speakable-element"

export default function Home() {
  const [scanResult, setScanResult] = useState<{
    productName: string
    expiryDate: string
  } | null>(null)

  const handleImageProcessed = (result: { productName: string; expiryDate: string }) => {
    setScanResult(result)
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="container px-4 py-6 mx-auto max-w-4xl">
        <Tabs defaultValue="scan" className="mt-6">
          <TabsList className="grid w-full grid-cols-2 h-14">
            <SpeakableElement text="Scan Product tab">
              <TabsTrigger value="scan" className="text-lg py-4">
                Scan Product
              </TabsTrigger>
            </SpeakableElement>
            <SpeakableElement text="View scan history tab">
              <TabsTrigger value="history" className="text-lg py-4">
                History
              </TabsTrigger>
            </SpeakableElement>
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

