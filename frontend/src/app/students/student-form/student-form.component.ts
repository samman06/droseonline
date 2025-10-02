import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { StudentService } from '../../services/student.service';
import { ApiService } from '../../services/api.service';

interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  academicInfo: {
    studentId: string;
    year: string;
    major: string;
    gpa?: number;
    enrollmentDate: Date;
    groups?: string[];
    subjects?: string[];
  };
  isActive: boolean;
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <!-- Back Button and Breadcrumb -->
      <div class="flex items-center justify-between mb-6">
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
                  <span class="ml-4 text-sm font-medium text-gray-900">
                    {{ isEditMode ? 'Edit Student' : 'Add New Student' }}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditMode ? 'Edit Student' : 'Add New Student' }}
          </h2>
        </div>
        
        <form [formGroup]="studentForm" (ngSubmit)="onSubmit()" class="card-body space-y-6">
          <!-- Personal Information Section -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">First Name *</label>
                <input 
                  type="text" 
                  formControlName="firstName"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('firstName')"
                  placeholder="Enter first name"
                >
                <div *ngIf="isFieldInvalid('firstName')" class="form-error">
                  First name is required and must be at least 2 characters
                </div>
              </div>
              
              <div>
                <label class="form-label">Last Name *</label>
                <input 
                  type="text" 
                  formControlName="lastName"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('lastName')"
                  placeholder="Enter last name"
                >
                <div *ngIf="isFieldInvalid('lastName')" class="form-error">
                  Last name is required and must be at least 2 characters
                </div>
              </div>
              
              <div>
                <label class="form-label">Email *</label>
                <input 
                  type="email" 
                  formControlName="email"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('email')"
                  placeholder="student@example.com"
                >
                <div *ngIf="isFieldInvalid('email')" class="form-error">
                  Please enter a valid email address
                </div>
              </div>
              
              <div>
                <label class="form-label">Phone Number</label>
                <input 
                  type="tel" 
                  formControlName="phoneNumber"
                  class="form-input"
                  placeholder="+1-555-0123"
                >
              </div>
              
              <div>
                <label class="form-label">Date of Birth</label>
                <input 
                  type="date" 
                  formControlName="dateOfBirth"
                  class="form-input"
                  [max]="maxDate"
                >
              </div>
              
              <div>
                <label class="form-label">Status</label>
                <select formControlName="isActive" class="form-select">
                  <option [value]="true">Active</option>
                  <option [value]="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Address Section -->
          <div class="bg-gray-50 p-4 rounded-lg" formGroupName="address">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="md:col-span-2">
                <label class="form-label">Street Address</label>
                <input 
                  type="text" 
                  formControlName="street"
                  class="form-input"
                  placeholder="123 Main Street"
                >
              </div>
              
              <div>
                <label class="form-label">City</label>
                <input 
                  type="text" 
                  formControlName="city"
                  class="form-input"
                  placeholder="New York"
                >
              </div>
              
              <div>
                <label class="form-label">State</label>
                <input 
                  type="text" 
                  formControlName="state"
                  class="form-input"
                  placeholder="NY"
                >
              </div>
              
              <div>
                <label class="form-label">ZIP Code</label>
                <input 
                  type="text" 
                  formControlName="zipCode"
                  class="form-input"
                  placeholder="10001"
                >
              </div>
              
              <div>
                <label class="form-label">Country</label>
                <input 
                  type="text" 
                  formControlName="country"
                  class="form-input"
                  placeholder="United States"
                >
              </div>
            </div>
          </div>

          <!-- Academic Information Section -->
          <div class="bg-gray-50 p-4 rounded-lg" formGroupName="academicInfo">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Academic Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">Student ID *</label>
                <input 
                  type="text" 
                  formControlName="studentId"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('academicInfo.studentId')"
                  placeholder="STU000001"
                >
                <div *ngIf="isFieldInvalid('academicInfo.studentId')" class="form-error">
                  Student ID is required
                </div>
              </div>
              
              <div>
                <label class="form-label">Academic Year *</label>
                <select 
                  formControlName="year"
                  class="form-select"
                  [class.border-red-300]="isFieldInvalid('academicInfo.year')"
                >
                  <option value="">Select Year</option>
                  <option value="Freshman">Freshman</option>
                  <option value="Sophomore">Sophomore</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                  <option value="Graduate">Graduate</option>
                </select>
                <div *ngIf="isFieldInvalid('academicInfo.year')" class="form-error">
                  Academic year is required
                </div>
              </div>
              
              <div>
                <label class="form-label">Major *</label>
                <select 
                  formControlName="major"
                  class="form-select"
                  [class.border-red-300]="isFieldInvalid('academicInfo.major')"
                >
                  <option value="">Select Major</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="History">History</option>
                  <option value="Psychology">Psychology</option>
                  <option value="Business">Business</option>
                  <option value="Art">Art</option>
                  <option value="Music">Music</option>
                  <option value="Philosophy">Philosophy</option>
                  <option value="Economics">Economics</option>
                </select>
                <div *ngIf="isFieldInvalid('academicInfo.major')" class="form-error">
                  Major is required
                </div>
              </div>
              
              <div>
                <label class="form-label">GPA</label>
                <input 
                  type="number" 
                  formControlName="gpa"
                  class="form-input"
                  min="0" 
                  max="4" 
                  step="0.01"
                  placeholder="3.50"
                >
              </div>
              
              <div>
                <label class="form-label">Enrollment Date *</label>
                <input 
                  type="date" 
                  formControlName="enrollmentDate"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('academicInfo.enrollmentDate')"
                >
                <div *ngIf="isFieldInvalid('academicInfo.enrollmentDate')" class="form-error">
                  Enrollment date is required
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-4 pt-6 border-t">
            <button 
              type="button" 
              (click)="onCancel()"
              class="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              [disabled]="studentForm.invalid || isSubmitting"
              class="btn-primary"
            >
              <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Student' : 'Create Student') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-label {
      @apply block text-sm font-medium text-gray-700 mb-1;
    }
    
    .form-input {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
    }
    
    .form-select {
      @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
    }
    
    .form-error {
      @apply mt-1 text-sm text-red-600;
    }
    
    .btn-primary {
      @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
    }
    
    .btn-secondary {
      @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
    }
    
    .card {
      @apply bg-white shadow-sm rounded-lg border border-gray-200;
    }
    
    .card-header {
      @apply px-6 py-4 border-b border-gray-200;
    }
    
    .card-body {
      @apply px-6 py-4;
    }
  `]
})
export class StudentFormComponent implements OnInit {
  @Input() student: Student | null = null;
  @Input() isEditMode = false;
  @Output() formSubmit = new EventEmitter<Student>();
  @Output() formCancel = new EventEmitter<void>();

  studentForm!: FormGroup;
  isSubmitting = false;
  maxDate: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private studentService: StudentService,
    private apiService: ApiService
  ) {
    // Set max date to 18 years ago
    const today = new Date();
    today.setFullYear(today.getFullYear() - 18);
    this.maxDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.initializeForm();
    
    if (this.student && this.isEditMode) {
      this.populateForm(this.student);
    }
  }

  initializeForm(): void {
    this.studentForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: [''],
      dateOfBirth: [''],
      isActive: [true],
      address: this.fb.group({
        street: [''],
        city: [''],
        state: [''],
        zipCode: [''],
        country: ['United States']
      }),
      academicInfo: this.fb.group({
        studentId: ['', Validators.required],
        year: ['', Validators.required],
        major: ['', Validators.required],
        gpa: ['', [Validators.min(0), Validators.max(4)]],
        enrollmentDate: ['', Validators.required],
        groups: [[]],
        subjects: [[]]
      })
    });
  }

  populateForm(student: Student): void {
    this.studentForm.patchValue({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phoneNumber: student.phoneNumber || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      isActive: student.isActive,
      address: {
        street: student.address?.street || '',
        city: student.address?.city || '',
        state: student.address?.state || '',
        zipCode: student.address?.zipCode || '',
        country: student.address?.country || 'United States'
      },
      academicInfo: {
        studentId: student.academicInfo.studentId,
        year: student.academicInfo.year,
        major: student.academicInfo.major,
        gpa: student.academicInfo.gpa || '',
        enrollmentDate: student.academicInfo.enrollmentDate ? 
          new Date(student.academicInfo.enrollmentDate).toISOString().split('T')[0] : '',
        groups: student.academicInfo.groups || [],
        subjects: student.academicInfo.subjects || []
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.studentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.studentForm.valid) {
      this.isSubmitting = true;
      const formData = this.studentForm.value;
      
      // Format the data
      const studentData: Student = {
        ...formData,
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : undefined,
        academicInfo: {
          ...formData.academicInfo,
          enrollmentDate: new Date(formData.academicInfo.enrollmentDate),
          gpa: formData.academicInfo.gpa ? parseFloat(formData.academicInfo.gpa) : undefined
        }
      };

      if (this.isEditMode && this.student?.id) {
        studentData.id = this.student.id;
      }

      this.formSubmit.emit(studentData);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.studentForm);
    }
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  goBack(): void {
    this.router.navigate(['/dashboard/students']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Method to be called from parent when submission is complete
  onSubmissionComplete(): void {
    this.isSubmitting = false;
  }
}
