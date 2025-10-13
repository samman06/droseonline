import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../../services/assignment.service';
import { SubmissionService } from '../../services/submission.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6">
        <button (click)="goBack()" class="text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Assignments
        </button>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div *ngIf="!loading && assignment">
        <!-- Assignment Header -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-start mb-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span [class]="getTypeClass(assignment.type)">{{ assignment.type }}</span>
                <span [class]="getStatusClass(assignment.status)">{{ assignment.status }}</span>
                <span *ngIf="isOverdue" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Overdue
                </span>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ assignment.title }}</h1>
              <p class="text-gray-600">{{ assignment.description }}</p>
            </div>
            
            <div class="flex gap-2 ml-4">
              <button *ngIf="canEdit" 
                      [routerLink]="['/dashboard/assignments', assignment._id, 'edit']"
                      class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Edit
              </button>
              <button *ngIf="isStudent && canSubmit"
                      [routerLink]="['/dashboard/assignments', assignment._id, 'submit']"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Submit Work
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <span class="text-sm text-gray-500">Due Date:</span>
              <p class="font-medium" [class.text-red-600]="isOverdue">{{ formatDate(assignment.dueDate) }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Max Points:</span>
              <p class="font-medium">{{ assignment.maxPoints }}</p>
            </div>
            <div *ngIf="assignment.course">
              <span class="text-sm text-gray-500">Course:</span>
              <p class="font-medium">{{ assignment.course.name }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Teacher:</span>
              <p class="font-medium">{{ assignment.teacher?.firstName }} {{ assignment.teacher?.lastName }}</p>
            </div>
          </div>
        </div>

        <!-- Statistics (Teacher/Admin View) -->
        <div *ngIf="(isTeacher || isAdmin) && assignment.stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-600">Total Submissions</p>
                <p class="text-2xl font-bold text-gray-900">{{ assignment.stats?.totalSubmissions || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-600">Graded</p>
                <p class="text-2xl font-bold text-gray-900">{{ assignment.stats?.gradedSubmissions || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-600">Pending</p>
                <p class="text-2xl font-bold text-gray-900">{{ assignment.stats?.pendingSubmissions || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-600">Avg Grade</p>
                <p class="text-2xl font-bold text-gray-900">{{ assignment.stats?.averageGrade || 0 }}%</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Instructions & Details -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div class="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Instructions</h2>
            <div class="prose max-w-none">
              <p class="text-gray-600 whitespace-pre-wrap">{{ assignment.instructions || 'No additional instructions provided.' }}</p>
            </div>

            <div *ngIf="assignment.rubric && assignment.rubric.length > 0" class="mt-6 pt-6 border-t border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Grading Rubric</h3>
              <div class="space-y-2">
                <div *ngFor="let criterion of assignment.rubric" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium text-gray-900">{{ criterion.name }}</p>
                    <p *ngIf="criterion.description" class="text-sm text-gray-600">{{ criterion.description }}</p>
                  </div>
                  <span class="text-lg font-bold text-gray-900">{{ criterion.points }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-1 space-y-6">
            <div class="bg-white rounded-lg shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-600">Late Submissions:</span>
                  <span class="font-medium">{{ assignment.allowLateSubmissions ? 'Allowed' : 'Not Allowed' }}</span>
                </div>
                <div *ngIf="assignment.allowLateSubmissions && assignment.latePenalty" class="flex justify-between">
                  <span class="text-gray-600">Late Penalty:</span>
                  <span class="font-medium text-red-600">-{{ assignment.latePenalty }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">File Upload:</span>
                  <span class="font-medium">{{ assignment.requireFileUpload ? 'Required' : 'Optional' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Multiple Submissions:</span>
                  <span class="font-medium">{{ assignment.allowMultipleSubmissions ? 'Allowed' : 'Not Allowed' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submissions List (Teacher/Admin View) -->
        <div *ngIf="(isTeacher || isAdmin) && submissions.length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Student Submissions</h2>
            <button (click)="exportGrades()" class="text-sm text-blue-600 hover:text-blue-800">
              Export Grades
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr *ngFor="let submission of submissions" class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                        {{ submission.student?.firstName?.charAt(0) }}{{ submission.student?.lastName?.charAt(0) }}
                      </div>
                      <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">
                          {{ submission.student?.firstName }} {{ submission.student?.lastName }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {{ formatDate(submission.submittedAt) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span [class]="getStatusClass(submission.status)">{{ submission.status }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {{ submission.grade !== undefined ? submission.grade : '-' }} / {{ assignment.maxPoints }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <button 
                      [routerLink]="['/dashboard/assignments/grade', submission._id]"
                      class="text-blue-600 hover:text-blue-800">
                      {{ submission.grade !== undefined ? 'Review' : 'Grade' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Student's Own Submission -->
        <div *ngIf="isStudent && mySubmission" class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Your Submission</h2>
          <div class="space-y-4">
            <div>
              <span class="text-sm text-gray-600">Status:</span>
              <span [class]="getStatusClass(mySubmission.status)" class="ml-2">{{ mySubmission.status }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">Submitted:</span>
              <span class="ml-2 font-medium">{{ formatDate(mySubmission.submittedAt) }}</span>
            </div>
            <div *ngIf="mySubmission.grade !== undefined">
              <span class="text-sm text-gray-600">Grade:</span>
              <span class="ml-2 text-lg font-bold">{{ mySubmission.grade }} / {{ assignment.maxPoints }}</span>
              <span class="ml-2 text-gray-600">({{ getPercentage(mySubmission.grade) }}%)</span>
            </div>
            <div *ngIf="mySubmission.feedback" class="pt-4 border-t border-gray-200">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Feedback:</h3>
              <p class="text-gray-900 bg-blue-50 p-4 rounded-lg">{{ mySubmission.feedback }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AssignmentDetailComponent implements OnInit {
  assignment: any = null;
  submissions: any[] = [];
  mySubmission: any = null;
  loading = false;
  assignmentId: string | null = null;
  currentUser: any;

  constructor(
    private assignmentService: AssignmentService,
    private submissionService: SubmissionService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.assignmentId = this.route.snapshot.paramMap.get('id');
    
    if (this.assignmentId) {
      this.loadAssignment();
      if (this.isTeacher || this.isAdmin) {
        this.loadSubmissions();
      } else if (this.isStudent) {
        this.loadMySubmission();
      }
    } else {
      this.toastService.showApiError({ message: 'Invalid assignment' });
      this.router.navigate(['/dashboard/assignments']);
    }
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

  loadSubmissions(): void {
    if (!this.assignmentId) return;
    
    this.submissionService.getAssignmentSubmissions(this.assignmentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.submissions = response.data;
        }
      },
      error: (error: any) => {
        console.error('Failed to load submissions', error);
      }
    });
  }

  loadMySubmission(): void {
    if (!this.assignmentId) return;
    
    this.submissionService.getMySubmission(this.assignmentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.mySubmission = response.data;
        }
      },
      error: (error) => {
        // It's okay if there's no submission yet
        console.log('No submission found');
      }
    });
  }

  exportGrades(): void {
    if (!this.assignmentId) return;
    
    this.assignmentService.exportAssignmentGrades(this.assignmentId, 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assignment-${this.assignmentId}-grades.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Grades exported successfully');
      },
      error: (error) => {
        this.toastService.showApiError({ message: 'Failed to export grades' });
      }
    });
  }

  get isTeacher(): boolean {
    return this.currentUser?.role === 'teacher';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get isStudent(): boolean {
    return this.currentUser?.role === 'student';
  }

  get canEdit(): boolean {
    if (this.isAdmin) return true;
    return this.isTeacher && this.assignment?.teacher === this.currentUser?._id;
  }

  get canSubmit(): boolean {
    return this.assignment?.status === 'published' && !this.isOverdue;
  }

  get isOverdue(): boolean {
    if (!this.assignment) return false;
    return new Date(this.assignment.dueDate) < new Date();
  }

  getPercentage(grade: number): number {
    if (!this.assignment?.maxPoints) return 0;
    return Math.round((grade / this.assignment.maxPoints) * 100);
  }

  getTypeClass(type: string): string {
    const classes: any = {
      homework: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
      quiz: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
      midterm: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
      final: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800',
      project: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
      presentation: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800'
    };
    return classes[type] || classes.homework;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      draft: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      published: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
      submitted: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      graded: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
      closed: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'
    };
    return classes[status] || classes.draft;
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/assignments']);
  }
}

