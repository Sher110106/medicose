"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronUp, Sun, Moon, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { useElementSpeech } from "@/hooks/useElementSpeech"

interface SpeechSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  delay: number;
  selectedVoice: string;
}

interface AccessibilityControlsProps {
  onFontSizeChange: (size: string) => void;
  onContrastToggle: (enabled: boolean) => void;
  highContrast: boolean;
  speechSettings: SpeechSettings;
  onSpeechSettingsChange: (settings: SpeechSettings) => void;
}

export function AccessibilityControls({
  onFontSizeChange,
  onContrastToggle,
  highContrast,
  speechSettings,
  onSpeechSettingsChange,
}: AccessibilityControlsProps) {
  const { isSpeechSupported, hasUserInteracted } = useElementSpeech();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(2); // 1=small, 2=medium, 3=large

  useEffect(() => {
    if (window.speechSynthesis) {
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    const sizeClass = newSize === 1 ? "text-sm" : newSize === 3 ? "text-xl" : "text-base";
    onFontSizeChange(sizeClass);
  };

  const updateSpeechSetting = <K extends keyof SpeechSettings>(
    key: K,
    value: SpeechSettings[K]
  ) => {
    onSpeechSettingsChange({
      ...speechSettings,
      [key]: value,
    });
  };

  const testVoice = () => {
    if (speechSettings.enabled && isSpeechSupported && hasUserInteracted) {
      const utterance = new SpeechSynthesisUtterance("This is a test of the voice settings");
      utterance.rate = speechSettings.rate;
      utterance.pitch = speechSettings.pitch;
      utterance.volume = speechSettings.volume;
      if (speechSettings.selectedVoice) {
        const selectedVoice = voices.find((v) => v.name === speechSettings.selectedVoice);
        if (selectedVoice) utterance.voice = selectedVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Format slider values for better screen reader announcements
  const formatRateValue = (value: number) => `${value.toFixed(1)}x speed`;
  const formatPitchValue = (value: number) => `${value.toFixed(1)}`;
  const formatVolumeValue = (value: number) => `${Math.round(value * 100)}%`;
  const formatDelayValue = (value: number) => `${value} milliseconds`;

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
              <Label htmlFor="voice-enabled" className="text-base">
                Voice Assistance
              </Label>
              {speechSettings.enabled ? (
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              ) : (
                <VolumeX className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <Switch
              id="voice-enabled"
              checked={speechSettings.enabled}
              onCheckedChange={(checked) => updateSpeechSetting("enabled", checked)}
              aria-label="Toggle voice assistance"
            />
          </div>

          {speechSettings.enabled && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="speech-rate-slider">Speech Rate: {formatRateValue(speechSettings.rate)}</Label>
                <Slider
                  id="speech-rate-slider"
                  value={[speechSettings.rate]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => updateSpeechSetting("rate", value)}
                  aria-label="Speech rate"
                  aria-valuetext={formatRateValue(speechSettings.rate)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speech-pitch-slider">Pitch: {formatPitchValue(speechSettings.pitch)}</Label>
                <Slider
                  id="speech-pitch-slider"
                  value={[speechSettings.pitch]}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => updateSpeechSetting("pitch", value)}
                  aria-label="Speech pitch"
                  aria-valuetext={formatPitchValue(speechSettings.pitch)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speech-volume-slider">Volume: {formatVolumeValue(speechSettings.volume)}</Label>
                <Slider
                  id="speech-volume-slider"
                  value={[speechSettings.volume]}
                  min={0}
                  max={1}
                  step={0.1}
                  onValueChange={([value]) => updateSpeechSetting("volume", value)}
                  aria-label="Speech volume"
                  aria-valuetext={formatVolumeValue(speechSettings.volume)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="speech-delay-slider">Hover Delay: {formatDelayValue(speechSettings.delay)}</Label>
                <Slider
                  id="speech-delay-slider"
                  value={[speechSettings.delay]}
                  min={0}
                  max={500}
                  step={50}
                  onValueChange={([value]) => updateSpeechSetting("delay", value)}
                  aria-label="Hover delay before speaking"
                  aria-valuetext={formatDelayValue(speechSettings.delay)}
                />
              </div>

              {voices.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="voice-select">Voice</Label>
                  <Select
                    value={speechSettings.selectedVoice}
                    onValueChange={(value) => updateSpeechSetting("selectedVoice", value)}
                    aria-label="Select voice for speech"
                  >
                    <SelectValue placeholder="Select a voice" id="voice-select" />
                    <SelectContent>
                      <SelectItem value="">System Default</SelectItem>
                      {voices.map((voice) => (
                        <SelectItem key={voice.name} value={voice.name}>
                          {voice.name} ({voice.lang})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                onClick={testVoice} 
                disabled={!speechSettings.enabled || !isSpeechSupported || !hasUserInteracted}
                className="w-full"
                aria-label="Test current voice settings"
              >
                Test Voice Settings
              </Button>

              {!hasUserInteracted && (
                <p className="text-sm text-yellow-600" role="alert">
                  Please interact with the page (click/tap anywhere) to enable voice features.
                </p>
              )}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

