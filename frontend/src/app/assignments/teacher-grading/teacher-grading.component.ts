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
  selector: 'app-teacher-grading',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="container mx-auto px-4 py-6 max-w-6xl">
      <div class="mb-6">
        <button (click)="goBack()" class="text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          {{ 'assignments.backToSubmissions' | translate }}
        </button>
        <h1 class="text-3xl font-bold text-gray-900">{{ 'assignments.gradeSubmission' | translate }}</h1>
        <p class="text-gray-600 mt-1">{{ 'assignments.reviewAndGrade' | translate }}</p>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content - Submission Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Assignment Info -->
          <div *ngIf="assignment" class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-2">{{ assignment.title }}</h2>
            <p class="text-gray-600 mb-4">{{ assignment.description }}</p>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">{{ 'assignments.type' | translate }}:</span>
                <p class="font-medium capitalize">{{ assignment.type }}</p>
              </div>
              <div>
                <span class="text-gray-500">{{ 'assignments.maxPoints' | translate }}:</span>
                <p class="font-medium">{{ assignment.maxPoints }}</p>
              </div>
            </div>
          </div>

          <!-- Student Submission -->
          <div *ngIf="submission" class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ 'assignments.studentSubmission' | translate }}</h3>
                <p class="text-sm text-gray-600">
                  {{ 'assignments.submittedBy' | translate }}: {{ submission.student?.firstName }} {{ submission.student?.lastName }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ formatDate(submission.submittedAt) }}
                  <span *ngIf="isLateSubmission" class="ml-2 text-red-600 font-medium">({{ 'assignments.late' | translate }})</span>
                </p>
              </div>
              <span [class]="getStatusClass(submission.status)">
                {{ submission.status }}
              </span>
            </div>

            <div class="prose max-w-none">
              <div class="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">{{ 'assignments.content' | translate }}:</h4>
                <p class="text-gray-900 whitespace-pre-wrap">{{ submission.content }}</p>
              </div>

              <div *ngIf="submission.comments" class="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 class="text-sm font-medium text-blue-700 mb-2">{{ 'assignments.studentComments' | translate }}:</h4>
                <p class="text-gray-900">{{ submission.comments }}</p>
              </div>

              <div *ngIf="submission.files && submission.files.length > 0" class="mb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-2">{{ 'assignments.attachedFiles' | translate }}:</h4>
                <div class="space-y-2">
                  <div *ngFor="let file of submission.files" 
                       class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center">
                      <svg class="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                      <span class="text-sm text-gray-700">{{ file.originalName }}</span>
                    </div>
                    <button (click)="downloadFile(file)" class="text-blue-600 hover:text-blue-800 text-sm">
                      {{ 'common.download' | translate }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Previous Feedback (if exists) -->
          <div *ngIf="submission?.feedback" class="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-yellow-900 mb-2">{{ 'assignments.previousFeedback' | translate }}</h3>
            <p class="text-yellow-800">{{ submission.feedback }}</p>
          </div>
        </div>

        <!-- Sidebar - Grading Form -->
        <div class="lg:col-span-1">
          <form [formGroup]="gradingForm" (ngSubmit)="onSubmit()" class="bg-white rounded-lg shadow-sm p-6 sticky top-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ 'assignments.gradeAssignment' | translate }}</h3>

            <!-- Rubric Grading (if available) -->
            <div *ngIf="assignment?.rubric && assignment.rubric.length > 0" class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-3">{{ 'assignments.rubricScoring' | translate }}</h4>
              <div class="space-y-3">
                <div *ngFor="let criterion of assignment.rubric" class="p-3 bg-gray-50 rounded-lg">
                  <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-gray-700">{{ criterion.name }}</span>
                    <span class="text-xs text-gray-500">{{ 'assignments.max' | translate }}: {{ criterion.points }}</span>
                  </div>
                  <input 
                    type="number" 
                    [attr.max]="criterion.points"
                    min="0"
                    step="0.5"
                    class="w-full mt-1 rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0">
                </div>
              </div>
            </div>

            <!-- Overall Grade -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'assignments.gradePoints' | translate }} <span class="text-red-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <input 
                  type="number" 
                  formControlName="grade"
                  [attr.max]="assignment?.maxPoints"
                  min="0"
                  step="0.5"
                  class="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0">
                <span class="text-sm text-gray-600">/ {{ assignment?.maxPoints }}</span>
              </div>
              <div class="mt-1 text-sm text-gray-600">
                {{ 'assignments.percentage' | translate }}: {{ getPercentage() }}%
              </div>
              <div *ngIf="gradingForm.get('grade')?.invalid && gradingForm.get('grade')?.touched" class="text-red-500 text-sm mt-1">
                {{ 'assignments.gradeMustBeBetween' | translate: {max: assignment?.maxPoints} }}
              </div>
            </div>

            <!-- Feedback -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ 'assignments.feedback' | translate }} <span class="text-red-500">*</span>
              </label>
              <textarea 
                formControlName="feedback"
                rows="6"
                class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                [placeholder]="'assignments.provideFeedback' | translate"></textarea>
              <div *ngIf="gradingForm.get('feedback')?.invalid && gradingForm.get('feedback')?.touched" class="text-red-500 text-sm mt-1">
                {{ 'assignments.feedbackRequired' | translate }}
              </div>
            </div>

            <!-- Late Penalty (if applicable) -->
            <div *ngIf="isLateSubmission && assignment?.latePenalty" class="mb-4 p-3 bg-red-50 rounded-lg">
              <div class="flex items-center text-red-800 text-sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>{{ 'assignments.latePenaltyAmount' | translate: {penalty: assignment.latePenalty} }}</span>
              </div>
            </div>

            <!-- Status -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'assignments.status' | translate }}</label>
              <select formControlName="status" class="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                <option value="graded">{{ 'assignments.statuses.graded' | translate }}</option>
                <option value="needs_revision">{{ 'assignments.statuses.needsRevision' | translate }}</option>
                <option value="resubmit">{{ 'assignments.statuses.resubmit' | translate }}</option>
              </select>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-2">
              <button 
                type="submit" 
                [disabled]="saving || gradingForm.invalid"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ (saving ? 'common.saving' : 'assignments.submitGrade') | translate }}
              </button>
              <button 
                type="button" 
                (click)="saveDraft()"
                [disabled]="saving"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                {{ 'assignments.saveAsDraft' | translate }}
              </button>
              <button 
                type="button" 
                (click)="goBack()"
                class="w-full px-4 py-2 text-gray-600 hover:text-gray-800">
                {{ 'common.cancel' | translate }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class TeacherGradingComponent implements OnInit {
  gradingForm!: FormGroup;
  assignment: any = null;
  submission: any = null;
  loading = false;
  saving = false;
  submissionId: string | null = null;
  assignmentId: string | null = null;
  currentUser: any;

  constructor(
    private fb: FormBuilder,
    private assignmentService: AssignmentService,
    private submissionService: SubmissionService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.initForm();
    
    this.submissionId = this.route.snapshot.paramMap.get('submissionId');
    if (this.submissionId) {
      this.loadSubmission();
    } else {
      this.toastService.showApiError({ message: this.translate.instant('assignments.invalidSubmission') });
      this.router.navigate(['/dashboard/assignments']);
    }
  }

  initForm(): void {
    this.gradingForm = this.fb.group({
      grade: [0, [Validators.required, Validators.min(0)]],
      feedback: ['', [Validators.required, Validators.minLength(10)]],
      status: ['graded']
    });
  }

  loadSubmission(): void {
    if (!this.submissionId) return;
    
    this.loading = true;
    this.submissionService.getSubmission(this.submissionId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.submission = response.data;
          this.assignmentId = this.submission.assignment._id || this.submission.assignment;
          
          // Load assignment details
          if (this.assignmentId) {
            this.loadAssignment();
          }

          // Pre-fill form if already graded
          if (this.submission.grade !== undefined) {
            this.gradingForm.patchValue({
              grade: this.submission.grade,
              feedback: this.submission.feedback || '',
              status: this.submission.status
            });
          }
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

  loadAssignment(): void {
    if (!this.assignmentId) return;
    
    this.assignmentService.getAssignment(this.assignmentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.assignment = response.data;
          
          // Update grade validator with max points
          this.gradingForm.get('grade')?.setValidators([
            Validators.required,
            Validators.min(0),
            Validators.max(this.assignment.maxPoints)
          ]);
          this.gradingForm.get('grade')?.updateValueAndValidity();
        }
      },
      error: (error: any) => {
        console.error('Failed to load assignment', error);
      }
    });
  }

  onSubmit(): void {
    if (this.gradingForm.invalid || this.saving || !this.submissionId) return;

    this.saving = true;
    const gradeData = {
      pointsEarned: this.gradingForm.value.grade,
      feedback: this.gradingForm.value.feedback
    };

    this.submissionService.gradeSubmission(this.submissionId, gradeData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate.instant('assignments.submissionGraded'));
          this.goBack();
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
    if (this.saving || !this.submissionId) return;

    this.saving = true;
    const draftData: any = {
      grade: this.gradingForm.value.grade || 0,
      feedback: this.gradingForm.value.feedback || '',
      status: 'submitted' as 'submitted'
    };

    this.submissionService.updateSubmission(this.submissionId, draftData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate.instant('assignments.draftSavedSuccess'));
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  get isLateSubmission(): boolean {
    if (!this.submission || !this.assignment) return false;
    return new Date(this.submission.submittedAt) > new Date(this.assignment.dueDate);
  }

  getPercentage(): number {
    if (!this.assignment?.maxPoints) return 0;
    const grade = this.gradingForm.get('grade')?.value || 0;
    return Math.round((grade / this.assignment.maxPoints) * 100);
  }

  getStatusClass(status: string): string {
    const classes: any = {
      submitted: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      graded: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
      pending: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      needs_revision: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
      draft: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'
    };
    return classes[status] || classes.pending;
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

  downloadFile(file: any): void {
    // Implement file download logic
    this.toastService.info('File download functionality');
  }

  goBack(): void {
    if (this.assignmentId) {
      this.router.navigate(['/dashboard/assignments', this.assignmentId]);
    } else {
      this.router.navigate(['/dashboard/assignments']);
    }
  }
}

