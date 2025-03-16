import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { config } from '@/lib/config'

// Maximum time for the entire process
const PROCESS_TIMEOUT = 25000; // 25 seconds

function formatDate(dateStr: string | null): string | null {
  // If no date provided, return null to indicate no date was found
  if (!dateStr || !dateStr.trim()) {
    return null;
  }

  // Try to parse the date string
  const cleanDate = dateStr.trim();
  
  // Handle different date formats
  // Format: YYYY-MM
  if (/^\d{4}-\d{2}$/.test(cleanDate)) {
    return `${cleanDate}-01`;
  }

  // Format: YYYY-MM-DD (already in correct format)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return cleanDate;
  }
  
  // Format: MM/YYYY
  const mmYyyyMatch = cleanDate.match(/^(\d{1,2})\/(\d{4})$/);
  if (mmYyyyMatch) {
    const month = mmYyyyMatch[1].padStart(2, '0');
    return `${mmYyyyMatch[2]}-${month}-01`;
  }

  // Format: MM/DD/YYYY
  const mmDdYyyyMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmDdYyyyMatch) {
    const month = mmDdYyyyMatch[1].padStart(2, '0');
    const day = mmDdYyyyMatch[2].padStart(2, '0');
    return `${mmDdYyyyMatch[3]}-${month}-${day}`;
  }

  // Try to use JavaScript's Date parsing as a fallback
  try {
    const date = new Date(cleanDate);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (_) {
    // Parsing failed
  }

  // If date is in any other format or invalid, return null
  return null;
}

