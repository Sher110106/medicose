export const config = {
  nebius: {
    apiKey: process.env.NEXT_PUBLIC_NEBIUS_API_KEY || '',
    // Update to use the correct Nebius Studio endpoint
    endpoint: process.env.NEXT_PUBLIC_NEBIUS_API_ENDPOINT || 'https://api.studio.nebius.com/v1',
  },
  image: {
    enableStorage: process.env.NEXT_PUBLIC_ENABLE_IMAGE_STORAGE === 'true',
    maxSize: parseInt(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE || '5242880', 10),
  },
} as const;