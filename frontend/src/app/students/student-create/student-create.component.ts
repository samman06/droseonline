import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StudentFormComponent } from '../student-form/student-form.component';
import { StudentService } from '../../services/student.service';
import { ToastService } from '../../services/toast.service';

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
    year: string;
    enrollmentDate: Date;
    groups?: string[];
    subjects?: string[];
  };
  isActive: boolean;
}

@Component({
  selector: 'app-student-create',
  standalone: true,
  imports: [CommonModule, StudentFormComponent],
  template: `
    <app-student-form
      [isEditMode]="false"
      (formSubmit)="onStudentCreate($event)"
      (formCancel)="onCancel()"
    ></app-student-form>
  `
})
export class StudentCreateComponent {
  constructor(
    private router: Router,
    private studentService: StudentService,
    private toastService: ToastService
  ) {}

  onStudentCreate(studentData: Student): void {
    this.studentService.createStudent(studentData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.showCreateSuccess('Student');
          // Navigate to the student detail page
          const studentId = response.data.student?.id || response.data.student?._id;
          if (studentId) {
            this.router.navigate(['/dashboard/students', studentId]);
          } else {
            this.router.navigate(['/dashboard/students']);
          }
        } else {
          this.toastService.error(response.message || 'Failed to create student');
        }
      },
      error: (error) => {
        console.error('Error creating student:', error);
        this.toastService.showApiError(error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/students']);
  }
}
