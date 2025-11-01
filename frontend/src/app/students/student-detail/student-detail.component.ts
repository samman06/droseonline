import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { StudentService } from '../../services/student.service';
import { AttendanceService } from '../../services/attendance.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { AuthService } from '../../services/auth.service';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: {
    city?: string;
  };
  parentContact?: {
    primaryPhone: string;
    secondaryPhone?: string;
  };
  academicInfo: {
    studentId: string;
    currentGrade: string;
    enrollmentDate: Date;
    groups?: any[];
    subjects?: any[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
  template: `
    <div class="max-w-6xl mx-auto p-6 space-y-6">
      <!-- Back Button -->
      <div class="mb-6">
        <button (click)="goBack()" class="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all">
          <svg class="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span class="text-gray-700 font-medium">{{ 'students.backToStudents' | translate }}</span>
        </button>
      </div>
      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !isLoading" class="bg-red-50 border border-red-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">{{ 'students.error' | translate }}</h3>
            <p class="mt-1 text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>

      <!-- Student Details -->
      <div *ngIf="student && !isLoading" class="space-y-6">
        <!-- Header -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-xl font-semibold text-blue-600">
                    {{ student.firstName.charAt(0) }}{{ student.lastName.charAt(0) }}
                  </span>
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">{{ student.fullName }}</h1>
                  <p class="text-gray-600">{{ student.academicInfo.studentId }} • {{ student.academicInfo.currentGrade }}</p>
                  <div class="flex items-center mt-1">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class]="student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      {{ (student.isActive ? 'students.active' : 'students.inactive') | translate }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex space-x-3">
                <!-- Only admins can edit/delete students -->
                <button 
                  *ngIf="isAdmin()"
                  (click)="editStudent()"
                  class="btn-secondary"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  {{ 'students.edit' | translate }}
                </button>
                <button 
                  *ngIf="isAdmin()"
                  (click)="deleteStudent()"
                  class="btn-danger"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  {{ 'students.delete' | translate }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left Column - Personal & Academic Info -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Personal Information -->
            <div class="card">
              <div class="card-header">
                <h2 class="text-lg font-semibold text-gray-900">{{ 'students.personalInformation' | translate }}</h2>
              </div>
              <div class="card-body">
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.fullName' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.fullName }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.email' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <a [href]="'mailto:' + student.email" class="text-blue-600 hover:text-blue-800">
                        {{ student.email }}
                      </a>
                    </dd>
                  </div>
                  <div *ngIf="student.phoneNumber">
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.phone' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <a [href]="'tel:' + student.phoneNumber" class="text-blue-600 hover:text-blue-800">
                        {{ student.phoneNumber }}
                      </a>
                    </dd>
                  </div>
                  <div *ngIf="student.dateOfBirth">
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.dateOfBirth' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.dateOfBirth | date:'mediumDate' }}</dd>
                  </div>
                  <div *ngIf="student.address && student.address.city">
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.city' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.address.city }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Parent Contact Information -->
            <div class="card">
              <div class="card-header bg-gradient-to-r from-purple-50 to-pink-50">
                <h2 class="text-lg font-semibold text-gray-900 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  {{ 'students.parentContactInformation' | translate }}
                </h2>
              </div>
              <div class="card-body">
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500 flex items-center">
                      <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      {{ 'students.primaryParentPhone' | translate }}
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="student.parentContact?.primaryPhone; else noPrimary">
                        <a [href]="'tel:' + student.parentContact!.primaryPhone" class="text-blue-600 hover:text-blue-800 font-medium">
                          {{ student.parentContact!.primaryPhone }}
                        </a>
                      </span>
                      <ng-template #noPrimary>
                        <span class="text-gray-400 italic">{{ 'students.notProvided' | translate }}</span>
                      </ng-template>
                    </dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500 flex items-center">
                      <svg class="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                      </svg>
                      {{ 'students.secondaryParentPhone' | translate }}
                    </dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <span *ngIf="student.parentContact?.secondaryPhone; else noSecondary">
                        <a [href]="'tel:' + student.parentContact!.secondaryPhone" class="text-blue-600 hover:text-blue-800 font-medium">
                          {{ student.parentContact!.secondaryPhone }}
                        </a>
                      </span>
                      <ng-template #noSecondary>
                        <span class="text-gray-400 italic">{{ 'students.notProvided' | translate }}</span>
                      </ng-template>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Academic Information -->
            <div class="card">
              <div class="card-header">
                <h2 class="text-lg font-semibold text-gray-900">{{ 'students.academicInformation' | translate }}</h2>
              </div>
              <div class="card-body">
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.studentId' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900 font-mono">{{ student.academicInfo.studentId }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.currentGrade' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.academicInfo.currentGrade }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.enrollmentDate' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.academicInfo.enrollmentDate | date:'mediumDate' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">{{ 'students.accountCreated' | translate }}</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.createdAt | date:'mediumDate' }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Courses Section -->
            <div class="card">
              <div class="card-header">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">{{ 'students.enrolledCourses' | translate }}</h2>
                  <span class="text-sm text-gray-500">{{ studentCourses.length }} {{ 'students.courses' | translate }}</span>
                </div>
              </div>
              <div class="card-body">
                <div *ngIf="studentCourses.length === 0" class="text-center py-6 text-gray-500">
                  {{ 'students.noCoursesEnrolled' | translate }}
                </div>
                <div *ngIf="studentCourses.length > 0" class="space-y-3">
                  <div *ngFor="let course of studentCourses" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 class="font-medium text-gray-900">{{ course.name }}</h4>
                      <p class="text-sm text-gray-600">{{ course.code }} • {{ course.credits }} {{ 'students.credits' | translate }}</p>
                    </div>
                    <span class="text-sm text-gray-500">{{ course.semester }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Stats & Quick Actions -->
          <div class="space-y-6">
            <!-- Quick Stats -->
            <div class="card">
              <div class="card-header">
                <h2 class="text-lg font-semibold text-gray-900">{{ 'students.quickStats' | translate }}</h2>
              </div>
              <div class="card-body space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ 'students.totalCourses' | translate }}</span>
                  <span class="text-lg font-semibold text-gray-900">{{ studentCourses.length }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ 'students.totalCredits' | translate }}</span>
                  <span class="text-lg font-semibold text-gray-900">{{ getTotalCredits() }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">{{ 'students.status' | translate }}</span>
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [class]="student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ (student.isActive ? 'students.active':'students.inactive') | translate }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Attendance Stats -->
            <div class="card">
              <div class="card-header">
                <h2 class="text-lg font-semibold text-gray-900">{{ 'students.attendance' | translate }}</h2>
              </div>
              <div class="card-body">
                <div *ngIf="loadingAttendance" class="text-center py-4">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
                <div *ngIf="!loadingAttendance && attendanceStats" class="space-y-4">
                  <div class="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                    <p class="text-3xl font-bold text-indigo-600">{{ attendanceStats.rate }}%</p>
                    <p class="text-xs text-gray-600 mt-1">{{ 'students.attendanceRate' | translate }}</p>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                      <p class="text-xl font-bold text-green-600">{{ attendanceStats.present }}</p>
                      <p class="text-xs text-gray-600">{{ 'students.present' | translate }}</p>
                    </div>
                    <div class="text-center p-3 bg-yellow-50 rounded-lg">
                      <p class="text-xl font-bold text-yellow-600">{{ attendanceStats.late }}</p>
                      <p class="text-xs text-gray-600">{{ 'students.late' | translate }}</p>
                    </div>
                    <div class="text-center p-3 bg-red-50 rounded-lg">
                      <p class="text-xl font-bold text-red-600">{{ attendanceStats.absent }}</p>
                      <p class="text-xs text-gray-600">{{ 'students.absent' | translate }}</p>
                    </div>
                    <div class="text-center p-3 bg-blue-50 rounded-lg">
                      <p class="text-xl font-bold text-blue-600">{{ attendanceStats.excused }}</p>
                      <p class="text-xs text-gray-600">{{ 'students.excused' | translate }}</p>
                    </div>
                  </div>
                  <div class="text-center pt-2 border-t border-gray-200">
                    <p class="text-sm text-gray-600">{{ 'students.totalSessions' | translate }}: <span class="font-semibold">{{ attendanceStats.total }}</span></p>
                  </div>
                </div>
                <div *ngIf="!loadingAttendance && !attendanceStats" class="text-center py-4 text-gray-500 text-sm">
                  {{ 'students.noAttendanceRecords' | translate }}
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="card">
              <div class="card-header">
                <h2 class="text-lg font-semibold text-gray-900">{{ 'students.quickActions' | translate }}</h2>
              </div>
              <div class="card-body space-y-3">
                <button class="w-full btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  {{ 'students.viewAssignments' | translate }}
                </button>
                <button class="w-full btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  {{ 'students.viewGrades' | translate }}
                </button>
                <button class="w-full btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-7 0h8m-8 0v12a2 2 0 002 2h4a2 2 0 002-2V7m-8 0H5a2 2 0 00-2 2v10a2 2 0 002 2h1"></path>
                  </svg>
                  {{ 'students.viewAttendance' | translate }}
                </button>
                <button class="w-full btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  {{ 'students.sendMessage' | translate }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      @apply bg-white shadow-sm rounded-lg border border-gray-200;
    }
    
    .card-header {
      @apply px-6 py-4 border-b border-gray-200;
    }
    
    .card-body {
      @apply px-6 py-4;
    }
    
    .btn-secondary {
      @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
    }
    
    .btn-danger {
      @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500;
    }
    
    .btn-outline {
      @apply inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
    }
  `]
})
export class StudentDetailComponent implements OnInit {
  student: Student | null = null;
  studentCourses: any[] = [];
  attendanceStats: any = null;
  isLoading = true;
  loadingAttendance = false;
  error: string | null = null;

