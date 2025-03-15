"use client"

import { useState } from "react"
import { X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { SpeakableElement } from "@/components/speakable-element"

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

  const handleSave = async () => {
    setIsSaving(true)

    // Simulate saving to database
    // In a real app, this would call an API to save the data
    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "Saved successfully",
        description: "Product information has been saved to your history.",
      })
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

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center" role="heading" aria-level={2}>
            <h2 className="text-2xl font-bold mb-2">Scan Results</h2>
            <p className="text-muted-foreground">Review and save the detected information</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <SpeakableElement text="Product name field">
                <div>
                  <Label htmlFor="productName" className="text-lg">
                    Product Name
                  </Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="h-12 text-lg"
                    placeholder="Enter product name"
                    aria-describedby="product-name-help"
                  />
                  <span id="product-name-help" className="sr-only">
                    Edit the detected product name if needed
                  </span>
                </div>
              </SpeakableElement>
            </div>

            <div className="space-y-2">
              <SpeakableElement text="Expiry date field">
                <div>
                  <Label htmlFor="expiryDate" className="text-lg">
                    Expiry Date
                  </Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="h-12 text-lg"
                    aria-describedby="expiry-date-display"
                  />
                  <p 
                    id="expiry-date-display" 
                    className="text-lg font-medium mt-2" 
                    aria-live="polite"
                  >
                    Expires on: {formatDate(expiryDate)}
                  </p>
                </div>
              </SpeakableElement>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0 flex flex-col sm:flex-row gap-4">
        <SpeakableElement text="Save product information to history">
          <Button 
            className="h-14 text-lg w-full sm:w-auto sm:flex-1" 
            onClick={handleSave} 
            disabled={isSaving}
            aria-busy={isSaving}
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
        <SpeakableElement text="Cancel and return to scanning">
          <Button 
            variant="outline" 
            className="h-14 text-lg w-full sm:w-auto sm:flex-1" 
            onClick={onCancel}
          >
            <X className="w-5 h-5 mr-2" aria-hidden="true" />
            Cancel
          </Button>
        </SpeakableElement>
      </CardFooter>
    </Card>
  )
}

