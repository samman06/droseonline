import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { SubjectService } from '../../services/subject.service';
import { TeacherService } from '../../services/teacher.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      <!-- Stunning Gradient Header -->
      <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
        <div class="flex items-center space-x-4">
          <div class="p-4 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
            </svg>
          </div>
          <div>
            <h1 class="text-4xl font-bold mb-2">{{ isEditMode ? 'Edit' : 'Create New' }} Course</h1>
            <p class="text-blue-100">{{ isEditMode ? 'Update course information and settings' : 'Set up a new course for your students' }}</p>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="flex justify-center py-12">
        <div class="flex flex-col items-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600"></div>
          <p class="text-gray-600 mt-4 font-medium">Loading course data...</p>
        </div>
      </div>

      <form *ngIf="!loading" [formGroup]="courseForm" (ngSubmit)="onSubmit()" class="space-y-6 max-w-5xl mx-auto">
        <!-- Basic Information -->
        <div class="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
            <div class="flex items-center">
              <svg class="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h2 class="text-xl font-bold text-white">Basic Information</h2>
            </div>
          </div>
          
          <div class="p-6 space-y-6">
            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                Course Name <span class="text-red-500 ml-1">*</span>
              </label>
              <input 
                type="text" 
                formControlName="name"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                placeholder="e.g., Introduction to Physics">
              <div *ngIf="courseForm.get('name')?.invalid && courseForm.get('name')?.touched" 
                   class="flex items-center text-red-600 text-sm mt-2">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Course name is required
              </div>
            </div>

            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                </svg>
                Course Code <span class="text-xs font-normal text-gray-500 ml-2">(Auto-generated)</span>
              </label>
              <div class="relative">
                <input 
                  type="text" 
                  formControlName="code"
                  class="w-full px-4 py-3 rounded-lg border-2 border-gray-200 bg-gray-50 cursor-not-allowed font-mono text-gray-500"
                  placeholder="Auto-generated (e.g., CO-000001)"
                  [disabled]="true">
                <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
              </div>
              <p class="flex items-center text-xs text-gray-500 mt-2">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                Code will be automatically generated when you save
              </p>
            </div>

            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
                </svg>
                Description
              </label>
              <textarea 
                formControlName="description"
                rows="4"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
                placeholder="Enter a detailed course description..."></textarea>
            </div>
          </div>
        </div>

        <!-- Course Details -->
        <div class="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
            <div class="flex items-center">
              <svg class="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <h2 class="text-xl font-bold text-white">Course Details</h2>
            </div>
          </div>
          
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Teacher <span class="text-red-500 ml-1">*</span>
              </label>
              <select formControlName="teacher" (change)="onTeacherChange()" class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all">
                <option value="">Select a teacher first</option>
                <option *ngFor="let teacher of teachers" [value]="teacher._id">
                  {{ teacher.firstName }} {{ teacher.lastName }}
                </option>
              </select>
              <div *ngIf="courseForm.get('teacher')?.invalid && courseForm.get('teacher')?.touched" class="flex items-center text-red-600 text-sm mt-2">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Teacher is required
              </div>
            </div>

            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                </svg>
                Subject <span class="text-red-500 ml-1">*</span>
              </label>
              <div class="relative">
                <select 
                  formControlName="subject" 
                  [disabled]="!selectedTeacherId || loadingSubjects"
                  class="w-full px-4 py-3 rounded-lg border-2 transition-all"
                  [ngClass]="!selectedTeacherId || loadingSubjects ? 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-500' : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'">
                  <option value="">{{ !selectedTeacherId ? 'Select teacher first' : (loadingSubjects ? 'Loading subjects...' : 'Select a subject') }}</option>
                  <option *ngFor="let subject of subjects" [value]="subject._id">
                    {{ subject.name }} ({{ subject.code }})
                  </option>
                </select>
                <div *ngIf="!selectedTeacherId" class="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
              </div>
              <p *ngIf="!selectedTeacherId" class="flex items-center text-xs text-amber-600 mt-2">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                Please select a teacher to view available subjects
              </p>
              <div *ngIf="courseForm.get('subject')?.invalid && courseForm.get('subject')?.touched" class="flex items-center text-red-600 text-sm mt-2">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                Subject is required
              </div>
            </div>

            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Credit Hours
              </label>
              <input 
                type="number" 
                formControlName="creditHours"
                min="0"
                step="0.5"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                placeholder="3">
            </div>

            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Max Students
              </label>
              <input 
                type="number" 
                formControlName="maxStudents"
                min="1"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
                placeholder="30">
            </div>
          </div>
        </div>

        <!-- Course Duration -->
        <div class="bg-white rounded-2xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div class="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
            <div class="flex items-center">
              <svg class="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <h2 class="text-xl font-bold text-white">Course Duration</h2>
            </div>
          </div>
          
          <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                Start Date
              </label>
              <input 
                type="date" 
                formControlName="startDate"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all">
            </div>

            <div>
              <label class="flex items-center text-sm font-semibold text-gray-700 mb-2">
                <svg class="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                End Date
              </label>
              <input 
                type="date" 
                formControlName="endDate"
                class="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all">
            </div>
          </div>
          
          <div class="px-6 pb-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
                <p class="text-sm text-blue-800">
                  <span class="font-semibold">Note:</span> Schedules are defined per section (group), not per course
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Action Buttons -->
        <div class="flex justify-end gap-4 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border-2 border-gray-200">
          <button 
            type="button" 
            (click)="cancel()"
            class="px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Cancel
          </button>
          <button 
            type="submit" 
            [disabled]="saving || courseForm.invalid"
            class="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            <svg *ngIf="!saving" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <svg *ngIf="saving" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ saving ? 'Saving...' : (isEditMode ? 'Update Course' : 'Create Course') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    /* Custom input focus effects */
    input:focus, select:focus, textarea:focus {
      outline: none;
      transition: all 0.3s ease;
    }

    /* Smooth transitions */
    * {
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    /* Loading animation */
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class CourseFormComponent implements OnInit {
  courseForm!: FormGroup;
  isEditMode = false;
  courseId: string | null = null;
  loading = false;
  saving = false;
  loadingSubjects = false;
  currentUser: any;
  subjects: any[] = [];
  teachers: any[] = [];
  selectedTeacherId: string = '';

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private subjectService: SubjectService,
    private teacherService: TeacherService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.initForm();
    this.loadTeachers();
    
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId) {
      this.isEditMode = true;
      this.loadCourse();
    }
  }

  onTeacherChange(): void {
    const teacherId = this.courseForm.get('teacher')?.value;
    
    if (teacherId) {
      this.selectedTeacherId = teacherId;
      // Clear subject selection when teacher changes
      this.courseForm.patchValue({ subject: '' });
      // Load subjects for the selected teacher
      this.loadSubjectsForTeacher(teacherId);
    } else {
      this.selectedTeacherId = '';
      this.subjects = [];
      this.courseForm.patchValue({ subject: '' });
    }
  }

  loadSubjectsForTeacher(teacherId: string): void {
    this.loadingSubjects = true;
    this.teacherService.getTeacher(teacherId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const teacher = response.data.teacher || response.data;
          this.subjects = teacher.academicInfo?.subjects || [];
          console.log('Loaded subjects for teacher:', this.subjects);
          
          if (this.subjects.length === 0) {
            this.toastService.warning('This teacher has no subjects assigned', 'No Subjects');
          }
        }
        this.loadingSubjects = false;
      },
      error: (error) => {
        console.error('Failed to load teacher subjects', error);
        this.toastService.error('Failed to load teacher subjects');
        this.subjects = [];
        this.loadingSubjects = false;
      }
    });
  }

  initForm(): void {
    this.courseForm = this.fb.group({
      name: ['', [Validators.required]],
      code: [{value: '', disabled: true}], // Auto-generated, not required
      description: [''],
      subject: ['', Validators.required],
      teacher: ['', Validators.required],
      creditHours: [3],
      maxStudents: [30],
      startDate: [''],
      endDate: ['']
    });
  }

  loadTeachers(): void {
    this.teacherService.getTeachers({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle nested response structure
          this.teachers = Array.isArray(response.data) 
            ? response.data 
            : (response.data.teachers || []);
          console.log('Loaded teachers:', this.teachers);
        }
      },
      error: (error) => {
        console.error('Failed to load teachers', error);
        this.toastService.error('Failed to load teachers');
      }
    });
  }

  loadCourse(): void {
    if (!this.courseId) return;
    
    this.loading = true;
    this.courseService.getCourse(this.courseId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Handle nested response structure
          const course = response.data.course || response.data;
          
          // Format dates for date inputs
          const startDate = course.startDate 
            ? new Date(course.startDate).toISOString().split('T')[0] 
            : '';
          const endDate = course.endDate 
            ? new Date(course.endDate).toISOString().split('T')[0] 
            : '';

          // Extract IDs from populated fields
          const subjectId = typeof course.subject === 'object' && course.subject !== null 
            ? (course.subject._id || course.subject.id) 
            : course.subject;
          const teacherId = typeof course.teacher === 'object' && course.teacher !== null 
            ? (course.teacher._id || course.teacher.id) 
            : course.teacher;

          console.log('Loading course data:', {
            name: course.name,
            code: course.code,
            description: course.description,
            subject: subjectId,
            teacher: teacherId
          });

          // Set teacher first and load their subjects
          if (teacherId) {
            this.selectedTeacherId = teacherId;
            this.courseForm.patchValue({
              teacher: teacherId
            });
            
            // Load subjects for the teacher, then set the subject
            this.teacherService.getTeacher(teacherId).subscribe({
              next: (teacherResponse) => {
                if (teacherResponse.success && teacherResponse.data) {
                  const teacher = teacherResponse.data.teacher || teacherResponse.data;
                  this.subjects = teacher.academicInfo?.subjects || [];
                  
                  // Now patch all form values including subject
                  this.courseForm.patchValue({
                    name: course.name || '',
                    code: course.code || '',
                    description: course.description || '',
                    subject: subjectId || '',
                    creditHours: course.creditHours || 3,
                    maxStudents: course.maxStudents || 30,
                    startDate,
                    endDate
                  });
                }
                this.loading = false;
              },
              error: (error) => {
                console.error('Failed to load teacher subjects', error);
                this.loading = false;
              }
            });
          } else {
            // No teacher, just patch the form
            this.courseForm.patchValue({
              name: course.name || '',
              code: course.code || '',
              description: course.description || '',
              teacher: teacherId || '',
              creditHours: course.creditHours || 3,
              maxStudents: course.maxStudents || 30,
              startDate,
              endDate
            });
            this.loading = false;
          }
        } else {
          this.loading = false;
        }
      },
      error: (error: any) => {
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/courses']);
      }
    });
  }

  onSubmit(): void {
    if (this.courseForm.invalid || this.saving) return;

    const formData = this.prepareFormData();

    this.saving = true;
    const request = this.isEditMode && this.courseId
      ? this.courseService.updateCourse(this.courseId, formData)
      : this.courseService.createCourse(formData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(
            this.isEditMode ? 'Course updated successfully' : 'Course created successfully'
          );
          this.router.navigate(['/dashboard/courses']);
        }
        this.saving = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.saving = false;
      }
    });
  }

  prepareFormData(): any {
    const formValue = this.courseForm.value;
    
    const data = {
      name: formValue.name,
      code: formValue.code,
      description: formValue.description || '',
      subject: formValue.subject,
      teacher: formValue.teacher,
      creditHours: formValue.creditHours || 3,
      maxStudents: formValue.maxStudents || undefined,
      startDate: formValue.startDate || undefined,
      endDate: formValue.endDate || undefined
    };
    
    console.log('Submitting course data:', data);
    return data;
  }

  cancel(): void {
    this.router.navigate(['/dashboard/courses']);
  }
}

