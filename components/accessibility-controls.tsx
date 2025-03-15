"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Sun, Moon, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

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
  const [fontSize, setFontSize] = useState(2) // 1=small, 2=medium, 3=large
  const [voiceGuidance, setVoiceGuidance] = useState(false)
  const [volume, setVolume] = useState([50])

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize)
    const sizeClass = newSize === 1 ? "text-sm" : newSize === 3 ? "text-xl" : "text-base"
    onFontSizeChange(sizeClass)
  }

  const toggleVoiceGuidance = () => {
    setVoiceGuidance(!voiceGuidance)
    // In a real app, this would enable/disable voice guidance
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg overflow-hidden">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center justify-between w-full p-4 h-auto text-left"
          aria-label={`${isOpen ? "Hide" : "Show"} accessibility controls`}
        >
          <span className="text-lg font-medium">Accessibility Controls</span>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="p-4 border-t">
        <div className="grid gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="font-size" className="text-base">
                Font Size
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFontSizeChange(1)}
                  className={fontSize === 1 ? "bg-primary text-primary-foreground" : ""}
                  aria-label="Small font size"
                  aria-pressed={fontSize === 1}
                >
                  A
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFontSizeChange(2)}
                  className={fontSize === 2 ? "bg-primary text-primary-foreground" : ""}
                  aria-label="Medium font size"
                  aria-pressed={fontSize === 2}
                >
                  A
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFontSizeChange(3)}
                  className={`text-lg ${fontSize === 3 ? "bg-primary text-primary-foreground" : ""}`}
                  aria-label="Large font size"
                  aria-pressed={fontSize === 3}
                >
                  A
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="high-contrast" className="text-base">
                High Contrast
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label htmlFor="voice-guidance" className="text-base">
                Voice Guidance
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
              onCheckedChange={toggleVoiceGuidance}
              aria-label="Toggle voice guidance"
            />
          </div>

          {voiceGuidance && (
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
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

