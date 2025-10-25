import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { MaterialService, Material } from '../../services/material.service';
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
              <p class="font-medium">{{ studentCount }} / {{ maxStudents || '∞' }}</p>
            </div>
            <div>
              <span class="text-sm text-gray-500">Academic Year:</span>
              <p class="font-medium">{{ course.academicYear?.name || course.academicYear?.code || 'N/A' }}</p>
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
                <p class="text-2xl font-bold text-gray-900">{{ studentCount }}</p>
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

        <!-- Groups/Sections -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex justify-between items-center mb-4">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Class Sections (Groups)</h2>
              <p class="text-sm text-gray-500 mt-1">Multiple sections available with different schedules</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-gray-600">{{ course?.groups?.length || 0 }} section(s)</span>
              <button *ngIf="canEdit" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Section</button>
            </div>
          </div>

          <!-- Schedule Grid View -->
          <div *ngIf="course?.groups && course.groups.length > 0" class="space-y-4">
            <!-- Group by day of week -->
            <div *ngFor="let day of getDaysWithGroups()" class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2">
                <h3 class="text-sm font-bold text-white uppercase">{{ day }}</h3>
              </div>
              <div class="p-3 space-y-2 bg-gray-50">
                <div *ngFor="let group of getGroupsByDay(day)" 
                     [routerLink]="['/dashboard/groups', group._id]"
                     class="flex justify-between items-center p-3 bg-white rounded-lg hover:shadow-md transition-all cursor-pointer border-l-4"
                     [class.border-green-500]="group.isActive"
                     [class.border-gray-300]="!group.isActive">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <h4 class="font-semibold text-gray-900">{{ group.name }}</h4>
                      <span class="text-xs px-2 py-0.5 rounded-full" 
                            [class]="group.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
                        {{ group.code }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Grade: {{ group.gradeLevel }}</p>
                    <div class="flex flex-wrap gap-2 mt-2">
                      <span *ngFor="let s of getScheduleForDay(group, day)" 
                            class="inline-flex items-center text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200 font-medium">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ s.startTime }} - {{ s.endTime }}
                      </span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2 ml-4">
                    <div class="flex items-center gap-1 text-gray-700">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                      </svg>
                      <span class="text-sm font-medium">{{ group.currentEnrollment || 0 }}</span>
                    </div>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!course?.groups || course.groups.length === 0" class="text-center py-12 text-gray-500">
            <svg class="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <p class="text-lg font-medium mb-1">No Class Sections Yet</p>
            <p class="text-sm">Create group sections with different schedules for this course</p>
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
        <div class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Course Materials</h2>
            <button *ngIf="canEdit" 
                    (click)="uploadMaterial()"
                    class="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              Upload Material
            </button>
          </div>

          <!-- Materials Grid -->
          <div *ngIf="materials.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let material of materials" 
                 (click)="viewMaterial(material)"
                 class="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer">
              <!-- Material Icon & Type -->
              <div class="flex items-start justify-between mb-3">
                <div class="p-2 bg-gray-100 rounded-lg">
                  <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getFileIcon(material.fileName)"></path>
                  </svg>
                </div>
                <span class="px-2 py-1 text-xs font-semibold rounded-full" [ngClass]="getTypeBadgeClass(material.type)">
                  {{ material.type | titlecase }}
                </span>
              </div>
              
              <!-- Material Title -->
              <h3 class="font-semibold text-gray-900 mb-2 truncate" [title]="material.title">
                {{ material.title }}
              </h3>
              
              <!-- Material Description -->
              <p *ngIf="material.description" class="text-sm text-gray-600 mb-3 line-clamp-2">
                {{ material.description }}
              </p>
              
              <!-- Material Meta -->
              <div class="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    {{ material.stats.viewCount || 0 }}
                  </div>
                  <div class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    {{ material.stats.downloadCount || 0 }}
                  </div>
                </div>
                <span *ngIf="material.fileSize" class="text-gray-500">
                  {{ material.fileSizeFormatted }}
                </span>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="materials.length === 0" class="text-center py-12 text-gray-500">
            <svg class="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <p class="text-lg font-medium mb-2">No Materials Available</p>
            <p class="text-sm text-gray-500 mb-4">Course materials and resources will appear here</p>
            <button *ngIf="canEdit" 
                    (click)="uploadMaterial()"
                    class="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md text-sm">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Upload First Material
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CourseDetailComponent implements OnInit {
  course: any = null;
  students: any[] = [];
  studentCount: number = 0; // Just the count, not full student objects
  maxStudents: number | null = null; // Total capacity from all groups
  assignments: any[] = [];
  materials: Material[] = [];
  loading = false;
  courseId: string | null = null;
  currentUser: any;

  constructor(
    private courseService: CourseService,
    private materialService: MaterialService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.courseId = this.route.snapshot.paramMap.get('id');
    
    if (this.courseId) {
      this.loadCourse(); // Also loads studentCount
      this.loadAssignments();
      this.loadMaterials();
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
          // Backend returns { success: true, data: { course, studentCount, maxStudents, groups } }
          this.course = response.data.course || response.data;
          
          // Extract student count (efficient - no full user objects)
          if (response.data.studentCount !== undefined) {
            this.studentCount = response.data.studentCount;
          }
          
          // Extract max capacity from all groups
          if (response.data.maxStudents !== undefined) {
            this.maxStudents = response.data.maxStudents;
          }
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

  loadMaterials(): void {
    if (!this.courseId) return;
    
    this.materialService.getMaterials({ course: this.courseId }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.materials = response.data.materials || [];
        }
      },
      error: (error) => {
        console.error('Failed to load materials', error);
      }
    });
  }

  uploadMaterial(): void {
    this.router.navigate(['/dashboard/materials/upload'], {
      queryParams: { course: this.courseId }
    });
  }

  viewMaterial(material: Material): void {
    this.router.navigate(['/dashboard/materials', material._id]);
  }

  getFileIcon(fileName?: string): string {
    if (!fileName) return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    
    if (['pdf'].includes(ext || '')) {
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    } else if (['doc', 'docx'].includes(ext || '')) {
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    } else if (['ppt', 'pptx'].includes(ext || '')) {
      return 'M7 21a2 2 0 002 2h6a2 2 0 002-2V5.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0010.586 3H9a2 2 0 00-2 2v16z';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    }
    
    return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
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

  getDaysWithGroups(): string[] {
    if (!this.course?.groups) return [];
    
    const daysOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const daysSet = new Set<string>();
    
    this.course.groups.forEach((group: any) => {
      if (group.schedule && Array.isArray(group.schedule)) {
        group.schedule.forEach((slot: any) => {
          if (slot.day) daysSet.add(slot.day.toLowerCase());
        });
      }
    });
    
    // Return days in order
    return daysOrder.filter(day => daysSet.has(day));
  }

  getGroupsByDay(day: string): any[] {
    if (!this.course?.groups) return [];
    
    return this.course.groups.filter((group: any) => {
      if (!group.schedule) return false;
      return group.schedule.some((slot: any) => slot.day?.toLowerCase() === day.toLowerCase());
    });
  }

  getScheduleForDay(group: any, day: string): any[] {
    if (!group?.schedule) return [];
    return group.schedule.filter((slot: any) => slot.day?.toLowerCase() === day.toLowerCase());
  }
}

