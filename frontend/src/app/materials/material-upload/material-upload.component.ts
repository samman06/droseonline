import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MaterialService } from '../../services/material.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CourseService } from '../../services/course.service';
import { GroupService } from '../../services/group.service';

@Component({
  selector: 'app-material-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
            Back
          </button>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">📤 Upload Material</h1>
          <p class="text-gray-600">Share resources with your students</p>
        </div>

        <!-- Upload Form -->
        <div class="bg-white rounded-xl shadow-xl p-8">
          <form (ngSubmit)="onSubmit()">
            
            <!-- Material Type Selection -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Material Type *</label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button type="button"
                        *ngFor="let type of materialTypes"
                        (click)="selectType(type.value)"
                        [class]="getTypeButtonClass(type.value)"
                        class="p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md">
                  <div [innerHTML]="type.icon" class="w-8 h-8 mx-auto mb-2"></div>
                  <span class="text-sm font-medium">{{ type.label }}</span>
                </button>
              </div>
            </div>

            <!-- Title -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
              <input type="text"
                     [(ngModel)]="formData.title"
                     name="title"
                     required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     placeholder="e.g., Chapter 1 - Introduction to Algebra">
            </div>

            <!-- Description -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Description</label>
              <textarea [(ngModel)]="formData.description"
                        name="description"
                        rows="4"
                        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Provide a brief description of this material..."></textarea>
            </div>

            <!-- Category -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select [(ngModel)]="formData.category"
                      name="category"
                      required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select a category</option>
                <option value="lecture_notes">Lecture Notes</option>
                <option value="reading">Reading Material</option>
                <option value="video">Video Tutorial</option>
                <option value="practice">Practice Exercises</option>
                <option value="syllabus">Syllabus</option>
                <option value="exam_material">Exam Material</option>
                <option value="supplementary">Supplementary Material</option>
              </select>
            </div>

            <!-- Course Selection -->
            <div class="mb-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Course *</label>
              <select [(ngModel)]="formData.course"
                      name="course"
                      (change)="onCourseChange()"
                      required
                      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="">Select a course</option>
                <option *ngFor="let course of courses" [value]="course._id">
                  {{ course.name }}
                </option>
              </select>
            </div>

            <!-- Group Selection (Optional) -->
            <div class="mb-6" *ngIf="groups.length > 0">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Groups (Optional)</label>
              <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
                <label *ngFor="let group of groups" class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input type="checkbox"
                         [value]="group._id"
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
                {{ formData.type === 'link' ? 'Link URL *' : 'File Upload *' }}
              </label>
              
              <!-- Link Input -->
              <input *ngIf="formData.type === 'link'"
                     type="url"
                     [(ngModel)]="formData.link"
                     name="link"
                     required
                     class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                     placeholder="https://example.com/resource">
              
              <!-- File Upload with Drag & Drop -->
              <div *ngIf="formData.type !== 'link'"
                   class="relative"
                   (dragover)="onDragOver($event)"
                   (dragleave)="onDragLeave($event)"
                   (drop)="onDrop($event)">
                <div [class]="getDropzoneClass()"
                     class="border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200">
                  
                  <!-- Upload Icon -->
                  <svg *ngIf="!selectedFile" class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  
                  <!-- Selected File Info -->
                  <div *ngIf="selectedFile" class="mb-4">
                    <div class="inline-flex items-center gap-3 bg-purple-50 px-6 py-3 rounded-lg">
                      <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <div class="text-left">
                        <p class="font-medium text-gray-900">{{ selectedFile.name }}</p>
                        <p class="text-sm text-gray-500">{{ formatFileSize(selectedFile.size) }}</p>
                      </div>
                      <button type="button"
                              (click)="removeFile()"
                              class="ml-4 text-red-500 hover:text-red-700">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <p *ngIf="!selectedFile" class="text-lg font-medium text-gray-700 mb-2">
                    {{ isDragging ? 'Drop file here' : 'Drag & drop your file here' }}
                  </p>
                  <p *ngIf="!selectedFile" class="text-sm text-gray-500 mb-4">or</p>
                  
                  <input type="file"
                         #fileInput
                         (change)="onFileSelected($event)"
                         class="hidden"
                         [accept]="getAcceptedFileTypes()">
                  
                  <button *ngIf="!selectedFile"
                          type="button"
                          (click)="fileInput.click()"
                          class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    Browse Files
                  </button>
                  
                  <p class="text-xs text-gray-500 mt-4">
                    Supported formats: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, Images, Videos (Max: 50MB)
                  </p>
                </div>
              </div>
            </div>

            <!-- Upload Progress -->
            <div *ngIf="uploadProgress > 0 && uploadProgress < 100" class="mb-6">
              <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div class="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300"
                     [style.width.%]="uploadProgress"></div>
              </div>
              <p class="text-sm text-gray-600 mt-2 text-center">Uploading... {{ uploadProgress }}%</p>
            </div>

            <!-- Actions -->
            <div class="flex gap-4">
              <button type="button"
                      (click)="goBack()"
                      [disabled]="uploading"
                      class="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button type="submit"
                      [disabled]="!isFormValid() || uploading"
                      class="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl">
                {{ uploading ? 'Uploading...' : 'Upload Material' }}
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
    type: 'document',
    title: '',
    description: '',
    category: '',
    course: '',
    groups: [],
    link: ''
  };

  materialTypes = [
    { value: 'document', label: 'Document', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>' },
    { value: 'presentation', label: 'Presentation', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>' },
    { value: 'video', label: 'Video', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' },
    { value: 'image', label: 'Image', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' },
    { value: 'link', label: 'Link', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>' },
    { value: 'file', label: 'Other File', icon: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>' }
  ];

  courses: any[] = [];
  groups: any[] = [];
  selectedFile: File | null = null;
  isDragging = false;
  uploading = false;
  uploadProgress = 0;

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

  selectType(type: string): void {
    this.formData.type = type;
    this.selectedFile = null;
  }

  getTypeButtonClass(type: string): string {
    return this.formData.type === type
      ? 'border-purple-500 bg-purple-50 text-purple-700'
      : 'border-gray-200 bg-white text-gray-700';
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
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      this.toastService.error('File size exceeds 50MB limit');
      return;
    }
    
    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
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
    
    if (this.formData.type === 'link') {
      return !!this.formData.link;
    }
    
    return !!this.selectedFile;
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
    
    if (this.formData.type === 'link') {
      formData.append('externalUrl', this.formData.link);
    } else if (this.selectedFile) {
      formData.append('file', this.selectedFile);
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
          this.toastService.success('Material uploaded successfully!');
          this.router.navigate(['/dashboard/materials']);
        }, 500);
      },
      error: (error: any) => {
        clearInterval(progressInterval);
        console.error('Upload error:', error);
        this.toastService.error(error.error?.userMessage || 'Failed to upload material');
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/materials']);
  }
}

