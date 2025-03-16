"use client"
import { useState, useEffect } from "react"
import { X, Save, Info, AlarmClock, PlusCircle, Pill, AlertCircle, FileText, Heart, ShieldAlert, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { SpeakableElement } from "@/components/speakable-element"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DetailedInfo {
  basic_information: {
    medicine_name?: string;
    expiry_date?: string;
    manufacturer?: string;
    batch_lot_number?: string;
    manufacturing_date?: string;
    retail_price_mrp?: string;
    barcode_id_numbers?: string;
  };
  composition: {
    active_ingredients?: string;
    inactive_ingredients_excipients?: string;
  };
  usage_information: {
    indications?: string;
    storage_instructions?: string;
    dosage_instructions?: string;
    route_of_administration?: string;
    frequency_and_duration?: string;
    benefits_summary?: string;
    additional_information?: string;
  };
  clinical_information: {
    contraindications?: string;
    side_effects_adverse_reactions?: string;
    drug_interactions?: string;
    warnings_and_precautions?: string;
    special_populations?: string;
    precautions?: string;
  };
  other_details: {
    regulatory_information?: string;
    prescription_status?: string;
    additional_information?: string;
  };
}

// Define proper type for medicine history records
interface MedicineRecord {
  id: string;
  productName: string;
  expiryDate: string;
  dateScanned: string;
  detailedInfo: DetailedInfo;
  rawText?: string;
}

interface ResultsDisplayProps {
  result: {
    success: boolean;
    productName?: string;
    expiryDate?: string;
    expired?: boolean;
    detailedInfo?: DetailedInfo;
    rawText?: string;
  };
  onSave: () => void;
  onCancel: () => void;
}

export function ResultsDisplay({ result, onSave, onCancel }: ResultsDisplayProps) {
  const [productName, setProductName] = useState(result.productName || "")
  const [expiryDate, setExpiryDate] = useState(result.expiryDate || "")
  const [isSaving, setIsSaving] = useState(false)
  const [isExpired, setIsExpired] = useState(result.expired || false)
  const { toast } = useToast()
  
  // Initialize detailedInfo with all required properties
  const [detailedInfo, setDetailedInfo] = useState<DetailedInfo>({
    basic_information: result.detailedInfo?.basic_information || {},
    composition: result.detailedInfo?.composition || {},
    usage_information: result.detailedInfo?.usage_information || {},
    clinical_information: result.detailedInfo?.clinical_information || {},
    other_details: result.detailedInfo?.other_details || {}
  });
  const [rawText, setRawText] = useState(result.rawText || "No extracted text available")
  
  // Update whenever result changes
  useEffect(() => {
    if (result.productName) {
      setProductName(result.productName);
    }
    
    if (result.expiryDate) {
      setExpiryDate(result.expiryDate);
      checkExpiration(result.expiryDate);
    }
    
    setIsExpired(result.expired || false);
    
    // Initialize all sections of detailedInfo
    setDetailedInfo({
      basic_information: result.detailedInfo?.basic_information || {},
      composition: result.detailedInfo?.composition || {},
      usage_information: result.detailedInfo?.usage_information || {},
      clinical_information: result.detailedInfo?.clinical_information || {},
      other_details: result.detailedInfo?.other_details || {}
    });
    if (result.rawText) {
      setRawText(result.rawText);
    }
  }, [result]);
  
  // Check for expiration whenever expiryDate changes
  useEffect(() => {
    if (expiryDate) {
      checkExpiration(expiryDate);
    }
  }, [expiryDate]);
  
  // Function to check if medicine is expired
  const checkExpiration = (dateStr: string) => {
    if (!dateStr) return;
    
    try {
      const today = new Date();
      const expiry = new Date(dateStr);
      
      // Check if the date is valid
      if (isNaN(expiry.getTime())) {
        console.error("Invalid expiry date:", dateStr);
        return;
      }
      
      setIsExpired(today > expiry);
    } catch (e) {
      console.error("Error parsing expiry date:", e);
    }
  };
  
  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      // Create a record to save
      const medicineRecord: MedicineRecord = {
        id: generateId(),
        productName: productName || "Unknown Medicine",
        expiryDate,
        dateScanned: new Date().toISOString(),
        detailedInfo,
        rawText
      };
      
      // Get existing records from localStorage
      let existingRecords: MedicineRecord[] = [];
      try {
        const storedData = localStorage.getItem('medicineHistory');
        if (storedData) {
          existingRecords = JSON.parse(storedData);
        }
      } catch (e) {
        console.error('Error parsing stored history:', e);
      }
      
      // Add new record to the beginning of the array
      const updatedRecords = [medicineRecord, ...existingRecords];
      
      // Save back to localStorage
      localStorage.setItem('medicineHistory', JSON.stringify(updatedRecords));
      
      toast({
        title: "Saved successfully",
        description: "Product information has been saved to your history.",
      })
      
      onSave()
    } catch (error) {
      console.error('Failed to save history:', error);
      toast({
        title: "Save failed",
        description: "There was a problem saving this item to history.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Generate a unique ID for the new record
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Format a date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    
    try {
      const date = new Date(dateStr);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateStr;
    }
  };
  
  // Helper to display information fields with better multi-line support and speech
  const InfoField = ({ label, value }: { label: string; value?: string }) => {
    if (!value) return null;
    
    // Handle multi-line content by splitting and mapping
    const lines = value.split('\n');
    const speakableText = `${label}: ${value}`;
    
    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-1">{label}</h4>
        <SpeakableElement text={speakableText}>
          <div className="hover:bg-accent/50 rounded-lg p-2 transition-colors">
            {lines.length > 1 ? (
              <div className="space-y-1">
                {lines.map((line, index) => (
                  <p key={index} className="text-base">{line}</p>
                ))}
              </div>
            ) : (
              <p className="text-base">{value}</p>
            )}
          </div>
        </SpeakableElement>
      </div>
    );
  };
  
  // Check if usage section has content
  const hasUsageContent = Boolean(
    detailedInfo.usage_information?.indications ||
    detailedInfo.usage_information?.dosage_instructions ||
    detailedInfo.usage_information?.route_of_administration ||
    detailedInfo.usage_information?.frequency_and_duration ||
    detailedInfo.usage_information?.storage_instructions
  );
  
  // Check if clinical section has content
  const hasClinicalContent = Boolean(
    detailedInfo.clinical_information?.contraindications ||
    detailedInfo.clinical_information?.side_effects_adverse_reactions ||
    detailedInfo.clinical_information?.drug_interactions ||
    detailedInfo.clinical_information?.warnings_and_precautions ||
    detailedInfo.clinical_information?.special_populations
  );
  
  // Check if other details section has content
  const hasOtherContent = Boolean(
    detailedInfo.other_details?.regulatory_information ||
    detailedInfo.other_details?.prescription_status ||
    detailedInfo.other_details?.additional_information
  );
  
  // Check if composition section has content - include more specific checks
  const hasCompositionContent = Boolean(
    detailedInfo.composition?.active_ingredients ||
    detailedInfo.composition?.inactive_ingredients_excipients
  );
  
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center" role="heading" aria-level={2}>
            <h2 className="text-2xl font-bold mb-2">Medicine Information</h2>
            <p className="text-muted-foreground">Review and save the detected information</p>
          </div>
          
          {isExpired && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Expired Medicine</AlertTitle>
              <AlertDescription>
                This medicine appears to be expired as of {formatDate(expiryDate)}. 
                Do not use expired medications as they may be less effective or potentially harmful.
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-9">
              <TabsTrigger value="basics" className="flex flex-col items-center gap-1 p-2">
                <Info className="h-4 w-4" />
                <span className="text-xs">Basics</span>
              </TabsTrigger>
              <TabsTrigger value="composition" className="flex flex-col items-center gap-1 p-2">
                <PlusCircle className="h-4 w-4" />
                <span className="text-xs">Composition</span>
              </TabsTrigger>
              <TabsTrigger value="benefits" className="flex flex-col items-center gap-1 p-2">
                <Heart className="h-4 w-4" />
                <span className="text-xs">Benefits</span>
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex flex-col items-center gap-1 p-2">
                <Pill className="h-4 w-4" />
                <span className="text-xs">Usage</span>
              </TabsTrigger>
              <TabsTrigger value="clinical" className="flex flex-col items-center gap-1 p-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-xs">Clinical</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex flex-col items-center gap-1 p-2">
                <ShieldAlert className="h-4 w-4" />
                <span className="text-xs">Advanced</span>
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex flex-col items-center gap-1 p-2">
                <HelpCircle className="h-4 w-4" />
                <span className="text-xs">Info</span>
              </TabsTrigger>
              <TabsTrigger value="other" className="flex flex-col items-center gap-1 p-2">
                <FileText className="h-4 w-4" />
                <span className="text-xs">Other</span>
              </TabsTrigger>
              <TabsTrigger value="raw" className="flex flex-col items-center gap-1 p-2">
                <AlarmClock className="h-4 w-4" />
                <span className="text-xs">Raw</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Basic Information Tab */}
            <TabsContent value="basics" className="space-y-4 mt-4">
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
                      className={`h-12 text-lg ${isExpired ? 'border-red-500' : ''}`}
                      aria-describedby="expiry-date-display"
                    />
                    <p 
                      id="expiry-date-display" 
                      className={`text-lg font-medium mt-2 ${isExpired ? 'text-red-500' : ''}`} 
                      aria-live="polite"
                    >
                      {isExpired ? 'EXPIRED: ' : 'Expires on: '} {formatDate(expiryDate)}
                    </p>
                  </div>
                </SpeakableElement>
              </div>
              
              {detailedInfo.basic_information && (
                <div className="bg-muted/50 rounded-lg p-4 mt-4">
                  <InfoField 
                    label="Manufacturer" 
                    value={detailedInfo.basic_information.manufacturer} 
                  />
                  <InfoField 
                    label="Batch/Lot Number" 
                    value={detailedInfo.basic_information.batch_lot_number} 
                  />
                  <InfoField 
                    label="Manufacturing Date" 
                    value={detailedInfo.basic_information.manufacturing_date} 
                  />
                  <InfoField 
                    label="Retail Price/MRP" 
                    value={detailedInfo.basic_information.retail_price_mrp} 
                  />
                  <InfoField 
                    label="Barcode/ID Numbers" 
                    value={detailedInfo.basic_information.barcode_id_numbers} 
                  />
                </div>
              )}
            </TabsContent>
            
            {/* Rest of the component remains unchanged */}
            {/* Composition Tab */}
            <TabsContent value="composition" className="mt-4">
              {hasCompositionContent ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <InfoField 
                    label="Active Ingredients" 
                    value={detailedInfo.composition?.active_ingredients} 
                  />
                  <InfoField 
                    label="Inactive Ingredients/Excipients" 
                    value={detailedInfo.composition?.inactive_ingredients_excipients} 
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No composition information found on packaging
                </p>
              )}
            </TabsContent>
            
            {/* Benefits Tab */}
            <TabsContent value="benefits" className="mt-4">
              {detailedInfo.usage_information?.benefits_summary ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <InfoField 
                    label="Medicine Benefits & Usage" 
                    value={detailedInfo.usage_information.benefits_summary} 
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No benefits information available
                </p>
              )}
            </TabsContent>
            
            {/* Additional Information Tab */}
            <TabsContent value="additional" className="mt-4">
              {detailedInfo.usage_information?.additional_information ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <InfoField 
                    label="Additional Medicine Information" 
                    value={detailedInfo.usage_information.additional_information} 
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No additional information available
                </p>
              )}
            </TabsContent>
            
            {/* Usage Information Tab */}
            <TabsContent value="usage" className="mt-4">
              {hasUsageContent ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <InfoField 
                    label="Indications" 
                    value={detailedInfo.usage_information?.indications} 
                  />
                  <InfoField 
                    label="Dosage Instructions" 
                    value={detailedInfo.usage_information?.dosage_instructions} 
                  />
                  <InfoField 
                    label="Route of Administration" 
                    value={detailedInfo.usage_information?.route_of_administration} 
                  />
                  <InfoField 
                    label="Frequency and Duration" 
                    value={detailedInfo.usage_information?.frequency_and_duration} 
                  />
                  <InfoField 
                    label="Storage Instructions" 
                    value={detailedInfo.usage_information?.storage_instructions} 
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No usage information found on packaging
                </p>
              )}
            </TabsContent>
            
            {/* Clinical Information Tab */}
            <TabsContent value="clinical" className="mt-4">
              {hasClinicalContent ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <InfoField 
                    label="Contraindications" 
                    value={detailedInfo.clinical_information?.contraindications} 
                  />
                  <InfoField 
                    label="Side Effects/Adverse Reactions" 
                    value={detailedInfo.clinical_information?.side_effects_adverse_reactions} 
                  />
                  <InfoField 
                    label="Drug Interactions" 
                    value={detailedInfo.clinical_information?.drug_interactions} 
                  />
                  <InfoField 
                    label="Warnings and Precautions" 
                    value={detailedInfo.clinical_information?.warnings_and_precautions} 
                  />
                  <InfoField 
                    label="Special Populations" 
                    value={detailedInfo.clinical_information?.special_populations} 
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No clinical information found on packaging
                </p>
              )}
            </TabsContent>
            
            {/* Advanced Clinical Information Tab */}
            <TabsContent value="advanced" className="mt-4">
              {detailedInfo.clinical_information?.precautions ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <InfoField 
                    label="Important Precautions & Considerations" 
                    value={detailedInfo.clinical_information.precautions} 
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No advanced clinical information available
                </p>
              )}
            </TabsContent>
            
            {/* Other Details Tab */}
            <TabsContent value="other" className="mt-4">
              {hasOtherContent ? (
                <div className="bg-muted/50 rounded-lg p-4">
                  <InfoField 
                    label="Regulatory Information" 
                    value={detailedInfo.other_details?.regulatory_information} 
                  />
                  <InfoField 
                    label="Prescription Status" 
                    value={detailedInfo.other_details?.prescription_status} 
                  />
                </div>
              ) : (
                <p className="text-muted-foreground text-center p-4">
                  No additional details found on packaging
                </p>
              )}
            </TabsContent>
            
            {/* Raw Text Tab */}
            <TabsContent value="raw" className="mt-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Raw Extracted Text</h3>
                <div className="max-h-[300px] overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap">{rawText}</pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      {/* Footer buttons */}
      <CardFooter className="px-6 pb-6 pt-0 flex flex-col sm:flex-row gap-4">
        <SpeakableElement text="Save product information to history" isInteractive={true}>
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
        <SpeakableElement text="Cancel and return to scanning" isInteractive={true}>
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
