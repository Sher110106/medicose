import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { config } from "./config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Types for medicine information
export interface MedicineInformation {
  basic_information: {
    medicine_name?: string;
    manufacturer?: string;
    batch_lot_number?: string;
    manufacturing_date?: string;
    expiry_date?: string;
    retail_price_mrp?: string;
    barcode_id_numbers?: string;
  };
  composition: {
    active_ingredients?: string;
    inactive_ingredients_excipients?: string;
  };
  usage_information: {
    indications?: string;
    benefits_summary?: string;
    dosage_instructions?: string;
    route_of_administration?: string;
    frequency_and_duration?: string;
    storage_instructions?: string;
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

export type ProcessImageResult = {
  success: boolean;
  productName?: string;
  expiryDate?: string;
  expired?: boolean;
  error?: string;
  noText?: boolean;
  message?: string;
  detailedInfo?: MedicineInformation;
  rawText?: string;
}

export async function processImageWithNebius(imageData: string): Promise<ProcessImageResult> {
  try {
    const base64Image = imageData.replace(/^data:image\/(png|jpeg|jpg);base64,/, '')
    
    // Validate image size
    const sizeInBytes = Buffer.from(base64Image, 'base64').length
    if (sizeInBytes > config.image.maxSize) {
      return {
        success: false,
        error: `Image size exceeds maximum allowed size of ${config.image.maxSize / 1024 / 1024}MB`
      }
    }

    const response = await fetch('/api/process-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: `data:image/jpeg;base64,${base64Image}`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to process image');
    }

    return data;

  } catch (error) {
    console.error('Error processing image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process image'
    }
  }
}
