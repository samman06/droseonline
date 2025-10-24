import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialService, Material } from '../../services/material.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-material-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxExtendedPdfViewerModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-6xl mx-auto">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>

        <!-- Material Content -->
        <div *ngIf="!loading && material" class="space-y-6">
          
          <!-- Back Button -->
          <button (click)="goBack()"
                  class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Materials
          </button>

          <!-- Header -->
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-3">
                  <span class="px-3 py-1 rounded-full text-sm font-medium" [ngClass]="getTypeBadgeClass(material.type)">
                    {{ material.type | titlecase }}
                  </span>
                  <span class="text-sm text-gray-500">{{ material.uploadedAgo }}</span>
                </div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ material.title }}</h1>
                <p *ngIf="material.description" class="text-gray-600">{{ material.description }}</p>
              </div>
            </div>

            <!-- Metadata -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p class="text-xs text-gray-500 mb-1">Uploaded By</p>
                <p class="text-sm font-medium text-gray-900">
                  {{ material.uploadedBy?.firstName }} {{ material.uploadedBy?.lastName }}
                </p>
              </div>
              <div *ngIf="material.fileSize">
                <p class="text-xs text-gray-500 mb-1">File Size</p>
                <p class="text-sm font-medium text-gray-900">{{ material.fileSizeFormatted }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Views</p>
                <p class="text-sm font-medium text-gray-900">{{ material.stats.viewCount }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500 mb-1">Downloads</p>
                <p class="text-sm font-medium text-gray-900">{{ material.stats.downloadCount }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-4 mt-6">
              <button (click)="downloadMaterial()"
                      class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-medium flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download
              </button>
              <button *ngIf="canEdit()"
                      (click)="editMaterial()"
                      class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Edit
              </button>
              <button *ngIf="canDelete()"
                      (click)="deleteMaterial()"
                      class="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors font-medium">
                Delete
              </button>
            </div>
          </div>

          <!-- Material Preview -->
          <div class="bg-white rounded-xl shadow-lg p-8">
            <!-- File Navigation (if multiple files) -->
            <div *ngIf="hasMultipleFiles()" class="mb-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900">Files ({{ allFiles.length }})</h2>
                <div class="flex items-center gap-2">
                  <button (click)="previousFile()"
                          [disabled]="currentFileIndex === 0"
                          class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                  </button>
                  <span class="text-sm text-gray-600 px-3">{{ currentFileIndex + 1 }} / {{ allFiles.length }}</span>
                  <button (click)="nextFile()"
                          [disabled]="currentFileIndex === allFiles.length - 1"
                          class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- File Thumbnails -->
              <div class="flex gap-2 overflow-x-auto pb-2">
                <button *ngFor="let file of allFiles; let i = index"
                        (click)="selectFile(i)"
                        [class]="currentFileIndex === i ? 'border-2 border-blue-500 bg-blue-50' : 'border-2 border-gray-200 bg-white'"
                        class="flex-shrink-0 p-3 rounded-lg hover:bg-blue-50 transition-colors min-w-[120px]">
                  <div class="text-xs font-medium text-gray-900 truncate mb-1">{{ file.fileName }}</div>
                  <div class="text-xs text-gray-500">{{ formatFileSize(file.fileSize) }}</div>
                  <div class="mt-1">
                    <span class="inline-block px-2 py-0.5 text-xs rounded-full"
                          [class]="getTypeBadgeClass(material.type || 'file')">
                      {{ getCurrentFileType(file) }}
                    </span>
                  </div>
                </button>
              </div>

              <!-- Current File Info -->
              <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ getCurrentFile().fileName }}</p>
                    <p class="text-xs text-gray-600">{{ formatFileSize(getCurrentFile().fileSize) }}</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 *ngIf="!hasMultipleFiles()" class="text-xl font-bold text-gray-900 mb-4">Preview</h2>
            
            <!-- Link Preview -->
            <div *ngIf="material.type === 'link'" class="text-center py-12">
              <svg class="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              <p class="text-lg font-medium text-gray-900 mb-4">External Link</p>
              <a [href]="getFullUrl(material.externalUrl || material.fileUrl)" target="_blank" rel="noopener noreferrer"
                 class="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                Open Link
              </a>
            </div>

            <!-- Image Preview (check both type and file extension) -->
            <div *ngIf="(material.type === 'image' || isImageFile(getCurrentFile().fileName)) && getCurrentFile().fileUrl" class="flex justify-center">
              <img [src]="getFullUrl(getCurrentFile().fileUrl)" 
                   [alt]="material.title"
                   class="max-w-full max-h-[600px] rounded-lg shadow-lg"
                   (error)="onImageError($event)">
            </div>

            <!-- Video Preview (check both type and file extension) -->
            <div *ngIf="(material.type === 'video' || isVideoFile(getCurrentFile().fileName)) && getCurrentFile().fileUrl" class="aspect-video">
              <video controls 
                     class="w-full h-full rounded-lg">
                <source [src]="getFullUrl(getCurrentFile().fileUrl)">
                Your browser does not support the video tag.
              </video>
            </div>

            <!-- PDF Preview (using ngx-extended-pdf-viewer) -->
            <div *ngIf="isPdf(getCurrentFile().fileName) && getCurrentFile().fileUrl" class="bg-gray-100 rounded-lg p-4">
              <ngx-extended-pdf-viewer 
                [src]="getFullUrl(getCurrentFile().fileUrl)"
                [height]="'800px'">
              </ngx-extended-pdf-viewer>
            </div>

            <!-- Office Documents Preview (Word, Excel, PowerPoint) -->
            <div *ngIf="isOfficeDocument(getCurrentFile().fileName) && getCurrentFile().fileUrl" class="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-12 border-2 border-dashed border-gray-300 min-h-[400px]">
              <svg class="w-24 h-24 text-blue-500 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="text-2xl font-bold text-gray-900 mb-2">{{ getCurrentFile().fileName }}</h3>
              <p class="text-gray-600 mb-6 text-center max-w-md">
                Office documents (Word, Excel, PowerPoint) cannot be previewed directly in the browser.
                <br>Please download to view the file.
              </p>
              <div class="flex gap-3">
                <a [href]="getFullUrl(getCurrentFile().fileUrl)" 
                   download
                   class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  Download File
                </a>
                <button (click)="openInNewTab(getCurrentFile().fileUrl)"
                        class="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  Open in New Tab
                </button>
              </div>
              <p class="text-sm text-gray-500 mt-6">
                💡 Supported formats: .doc, .docx, .xls, .xlsx, .ppt, .pptx
              </p>
            </div>

            <!-- Text Files Preview -->
            <div *ngIf="isTextFile(getCurrentFile().fileName) && getCurrentFile().fileUrl" class="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
              <!-- File Header -->
              <div class="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                  </svg>
                  <span class="text-white font-medium">{{ getCurrentFile().fileName }}</span>
                  <span class="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">{{ getLanguageFromExtension(getCurrentFile().fileName) }}</span>
                </div>
                <button (click)="copyToClipboard()"
                        [disabled]="loadingTextContent"
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Copy
                </button>
              </div>

              <!-- Loading State -->
              <div *ngIf="loadingTextContent" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>

              <!-- Error State -->
              <div *ngIf="textFileError && !loadingTextContent" class="px-6 py-12 text-center">
                <svg class="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-red-600">{{ textFileError }}</p>
              </div>

              <!-- Content with Line Numbers -->
              <div *ngIf="!loadingTextContent && !textFileError && textFileContent" 
                   class="bg-white overflow-x-auto max-h-[800px]">
                <div class="flex font-mono text-sm">
                  <!-- Line Numbers -->
                  <div class="bg-gray-100 text-gray-500 px-4 py-4 select-none border-r border-gray-200 sticky left-0">
                    <div *ngFor="let line of getTextWithLineNumbers(); let i = index" class="leading-6 text-right">
                      {{ i + 1 }}
                    </div>
                  </div>
                  
                  <!-- Code Content -->
                  <div class="flex-1 px-4 py-4 overflow-x-auto">
                    <pre class="leading-6 whitespace-pre"><code *ngFor="let line of getTextWithLineNumbers()" class="block">{{ line }}</code></pre>
                  </div>
                </div>
              </div>

              <!-- File Info Footer -->
              <div *ngIf="!loadingTextContent && !textFileError && textFileContent" 
                   class="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
                <span>{{ getTextWithLineNumbers().length }} lines</span>
                <span>{{ (textFileContent.length / 1024).toFixed(2) }} KB</span>
              </div>
            </div>

            <!-- Audio Preview -->
            <div *ngIf="isAudio(getCurrentFile().fileName) && getCurrentFile().fileUrl" class="flex justify-center py-8">
              <audio controls class="w-full max-w-2xl">
                <source [src]="getFullUrl(getCurrentFile().fileUrl)">
                Your browser does not support the audio element.
              </audio>
            </div>

            <!-- Generic File Preview -->
            <div *ngIf="!canPreview(material)" class="text-center py-12">
              <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mb-4">
                <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
              </div>
              <p class="text-lg font-medium text-gray-900 mb-2">Preview not available</p>
              <p class="text-gray-600 mb-4">{{ getFileTypeDescription(material.fileName) }}</p>
              <button (click)="downloadMaterial()"
                      class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                Download to View
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: []
})
export class MaterialDetailComponent implements OnInit {
  material: Material | null = null;
  loading = false;
  currentUser: any;
  textFileContent: string = '';
  loadingTextContent: boolean = false;
  textFileError: string = '';
  currentFileIndex: number = 0;
  allFiles: Array<{fileUrl: string; fileName: string; fileSize: number; mimeType: string}> = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private materialService: MaterialService,
    private toastService: ToastService,
    private authService: AuthService,
    private sanitizer: DomSanitizer
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    const materialId = this.route.snapshot.paramMap.get('id');
    if (materialId) {
      this.loadMaterial(materialId);
    }
  }

  loadMaterial(id: string): void {
    this.loading = true;
    this.materialService.getMaterial(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.material = response.data;
          
          // Build list of all files (support both single and multiple files)
          this.allFiles = [];
          
          // Add primary file if exists
          if (this.material.fileUrl) {
            this.allFiles.push({
              fileUrl: this.material.fileUrl,
              fileName: this.material.fileName || 'Unknown',
              fileSize: this.material.fileSize || 0,
              mimeType: this.material.mimeType || ''
            });
          }
          
          // Add additional files if exists
          if (this.material.files && this.material.files.length > 0) {
            this.allFiles.push(...this.material.files);
          }
          
          console.log('📁 Material loaded:', {
            title: this.material.title,
            primaryFile: this.material.fileUrl ? this.material.fileName : 'None',
            additionalFiles: this.material.files?.length || 0,
            totalFiles: this.allFiles.length,
            allFiles: this.allFiles
          });
          
          // Load text content for current file if it's a text file
          if (this.allFiles.length > 0 && this.isTextFile(this.getCurrentFile().fileName)) {
            this.loadTextFileContent(this.getCurrentFile().fileUrl);
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading material:', error);
        this.toastService.error('Failed to load material');
        this.loading = false;
        this.goBack();
      }
    });
  }

  loadTextFileContent(fileUrl: string): void {
    this.loadingTextContent = true;
    this.textFileError = '';
    this.materialService.getTextFileContent(fileUrl).subscribe({
      next: (content) => {
        this.textFileContent = content;
        this.loadingTextContent = false;
      },
      error: (error) => {
        console.error('Error loading text file:', error);
        this.textFileError = 'Failed to load file content';
        this.loadingTextContent = false;
      }
    });
  }

  canEdit(): boolean {
    if (!this.material) return false;
    const user = this.currentUser;
    if (user?.role === 'admin') return true;
    return this.material.uploadedBy?._id === user?._id;
  }

  canDelete(): boolean {
    return this.canEdit();
  }

  canPreview(material: Material): boolean {
    return material.type === 'image' || 
           material.type === 'video' || 
           material.type === 'link' ||
           this.isImageFile(material.fileName) ||
           this.isVideoFile(material.fileName) ||
           this.isPdf(material.fileName) ||
           this.isOfficeDocument(material.fileName) ||
           this.isTextFile(material.fileName) ||
           this.isAudio(material.fileName);
  }

  isImageFile(fileName?: string): boolean {
    if (!fileName) return false;
    const ext = fileName.toLowerCase();
    return ext.endsWith('.jpg') || 
           ext.endsWith('.jpeg') || 
           ext.endsWith('.png') || 
           ext.endsWith('.gif') || 
           ext.endsWith('.webp') ||
           ext.endsWith('.svg') ||
           ext.endsWith('.bmp') ||
           ext.endsWith('.ico');
  }

  isVideoFile(fileName?: string): boolean {
    if (!fileName) return false;
    const ext = fileName.toLowerCase();
    return ext.endsWith('.mp4') || 
           ext.endsWith('.webm') || 
           ext.endsWith('.ogg') || 
           ext.endsWith('.mov') || 
           ext.endsWith('.avi') ||
           ext.endsWith('.mkv') ||
           ext.endsWith('.wmv') ||
           ext.endsWith('.flv');
  }

  isPdf(fileName?: string): boolean {
    return fileName?.toLowerCase().endsWith('.pdf') || false;
  }

  isOfficeDocument(fileName?: string): boolean {
    if (!fileName) return false;
    const ext = fileName.toLowerCase();
    return ext.endsWith('.doc') || 
           ext.endsWith('.docx') || 
           ext.endsWith('.xls') || 
           ext.endsWith('.xlsx') || 
           ext.endsWith('.ppt') || 
           ext.endsWith('.pptx');
  }

  isTextFile(fileName?: string): boolean {
    if (!fileName) return false;
    const ext = fileName.toLowerCase();
    return ext.endsWith('.txt') || 
           ext.endsWith('.md') || 
           ext.endsWith('.json') || 
           ext.endsWith('.xml') ||
           ext.endsWith('.csv') ||
           ext.endsWith('.log');
  }

  isAudio(fileName?: string): boolean {
    if (!fileName) return false;
    const ext = fileName.toLowerCase();
    return ext.endsWith('.mp3') || 
           ext.endsWith('.wav') || 
           ext.endsWith('.ogg') || 
           ext.endsWith('.m4a') ||
           ext.endsWith('.aac');
  }

  getFileTypeDescription(fileName?: string): string {
    if (!fileName) return 'Download the file to view its contents';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    const descriptions: { [key: string]: string } = {
      'zip': 'Compressed archive file',
      'rar': 'Compressed archive file',
      '7z': 'Compressed archive file',
      'exe': 'Executable file',
      'apk': 'Android application',
      'dmg': 'Mac application',
      'iso': 'Disk image file',
      'sql': 'Database file',
      'db': 'Database file',
      'psd': 'Photoshop document',
      'ai': 'Adobe Illustrator file',
      'sketch': 'Sketch design file',
      'fig': 'Figma design file'
    };
    
    return descriptions[ext || ''] || 'Download the file to view its contents';
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getFullUrl(url));
  }

  getFullUrl(url?: string): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url; // Already a full URL
    }
    // Relative path - prepend backend base URL
    const baseUrl = environment.apiBaseUrl.replace('/api', '');
    return `${baseUrl}${url}`;
  }

  getFileExtension(fileName?: string): string {
    if (!fileName) return '';
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  getLanguageFromExtension(fileName?: string): string {
    const ext = this.getFileExtension(fileName);
    const languageMap: { [key: string]: string } = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'go': 'Go',
      'rb': 'Ruby',
      'php': 'PHP',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'md': 'Markdown',
      'sql': 'SQL',
      'sh': 'Shell',
      'bash': 'Bash',
      'txt': 'Plain Text',
      'log': 'Log',
      'csv': 'CSV'
    };
    return languageMap[ext] || 'Text';
  }

  getTextWithLineNumbers(): string[] {
    if (!this.textFileContent) return [];
    return this.textFileContent.split('\n');
  }

  copyToClipboard(): void {
    if (!this.textFileContent) return;
    
    navigator.clipboard.writeText(this.textFileContent).then(() => {
      this.toastService.success('Content copied to clipboard');
    }).catch(() => {
      this.toastService.error('Failed to copy content');
    });
  }

  onImageError(event: any): void {
    // Log for debugging but don't show toast - UI already handles preview states
    console.error('Image failed to load:', event);
    console.log('Attempted URL:', event.target?.src);
    console.log('Material fileUrl:', this.material?.fileUrl);
  }

  downloadMaterial(): void {
    if (this.material) {
      this.materialService.downloadMaterial(this.material);
      this.toastService.success('Download started');
    }
  }

  openInNewTab(fileUrl: string): void {
    const fullUrl = this.getFullUrl(fileUrl);
    window.open(fullUrl, '_blank');
  }

  editMaterial(): void {
    if (this.material && this.material._id) {
      this.router.navigate(['/dashboard/materials', this.material._id, 'edit']);
    }
  }

  deleteMaterial(): void {
    if (!this.material || !this.material._id) return;
    
    // Confirmation and deletion logic here
    this.materialService.deleteMaterial(this.material._id).subscribe({
      next: () => {
        this.toastService.success('Material deleted');
        this.goBack();
      },
      error: (error: any) => {
        this.toastService.error('Failed to delete material');
      }
    });
  }

  getTypeBadgeClass(type: string): string {
    const colors: any = {
      'file': 'bg-blue-100 text-blue-800',
      'document': 'bg-purple-100 text-purple-800',
      'link': 'bg-green-100 text-green-800',
      'video': 'bg-red-100 text-red-800',
      'presentation': 'bg-yellow-100 text-yellow-800',
      'image': 'bg-pink-100 text-pink-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }

  goBack(): void {
    this.router.navigate(['/dashboard/materials']);
  }

  // Multi-file support methods
  hasMultipleFiles(): boolean {
    return this.allFiles.length > 1;
  }

  getCurrentFile() {
    if (this.allFiles.length === 0) {
      return { fileUrl: '', fileName: '', fileSize: 0, mimeType: '' };
    }
    return this.allFiles[this.currentFileIndex] || this.allFiles[0];
  }

  nextFile(): void {
    if (this.currentFileIndex < this.allFiles.length - 1) {
      this.currentFileIndex++;
      this.loadCurrentFileContent();
    }
  }

  previousFile(): void {
    if (this.currentFileIndex > 0) {
      this.currentFileIndex--;
      this.loadCurrentFileContent();
    }
  }

  selectFile(index: number): void {
    if (index >= 0 && index < this.allFiles.length) {
      this.currentFileIndex = index;
      this.loadCurrentFileContent();
    }
  }

  private loadCurrentFileContent(): void {
    const currentFile = this.getCurrentFile();
    // If it's a text file, reload content
    if (this.isTextFile(currentFile.fileName)) {
      this.loadTextFileContent(currentFile.fileUrl);
    } else {
      // Clear text content if switching to non-text file
      this.textFileContent = '';
      this.textFileError = '';
    }
  }

  getCurrentFileType(file: any): string {
    const fileName = file.fileName;
    if (this.isImageFile(fileName)) return 'image';
    if (this.isVideoFile(fileName)) return 'video';
    if (this.isPdf(fileName)) return 'pdf';
    if (this.isOfficeDocument(fileName)) return 'office';
    if (this.isTextFile(fileName)) return 'text';
    if (this.isAudio(fileName)) return 'audio';
    return 'other';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

