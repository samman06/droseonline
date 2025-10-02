import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentFormComponent } from '../student-form/student-form.component';
import { StudentService } from '../../services/student.service';

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
  selector: 'app-student-edit',
  standalone: true,
  imports: [CommonModule, StudentFormComponent],
  template: `
    <div *ngIf="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <div *ngIf="error && !isLoading" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
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

    <app-student-form
      *ngIf="student && !isLoading"
      [student]="student"
      [isEditMode]="true"
      (formSubmit)="onStudentUpdate($event)"
      (formCancel)="onCancel()"
    ></app-student-form>
  `
})
export class StudentEditComponent implements OnInit {
  student: Student | null = null;
  isLoading = true;
  error: string | null = null;
  studentId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.studentId = params['id'];
      if (this.studentId) {
        this.loadStudent(this.studentId);
      }
    });
  }

  loadStudent(id: string): void {
    this.isLoading = true;
    this.error = null;

    this.studentService.getStudent(id).subscribe({
      next: (response) => {
        console.log('Student edit response:', response);
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
        console.error('Error loading student for edit:', error);
        this.error = 'Failed to load student details';
        this.isLoading = false;
      }
    });
  }

  onStudentUpdate(studentData: Student): void {
    if (!this.studentId) {
      alert('Student ID is missing');
      return;
    }

    this.studentService.updateStudent(this.studentId, studentData).subscribe({
      next: (response) => {
        if (response.success) {
          // Navigate to the student detail page
          this.router.navigate(['/dashboard/students', this.studentId]);
          // TODO: Show success toast
        } else {
          alert('Failed to update student: ' + (response.message || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('Error updating student:', error);
        alert('Failed to update student');
      }
    });
  }

  onCancel(): void {
    if (this.studentId) {
      this.router.navigate(['/dashboard/students', this.studentId]);
    } else {
      this.router.navigate(['/dashboard/students']);
    }
  }
}
