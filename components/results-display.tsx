"use client"

import { useState, useEffect } from "react"
import { X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useSpeech } from "@/hooks/use-speech"
import { SpeakableElement } from "./SpeakableElement"

interface ResultsDisplayProps {
  result: {
    productName: string
    expiryDate: string
  }
  onSave: () => void
  onCancel: () => void
}

export function ResultsDisplay({ result, onSave, onCancel }: ResultsDisplayProps) {
  const [productName, setProductName] = useState(result.productName)
  const [expiryDate, setExpiryDate] = useState(result.expiryDate)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const { speak } = useSpeech()

  useEffect(() => {
    // Announce results when component mounts
    speak(`Detected product: ${result.productName}. Expiry date: ${formatDate(result.expiryDate)}. Press Tab to review and edit details.`)
  }, [result, speak])

  const handleSave = async () => {
    setIsSaving(true)
    speak('Saving product information')
    
    // Simulate saving to database
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Saved successfully",
        description: "Product information has been saved to your history.",
      })
      speak('Product information saved successfully')
      onSave()
    }, 1000)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const handleKeyboardSave = (e: React.KeyboardEvent) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Card 
      className="border-2"
      onKeyDown={handleKeyboardSave}
      role="region"
      aria-label="Scan results"
    >
      <CardContent className="p-6">
        <div className="space-y-6">
          <SpeakableElement text="Scan results section. Here you can review and edit the detected product information.">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Scan Results</h2>
              <p className="text-muted-foreground" role="status">Review and save the detected information</p>
            </div>
          </SpeakableElement>
          
          <div className="space-y-4">
            <SpeakableElement text="Product name field. You can edit this if the detected name is incorrect.">
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-lg">
                  Product Name
                </Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="Enter product name"
                  aria-label="Product name"
                  aria-required="true"
                  onFocus={() => speak('Product name field. Press Enter to edit.')}
                />
              </div>
            </SpeakableElement>
            
            <SpeakableElement text="Expiry date field. You can adjust this if the detected date is incorrect.">
              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-lg">
                  Expiry Date
                </Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-12 text-lg"
                  aria-label="Expiry date"
                  aria-required="true"
                  onFocus={() => speak('Expiry date field. Press Enter to edit.')}
                />
                <SpeakableElement text={`Formatted expiry date: ${formatDate(expiryDate)}`}>
                  <p 
                    className="text-lg font-medium mt-2" 
                    aria-live="polite"
                    role="status"
                  >
                    Expires on: {formatDate(expiryDate)}
                  </p>
                </SpeakableElement>
              </div>
            </SpeakableElement>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0 flex flex-col sm:flex-row gap-4">
        <SpeakableElement text="Save to history button. Saves this product and expiry date to your history. You can also press Control plus S to save.">
          <Button 
            className="h-14 text-lg w-full sm:w-auto sm:flex-1" 
            onClick={handleSave} 
            disabled={isSaving}
            aria-label={isSaving ? "Saving..." : "Save to history (Control + S)"}
            onFocus={() => speak(isSaving ? "Saving..." : "Save button. Press Enter to save, or use Control + S")}
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" aria-hidden="true" />
                Save to History
              </>
            )}
          </Button>
        </SpeakableElement>
        
        <SpeakableElement text="Cancel button. Discards the scan results and returns to the camera screen.">
          <Button 
            variant="outline" 
            className="h-14 text-lg w-full sm:w-auto sm:flex-1" 
            onClick={onCancel}
            aria-label="Cancel and return to camera"
            onFocus={() => speak("Cancel button. Press Enter to discard and return to camera")}
          >
            <X className="w-5 h-5 mr-2" aria-hidden="true" />
            Cancel
          </Button>
        </SpeakableElement>
      </CardFooter>
    </Card>
  )
}

