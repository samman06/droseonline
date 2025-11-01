import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
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
    groups?: string[];
    subjects?: string[];
  };
  isActive: boolean;
}

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <!-- Modern Header with Gradient -->
      <div class="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
        <div class="flex items-center space-x-4">
          <div class="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <div>
            <h1 class="text-3xl font-bold mb-1">
              {{ (isEditMode ? 'students.editStudent' : 'students.addNewStudent') | translate }}
            </h1>
            <p class="text-indigo-100">
              {{ (isEditMode ? 'students.updateStudentInfo' : 'students.createStudentProfile') | translate }}
            </p>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="mb-6">
        <button 
          (click)="goBack()"
          class="inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          {{ 'students.backToStudents' | translate }}
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="px-8 py-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">{{ 'students.studentInformation' | translate }}</h2>
          <p class="mt-1 text-sm text-gray-600">{{ 'students.fillRequiredDetails' | translate }}</p>
        </div>
        
        <form [formGroup]="studentForm" (ngSubmit)="onSubmit()" class="card-body space-y-6">
          <!-- Personal Information Section -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-gray-900 mb-4">{{ 'students.personalInformation' | translate }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">{{ 'students.firstName' | translate }} *</label>
                <input 
                  type="text" 
                  formControlName="firstName"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('firstName')"
                  [placeholder]="'students.firstName' | translate"
                >
                <div *ngIf="isFieldInvalid('firstName')" class="form-error">
                  {{ 'students.firstNameRequired' | translate }}
                </div>
              </div>
              
              <div>
                <label class="form-label">{{ 'students.lastName' | translate }} *</label>
                <input 
                  type="text" 
                  formControlName="lastName"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('lastName')"
                  [placeholder]="'students.lastName' | translate"
                >
                <div *ngIf="isFieldInvalid('lastName')" class="form-error">
                  {{ 'students.lastNameRequired' | translate }}
                </div>
              </div>
              
              <div>
                <label class="form-label">{{ 'students.email' | translate }} *</label>
                <input 
                  type="email" 
                  formControlName="email"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('email')"
                  placeholder="student@example.com"
                >
                <div *ngIf="isFieldInvalid('email')" class="form-error">
                  {{ 'students.pleaseEnterValidEmail' | translate }}
                </div>
              </div>
              
              <div>
                <label class="form-label">{{ 'students.phone' | translate }}</label>
                <input 
                  type="tel" 
                  formControlName="phoneNumber"
                  class="form-input"
                  placeholder="+1-555-0123"
                >
              </div>
              
              <div>
                <label class="form-label">{{ 'students.dateOfBirth' | translate }}</label>
                <input 
                  type="date" 
                  formControlName="dateOfBirth"
                  class="form-input"
                  [max]="maxDate"
                >
              </div>
              
              <div>
                <label class="form-label">{{ 'students.status' | translate }}</label>
                <select formControlName="isActive" class="form-select">
                  <option [value]="true">{{ 'students.active' | translate }}</option>
                  <option [value]="false">{{ 'students.inactive' | translate }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Address Section -->
          <div class="bg-gray-50 p-4 rounded-lg" formGroupName="address">
            <h3 class="text-lg font-medium text-gray-900 mb-4">{{ 'students.addressInformation' | translate }}</h3>
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label class="form-label">{{ 'students.city' | translate }}</label>
                <input 
                  type="text" 
                  formControlName="city"
                  class="form-input"
                  placeholder="Cairo, Alexandria, Giza..."
                >
              </div>
            </div>
          </div>

          <!-- Parent Contact Section -->
          <div class="bg-gray-50 p-4 rounded-lg" formGroupName="parentContact">
            <h3 class="text-lg font-medium text-gray-900 mb-4">{{ 'students.parentContactInformation' | translate }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">{{ 'students.primaryParentPhone' | translate }} *</label>
                <input 
                  type="tel" 
                  formControlName="primaryPhone"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('parentContact.primaryPhone')"
                  placeholder="01XXXXXXXXX"
                >
                <div *ngIf="isFieldInvalid('parentContact.primaryPhone')" class="form-error">
                  {{ 'students.primaryParentPhoneRequired' | translate }}
                </div>
              </div>
              
              <div>
                <label class="form-label">{{ 'students.secondaryParentPhone' | translate }}</label>
                <input 
                  type="tel" 
                  formControlName="secondaryPhone"
                  class="form-input"
                  placeholder="01XXXXXXXXX ({{ 'students.optional' | translate }})"
                >
              </div>
            </div>
          </div>

          <!-- Academic Information Section -->
          <div class="bg-gray-50 p-4 rounded-lg" formGroupName="academicInfo">
            <h3 class="text-lg font-medium text-gray-900 mb-4">{{ 'students.academicInformation' | translate }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="form-label">{{ 'students.studentId' | translate }} <span class="text-xs text-gray-500">({{ 'students.autoGenerated' | translate }})</span></label>
                <input 
                  type="text" 
                  formControlName="studentId"
                  class="form-input bg-gray-100 cursor-not-allowed"
                  placeholder="{{ ('students.autoGenerated' | translate) }} (e.g., ST-000001)"
                  [disabled]="true"
                >
                <p class="text-xs text-gray-500 mt-1">{{ 'students.autoGeneratedHelp' | translate }}</p>
              </div>
              
              <div>
                <label class="form-label">{{ 'students.currentGrade' | translate }} *</label>
                <select 
                  formControlName="currentGrade"
                  class="form-select"
                  [class.border-red-300]="isFieldInvalid('academicInfo.currentGrade')"
                >
                  <option value="">{{ 'students.selectGrade' | translate }}</option>
                  <optgroup [label]="'students.primarySchool' | translate">
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </optgroup>
                  <optgroup [label]="'students.preparatorySchool' | translate">
                    <option value="Grade 7">Grade 7</option>
                    <option value="Grade 8">Grade 8</option>
                    <option value="Grade 9">Grade 9</option>
                  </optgroup>
                  <optgroup [label]="'students.secondarySchool' | translate">
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </optgroup>
                </select>
                <div *ngIf="isFieldInvalid('academicInfo.currentGrade')" class="form-error">
                  {{ 'students.currentGradeRequired' | translate }}
                </div>
              </div>
              
              <div>
                <label class="form-label">{{ 'students.enrollmentDate' | translate }} *</label>
                <input 
                  type="date" 
                  formControlName="enrollmentDate"
                  class="form-input"
                  [class.border-red-300]="isFieldInvalid('academicInfo.enrollmentDate')"
                >
                <div *ngIf="isFieldInvalid('academicInfo.enrollmentDate')" class="form-error">
                  {{ 'students.enrollmentDate' | translate }} {{ 'students.required' | translate }}
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 px-8 py-6 bg-gray-50 border-t border-gray-200">
            <button 
              type="button" 
              (click)="onCancel()"
              class="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
            >
              {{ 'students.cancel' | translate }}
            </button>
            <button 
              type="submit" 
              [disabled]="studentForm.invalid || isSubmitting"
              class="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
            >
              <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isSubmitting ? ('common.saving' | translate) : ((isEditMode ? 'students.editStudent' : 'students.createStudent') | translate) }}
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
        city: ['']
      }),
      parentContact: this.fb.group({
        primaryPhone: ['', Validators.required],
        secondaryPhone: ['']
      }),
      academicInfo: this.fb.group({
        studentId: [{value: '', disabled: true}], // Auto-generated, not required
        currentGrade: ['', Validators.required],
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
        city: student.address?.city || ''
      },
      parentContact: {
        primaryPhone: student.parentContact?.primaryPhone || '',
        secondaryPhone: student.parentContact?.secondaryPhone || ''
      },
      academicInfo: {
        studentId: student.academicInfo.studentId,
        currentGrade: student.academicInfo.currentGrade,
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
          enrollmentDate: new Date(formData.academicInfo.enrollmentDate)
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
