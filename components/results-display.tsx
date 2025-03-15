"use client"

import { useState } from "react"
import { X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

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
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Scan Results</h2>
            <p className="text-muted-foreground">Review and save the detected information</p>
          </div>

          <div className="space-y-4">
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
              />
            </div>

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
              />
              <p className="text-lg font-medium mt-2" aria-live="polite">
                Expires on: {formatDate(expiryDate)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0 flex flex-col sm:flex-row gap-4">
        <Button className="h-14 text-lg w-full sm:w-auto sm:flex-1" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" aria-hidden="true" />
              Save to History
            </>
          )}
        </Button>
        <Button variant="outline" className="h-14 text-lg w-full sm:w-auto sm:flex-1" onClick={onCancel}>
          <X className="w-5 h-5 mr-2" aria-hidden="true" />
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}

