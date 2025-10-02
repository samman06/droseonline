import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TeacherService } from '../../services/teacher.service';

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  academicInfo: {
    employeeId: string;
    department: string;
    specialization: string[];
    hireDate: Date;
    subjects: any[];
  };
  isActive: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './teacher-list.component.html',
  styleUrls: ['./teacher-list.component.scss']
})
export class TeacherListComponent implements OnInit {
  teachers: Teacher[] = [];
  selectedTeachers: string[] = [];
  isLoading = false;
  
  filters = {
    search: '',
    department: '',
    isActive: ''
  };
  
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  Math = Math;

  constructor(
    private teacherService: TeacherService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTeachers();
  }

  loadTeachers(): void {
    this.isLoading = true;
    
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    if (this.filters.search) params.search = this.filters.search;
    if (this.filters.department) params.department = this.filters.department;
    if (this.filters.isActive) params.isActive = this.filters.isActive;

    this.teacherService.getTeachers(params).subscribe({
      next: (response) => {
        console.log('Teachers response:', response);
        if (response.success && response.data) {
          this.teachers = response.data.teachers || [];
          if (response.data.pagination) {
            this.pagination = {
              ...this.pagination,
              total: response.data.pagination.total,
              pages: response.data.pagination.pages
            };
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.teachers = [];
        this.isLoading = false;
      }
    });
  }

  onFiltersChange(): void {
    this.pagination.page = 1;
    this.loadTeachers();
  }

  clearFilters(): void {
    this.filters = {
      search: '',
      department: '',
      isActive: ''
    };
    this.pagination.page = 1;
    this.loadTeachers();
  }

  changePage(page: number): void {
    this.pagination.page = page;
    this.loadTeachers();
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.pagination.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.pagination.pages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  isSelected(teacherId: string): boolean {
    return this.selectedTeachers.includes(teacherId);
  }

  toggleSelection(teacherId: string): void {
    const index = this.selectedTeachers.indexOf(teacherId);
    if (index > -1) {
      this.selectedTeachers.splice(index, 1);
    } else {
      this.selectedTeachers.push(teacherId);
    }
  }

  toggleAllSelection(): void {
    if (this.allSelected) {
      this.selectedTeachers = [];
    } else {
      this.selectedTeachers = this.teachers.map(t => t.id);
    }
  }

  get allSelected(): boolean {
    return this.teachers.length > 0 && this.selectedTeachers.length === this.teachers.length;
  }

  get someSelected(): boolean {
    return this.selectedTeachers.length > 0 && this.selectedTeachers.length < this.teachers.length;
  }

  clearSelection(): void {
    this.selectedTeachers = [];
  }

  bulkActivate(): void {
    if (confirm(\`Activate \${this.selectedTeachers.length} teacher(s)?\`)) {
      this.teacherService.bulkAction('activate', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            alert(\`\${this.selectedTeachers.length} teacher(s) activated successfully\`);
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk activate error:', error);
          alert('Failed to activate teachers');
        }
      });
    }
  }

  bulkDeactivate(): void {
    if (confirm(\`Deactivate \${this.selectedTeachers.length} teacher(s)?\`)) {
      this.teacherService.bulkAction('deactivate', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            alert(\`\${this.selectedTeachers.length} teacher(s) deactivated successfully\`);
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk deactivate error:', error);
          alert('Failed to deactivate teachers');
        }
      });
    }
  }

  bulkDelete(): void {
    if (confirm(\`Are you sure you want to delete \${this.selectedTeachers.length} teacher(s)? This action cannot be undone.\`)) {
      this.teacherService.bulkAction('delete', this.selectedTeachers).subscribe({
        next: (response) => {
          if (response.success) {
            alert(response.message || \`\${this.selectedTeachers.length} teacher(s) deleted successfully\`);
            this.selectedTeachers = [];
            this.loadTeachers();
          }
        },
        error: (error) => {
          console.error('Bulk delete error:', error);
          let errorMessage = 'Failed to delete teachers';
          if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          alert(errorMessage);
        }
      });
    }
  }

  deleteTeacher(teacher: Teacher): void {
    if (confirm(\`Are you sure you want to delete \${teacher.fullName}? This action cannot be undone.\`)) {
      this.teacherService.deleteTeacher(teacher.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert(\`\${teacher.fullName} has been deleted successfully.\`);
            this.loadTeachers();
          } else {
            alert('Failed to delete teacher: ' + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          console.error('Error deleting teacher:', error);
          let errorMessage = 'Failed to delete teacher';
          if (error.status === 403) {
            errorMessage = 'You do not have permission to delete teachers. Admin access required.';
          } else if (error.status === 404) {
            errorMessage = 'Teacher not found.';
          } else if (error.status === 400 && error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          alert(errorMessage);
        }
      });
    }
  }

  exportTeachers(): void {
    if (this.teachers.length === 0) return;
    
    const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Status', 'Hire Date'];
    const csvContent = [
      headers.join(','),
      ...this.teachers.map(teacher => [
        teacher.academicInfo.employeeId,
        \`"\${teacher.fullName}"\`,
        teacher.email,
        \`"\${teacher.academicInfo.department || ''}"\`,
        teacher.isActive ? 'Active' : 'Inactive',
        new Date(teacher.academicInfo.hireDate).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`teachers_\${new Date().toISOString().split('T')[0]}.csv\`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  trackByTeacherId(index: number, teacher: Teacher): string {
    return teacher.id;
  }
}
