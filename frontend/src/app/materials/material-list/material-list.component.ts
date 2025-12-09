import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaterialService, Material, MaterialQueryParams } from '../../services/material.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-material-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 class="text-4xl font-bold text-white mb-2">📚 {{ 'materials.title' | translate }}</h1>
              <p class="text-blue-100 text-lg">{{ 'materials.accessResources' | translate }}</p>
            </div>
            <div class="flex items-center gap-3 mt-4 md:mt-0">
              <!-- View Mode Toggle -->
              <div class="inline-flex rounded-lg bg-white bg-opacity-20 p-1 border-2 border-white border-opacity-30">
                <button 
                  (click)="viewMode = 'card'"
                  [class]="viewMode === 'card' 
                    ? 'px-3 py-2 bg-white text-indigo-600 rounded-md shadow-sm font-medium transition-all' 
                    : 'px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-md transition-all'"
                  [title]="'common.cardView' | translate"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
                  </svg>
                </button>
                <button 
                  (click)="viewMode = 'table'"
                  [class]="viewMode === 'table' 
                    ? 'px-3 py-2 bg-white text-indigo-600 rounded-md shadow-sm font-medium transition-all' 
                    : 'px-3 py-2 text-white hover:bg-white hover:bg-opacity-10 rounded-md transition-all'"
                  [title]="'common.tableView' | translate"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </button>
              </div>
              
              <button *ngIf="canUpload()"
                      (click)="openUploadModal()"
                      class="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                </svg>
                {{ 'materials.uploadMaterials' | translate }}
              </button>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
            </svg>
            {{ 'common.filter' | translate }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'common.search' | translate }}</label>
              <input 
                type="text"
                [(ngModel)]="filters.search"
                (ngModelChange)="onFilterChange()"
                [placeholder]="'materials.searchPlaceholder' | translate"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'materials.type' | translate }}</label>
              <select 
                [(ngModel)]="filters.type"
                (change)="onFilterChange()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">{{ 'materials.allTypes' | translate }}</option>
                <option value="file">{{ 'materials.types.file' | translate }}</option>
                <option value="document">{{ 'materials.types.document' | translate }}</option>
                <option value="link">{{ 'materials.types.link' | translate }}</option>
                <option value="video">{{ 'materials.types.video' | translate }}</option>
                <option value="presentation">{{ 'materials.types.presentation' | translate }}</option>
                <option value="image">{{ 'materials.types.image' | translate }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'materials.category' | translate }}</label>
              <select 
                [(ngModel)]="filters.category"
                (change)="onFilterChange()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">{{ 'materials.allCategories' | translate }}</option>
                <option value="lecture_notes">{{ 'materials.categories.lectureNotes' | translate }}</option>
                <option value="reading">{{ 'materials.categories.reading' | translate }}</option>
                <option value="video">{{ 'materials.categories.video' | translate }}</option>
                <option value="practice">{{ 'materials.categories.practice' | translate }}</option>
                <option value="syllabus">{{ 'materials.categories.syllabus' | translate }}</option>
                <option value="exam_material">{{ 'materials.categories.examMaterial' | translate }}</option>
                <option value="supplementary">{{ 'materials.categories.supplementary' | translate }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'materials.sortBy' | translate }}</label>
              <select 
                [(ngModel)]="filters.sort"
                (change)="onFilterChange()"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="-uploadDate">{{ 'materials.newestFirst' | translate }}</option>
                <option value="uploadDate">{{ 'materials.oldestFirst' | translate }}</option>
                <option value="title">{{ 'materials.titleAZ' | translate }}</option>
                <option value="-title">{{ 'materials.titleZA' | translate }}</option>
                <option value="-stats.downloadCount">{{ 'materials.mostDownloaded' | translate }}</option>
                <option value="-stats.viewCount">{{ 'materials.mostViewed' | translate }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let i of [1,2,3,4,5,6]" class="bg-white rounded-xl shadow-lg p-6 animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div class="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && materials.length === 0" class="bg-white rounded-xl shadow-lg p-12 text-center">
          <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ 'materials.noMaterialsFound' | translate }}</h3>
          <p class="text-gray-500">{{ 'materials.tryAdjustingFilters' | translate }}</p>
        </div>

        <!-- Table View -->
        <div *ngIf="!loading && materials.length > 0 && viewMode === 'table'" class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ 'materials.title' | translate }}
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ 'materials.type' | translate }}
                  </th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ 'materials.category' | translate }}
                  </th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                    {{ 'common.actions' | translate }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr *ngFor="let material of materials" class="hover:bg-blue-50 transition-colors">
                  <!-- Title -->
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-bold text-gray-900">{{ material.title }}</div>
                      </div>
                    </div>
                  </td>

                  <!-- Type -->
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                      {{ material.type }}
                    </span>
                  </td>

                  <!-- Category -->
                  <td class="px-6 py-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                      {{ material.category }}
                    </span>
                  </td>

                  <!-- Actions -->
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <button 
                        (click)="viewMaterial(material)"
                        class="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">
                        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        {{ 'materials.view' | translate }}
                      </button>
                      <button 
                        *ngIf="canDelete(material)"
                        (click)="deleteMaterial(material)"
                        class="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">
                        <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        {{ 'materials.delete' | translate }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Card View (Materials Grid) -->
        <div *ngIf="!loading && materials.length > 0 && viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div *ngFor="let material of materials" 
               class="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group">
            
            <!-- Material Header with Type Color -->
            <div class="h-2" [ngClass]="getTypeColorClass(material.type)"></div>
            
            <div class="p-6">
              <!-- Icon and Type -->
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="p-3 rounded-lg" [ngClass]="getTypeBackgroundClass(material.type)">
                    <svg class="w-6 h-6" [ngClass]="getTypeColorClass(material.type)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath(material.type)"></path>
                    </svg>
                  </div>
                  <span class="text-xs font-medium px-2 py-1 rounded-full" [ngClass]="getTypeBadgeClass(material.type)">
                    {{ material.type | titlecase }}
                  </span>
                </div>
                <span class="text-xs text-gray-500">{{ material.uploadedAgo }}</span>
              </div>

              <!-- Title and Description -->
              <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{{ material.title }}</h3>
              <p *ngIf="material.description" class="text-sm text-gray-600 mb-4 line-clamp-2">{{ material.description }}</p>

              <!-- Metadata -->
              <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  {{ material.uploadedBy?.firstName }} {{ material.uploadedBy?.lastName }}
                </div>
                <div *ngIf="material.fileSize" class="flex items-center gap-2 text-sm text-gray-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                  </svg>
                  {{ material.fileSizeFormatted }}
                </div>
              </div>

              <!-- Stats -->
              <div class="flex items-center gap-4 mb-4 text-sm text-gray-500">
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  {{ material.stats.viewCount }}
                </div>
                <div class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  {{ material.stats.downloadCount }}
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button (click)="viewMaterial(material)"
                        class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  {{ 'common.view' | translate }}
                </button>
                <button (click)="downloadMaterial(material)"
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                </button>
                <button *ngIf="canEdit(material)"
                        (click)="editMaterial(material)"
                        class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button *ngIf="canDelete(material)"
                        (click)="deleteMaterial(material)"
                        class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div *ngIf="!loading && pagination && pagination.pages > 1" class="mt-8 flex justify-center">
          <nav class="flex items-center gap-2">
            <button (click)="goToPage(pagination.page - 1)"
                    [disabled]="pagination.page === 1"
                    class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ 'common.previous' | translate }}
            </button>
            <span class="px-4 py-2 text-gray-700">
              {{ 'pagination.page' | translate }} {{ pagination.page }} {{ 'pagination.of' | translate }} {{ pagination.pages }}
            </span>
            <button (click)="goToPage(pagination.page + 1)"
                    [disabled]="pagination.page === pagination.pages"
                    class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              {{ 'common.next' | translate }}
            </button>
          </nav>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class MaterialListComponent implements OnInit {
  materials: Material[] = [];
  loading = false;
  viewMode: 'card' | 'table' = 'table';
  filters: MaterialQueryParams = {
    page: 1,
    limit: 12,
    sort: '-uploadDate'
  };
  pagination: any = null;

  constructor(
    private materialService: MaterialService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Check for route params (e.g., course filter)
    this.route.queryParams.subscribe(params => {
      if (params['course']) {
        this.filters.course = params['course'];
      }
      this.loadMaterials();
    });
  }

  loadMaterials(): void {
    console.log("--------------------------------");
    console.log('Loading materials');
    console.log('Filters:', this.filters);
    this.loading = true;
    this.materialService.getMaterials(this.filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.materials = response.data.materials;
          this.pagination = response.data.pagination;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading materials:', error);
        this.toastService.error(error.error?.userMessage || this.translate.instant('materials.failedToLoad'));
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.filters.page = 1; // Reset to first page
    this.loadMaterials();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.pages) {
      this.filters.page = page;
      this.loadMaterials();
    }
  }

  canUpload(): boolean {
    const user = this.authService.currentUser;
    return user?.role === 'teacher' || user?.role === 'admin';
  }

  canEdit(material: Material): boolean {
    const user = this.authService.currentUser;
    if (user?.role === 'admin') return true;
    return material.uploadedBy?._id === user?._id;
  }

  canDelete(material: Material): boolean {
    return this.canEdit(material);
  }

  openUploadModal(): void {
    // Navigate to upload page or open modal
    this.router.navigate(['/dashboard/materials/upload']);
  }

  viewMaterial(material: Material): void {
    this.router.navigate(['/dashboard/materials', material._id]);
  }

  downloadMaterial(material: Material): void {
    this.materialService.downloadMaterial(material);
    this.toastService.success(this.translate.instant('materials.downloadStarted'));
  }

  editMaterial(material: Material): void {
    this.router.navigate(['/dashboard/materials', material._id, 'edit']);
  }

  deleteMaterial(material: Material): void {
    this.confirmationService.confirm({
      title: this.translate.instant('materials.deleteMaterial'),
      message: this.translate.instant('materials.deleteConfirmMessage', { title: material.title }),
      confirmText: this.translate.instant('common.delete'),
      cancelText: this.translate.instant('common.cancel'),
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.materialService.deleteMaterial(material._id).subscribe({
          next: (response) => {
            this.toastService.success(this.translate.instant('materials.deleteSuccess'));
            this.loadMaterials();
          },
          error: (error) => {
            this.toastService.error(error.error?.userMessage || this.translate.instant('materials.failedToDelete'));
          }
        });
      }
    });
  }

  // Helper methods for styling
  getTypeColorClass(type: string): string {
    const colors: any = {
      'file': 'bg-blue-500',
      'document': 'bg-purple-500',
      'link': 'bg-green-500',
      'video': 'bg-red-500',
      'presentation': 'bg-yellow-500',
      'image': 'bg-pink-500',
      'other': 'bg-gray-500'
    };
    return colors[type] || 'bg-gray-500';
  }

  getTypeBackgroundClass(type: string): string {
    const colors: any = {
      'file': 'bg-blue-100',
      'document': 'bg-purple-100',
      'link': 'bg-green-100',
      'video': 'bg-red-100',
      'presentation': 'bg-yellow-100',
      'image': 'bg-pink-100',
      'other': 'bg-gray-100'
    };
    return colors[type] || 'bg-gray-100';
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

  getIconPath(type: string): string {
    const paths: any = {
      'file': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'document': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      'link': 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      'video': 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'presentation': 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
      'image': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      'other': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
    };
    return paths[type] || paths['other'];
  }
}

