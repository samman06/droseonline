import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
    private studentService: StudentService
  ) {}

  onStudentCreate(studentData: Student): void {
    this.studentService.createStudent(studentData).subscribe({
      next: (response) => {
        if (response.success) {
          // Navigate to the student detail page
          const studentId = response.data.student?.id || response.data.student?._id;
          if (studentId) {
            this.router.navigate(['/dashboard/students', studentId]);
          } else {
            this.router.navigate(['/dashboard/students']);
          }
          // TODO: Show success toast
        } else {
          alert('Failed to create student: ' + (response.message || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('Error creating student:', error);
        alert('Failed to create student');
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard/students']);
  }
}
