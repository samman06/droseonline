import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      <div class="flex items-center space-x-4">
        <button (click)="goBack()" class="btn-secondary">
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back
        </button>
      </div>

      <div *ngIf="isLoading" class="flex justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <div *ngIf="teacher && !isLoading" class="space-y-6">
        <!-- Header -->
        <div class="card">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-4">
                <div class="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center">
                  <span class="text-xl font-semibold text-purple-600">
                    {{ teacher.firstName.charAt(0) }}{{ teacher.lastName.charAt(0) }}
                  </span>
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">{{ teacher.fullName }}</h1>
                  <p class="text-gray-600">{{ teacher.academicInfo.employeeId }}</p>
                  <p class="text-sm text-gray-500">{{ teacher.academicInfo.subjects?.length || 0 }} Subjects • {{ teacher.academicInfo.groups?.length || 0 }} Groups</p>
                </div>
              </div>
              <div class="flex space-x-3">
                <button [routerLink]="['/dashboard/teachers', teacher.id, 'edit']" class="btn-secondary">Edit</button>
                <button (click)="deleteTeacher()" class="btn-danger">Delete</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card">
            <div class="card-header"><h2 class="text-lg font-semibold">Personal Information</h2></div>
            <div class="card-body">
              <dl class="space-y-3">
                <div><dt class="text-sm font-medium text-gray-500">Email</dt>
                     <dd class="text-sm text-gray-900">{{ teacher.email }}</dd></div>
                <div *ngIf="teacher.phoneNumber"><dt class="text-sm font-medium text-gray-500">Phone</dt>
                     <dd class="text-sm text-gray-900">{{ teacher.phoneNumber }}</dd></div>
                <div *ngIf="teacher.address?.city"><dt class="text-sm font-medium text-gray-500">City</dt>
                     <dd class="text-sm text-gray-900">{{ teacher.address.city }}</dd></div>
              </dl>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h2 class="text-lg font-semibold">Academic Information</h2></div>
            <div class="card-body">
              <dl class="space-y-3">
                <div><dt class="text-sm font-medium text-gray-500">Employee ID</dt>
                     <dd class="text-sm text-gray-900 font-mono">{{ teacher.academicInfo.employeeId }}</dd></div>
                <div><dt class="text-sm font-medium text-gray-500">Subjects</dt>
                     <dd class="text-sm text-gray-900">{{ teacher.academicInfo.subjects?.length || 0 }} assigned</dd></div>
                <div><dt class="text-sm font-medium text-gray-500">Groups</dt>
                     <dd class="text-sm text-gray-900">{{ teacher.academicInfo.groups?.length || 0 }} assigned</dd></div>
                <div><dt class="text-sm font-medium text-gray-500">Hire Date</dt>
                     <dd class="text-sm text-gray-900">{{ teacher.academicInfo.hireDate | date:'mediumDate' }}</dd></div>
                <div><dt class="text-sm font-medium text-gray-500">Status</dt>
                     <dd><span class="px-2 py-1 text-xs rounded-full" 
                               [class]="teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                       {{ teacher.isActive ? 'Active' : 'Inactive' }}
                     </span></dd></div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-secondary { @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50; }
    .btn-danger { @apply inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700; }
    .card { @apply bg-white shadow-sm rounded-lg border border-gray-200; }
    .card-header { @apply px-6 py-4 border-b border-gray-200; }
    .card-body { @apply px-6 py-4; }
  `]
})
export class TeacherDetailComponent implements OnInit {
  teacher: any;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teacherService: TeacherService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.teacherService.getTeacher(id).subscribe({
      next: (response) => {
        this.teacher = response.data.teacher || response.data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/teachers']);
  }

  deleteTeacher(): void {
    if (this.teacher && confirm(`Delete ${this.teacher.fullName}?`)) {
      this.teacherService.deleteTeacher(this.teacher.id).subscribe({
        next: () => {
          alert('Teacher deleted successfully');
          this.router.navigate(['/dashboard/teachers']);
        },
        error: (error) => {
          alert(error.error?.message || 'Failed to delete teacher');
        }
      });
    }
  }
}

