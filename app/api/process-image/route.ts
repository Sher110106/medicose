import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { config } from '@/lib/config'

function formatDate(dateStr: string): string {
  // Try to parse the date string
  const cleanDate = dateStr.trim();
  
  // If no date found, return default date
  if (!cleanDate) {
    return '2025-01-01';
  }

  // Handle different date formats
  if (/^\d{4}-\d{2}$/.test(cleanDate)) {
    // Format: YYYY-MM
    return `${cleanDate}-01`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    // Already in correct format
    return cleanDate;
  }

  // If date is in any other format or invalid, return default
  return '2025-01-01';
}

export async function POST(request: Request) {
  try {
    const { imageData } = await request.json()

    if (!config.nebius.apiKey || !config.nebius.endpoint) {
      return NextResponse.json(
        { error: 'API configuration is missing' },
        { status: 500 }
      )
    }

    const client = new OpenAI({
      baseURL: config.nebius.endpoint,
      apiKey: config.nebius.apiKey,
    })

    // Add more detailed error logging
    console.log('Sending request to Nebius API...');
    
    const response = await client.chat.completions.create({
      model: 'Qwen/Qwen2-VL-7B-Instruct',
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Look at this product packaging and extract the expiration date. Return only the date and product name, separated by a pipe character. For the date, use YYYY-MM-DD format. If no specific day is found, use 01. Example: Product Name|2025-12-31'
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

    console.log('API Response received:', JSON.stringify(response.choices?.[0]?.message || {}, null, 2));

    if (!response.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: 'Invalid response format from API' },
        { status: 400 }
      )
    }

    const result = response.choices[0].message.content.split('|')
    
    if (result.length !== 2) {
      return NextResponse.json(
        { 
          error: 'Invalid response format from API',
          received: response.choices[0].message.content 
        },
        { status: 400 }
      )
    }

    const productName = result[0].trim();
    const formattedDate = formatDate(result[1].trim());

    return NextResponse.json({
      success: true,
      productName,
      expiryDate: formattedDate
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process image',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
