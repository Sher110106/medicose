"use client"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Header } from "@/components/header"
import { CameraUpload, ProcessedImageResult } from "@/components/camera-upload"
import { ResultsDisplay } from "@/components/results-display"
import { History } from "@/components/history"
import { SpeakableElement } from "@/components/speakable-element"

// Define the detailed information structure
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
  };
  clinical_information: {
    contraindications?: string;
    side_effects_adverse_reactions?: string;
    drug_interactions?: string;
    warnings_and_precautions?: string;
    special_populations?: string;
  };
  other_details: {
    regulatory_information?: string;
    prescription_status?: string;
    additional_information?: string;
  };
}

// Define the scan result type
interface ScanResult {
  success: boolean;
  productName?: string;
  expiryDate?: string;
  expired?: boolean;
  detailedInfo?: DetailedInfo;
  rawText?: string;
}

export default function Home() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const handleImageProcessed = (result: ProcessedImageResult) => {
    setScanResult({
      success: result.success,
      productName: result.productName || "",
      expiryDate: result.expiryDate || "",
      expired: result.expired || false,
      detailedInfo: {
        basic_information: result.detailedInfo?.basic_information || {},
        composition: result.detailedInfo?.composition || {},
        usage_information: result.detailedInfo?.usage_information || {},
        clinical_information: result.detailedInfo?.clinical_information || {},
        other_details: result.detailedInfo?.other_details || {}
      },
      rawText: result.rawText || ""
    });
  };

  const handleScanComplete = () => {
    setScanResult(null);
  };

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
                onSave={handleScanComplete}
                onCancel={handleScanComplete}
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