  currentUser: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private attendanceService: AttendanceService,
    private confirmationService: ConfirmationService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.currentUser;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const studentId = params['id'];
      if (studentId) {
        this.loadStudent(studentId);
        this.loadStudentCourses(studentId);
        this.loadAttendanceStats(studentId);
      }
    });
  }

  loadStudent(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.studentService.getStudent(id).subscribe({
      next: (response) => {
        console.log('Student detail response:', response);
        if (response.success && response.data) {
          // Handle different response structures
          if (response.data.student) {
            this.student = response.data.student;
          } else {
            this.student = response.data;
          }
        } else {
          this.error = 'Failed to load student details';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading student:', error);
        this.error = 'Failed to load student details';
        this.isLoading = false;
      }
    });
  }

  loadAttendanceStats(id: string): void {
    this.loadingAttendance = true;
    this.attendanceService.getStudentAttendance(id).subscribe({
      next: (response) => {
        this.attendanceStats = response.stats;
        this.loadingAttendance = false;
      },
      error: (err) => {
        console.error('Error loading attendance stats:', err);
        this.loadingAttendance = false;
      }
    });
  }

  loadStudentCourses(id: string): void {
    this.studentService.getStudentCourses(id).subscribe({
      next: (response) => {
        console.log('Student courses response:', response);
        if (response.success && response.data) {
          this.studentCourses = Array.isArray(response.data) ? response.data : response.data.courses || [];
        }
      },
      error: (error) => {
        console.error('Error loading student courses:', error);
        this.studentCourses = [];
      }
    });
  }

  hasAddress(): boolean {
    const address = this.student?.address;
    return !!(address && address.city);
  }

  getTotalCredits(): number {
    return this.studentCourses.reduce((total, course) => total + (course.credits || 0), 0);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/students']);
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  editStudent(): void {
    if (this.student) {
      this.router.navigate(['/dashboard/students', this.student.id, 'edit']);
    }
  }

  async deleteStudent(): Promise<void> {
    if (!this.student) return;
    
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Student',
      message: `Are you sure you want to delete ${this.student.fullName}? This action cannot be undone and will remove all their records and enrollments.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      console.log('Attempting to delete student:', this.student.id);
      
      this.studentService.deleteStudent(this.student.id).subscribe({
        next: (response) => {
          console.log('Delete student response:', response);
          if (response.success) {
            console.log('Student deleted successfully');
            this.router.navigate(['/dashboard/students']);
          } else {
            console.error('Delete failed with message:', response.message);
          }
        },
        error: (error) => {
          console.error('Error deleting student:', error);
        }
      });
    }
  }
}