// Check if a medicine is expired based on the expiry date
function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) {
    // If no date available, we can't determine if it's expired
    return false;
  }
  
  try {
    const today = new Date("2025-03-16"); // Current date from context
    const expiry = new Date(expiryDate);
    return today > expiry;
  } catch (_) {
    // If date parsing fails, assume not expired
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  let timeoutId: NodeJS.Timeout | undefined;
  
  try {
    const timeoutPromise: Promise<Response> = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Processing timeout - please try with a smaller image or try again'));
      }, PROCESS_TIMEOUT);
    });

    const processPromise: Promise<Response> = (async () => {
      try {
        const { imageData } = await request.json()

        if (!config.nebius.apiKey || !config.nebius.endpoint) {
          throw new Error('API configuration is missing');
        }

        const client = new OpenAI({
          baseURL: config.nebius.endpoint,
          apiKey: config.nebius.apiKey,
          timeout: 20000, // 20 second timeout for OpenAI calls
        })

        // Using the Vision model for comprehensive text extraction and medicine information
        console.log('Starting comprehensive scan with vision model...');
        
        const visionResponse = await client.chat.completions.create({
          model: 'Qwen/Qwen2-VL-7B-Instruct',  // Corrected model name
          temperature: 0.2,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Extract all medicine information from this packaging image, focusing on:
1. Medicine name (official name, brand name)
2. Expiry date (in any format)
3. Manufacturer name
4. Batch/lot number
5. Composition (active ingredients and their amounts)
6. Dosage instructions
7. Storage conditions
8. Warnings and precautions

For each identified piece of information, provide the exact text as seen on the packaging.
If the expiry date is found, ensure it's clearly labeled.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageData
                  }
                }
              ]
            }
          ]
        })
        
        console.log('Vision response received');
        
        if (!visionResponse.choices?.[0]?.message?.content) {
          return NextResponse.json(
            { error: 'No text extracted from image' },
            { status: 400 }
          )
        }
        
        const extractedText = visionResponse.choices[0].message.content.trim();
        console.log('Extracted text:', extractedText.substring(0, 200) + '...');
        
        // If no text found, return early
        if (!extractedText || extractedText.toLowerCase().includes("no text") || extractedText.toLowerCase().includes("no readable text")) {
          return NextResponse.json({
            success: true,
            noText: true,
            message: "No information could be extracted from this image",
            rawText: extractedText
          });
        }
        
        // Try to extract medicine name and expiry date from the vision model output first
        let productName = "Unknown Medicine";
        let expiryDate: string | null = null; // Initialize as null instead of a default date
        
        // Enhanced pattern matching for medicine name to handle structured format
        const officialNameMatch = extractedText.match(/official\s+name:\s*([^\n]+)/i);
        const brandNameMatch = extractedText.match(/brand\s+name:\s*([^\n]+)/i);
        
        if (officialNameMatch && officialNameMatch[1]) {
          productName = officialNameMatch[1].trim();
          // If we have both names, combine them
          if (brandNameMatch && brandNameMatch[1]) {
            productName = `${officialNameMatch[1].trim()} (${brandNameMatch[1].trim()})`;
          }
        } else if (brandNameMatch && brandNameMatch[1]) {
          productName = brandNameMatch[1].trim();
        } else {
          // Fallback to previous pattern matching if structured format not found
          const nameMatch = extractedText.match(/(?:medicine|product|drug|medication|brand|trade)\s+name:?\s*([^\n]+)/i) || 
                           extractedText.match(/name:?\s*([^\n]+)/i) ||
                           extractedText.match(/^([A-Za-z0-9 ]+?)(?:\n|$)/m);
          
          if (nameMatch && nameMatch[1]) {
            productName = nameMatch[1].trim();
          }
        }
        
        // Improved pattern matching for expiry date
        const expiryMatch = extractedText.match(/(?:expiry|expiration|exp\.?|use before|best before)(?:\s+date)?:?\s*([^\n]+)/i) ||
                            extractedText.match(/(?:exp|expiry)\.?\s*(?:date)?:?\s*([^\n]+)/i);
        
        // Check if expiry date is mentioned as not visible/not found in the extracted text
        const notVisibleMatch = extractedText.toLowerCase().match(/expiry\s+date.*not\s+visible|not\s+able\s+to\s+detect.*expiry/);
                            
        if (expiryMatch && expiryMatch[1]) {
          expiryDate = formatDate(expiryMatch[1].trim());
        } else if (notVisibleMatch) {
          expiryDate = null; // Explicitly set to null if mentioned as not visible
        }
        
        // Use DeepSeek only for summarizing benefits and providing additional contextual information
        console.log('Starting DeepSeek analysis for medicine benefits and summary...');
        
        interface BenefitsInfo {
          benefits_summary?: string;
          additional_information?: string;
          precautions?: string;
        }
        
        let benefitsInfo: BenefitsInfo = {};
        try {
          const deepseekResponse = await client.chat.completions.create({
            model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',  // Corrected model name
            temperature: 0.2,
            messages: [
              {
                role: 'user',
                content: `Based on the following extracted text from a medicine packaging, provide:

1. A brief summary of the medicine's benefits and primary usage
2. Additional information about this type of medication that might be helpful to the patient
3. Any common precautions worth noting beyond what's explicitly stated

Extracted text:
${extractedText}

Return a JSON response with these fields:
{
  "benefits_summary": "Brief summary of what the medicine is used for",
  "additional_information": "Additional helpful context about this medicine type",
  "precautions": "Important precautions beyond what's explicitly stated"
}
`
              }
            ]
          });
          
          console.log('DeepSeek benefits analysis completed');
          console.log('DeepSeek response:', deepseekResponse.choices?.[0]?.message?.content);
          
          // Process the DeepSeek response for benefits information
          if (deepseekResponse.choices?.[0]?.message?.content) {
            const benefitsText = deepseekResponse.choices[0].message.content;
            
            // Try to extract JSON from the response
            const jsonMatch = benefitsText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              benefitsInfo = JSON.parse(jsonMatch[0]);
            }
          }
        } catch (error) {
          console.error('DeepSeek analysis failed:', error);
          // Continue without benefits info if there's an error
        }
        
        // Extract more information from the vision model response with improved pattern matching
        const manufacturerMatch = extractedText.match(/(?:manufacturer|manufactured by|mfg\.?|made by):?\s*([^\n]+)/i) ||
                                extractedText.match(/(?:manufacturer|manufactured by|mfg\.?|made by)[^\n]*\n\s*([^\n]+)/i);
        const manufacturerName = manufacturerMatch && manufacturerMatch[1] ? manufacturerMatch[1].trim() : undefined;
        
        const batchMatch = extractedText.match(/(?:batch|lot|batch\/lot|b\.no|l\.no|batch no|lot no)\.?:?\s*([^\n]+)/i) ||
                          extractedText.match(/(?:batch|lot|batch\/lot|b\.no|l\.no|batch no|lot no)[^\n]*\n\s*([^\n]+)/i);
        const batchNumber = batchMatch && batchMatch[1] ? batchMatch[1].trim() : undefined;
        
        const storageMatch = extractedText.match(/(?:store|storage|keep|preserve)(?:\s+at)?(?:\s+in)?:?\s*([^\n]+)/i);
        const storageInstructions = storageMatch && storageMatch[1] ? storageMatch[1].trim() : undefined;
        
        // Extract composition information with improved pattern matching
        const compositionMatch = extractedText.match(/composition[^\n]*(?:\n|.)*?(?:contains?:)([^]*?)(?=\d\.|\n\s*\n|$)/i);
        let activeIngredients = "";
        let inactiveIngredients = "";
        
        if (compositionMatch && compositionMatch[1]) {
          const compositionText = compositionMatch[1].trim();
          
          // Try to separate active and inactive ingredients
          const lines = compositionText.split('\n').map(line => line.trim()).filter(Boolean);
          
          lines.forEach(line => {
            if (line.toLowerCase().includes('excipient') || line.toLowerCase().includes('colour')) {
              if (inactiveIngredients) {
                inactiveIngredients += '\n' + line;
              } else {
                inactiveIngredients = line;
              }
            } else {
              if (activeIngredients) {
                activeIngredients += '\n' + line;
              } else {
                activeIngredients = line;
              }
            }
          });
        }

        // Build normalized information structure
        const medicineInfo = {
          basic_information: {
            medicine_name: productName,
            expiry_date: expiryDate || "Not detected", // Use "Not detected" for display in detailed info
            manufacturer: manufacturerName,
            batch_lot_number: batchNumber
          },
          composition: {
            active_ingredients: activeIngredients || undefined,
            inactive_ingredients_excipients: inactiveIngredients || undefined
          },
          usage_information: {
            indications: benefitsInfo?.benefits_summary || "No information available",
            benefits_summary: benefitsInfo?.benefits_summary,
            storage_instructions: storageInstructions,
            dosage_instructions: extractedText.match(/dosage:([^\n]+)/i)?.[1]?.trim(),
            additional_information: benefitsInfo?.additional_information
          },
          clinical_information: {
            warnings_and_precautions: extractedText.match(/warnings and precautions:([^]*?)(?=\d\.|\n\s*\n|$)/i)?.[1]?.trim(),
            precautions: benefitsInfo?.precautions
          },
          other_details: {
            additional_information: benefitsInfo?.additional_information || "No additional information available",
            regulatory_information: extractedText.match(/schedule[^]*?practitioner/i)?.[0]?.trim() || undefined
          }
        };
        
        // Check if the medicine is expired
        const expired = isExpired(expiryDate);
        
        return NextResponse.json({
          success: true,
          productName,
          expiryDate: expiryDate || "Not detected", // Use "Not detected" for the top-level response
          expired,
          detailedInfo: medicineInfo,
          rawText: extractedText
        });

      } catch (error) {
        console.error('API Error:', error);
        throw error;
      }
    })();

    // Race between timeout and processing
    const result = await Promise.race<Response>([processPromise, timeoutPromise]);
    if (timeoutId) clearTimeout(timeoutId);
    return result;

  } catch (error) {
    console.error('API Error:', error);
    if (timeoutId) clearTimeout(timeoutId);
    
    // Ensure we always return a valid JSON response
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.stack : undefined
    }, { 
      status: error instanceof Error && error.message.includes('timeout') ? 504 : 500 
    });
  }
}
