import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialService, Material } from '../../services/material.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CourseService } from '../../services/course.service';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-material-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        
        <!-- Loading State -->
        <div *ngIf="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>

        <div *ngIf="!loading">
          <!-- Header -->
          <div class="mb-8">
            <button (click)="goBack()"
                    class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back
            </button>
            <h1 class="text-4xl font-bold text-gray-900 mb-2">✏️ Edit Material</h1>
            <p class="text-gray-600">Update material information and files</p>
          </div>

          <!-- Edit Form -->
          <div class="bg-white rounded-xl shadow-xl p-8">
            <form (ngSubmit)="onSubmit()">
              
              <!-- Upload Mode Toggle -->
              <div class="mb-6 flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span class="text-sm font-semibold text-gray-700">Material Type:</span>
                <div class="flex gap-2">
                  <button type="button"
                          (click)="switchToFileMode()"
                          [class]="!isLinkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                          class="px-4 py-2 rounded-lg font-medium transition-colors">
                    📁 Files
                  </button>
                  <button type="button"
                          (click)="switchToLinkMode()"
                          [class]="isLinkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                          class="px-4 py-2 rounded-lg font-medium transition-colors">
                    🔗 External Link
                  </button>
                </div>
              </div>

              <!-- Current Files Info -->
              <div *ngIf="!isLinkMode && existingFiles.length > 0 && !replaceFiles" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-semibold text-green-900 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    Current Files ({{ existingFiles.length }})
                  </h3>
                  <button type="button"
                          (click)="replaceFiles = true"
                          class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Replace Files
                  </button>
                </div>
                <div class="space-y-2 mt-3">
                  <div *ngFor="let file of existingFiles" class="flex items-center gap-3 p-2 bg-white rounded border border-green-200">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-900">{{ file.fileName }}</p>
                      <p class="text-xs text-gray-600">{{ formatFileSize(file.fileSize) }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Current Link Info -->
              <div *ngIf="isLinkMode && material?.externalUrl && !replaceFiles" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-sm font-semibold text-green-900 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                    </svg>
                    Current Link
                  </h3>
                  <button type="button"
                          (click)="replaceFiles = true"
                          class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Replace Link
                  </button>
                </div>
                <p class="text-sm text-blue-600 truncate mt-2">{{ material?.externalUrl }}</p>
              </div>

              <!-- Auto-detected Type Badge (if new files selected) -->
              <div *ngIf="selectedFiles.length > 0 && !isLinkMode" class="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-sm text-gray-700">
                  Material Type: <span class="font-semibold text-blue-700">{{ formData.type | titlecase }}</span> (auto-detected)
                </span>
              </div>

              <!-- Title -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                <input type="text"
                       [(ngModel)]="formData.title"
                       name="title"
                       required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                       placeholder="e.g., Chapter 1 - Introduction">
              </div>

              <!-- Description -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea [(ngModel)]="formData.description"
                          name="description"
                          rows="4"
                          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Describe this material..."></textarea>
              </div>

              <!-- Category -->
              <div class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-semibold text-gray-700">Category *</label>
                  <button type="button"
                          *ngIf="selectedFiles.length > 0 && getSuggestedCategory()"
                          (click)="applySuggestedCategory()"
                          class="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    Use Suggested: {{ getCategoryLabel(getSuggestedCategory()) }}
                  </button>
                </div>
                <select [(ngModel)]="formData.category"
                        name="category"
                        required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Select a category</option>
                  <option value="lecture_notes">📝 Lecture Notes</option>
                  <option value="reading">📖 Reading Material</option>
                  <option value="video">🎬 Video Tutorial</option>
                  <option value="practice">✏️ Practice Exercises</option>
                  <option value="syllabus">📋 Syllabus</option>
                  <option value="exam_material">📄 Exam Material</option>
                  <option value="supplementary">📚 Supplementary Material</option>
                  <option value="other">📎 Other</option>
                </select>
                <p *ngIf="selectedFiles.length > 0" class="text-xs text-gray-500 mt-2">
                  💡 Category auto-suggested based on new file types
                </p>
              </div>

              <!-- Course -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Course *</label>
                <select [(ngModel)]="formData.course"
                        name="course"
                        (change)="onCourseChange()"
                        required
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option value="">Select a course</option>
                  <option *ngFor="let course of courses" [value]="course._id">
                    {{ course.code }} - {{ course.name }}
                  </option>
                </select>
              </div>

              <!-- Groups (Optional) -->
              <div *ngIf="groups.length > 0" class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Specific Groups (Optional)</label>
                <div class="grid grid-cols-2 gap-3 p-4 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                  <label *ngFor="let group of groups" class="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input type="checkbox"
                           [value]="group._id"
                           [checked]="formData.groups?.includes(group._id)"
                           (change)="toggleGroup(group._id, $event)"
                           class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                    <span class="text-sm text-gray-700">{{ group.name }}</span>
                  </label>
                </div>
                <p class="text-xs text-gray-500 mt-2">Select specific groups or leave empty for all course students</p>
              </div>

              <!-- File Upload or Link -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  {{ isLinkMode ? 'Link URL *' : 'File Upload' }}
                  <span *ngIf="!isLinkMode && !replaceFiles" class="text-gray-500 font-normal">(Optional - keep existing or replace)</span>
                </label>
                
                <!-- Link Input -->
                <div *ngIf="isLinkMode">
                  <input type="url"
                         [(ngModel)]="formData.link"
                         name="link"
                         [required]="isLinkMode && replaceFiles"
                         class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                         placeholder="https://example.com/resource">
                  <p class="text-xs text-gray-500 mt-2">💡 Enter a URL to external resources (YouTube, Google Drive, etc.)</p>
                </div>
                
                <!-- File Upload with Drag & Drop -->
                <div *ngIf="!isLinkMode && replaceFiles"
                     class="relative"
                     (dragover)="onDragOver($event)"
                     (dragleave)="onDragLeave($event)"
                     (drop)="onDrop($event)">
                  <div [class]="getDropzoneClass()"
                       class="border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200">
                    
                    <!-- Upload Icon -->
                    <svg class="w-16 h-16 mx-auto mb-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                    </svg>
                    
                    <p class="text-lg font-medium text-gray-700 mb-2">
                      {{ isDragging ? 'Drop files here' : 'Drag & drop files here' }}
                    </p>
                    <p class="text-sm text-gray-500 mb-4">Upload one or multiple files • or</p>
                    
                    <input type="file"
                           #fileInput
                           (change)="onFileSelected($event)"
                           multiple
                           class="hidden">
                    
                    <button type="button"
                            (click)="fileInput.click()"
                            class="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium shadow-lg">
                      Browse Files
                    </button>
                    
                    <p class="text-xs text-gray-500 mt-4">
                      Max: 50MB per file | PDF, DOC, PPT, Images, Videos, and more
                    </p>
                  </div>
                </div>
              </div>

              <!-- Selected Files List -->
              <div *ngIf="selectedFiles.length > 0" class="mt-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm font-semibold text-gray-700">📎 New Files ({{ selectedFiles.length }})</h3>
                  <button type="button"
                          (click)="clearAllFiles()"
                          class="text-sm text-red-600 hover:text-red-700">
                    Clear All
                  </button>
                </div>

                <div class="space-y-3">
                  <div *ngFor="let fileData of selectedFiles; let i = index" 
                       class="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <!-- File Icon -->
                    <div class="flex-shrink-0 mt-1">
                      <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>

                    <!-- File Info and Description -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-2">
                        <p class="font-medium text-gray-900 truncate">{{ fileData.file.name }}</p>
                        <span class="text-xs text-gray-500">{{ formatFileSize(fileData.file.size) }}</span>
                      </div>
                      
                      <!-- Optional Description -->
                      <textarea [(ngModel)]="fileData.description"
                                placeholder="Optional description for this file..."
                                rows="2"
                                [name]="'fileDesc-' + i"
                                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"></textarea>
                    </div>

                    <!-- Remove Button -->
                    <button type="button"
                            (click)="removeFile(i)"
                            class="flex-shrink-0 mt-1 text-red-500 hover:text-red-700">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Upload Progress -->
              <div *ngIf="uploading" class="mb-6">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">Updating...</span>
                  <span class="text-sm font-medium text-purple-600">{{ uploadProgress }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div class="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-300"
                       [style.width.%]="uploadProgress"></div>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="flex gap-4 pt-6 border-t border-gray-200">
                <button type="button"
                        (click)="goBack()"
                        [disabled]="uploading"
                        class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                  Cancel
                </button>
                <button type="submit"
                        [disabled]="!isFormValid() || uploading"
                        class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                  {{ uploading ? 'Updating...' : 'Update Material' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class MaterialEditComponent implements OnInit {
  materialId: string = '';
  material: Material | null = null;
  loading = false;
  
  formData: any = {
    type: 'file',
    title: '',
    description: '',
    category: '',
    course: '',
    groups: [],
    link: ''
  };

  courses: any[] = [];
  groups: any[] = [];
  selectedFiles: Array<{file: File, description: string, id: string}> = [];
  existingFiles: Array<{fileName: string, fileSize: number, fileUrl: string}> = [];
  isDragging = false;
  uploading = false;
  uploadProgress = 0;
  isLinkMode = false;
  replaceFiles = false;

  constructor(
    private materialService: MaterialService,
    private courseService: CourseService,
    private groupService: GroupService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.materialId = this.route.snapshot.paramMap.get('id') || '';
    if (this.materialId) {
      this.loadMaterial();
      this.loadCourses();
    } else {
      this.toastService.error('Invalid material ID');
      this.goBack();
    }
  }

  loadMaterial(): void {
    this.loading = true;
    this.materialService.getMaterial(this.materialId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.material = response.data;
          this.populateForm();
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

  populateForm(): void {
    if (!this.material) return;

    // Determine if it's a link or file
    this.isLinkMode = this.material.type === 'link' && !!this.material.externalUrl;

    this.formData = {
      type: this.material.type,
      title: this.material.title,
      description: this.material.description || '',
      category: this.material.category || '',
      course: this.material.course._id,
      groups: this.material.groups?.map(g => g._id) || [],
      link: this.material.externalUrl || ''
    };

    // Build existing files list
    this.existingFiles = [];
    if (this.material.fileUrl) {
      this.existingFiles.push({
        fileName: this.material.fileName || 'File',
        fileSize: this.material.fileSize || 0,
        fileUrl: this.material.fileUrl
      });
    }
    if (this.material.files && this.material.files.length > 0) {
      this.material.files.forEach(file => {
        this.existingFiles.push({
          fileName: file.fileName,
          fileSize: file.fileSize,
          fileUrl: file.fileUrl
        });
      });
    }

    // Load groups for the selected course
    if (this.formData.course) {
      this.loadGroups(this.formData.course);
    }
  }

  loadCourses(): void {
    this.courseService.getCourses({ limit: 100 }).subscribe({
      next: (response: any) => {
        if (response.success && response.data?.courses) {
          this.courses = response.data.courses;
        }
      },
      error: (error: any) => {
        console.error('Error loading courses:', error);
        this.toastService.error('Failed to load courses');
      }
    });
  }

  onCourseChange(): void {
    if (this.formData.course) {
      this.loadGroups(this.formData.course);
    } else {
      this.groups = [];
      this.formData.groups = [];
    }
  }

  loadGroups(courseId: string): void {
    this.groupService.getGroups({ course: courseId, limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data?.groups) {
          this.groups = response.data.groups;
        }
      },
      error: (error) => {
        console.error('Error loading groups:', error);
        this.toastService.error('Failed to load groups');
      }
    });
  }

  switchToFileMode(): void {
    this.isLinkMode = false;
    this.formData.type = 'file';
    if (this.selectedFiles.length > 0) {
      this.formData.type = this.detectFileType(this.selectedFiles[0].file);
    }
  }

  switchToLinkMode(): void {
    this.isLinkMode = true;
    this.formData.type = 'link';
    this.selectedFiles = [];
    this.replaceFiles = false;
  }

  toggleGroup(groupId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.formData.groups.push(groupId);
    } else {
      this.formData.groups = this.formData.groups.filter((id: string) => id !== groupId);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFiles(Array.from(files));
    }
  }

  getDropzoneClass(): string {
    return this.isDragging
      ? 'border-purple-500 bg-purple-50'
      : 'border-gray-300 bg-gray-50 hover:border-purple-400';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFiles(Array.from(input.files));
    }
  }

  handleFiles(files: File[]): void {
    files.forEach(file => {
      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        this.toastService.error(`${file.name} exceeds 50MB limit`);
        return;
      }
      
      this.selectedFiles.push({
        file: file,
        description: '',
        id: Date.now() + '-' + Math.random()
      });
    });

    if (files.length > 0) {
      this.toastService.success(`${files.length} file(s) added`);
      
      // Auto-detect material type from first file
      if (this.selectedFiles.length > 0) {
        this.formData.type = this.detectFileType(this.selectedFiles[0].file);
      }
    }
  }

  detectFileType(file: File): string {
    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();

    // Images
    if (mimeType.startsWith('image/') || 
        /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(fileName)) {
      return 'image';
    }

    // Videos
    if (mimeType.startsWith('video/') || 
        /\.(mp4|webm|ogg|mov|avi|mkv|wmv|flv)$/.test(fileName)) {
      return 'video';
    }

    // PDFs and Documents
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return 'document';
    }

    if (/\.(doc|docx|txt)$/.test(fileName) || 
        mimeType.includes('word') ||
        mimeType.includes('document') ||
        mimeType.includes('text')) {
      return 'document';
    }

    // Presentations
    if (/\.(ppt|pptx)$/.test(fileName) || 
        mimeType.includes('presentation') ||
        mimeType.includes('powerpoint')) {
      return 'presentation';
    }

    // Spreadsheets (treat as document)
    if (/\.(xls|xlsx)$/.test(fileName) || 
        mimeType.includes('spreadsheet') ||
        mimeType.includes('excel')) {
      return 'document';
    }

    // Default
    return 'file';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  clearAllFiles(): void {
    this.selectedFiles = [];
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  isFormValid(): boolean {
    const hasTitle = !!this.formData.title;
    const hasCategory = !!this.formData.category;
    const hasCourse = !!this.formData.course;
    
    if (!hasTitle || !hasCategory || !hasCourse) {
      return false;
    }
    
    // For link mode
    if (this.isLinkMode) {
      // If replacing link, must have new link
      if (this.replaceFiles) {
        return !!this.formData.link;
      }
      // Otherwise just need existing link or new link
      return !!this.formData.link || !!this.material?.externalUrl;
    }
    
    // For file mode
    // If replacing files, must have new files
    if (this.replaceFiles) {
      return this.selectedFiles.length > 0;
    }
    
    // Otherwise, can update without new files (keep existing)
    return true;
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.uploading) {
      return;
    }

    this.uploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    formData.append('title', this.formData.title);
    formData.append('description', this.formData.description);
    formData.append('type', this.formData.type);
    formData.append('category', this.formData.category);
    formData.append('course', this.formData.course);
    
    if (this.formData.groups && this.formData.groups.length > 0) {
      formData.append('groups', JSON.stringify(this.formData.groups));
    }
    
    // Only send replaceFile if we're actually replacing
    if (this.replaceFiles) {
      formData.append('replaceFile', 'true');
      
      if (this.isLinkMode) {
        formData.append('externalUrl', this.formData.link);
      } else if (this.selectedFiles.length > 0) {
        // Append all files
        this.selectedFiles.forEach((fileData, index) => {
          formData.append('files', fileData.file);
        });
        
        // Append file descriptions as JSON
        const descriptions = this.selectedFiles.map(f => f.description);
        formData.append('fileDescriptions', JSON.stringify(descriptions));
      }
    }

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 300);

    this.materialService.updateMaterial(this.materialId, formData as any).subscribe({
      next: (response: any) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          this.toastService.success('Material updated successfully!');
          this.router.navigate(['/dashboard/materials', this.materialId]);
        }, 500);
      },
      error: (error: any) => {
        clearInterval(progressInterval);
        console.error('Update error:', error);
        this.toastService.error(error.error?.userMessage || 'Failed to update material');
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  goBack(): void {
    if (this.materialId) {
      this.router.navigate(['/dashboard/materials', this.materialId]);
    } else {
      this.router.navigate(['/dashboard/materials']);
    }
  }

  getSuggestedCategory(): string {
    if (this.selectedFiles.length === 0) return '';
    
    const types = this.selectedFiles.map(f => this.detectFileType(f.file));
    const hasVideo = types.includes('video');
    const hasDocument = types.includes('document');
    const hasPresentation = types.includes('presentation');
    const hasImage = types.includes('image');
    
    // Suggest based on file type combinations
    if (hasVideo) {
      return 'video';
    } else if (hasPresentation) {
      return 'lecture_notes';
    } else if (hasDocument) {
      // Check file names for hints
      const fileNames = this.selectedFiles.map(f => f.file.name.toLowerCase());
      if (fileNames.some(name => name.includes('syllabus'))) {
        return 'syllabus';
      } else if (fileNames.some(name => name.includes('exam') || name.includes('test') || name.includes('quiz'))) {
        return 'exam_material';
      } else if (fileNames.some(name => name.includes('practice') || name.includes('exercise') || name.includes('homework'))) {
        return 'practice';
      } else {
        return 'reading';
      }
    } else if (hasImage) {
      return 'supplementary';
    }
    
    return 'other';
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'lecture_notes': 'Lecture Notes',
      'reading': 'Reading Material',
      'video': 'Video Tutorial',
      'practice': 'Practice Exercises',
      'syllabus': 'Syllabus',
      'exam_material': 'Exam Material',
      'supplementary': 'Supplementary Material',
      'other': 'Other'
    };
    return labels[category] || category;
  }

  applySuggestedCategory(): void {
    const suggested = this.getSuggestedCategory();
    if (suggested) {
      this.formData.category = suggested;
      this.toastService.success(`Category set to: ${this.getCategoryLabel(suggested)}`);
    }
  }
}
