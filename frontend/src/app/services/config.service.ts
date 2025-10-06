import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  
  // API Configuration
  get apiBaseUrl(): string {
    return environment.apiBaseUrl;
  }

  get apiTimeout(): number {
    return environment.apiTimeout;
  }

  // Application Configuration
  get appName(): string {
    return environment.appName;
  }

  get version(): string {
    return environment.version;
  }

  get isProduction(): boolean {
    return environment.production;
  }

  // Feature Flags
  get enableMockData(): boolean {
    return environment.features.enableMockData;
  }

  get enableDebugMode(): boolean {
    return environment.features.enableDebugMode;
  }

  get enableAnalytics(): boolean {
    return environment.features.enableAnalytics;
  }

  // UI Configuration
  get itemsPerPage(): number {
    return environment.itemsPerPage;
  }

  get maxFileUploadSize(): number {
    return environment.maxFileUploadSize;
  }

  get supportedImageFormats(): string[] {
    return environment.supportedImageFormats;
  }

  get dateFormat(): string {
    return environment.dateFormat;
  }

  get timeFormat(): string {
    return environment.timeFormat;
  }

  // Utility Methods
  isFeatureEnabled(feature: keyof typeof environment.features): boolean {
    return environment.features[feature];
  }

  getApiEndpoint(path: string): string {
    return `${this.apiBaseUrl}/${path.replace(/^\//, '')}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isFileSizeValid(size: number): boolean {
    return size <= this.maxFileUploadSize;
  }

  isImageFormatSupported(extension: string): boolean {
    return this.supportedImageFormats.includes(extension.toLowerCase());
  }

  // Development helpers
  log(message: any, ...args: any[]): void {
    if (this.enableDebugMode) {
      console.log(`[${this.appName}]`, message, ...args);
    }
  }

  warn(message: any, ...args: any[]): void {
    if (this.enableDebugMode) {
      console.warn(`[${this.appName}]`, message, ...args);
    }
  }

  error(message: any, ...args: any[]): void {
    if (this.enableDebugMode) {
      console.error(`[${this.appName}]`, message, ...args);
    }
  }
}
