export const environment = {
  production: true,
  apiBaseUrl: 'https://api.droseonline.com/api',
  appName: 'DroseOnline',
  version: '1.0.0',
  features: {
    enableMockData: false,
    enableDebugMode: false,
    enableAnalytics: true
  },
  apiTimeout: 15000, // 15 seconds
  itemsPerPage: 10,
  maxFileUploadSize: 10 * 1024 * 1024, // 10MB
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm'
};
