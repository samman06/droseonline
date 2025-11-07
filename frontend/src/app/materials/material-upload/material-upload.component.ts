import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MaterialService } from '../../services/material.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CourseService } from '../../services/course.service';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-material-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto">
        
        <!-- Header -->
        <div class="mb-8">
          <button (click)="goBack()"
                  class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            {{ 'common.back' | translate }}
          </button>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">📤 {{ 'materials.uploadMaterial' | translate }}</h1>
          <p class="text-gray-600">{{ 'materials.shareResources' | translate }}</p>
        </div>

        <!-- Upload Form -->
        <div class="bg-white rounded-xl shadow-xl p-8">
          <form (ngSubmit)="onSubmit()">
            
            <!-- Upload Mode Toggle -->
            <div class="mb-6 flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <span class="text-sm font-semibold text-gray-700">{{ 'materials.uploadType' | translate }}:</span>
              <div class="flex gap-2">
                <button type="button"
                        (click)="isLinkMode = false; formData.type = 'file'"
                        [class]="!isLinkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                        class="px-4 py-2 rounded-lg font-medium transition-colors">
                  📁 {{ 'materials.files' | translate }}
                </button>
                <button type="button"
                        (click)="isLinkMode = true; formData.type = 'link'; selectedFiles = []"
                        [class]="isLinkMode ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                        class="px-4 py-2 rounded-lg font-medium transition-colors">
                  🔗 {{ 'materials.externalLink' | translate }}
                </button>
              </div>
            </div>

            <!-- Auto-detected Type Badge (if files selected) -->
            <div *ngIf="selectedFiles.length > 0 && !isLinkMode" class="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-sm text-gray-700">
                {{ 'materials.materialType' | translate }}: <span class="font-semibold text-blue-700">{{ formData.type | titlecase }}</span> ({{ 'materials.autoDetected' | translate }})
              </span>
            </div>

            <!-- Title -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ 'materials.title' | translate }} *</label>
              <input type="text"
                     [(ngModel)]="formData.title"
                     name="title"
                     required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     [placeholder]="'materials.titlePlaceholder' | translate">
            </div>

            <!-- Description -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ 'materials.description' | translate }}</label>
              <textarea [(ngModel)]="formData.description"
                        name="description"
                        rows="4"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        [placeholder]="'materials.descriptionPlaceholder' | translate"></textarea>
            </div>

            <!-- Category -->
            <div class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <label class="block text-sm font-semibold text-gray-700">{{ 'materials.category' | translate }} *</label>
                <button type="button"
                        *ngIf="selectedFiles.length > 0 && getSuggestedCategory()"
                        (click)="applySuggestedCategory()"
                        class="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  {{ 'materials.useSuggested' | translate }}: {{ getCategoryLabel(getSuggestedCategory()) }}
                </button>
              </div>
              <select [(ngModel)]="formData.category"
                      name="category"
                      required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">{{ 'materials.selectCategory' | translate }}</option>
                <option value="lecture_notes">📝 {{ 'materials.categories.lectureNotes' | translate }}</option>
                <option value="reading">📖 {{ 'materials.categories.reading' | translate }}</option>
                <option value="video">🎬 {{ 'materials.categories.video' | translate }}</option>
                <option value="practice">✏️ {{ 'materials.categories.practice' | translate }}</option>
                <option value="syllabus">📋 {{ 'materials.categories.syllabus' | translate }}</option>
                <option value="exam_material">📄 {{ 'materials.categories.examMaterial' | translate }}</option>
                <option value="supplementary">📚 {{ 'materials.categories.supplementary' | translate }}</option>
                <option value="other">📎 {{ 'materials.categories.other' | translate }}</option>
              </select>
              <p *ngIf="selectedFiles.length > 0" class="text-xs text-gray-500 mt-2">
                💡 {{ 'materials.categoryAutoSuggested' | translate }}
              </p>
            </div>

            <!-- Course Selection -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ 'materials.course' | translate }} *</label>
              <select [(ngModel)]="formData.course"
                      name="course"
                      (change)="onCourseChange()"
                      required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">{{ 'materials.selectCourse' | translate }}</option>
                <option *ngFor="let course of courses" [value]="course._id">
                  {{ course.name }}
                </option>
              </select>
            </div>

            <!-- Group Selection (Optional) -->
            <div class="mb-6" *ngIf="groups.length > 0">
              <label class="block text-sm font-semibold text-gray-700 mb-2">{{ 'materials.groupsOptional' | translate }}</label>
              <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                <label *ngFor="let group of groups" class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox"
                         [value]="group._id"
                         (change)="toggleGroup(group._id, $event)"
                         class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
                  <span class="text-sm text-gray-700">{{ group.name }}</span>
                </label>
              </div>
              <p class="text-xs text-gray-500 mt-2">{{ 'materials.groupsHelp' | translate }}</p>
            </div>

            <!-- File Upload or Link -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                {{ isLinkMode ? ('materials.linkURL' | translate) + ' *' : ('materials.fileUpload' | translate) + ' *' }}
              </label>
              
              <!-- Link Input -->
              <div *ngIf="isLinkMode">
                <input type="url"
                       [(ngModel)]="formData.link"
                       name="link"
                       required
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                       [placeholder]="'materials.linkPlaceholder' | translate">
                <p class="text-xs text-gray-500 mt-2">💡 {{ 'materials.linkHelp' | translate }}</p>
              </div>
              
              <!-- File Upload with Drag & Drop -->
              <div *ngIf="!isLinkMode"
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
                    {{ isDragging ? ('materials.dropFilesHere' | translate) : ('materials.dragDropFiles' | translate) }}
                  </p>
                  <p class="text-sm text-gray-500 mb-4">{{ 'materials.uploadMultipleOr' | translate }}</p>
                  
                  <input type="file"
                         #fileInput
                         (change)="onFileSelected($event)"
                         multiple
                         class="hidden"
                         [accept]="getAcceptedFileTypes()">
                  
                  <button type="button"
                          (click)="fileInput.click()"
                          class="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium shadow-lg">
                    {{ 'materials.browseFiles' | translate }}
                  </button>
                  
                  <p class="text-xs text-gray-500 mt-4">
                    {{ 'materials.maxFileSize' | translate }}
                  </p>
                </div>
              </div>

              <!-- Selected Files List -->
              <div *ngIf="selectedFiles.length > 0" class="mt-6">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-sm font-semibold text-gray-700">📎 {{ 'materials.selectedFiles' | translate }} ({{ selectedFiles.length }})</h3>
                  <button type="button"
                          (click)="clearAllFiles()"
                          class="text-sm text-red-600 hover:text-red-700">
                    {{ 'materials.clearAll' | translate }}
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
                                [placeholder]="'materials.optionalFileDescription' | translate"
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
            </div>

            <!-- Upload Progress -->
            <div *ngIf="uploadProgress > 0 && uploadProgress < 100" class="mb-6">
              <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div class="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300"
                     [style.width.%]="uploadProgress"></div>
              </div>
              <p class="text-sm text-gray-600 mt-2 text-center">{{ 'materials.uploading' | translate }}... {{ uploadProgress }}%</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-4">
              <button type="button"
                      (click)="goBack()"
                      [disabled]="uploading"
                      class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                {{ 'common.cancel' | translate }}
              </button>
              <button type="submit"
                      [disabled]="!isFormValid() || uploading"
                      class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                {{ uploading ? ('materials.uploading' | translate) + '...' : ('materials.uploadMaterial' | translate) }}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class MaterialUploadComponent implements OnInit {
  formData: any = {
    type: 'file', // Will be auto-detected from files
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
  isDragging = false;
  uploading = false;
  uploadProgress = 0;
  isLinkMode = false;

  constructor(
    private materialService: MaterialService,
    private courseService: CourseService,
    private groupService: GroupService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
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
        this.toastService.error(this.translate.instant('materials.failedToLoadCourses'));
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
        this.toastService.error(this.translate.instant('materials.failedToLoadGroups'));
      }
    });
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
        this.toastService.error(this.translate.instant('materials.fileTooLarge', { name: file.name }));
        return;
      }
      
      this.selectedFiles.push({
        file: file,
        description: '',
        id: Date.now() + '-' + Math.random()
      });
    });

    if (files.length > 0) {
      this.toastService.success(this.translate.instant('materials.filesAdded', { count: files.length }));
      
      // Auto-detect material type from first file
      if (this.selectedFiles.length > 0) {
        this.formData.type = this.detectFileType(this.selectedFiles[0].file);
        
        // Auto-suggest category if not already set
        if (!this.formData.category) {
          const suggested = this.getSuggestedCategory();
          if (suggested) {
            this.formData.category = suggested;
          }
        }
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

  getDropzoneClass(): string {
    if (this.isDragging) {
      return 'border-purple-500 bg-purple-50';
    }
    return 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/30';
  }

  getAcceptedFileTypes(): string {
    const types: any = {
      'document': '.pdf,.doc,.docx,.txt',
      'presentation': '.ppt,.pptx,.pdf',
      'video': '.mp4,.mov,.avi,.mkv,.webm',
      'image': '.jpg,.jpeg,.png,.gif,.webp',
      'file': '*'
    };
    return types[this.formData.type] || '*';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  isFormValid(): boolean {
    if (!this.formData.title || !this.formData.category || !this.formData.course) {
      return false;
    }
    
    if (this.isLinkMode) {
      return !!this.formData.link;
    }
    
    return this.selectedFiles.length > 0;
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

    // Simulate upload progress (real implementation would use HttpEvent)
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 300);

    this.materialService.createMaterial(formData as any).subscribe({
      next: (response: any) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        
        setTimeout(() => {
          const fileCount = this.selectedFiles.length;
          this.toastService.success(this.translate.instant('materials.uploadSuccess', { count: fileCount }));
          this.router.navigate(['/dashboard/materials']);
        }, 500);
      },
      error: (error: any) => {
        clearInterval(progressInterval);
        console.error('Upload error:', error);
        this.toastService.error(error.error?.userMessage || this.translate.instant('materials.uploadFailed'));
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/materials']);
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
      this.toastService.success(this.translate.instant('materials.categorySet', { category: this.getCategoryLabel(suggested) }));
    }
  }
}

