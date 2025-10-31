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
  apiTimeout: 600000, // 10 minutes for video uploads
  itemsPerPage: 10,
  maxFileUploadSize: 500 * 1024 * 1024, // 500MB for videos
  maxVideoUploadSize: 500 * 1024 * 1024, // 500MB for recorded sessions
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  supportedVideoFormats: ['mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 'flv'],
  dateFormat: 'dd/MM/yyyy',
  timeFormat: 'HH:mm'
};
