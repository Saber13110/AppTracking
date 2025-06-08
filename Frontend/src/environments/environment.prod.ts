export const environment = {
  production: true,
  apiUrl: 'https://api.example.com/api/v1',
  googleMapsApiKey: (process as any).env.GOOGLE_MAPS_API_KEY || ''
};
