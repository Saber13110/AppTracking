export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api/v1',
  googleMapsApiKey: (process as any).env.GOOGLE_MAPS_API_KEY || '',
  simulateNetworkError: true
};
