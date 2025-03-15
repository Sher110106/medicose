import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { config } from "./config"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type ProcessImageResult = {
  success: boolean
  productName?: string
  expiryDate?: string
  error?: string
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
