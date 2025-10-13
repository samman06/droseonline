import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto px-4 py-6">
      <div class="mb-6">
        <button (click)="goBack()" class="text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-4">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Back to Courses
        </button>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div *ngIf="!loading && course">
        <!-- Course Header -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span [class]="getStatusClass(course.isActive)">
                  {{ course.isActive ? 'Active' : 'Inactive' }}
                </span>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                  {{ course.semester }}
                </span>
              </div>
              <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ course.name }}</h1>
              <p class="text-lg text-gray-600">{{ course.code }}</p>
              <p *ngIf="course.description" class="text-gray-600 mt-2">{{ course.description }}</p>
            </div>
            
            <div class="flex gap-2 ml-4">
              <button *ngIf="canEdit" 
                      [routerLink]="['/dashboard/courses', course._id, 'edit']"
                      class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Edit Course
              </button>
              <button *ngIf="canEdit"
                      (click)="exportRoster()"
                      class="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50">
                Export Roster
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 mt-4 border-t border-gray-200">
            <div>
              <span class="text-sm text-gray-500">Teacher:</span>
              <p class="font-medium">{{ course.teacher?.firstName }} {{ course.teacher?.lastName }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Subject:</span>
              <p class="font-medium">{{ course.subject?.name || 'N/A' }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Enrollment:</span>
              <p class="font-medium">{{ course.currentEnrollment || 0 }} / {{ course.maxStudents || '∞' }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Academic Year:</span>
              <p class="font-medium">{{ course.academicYear || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Course Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-600">Students</p>
                <p class="text-2xl font-bold text-gray-900">{{ students.length }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-600">Assignments</p>
                <p class="text-2xl font-bold text-gray-900">{{ assignments.length }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-600">Completion</p>
                <p class="text-2xl font-bold text-gray-900">{{ getCompletionRate() }}%</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-gray-600">Avg Grade</p>
                <p class="text-2xl font-bold text-gray-900">{{ getAverageGrade() }}%</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Enrolled Students -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Enrolled Students</h2>
            <button *ngIf="canEdit" class="text-sm text-blue-600 hover:text-blue-800">
              Manage Enrollment
            </button>
          </div>

          <div *ngIf="students.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let student of students" class="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div class="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                {{ student.firstName?.charAt(0) }}{{ student.lastName?.charAt(0) }}
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-900">{{ student.firstName }} {{ student.lastName }}</p>
                <p class="text-xs text-gray-600">{{ student.email }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="students.length === 0" class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <p>No students enrolled yet</p>
          </div>
        </div>

        <!-- Groups -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Class Sections (Groups)</h2>
            <span class="text-sm text-gray-600">{{ course?.groups?.length || 0 }} section(s)</span>
          </div>

          <div *ngIf="course?.groups && course.groups.length > 0" class="space-y-3">
            <div *ngFor="let group of course.groups" 
                 [routerLink]="['/dashboard/groups', group._id]"
                 class="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-all cursor-pointer border border-blue-200">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ group.name }}</h3>
                <p class="text-sm text-gray-600">Code: {{ group.code }} • Grade: {{ group.gradeLevel }}</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <span *ngFor="let s of group.schedule" class="text-xs px-2 py-1 bg-white rounded-md border border-blue-200">
                    {{ s.day | titlecase }} {{ s.startTime }}-{{ s.endTime }}
                  </span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-2">
                <span class="text-sm font-medium text-blue-900">{{ group.currentEnrollment || 0 }} students</span>
                <span class="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full" 
                      [class]="group.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                  {{ group.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>

          <div *ngIf="!course?.groups || course.groups.length === 0" class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <p>No class sections created yet</p>
          </div>
        </div>

        <!-- Assignments -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Assignments</h2>
            <button *ngIf="canEdit" [routerLink]="['/dashboard/assignments/new']" class="text-sm text-blue-600 hover:text-blue-800">
              Create Assignment
            </button>
          </div>

          <div *ngIf="assignments.length > 0" class="space-y-3">
            <div *ngFor="let assignment of assignments" 
                 [routerLink]="['/dashboard/assignments', assignment._id]"
                 class="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div class="flex-1">
                <h3 class="font-medium text-gray-900">{{ assignment.title }}</h3>
                <p class="text-sm text-gray-600">Due: {{ formatDate(assignment.dueDate) }}</p>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm font-medium">{{ assignment.maxPoints }} pts</span>
                <span [class]="getAssignmentStatusClass(assignment.status)">{{ assignment.status }}</span>
              </div>
            </div>
          </div>

          <div *ngIf="assignments.length === 0" class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p>No assignments created yet</p>
          </div>
        </div>

        <!-- Course Materials -->
        <div *ngIf="canEdit" class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Course Materials</h2>
            <button class="text-sm text-blue-600 hover:text-blue-800">
              Upload Material
            </button>
          </div>
          
          <div class="text-center py-8 text-gray-500">
            <svg class="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <p>No materials uploaded yet</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CourseDetailComponent implements OnInit {
  course: any = null;
  students: any[] = [];
  assignments: any[] = [];
  loading = false;
  courseId: string | null = null;
  currentUser: any;

  constructor(
    private courseService: CourseService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.courseId = this.route.snapshot.paramMap.get('id');
    
    if (this.courseId) {
      this.loadCourse();
      this.loadStudents();
      this.loadAssignments();
    } else {
      this.toastService.showApiError({ message: 'Invalid course' });
      this.router.navigate(['/dashboard/courses']);
    }
  }

  loadCourse(): void {
    if (!this.courseId) return;
    
    this.loading = true;
    this.courseService.getCourse(this.courseId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.course = response.data;
        }
        this.loading = false;
      },
      error: (error: any) => {
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/courses']);
      }
    });
  }

  loadStudents(): void {
    if (!this.courseId) return;
    
    this.courseService.getCourseStudents(this.courseId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.students = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load students', error);
      }
    });
  }

  loadAssignments(): void {
    if (!this.courseId) return;
    
    this.courseService.getCourseAssignments(this.courseId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.assignments = response.data;
        }
      },
      error: (error) => {
        console.error('Failed to load assignments', error);
      }
    });
  }

  exportRoster(): void {
    if (!this.courseId) return;
    
    this.courseService.exportCourseRoster(this.courseId, 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `course-${this.courseId}-roster.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Roster exported successfully');
      },
      error: (error) => {
        this.toastService.error('Failed to export roster');
      }
    });
  }

  get canEdit(): boolean {
    if (this.currentUser?.role === 'admin') return true;
    return this.course?.teacher === this.currentUser?._id;
  }

  getCompletionRate(): number {
    // This would normally come from backend stats
    return 75;
  }

  getAverageGrade(): number {
    // This would normally come from backend stats
    return 82;
  }

  getStatusClass(isActive: boolean): string {
    return isActive 
      ? 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'
      : 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800';
  }

  getAssignmentStatusClass(status: string): string {
    const classes: any = {
      draft: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800',
      published: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800',
      closed: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'
    };
    return classes[status] || classes.draft;
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/courses']);
  }
}

