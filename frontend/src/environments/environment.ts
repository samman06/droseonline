// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000/api',
  appName: 'DroseOnline - Development',
  version: '1.0.0',
  features: {
    enableMockData: false,
    enableDebugMode: true,
    enableAnalytics: false
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
