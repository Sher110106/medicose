"use client"
import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Sun, Moon, Volume2, VolumeX, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { useSpeech } from "@/hooks/use-speech"
import { SpeakableElement } from "./SpeakableElement"

interface AccessibilityControlsProps {
  onFontSizeChange: (size: string) => void
  onContrastToggle: (enabled: boolean) => void
  highContrast: boolean
}

export function AccessibilityControls({
  onFontSizeChange,
  onContrastToggle,
  highContrast,
}: AccessibilityControlsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [fontSize, setFontSize] = useState(2)
  const [volume, setVolume] = useState([50])
  const [speechRate, setSpeechRate] = useState([1])
  const { 
    isEnabled: voiceGuidance, 
    setEnabled: setVoiceGuidance,
    initializeSpeech 
  } = useSpeech({
    volume: volume[0] / 100,
    rate: speechRate[0],
    delay: 400
  })

  // Initialize speech on hover over accessibility controls
  const handleAccessibilityHover = () => {
    initializeSpeech();
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt + A to toggle accessibility panel
      if (e.altKey && e.key === "a") {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      // Alt + C to toggle contrast
      if (e.altKey && e.key === "c") {
        e.preventDefault()
        onContrastToggle(!highContrast)
      }
      // Alt + V to toggle voice guidance
      if (e.altKey && e.key === "v") {
        e.preventDefault()
        setVoiceGuidance(!voiceGuidance)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [highContrast, voiceGuidance, onContrastToggle, setVoiceGuidance])

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize)
    const sizeClass = newSize === 1 ? "text-sm" : newSize === 3 ? "text-xl" : "text-base"
    onFontSizeChange(sizeClass)
  }

  return (
    <div 
      role="region" 
      aria-label="Accessibility Controls"
      onMouseEnter={handleAccessibilityHover}
    >
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:p-2 focus:bg-background">
        Skip to main content
      </a>
      
      <Collapsible 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        className="border rounded-lg overflow-hidden"
      >
        <SpeakableElement text="Accessibility controls panel. Press to expand or collapse accessibility options.">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center justify-between w-full p-4 h-auto text-left"
              aria-label={`${isOpen ? "Hide" : "Show"} accessibility controls. Press Alt+A to toggle`}
            >
              <span className="text-lg font-medium">Accessibility Controls</span>
              {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </CollapsibleTrigger>
        </SpeakableElement>
        
        <CollapsibleContent className="p-4 border-t">
          <div className="grid gap-6">
            <div className="space-y-2">
              <SpeakableElement text="Font size control. Select small, medium, or large text size for better readability.">
                <div className="flex items-center justify-between">
                  <Label htmlFor="font-size" className="text-base">
                    Font Size
                  </Label>
                  <div 
                    className="flex items-center gap-2"
                    role="radiogroup"
                    aria-label="Font size selection"
                  >
                    <SpeakableElement text="Small font size">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFontSizeChange(1)}
                        className={fontSize === 1 ? "bg-primary text-primary-foreground" : ""}
                        aria-label="Small font size"
                        aria-pressed={fontSize === 1}
                        role="radio"
                      >
                        A
                      </Button>
                    </SpeakableElement>
                    
                    <SpeakableElement text="Medium font size">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFontSizeChange(2)}
                        className={fontSize === 2 ? "bg-primary text-primary-foreground" : ""}
                        aria-label="Medium font size"
                        aria-pressed={fontSize === 2}
                        role="radio"
                      >
                        A
                      </Button>
                    </SpeakableElement>
                    
                    <SpeakableElement text="Large font size">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFontSizeChange(3)}
                        className={`text-lg ${fontSize === 3 ? "bg-primary text-primary-foreground" : ""}`}
                        aria-label="Large font size"
                        aria-pressed={fontSize === 3}
                        role="radio"
                      >
                        A
                      </Button>
                    </SpeakableElement>
                  </div>
                </div>
              </SpeakableElement>
            </div>
            
            <SpeakableElement text="High contrast mode. Toggle to switch between standard and high contrast colors. Press Alt plus C to toggle.">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="high-contrast" className="text-base">
                    High Contrast (Alt+C)
                  </Label>
                  {highContrast ? (
                    <Moon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Sun className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <Switch
                  id="high-contrast"
                  checked={highContrast}
                  onCheckedChange={onContrastToggle}
                  aria-label="Toggle high contrast mode"
                />
              </div>
            </SpeakableElement>
            
            <SpeakableElement text="Voice guidance. Toggle to enable or disable speech when navigating the application. Press Alt plus V to toggle.">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label htmlFor="voice-guidance" className="text-base">
                    Voice Guidance (Alt+V)
                  </Label>
                  {voiceGuidance ? (
                    <Volume2 className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <VolumeX className="h-5 w-5" aria-hidden="true" />
                  )}
                </div>
                <Switch
                  id="voice-guidance"
                  checked={voiceGuidance}
                  onCheckedChange={setVoiceGuidance}
                  aria-label="Toggle voice guidance"
                />
              </div>
            </SpeakableElement>
            
            {voiceGuidance && (
              <>
                <SpeakableElement text="Voice volume control. Adjust how loud the speech will be.">
                  <div className="space-y-2">
                    <Label htmlFor="volume-slider" className="text-base">
                      Voice Volume
                    </Label>
                    <Slider
                      id="volume-slider"
                      value={volume}
                      onValueChange={setVolume}
                      max={100}
                      step={1}
                      aria-label="Adjust voice guidance volume"
                    />
                  </div>
                </SpeakableElement>
                
                <SpeakableElement text="Speech rate control. Adjust how fast or slow the speech will be.">
                  <div className="space-y-2">
                    <Label htmlFor="speech-rate-slider" className="text-base">
                      Speech Rate
                    </Label>
                    <Slider
                      id="speech-rate-slider"
                      value={speechRate}
                      onValueChange={setSpeechRate}
                      min={0.5}
                      max={2}
                      step={0.1}
                      aria-label="Adjust speech rate"
                    />
                  </div>
                </SpeakableElement>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

