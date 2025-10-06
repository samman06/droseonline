import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { AttendanceService } from '../../services/attendance.service';

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
    year: string;
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
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Back Button -->
      <div class="flex items-center space-x-4">
        <button 
          (click)="goBack()"
          class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Students
        </button>
        <nav class="flex" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-4">
            <li>
              <div class="flex">
                <a routerLink="/dashboard/students" class="text-sm font-medium text-gray-500 hover:text-gray-700">Students</a>
              </div>
            </li>
            <li>
              <div class="flex items-center">
                <svg class="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                </svg>
                <span class="ml-4 text-sm font-medium text-gray-900">{{ student?.fullName || 'Student Details' }}</span>
              </div>
            </li>
          </ol>
        </nav>
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
            <h3 class="text-sm font-medium text-red-800">Error</h3>
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
                  <p class="text-gray-600">{{ student.academicInfo.studentId }} • {{ student.academicInfo.currentGrade || student.academicInfo.year }}</p>
                  <div class="flex items-center mt-1">
                    <span 
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class]="student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                    >
                      {{ student.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="flex space-x-3">
                <button 
                  (click)="editStudent()"
                  class="btn-secondary"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Edit
                </button>
                <button 
                  (click)="deleteStudent()"
                  class="btn-danger"
                >
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  Delete
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
                <h2 class="text-lg font-semibold text-gray-900">Personal Information</h2>
              </div>
              <div class="card-body">
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.fullName }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Email</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <a [href]="'mailto:' + student.email" class="text-blue-600 hover:text-blue-800">
                        {{ student.email }}
                      </a>
                    </dd>
                  </div>
                  <div *ngIf="student.phoneNumber">
                    <dt class="text-sm font-medium text-gray-500">Phone</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <a [href]="'tel:' + student.phoneNumber" class="text-blue-600 hover:text-blue-800">
                        {{ student.phoneNumber }}
                      </a>
                    </dd>
                  </div>
                  <div *ngIf="student.dateOfBirth">
                    <dt class="text-sm font-medium text-gray-500">Date of Birth</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.dateOfBirth | date:'mediumDate' }}</dd>
                  </div>
                  <div *ngIf="student.address && student.address.city">
                    <dt class="text-sm font-medium text-gray-500">City</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.address.city }}</dd>
                  </div>
                  <div *ngIf="student.parentContact && student.parentContact.primaryPhone">
                    <dt class="text-sm font-medium text-gray-500">Primary Parent Phone</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <a [href]="'tel:' + student.parentContact.primaryPhone" class="text-blue-600 hover:text-blue-800">
                        {{ student.parentContact.primaryPhone }}
                      </a>
                    </dd>
                  </div>
                  <div *ngIf="student.parentContact && student.parentContact.secondaryPhone">
                    <dt class="text-sm font-medium text-gray-500">Secondary Parent Phone</dt>
                    <dd class="mt-1 text-sm text-gray-900">
                      <a [href]="'tel:' + student.parentContact.secondaryPhone" class="text-blue-600 hover:text-blue-800">
                        {{ student.parentContact.secondaryPhone }}
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Academic Information -->
            <div class="card">
              <div class="card-header">
                <h2 class="text-lg font-semibold text-gray-900">Academic Information</h2>
              </div>
              <div class="card-body">
                <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Student ID</dt>
                    <dd class="mt-1 text-sm text-gray-900 font-mono">{{ student.academicInfo.studentId }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Current Grade</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.academicInfo.currentGrade }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Academic Year</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.academicInfo.year }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Enrollment Date</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.academicInfo.enrollmentDate | date:'mediumDate' }}</dd>
                  </div>
                  <div>
                    <dt class="text-sm font-medium text-gray-500">Account Created</dt>
                    <dd class="mt-1 text-sm text-gray-900">{{ student.createdAt | date:'mediumDate' }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <!-- Courses Section -->
            <div class="card">
              <div class="card-header">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">Enrolled Courses</h2>
                  <span class="text-sm text-gray-500">{{ studentCourses.length }} courses</span>
                </div>
              </div>
              <div class="card-body">
                <div *ngIf="studentCourses.length === 0" class="text-center py-6 text-gray-500">
                  No courses enrolled yet
                </div>
                <div *ngIf="studentCourses.length > 0" class="space-y-3">
                  <div *ngFor="let course of studentCourses" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 class="font-medium text-gray-900">{{ course.name }}</h4>
                      <p class="text-sm text-gray-600">{{ course.code }} • {{ course.credits }} credits</p>
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
                <h2 class="text-lg font-semibold text-gray-900">Quick Stats</h2>
              </div>
              <div class="card-body space-y-4">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Total Courses</span>
                  <span class="text-lg font-semibold text-gray-900">{{ studentCourses.length }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Total Credits</span>
                  <span class="text-lg font-semibold text-gray-900">{{ getTotalCredits() }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-gray-600">Status</span>
                  <span 
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    [class]="student.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  >
                    {{ student.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Attendance Stats -->
            <div class="card">
              <div class="card-header">
                <h2 class="text-lg font-semibold text-gray-900">Attendance</h2>
              </div>
              <div class="card-body">
                <div *ngIf="loadingAttendance" class="text-center py-4">
                  <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
                <div *ngIf="!loadingAttendance && attendanceStats" class="space-y-4">
                  <div class="text-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                    <p class="text-3xl font-bold text-indigo-600">{{ attendanceStats.rate }}%</p>
                    <p class="text-xs text-gray-600 mt-1">Attendance Rate</p>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <div class="text-center p-3 bg-green-50 rounded-lg">
                      <p class="text-xl font-bold text-green-600">{{ attendanceStats.present }}</p>
                      <p class="text-xs text-gray-600">Present</p>
                    </div>
                    <div class="text-center p-3 bg-yellow-50 rounded-lg">
                      <p class="text-xl font-bold text-yellow-600">{{ attendanceStats.late }}</p>
                      <p class="text-xs text-gray-600">Late</p>
                    </div>
                    <div class="text-center p-3 bg-red-50 rounded-lg">
                      <p class="text-xl font-bold text-red-600">{{ attendanceStats.absent }}</p>
                      <p class="text-xs text-gray-600">Absent</p>
                    </div>
                    <div class="text-center p-3 bg-blue-50 rounded-lg">
                      <p class="text-xl font-bold text-blue-600">{{ attendanceStats.excused }}</p>
                      <p class="text-xs text-gray-600">Excused</p>
                    </div>
                  </div>
                  <div class="text-center pt-2 border-t border-gray-200">
                    <p class="text-sm text-gray-600">Total Sessions: <span class="font-semibold">{{ attendanceStats.total }}</span></p>
                  </div>
                </div>
                <div *ngIf="!loadingAttendance && !attendanceStats" class="text-center py-4 text-gray-500 text-sm">
                  No attendance records yet
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="card">
              <div class="card-header">
                <h2 class="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div class="card-body space-y-3">
                <button class="w-full btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  View Assignments
                </button>
                <button class="w-full btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  View Grades
                </button>
                <button class="w-full btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-7 0h8m-8 0v12a2 2 0 002 2h4a2 2 0 002-2V7m-8 0H5a2 2 0 00-2 2v10a2 2 0 002 2h1"></path>
                  </svg>
                  View Attendance
                </button>
                <button class="w-full btn-outline">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  Send Message
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService,
    private attendanceService: AttendanceService
  ) {}

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

  editStudent(): void {
    if (this.student) {
      this.router.navigate(['/dashboard/students', this.student.id, 'edit']);
    }
  }

  deleteStudent(): void {
    if (this.student && confirm(`Are you sure you want to delete ${this.student.fullName}? This action cannot be undone.`)) {
      console.log('Attempting to delete student:', this.student.id);
      
      this.studentService.deleteStudent(this.student.id).subscribe({
        next: (response) => {
          console.log('Delete student response:', response);
          if (response.success) {
            console.log('Student deleted successfully');
            alert(`${this.student!.fullName} has been deleted successfully.`);
            this.router.navigate(['/dashboard/students']);
          } else {
            console.error('Delete failed with message:', response.message);
            alert('Failed to delete student: ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error deleting student:', error);
          
          // Provide more specific error messages
          let errorMessage = 'Failed to delete student';
          if (error.status === 403) {
            errorMessage = 'You do not have permission to delete students. Admin access required.';
          } else if (error.status === 404) {
            errorMessage = 'Student not found.';
          } else if (error.status === 500) {
            errorMessage = 'Server error occurred while deleting student.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          alert(errorMessage);
        }
      });
    }
  }
}
