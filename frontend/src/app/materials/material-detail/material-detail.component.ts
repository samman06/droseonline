import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MaterialService, Material } from '../../services/material.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-material-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
            <h2 class="text-xl font-bold text-gray-900 mb-4">Preview</h2>
            
            <!-- Link Preview -->
            <div *ngIf="material.type === 'link'" class="text-center py-12">
              <svg class="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              <p class="text-lg font-medium text-gray-900 mb-4">External Link</p>
              <a [href]="material.fileUrl" target="_blank" rel="noopener noreferrer"
                 class="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
                Open Link
              </a>
            </div>

            <!-- Image Preview -->
            <div *ngIf="material.type === 'image'" class="flex justify-center">
              <img [src]="material.fileUrl" 
                   [alt]="material.title"
                   class="max-w-full max-h-[600px] rounded-lg shadow-lg">
            </div>

            <!-- Video Preview -->
            <div *ngIf="material.type === 'video'" class="aspect-video">
              <video *ngIf="material.fileUrl" 
                     controls 
                     class="w-full h-full rounded-lg">
                <source [src]="material.fileUrl">
                Your browser does not support the video tag.
              </video>
            </div>

            <!-- Document/PDF Preview -->
            <div *ngIf="material.type === 'document' && isPdf(material.fileName) && material.fileUrl" class="h-[800px]">
              <iframe [src]="getSafeUrl(material.fileUrl!)" 
                      class="w-full h-full border-0 rounded-lg"></iframe>
            </div>

            <!-- Generic File Preview -->
            <div *ngIf="!canPreview(material)" class="text-center py-12">
              <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              <p class="text-lg font-medium text-gray-900 mb-2">Preview not available</p>
              <p class="text-gray-600 mb-4">Download the file to view its contents</p>
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
           this.isPdf(material.fileName);
  }

  isPdf(fileName?: string): boolean {
    return fileName?.toLowerCase().endsWith('.pdf') || false;
  }

  getSafeUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  downloadMaterial(): void {
    if (this.material) {
      this.materialService.downloadMaterial(this.material);
      this.toastService.success('Download started');
    }
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
}

