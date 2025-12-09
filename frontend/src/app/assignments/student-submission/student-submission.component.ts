import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AssignmentService } from '../../services/assignment.service';
import { SubmissionService } from '../../services/submission.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-student-submission',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-4xl">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">{{ 'assignments.submitAssignment' | translate }}</h1>
        <p class="text-gray-600 mt-1">{{ 'assignments.submitYourWork' | translate }}</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Assignment Details -->
      <div *ngIf="!loading && assignment" class="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">{{ assignment.title }}</h2>
        <p class="text-gray-600 mb-4">{{ assignment.description }}</p>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div>
            <span class="text-sm text-gray-500">{{ 'assignments.dueDate' | translate }}:</span>
            <p class="font-medium" [class.text-red-600]="isOverdue">{{ formatDate(assignment.dueDate) }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">{{ 'assignments.maxPoints' | translate }}:</span>
            <p class="font-medium">{{ assignment.maxPoints }}</p>
          </div>
          <div>
            <span class="text-sm text-gray-500">{{ 'assignments.type' | translate }}:</span>
            <p class="font-medium capitalize">{{ assignment.type }}</p>
          </div>
        </div>

        <div *ngIf="isOverdue" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center text-red-800">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="font-medium">{{ 'assignments.assignmentOverdue' | translate }}</span>
          </div>
        </div>

        <div *ngIf="assignment.rubric" class="mt-4 pt-4 border-t border-gray-200">
          <h3 class="font-semibold text-gray-900 mb-2">{{ 'assignments.gradingRubric' | translate }}</h3>
          <div class="space-y-2">
            <div *ngFor="let criterion of assignment.rubric" class="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span class="text-sm">{{ criterion.name }}</span>
              <span class="text-sm font-medium">{{ criterion.points }} {{ 'assignments.points' | translate }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Existing Submission (if any) -->
      <div *ngIf="existingSubmission" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
        <h3 class="font-semibold text-yellow-900 mb-2">{{ 'assignments.previousSubmission' | translate }}</h3>
        <p class="text-sm text-yellow-800 mb-2">{{ 'assignments.alreadySubmitted' | translate }}</p>
        <div class="space-y-1 text-sm">
          <p><span class="font-medium">{{ 'assignments.submitted' | translate }}:</span> {{ formatDate(existingSubmission.submittedAt) }}</p>
          <p *ngIf="existingSubmission.grade"><span class="font-medium">{{ 'assignments.grade' | translate }}:</span> {{ existingSubmission.grade }}%</p>
          <p *ngIf="existingSubmission.status"><span class="font-medium">{{ 'assignments.status' | translate }}:</span> {{ existingSubmission.status }}</p>
        </div>
      </div>

      <!-- Submission Form -->
      <form *ngIf="!loading" [formGroup]="submissionForm" (ngSubmit)="onSubmit()" class="bg-white rounded-lg shadow-sm p-6">
        <!-- Submission Text/Content -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'assignments.yourAnswer' | translate }} <span class="text-red-500">*</span>
          </label>
          <textarea 
            formControlName="content"
            rows="10"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            [placeholder]="'assignments.enterAnswer' | translate"></textarea>
          <div *ngIf="submissionForm.get('content')?.invalid && submissionForm.get('content')?.touched" class="text-red-500 text-sm mt-1">
            {{ 'assignments.contentRequired' | translate }}
          </div>
        </div>

        <!-- File Upload -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'assignments.attachFiles' | translate }} ({{ 'common.optional' | translate }})
          </label>
          <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input 
              type="file" 
              #fileInput
              (change)="onFileSelected($event)"
              multiple
              class="hidden"
              accept=".pdf,.doc,.docx,.txt,.zip,.jpg,.jpeg,.png">
            <div *ngIf="selectedFiles.length === 0" (click)="fileInput.click()" class="cursor-pointer">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <p class="mt-2 text-sm text-gray-600">{{ 'assignments.clickToUpload' | translate }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ 'assignments.fileTypes' | translate }}</p>
            </div>
            
            <div *ngIf="selectedFiles.length > 0" class="space-y-2">
              <div *ngFor="let file of selectedFiles; let i = index" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                  </svg>
                  <span class="text-sm text-gray-700">{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                </div>
                <button type="button" (click)="removeFile(i)" class="text-red-600 hover:text-red-800">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              <button type="button" (click)="fileInput.click()" class="text-sm text-blue-600 hover:text-blue-800">
                {{ 'assignments.addMoreFiles' | translate }}
              </button>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ 'assignments.comments' | translate }} ({{ 'common.optional' | translate }})
          </label>
          <textarea 
            formControlName="comments"
            rows="3"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            [placeholder]="'assignments.addComments' | translate"></textarea>
        </div>

        <!-- Late Submission Notice -->
        <div *ngIf="isOverdue" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <label class="flex items-start">
            <input type="checkbox" formControlName="acknowledgeLate" class="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <span class="ml-2 text-sm text-yellow-900">
              {{ 'assignments.acknowledgeLateSubmission' | translate }}
            </span>
          </label>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button 
            type="button" 
            (click)="cancel()"
            class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">
            {{ 'common.cancel' | translate }}
          </button>
          <button 
            type="button" 
            (click)="saveDraft()"
            [disabled]="saving"
            class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50">
            {{ 'assignments.saveAsDraft' | translate }}
          </button>
          <button 
            type="submit" 
            [disabled]="saving || submissionForm.invalid || (isOverdue && !submissionForm.get('acknowledgeLate')?.value)"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {{ (saving ? 'assignments.submitting' : 'assignments.submitAssignment') | translate }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class StudentSubmissionComponent implements OnInit {
  submissionForm!: FormGroup;
  assignment: any = null;
  existingSubmission: any = null;
  loading = false;
  saving = false;
  assignmentId: string | null = null;
  selectedFiles: File[] = [];
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private submissionService: SubmissionService,
    private toastService: ToastService,
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.initForm();
    
    this.assignmentId = this.route.snapshot.paramMap.get('id');
    if (this.assignmentId) {
      this.loadAssignment();
      this.loadExistingSubmission();
    } else {
      this.toastService.showApiError({ message: 'Invalid assignment' });
      this.router.navigate(['/dashboard/assignments']);
    }
  }

  initForm(): void {
    this.submissionForm = this.fb.group({
      content: ['', [Validators.required, Validators.minLength(10)]],
      comments: [''],
      acknowledgeLate: [false]
    });
  }

  loadAssignment(): void {
    if (!this.assignmentId) return;
    
    this.loading = true;
    this.assignmentService.getAssignment(this.assignmentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.assignment = response.data;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/assignments']);
      }
    });
  }

  loadExistingSubmission(): void {
    if (!this.assignmentId) return;
    
    this.submissionService.getMySubmission(this.assignmentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.existingSubmission = response.data;
          // Pre-fill form with existing submission data
          if (this.existingSubmission.content) {
            this.submissionForm.patchValue({
              content: this.existingSubmission.content,
              comments: this.existingSubmission.comments || ''
            });
          }
        }
      },
      error: (error) => {
        // It's okay if there's no existing submission
        console.log('No existing submission found');
      }
    });
  }

  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize) {
        this.toastService.showApiError({ message: `File ${file.name} exceeds 10MB limit` });
        continue;
      }
      this.selectedFiles.push(file);
    }

    // Reset input
    event.target.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  onSubmit(): void {
    if (this.submissionForm.invalid || this.saving || !this.assignmentId) return;

    if (this.isOverdue && !this.submissionForm.get('acknowledgeLate')?.value) {
      this.toastService.showApiError({ message: 'Please acknowledge this is a late submission' });
      return;
    }

    this.saving = true;
    const submissionData: any = {
      content: this.submissionForm.value.content,
      comments: this.submissionForm.value.comments,
      status: 'submitted' as 'submitted',
      submittedAt: new Date().toISOString()
    };

    // If we have an existing submission, update it; otherwise create new
    const request = this.existingSubmission
      ? this.submissionService.updateSubmission(this.existingSubmission._id, submissionData)
      : this.submissionService.createSubmission(this.assignmentId!, submissionData);

    request.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // If files are selected, upload them
          if (this.selectedFiles.length > 0 && response.data._id) {
            this.uploadFiles(response.data._id);
          } else {
            this.toastService.success(this.translate.instant('assignments.assignmentSubmittedSuccess'));
            this.router.navigate(['/dashboard/assignments']);
          }
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  saveDraft(): void {
    if (this.saving || !this.assignmentId) return;

    this.saving = true;
    const submissionData: any = {
      content: this.submissionForm.value.content || '',
      comments: this.submissionForm.value.comments,
      status: 'draft' as 'draft'
    };

    const request = this.existingSubmission
      ? this.submissionService.updateSubmission(this.existingSubmission._id, submissionData)
      : this.submissionService.createSubmission(this.assignmentId!, submissionData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate.instant('assignments.draftSavedSuccess'));
          this.router.navigate(['/dashboard/assignments']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  uploadFiles(submissionId: string): void {
    let uploadedCount = 0;
    const totalFiles = this.selectedFiles.length;

    this.selectedFiles.forEach((file) => {
      this.submissionService.uploadFile(this.assignmentId!, file).subscribe({
        next: () => {
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.toastService.success(this.translate.instant('assignments.assignmentFilesSubmitted'));
            this.router.navigate(['/dashboard/assignments']);
          }
        },
        error: (error: any) => {
          this.toastService.showApiError({ message: `Failed to upload ${file.name}` });
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.toastService.warning('Assignment submitted, but some files failed to upload');
            this.router.navigate(['/dashboard/assignments']);
          }
        }
      });
    });
  }

  get isOverdue(): boolean {
    if (!this.assignment) return false;
    return new Date(this.assignment.dueDate) < new Date();
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  cancel(): void {
    this.router.navigate(['/dashboard/assignments']);
  }
}

