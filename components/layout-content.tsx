// This is a client component
"use client"

import { useState, useEffect } from "react"
import { AccessibilityControls } from "@/components/accessibility-controls"
import { SpeechProvider } from "@/contexts/SpeechContext"

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const [fontSizeClass, setFontSizeClass] = useState("text-base")
  const [highContrast, setHighContrast] = useState(false)
  const [speechSettings, setSpeechSettings] = useState(() => {
    // Load speech settings from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('speechSettings')
      return saved ? JSON.parse(saved) : {
        enabled: false,
        delay: 150,
        rate: 1,
        pitch: 1,
        volume: 1,
        selectedVoice: "",
      }
    }
    return {
      enabled: false,
      delay: 150,
      rate: 1,
      pitch: 1,
      volume: 1,
      selectedVoice: "",
    }
  })

  // Save settings to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('speechSettings', JSON.stringify(speechSettings))
    }
  }, [speechSettings])

  return (
    <SpeechProvider settings={speechSettings}>
      <div className="container mx-auto p-4">
        <AccessibilityControls
          onFontSizeChange={setFontSizeClass}
          onContrastToggle={setHighContrast}
          highContrast={highContrast}
          speechSettings={speechSettings}
          onSpeechSettingsChange={setSpeechSettings}
        />
        <main className={`mt-4 ${fontSizeClass}`}>
          {children}
        </main>
      </div>
    </SpeechProvider>
  )
}