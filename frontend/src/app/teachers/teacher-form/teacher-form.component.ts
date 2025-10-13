import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';

interface Teacher {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: { city?: string; };
  academicInfo: {
    employeeId: string;
    hireDate: Date;
    subjects?: string[];
    groups?: string[];
  };
  isActive: boolean;
}

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-5xl mx-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button (click)="goBack()" class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
            </button>
            <div>
              <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {{ isEditMode ? 'Edit Teacher' : 'Add New Teacher' }}
              </h1>
              <p class="text-gray-600 mt-1">{{ isEditMode ? 'Update teacher information' : 'Create a new teacher profile' }}</p>
            </div>
          </div>
          <div class="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form [formGroup]="teacherForm" (ngSubmit)="onSubmit()" class="space-y-6">
        <!-- Personal Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <h3 class="text-lg font-bold text-gray-900">Personal Information</h3>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="form-label">First Name *</label>
                <input type="text" formControlName="firstName" class="form-input" placeholder="Enter first name">
              </div>
              <div>
                <label class="form-label">Last Name *</label>
                <input type="text" formControlName="lastName" class="form-input" placeholder="Enter last name">
              </div>
              <div>
                <label class="form-label">Email *</label>
                <input type="email" formControlName="email" class="form-input" placeholder="teacher@example.com">
              </div>
              <div>
                <label class="form-label">Phone Number</label>
                <input type="tel" formControlName="phoneNumber" class="form-input" placeholder="+20 123 456 7890">
              </div>
            </div>
          </div>
        </div>

        <!-- Academic Info -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" formGroupName="academicInfo">
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <h3 class="text-lg font-bold text-gray-900">Academic Information</h3>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="form-label">Employee ID <span class="text-xs text-gray-500">(Auto-generated)</span></label>
                <input type="text" formControlName="employeeId" class="form-input bg-gray-100 cursor-not-allowed" placeholder="Auto-generated (e.g., TE-000001)" [disabled]="true">
                <p class="text-xs text-gray-500 mt-1">Employee ID will be automatically generated when you save</p>
              </div>
              <div>
                <label class="form-label">Hire Date *</label>
                <input type="date" formControlName="hireDate" class="form-input">
              </div>
            </div>
            <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div class="flex items-start">
                <svg class="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-sm text-blue-800">Subjects and groups can be assigned after creating the teacher profile.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <button type="button" (click)="onCancel()" class="btn-secondary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Cancel
          </button>
          <button type="submit" [disabled]="teacherForm.invalid || isSubmitting" class="btn-primary">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Teacher' : 'Create Teacher') }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-label { @apply block text-sm font-semibold text-gray-700 mb-2; }
    .form-input { @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200; }
    .btn-primary { 
      @apply inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white 
      bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 
      disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200;
    }
    .btn-secondary { 
      @apply inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-semibold 
      rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200;
    }
  `]
})
export class TeacherFormComponent implements OnInit {
  @Input() teacher?: Teacher;
  @Input() isEditMode: boolean = false;

  teacherForm!: FormGroup;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private teacherService: TeacherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.teacher && this.isEditMode) {
      this.populateForm(this.teacher);
    }
  }

  initializeForm(): void {
    this.teacherForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      dateOfBirth: [''],
      isActive: [true],
      address: this.fb.group({
        city: ['']
      }),
      academicInfo: this.fb.group({
        employeeId: [{value: '', disabled: true}], // Auto-generated, not required
        hireDate: ['', Validators.required]
      })
    });
  }

  populateForm(teacher: Teacher): void {
    this.teacherForm.patchValue({
      ...teacher,
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString().split('T')[0] : '',
      academicInfo: {
        ...teacher.academicInfo,
        hireDate: teacher.academicInfo.hireDate ? new Date(teacher.academicInfo.hireDate).toISOString().split('T')[0] : ''
      }
    });
  }

  onSubmit(): void {
    if (this.teacherForm.valid) {
      this.isSubmitting = true;
      const teacherData = this.teacherForm.value;

      const request = this.isEditMode && this.teacher?.id
        ? this.teacherService.updateTeacher(this.teacher.id, teacherData)
        : this.teacherService.createTeacher(teacherData);

      request.subscribe({
        next: () => {
          alert(`Teacher ${this.isEditMode ? 'updated' : 'created'} successfully!`);
          this.router.navigate(['/dashboard/teachers']);
        },
        error: (error) => {
          alert(error.error?.message || 'Failed to save teacher');
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/teachers']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard/teachers']);
  }
}

