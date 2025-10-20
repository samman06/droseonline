import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { TeacherService } from '../../services/teacher.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-teacher-browse',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './teacher-browse.component.html',
  styleUrls: ['./teacher-browse.component.scss']
})
export class TeacherBrowseComponent implements OnInit, OnDestroy {
  teachers: any[] = [];
  selectedTeacher: any = null;
  isLoading = false;
  searchTerm = '';
  
  // Modal state
  showDetailModal = false;

  constructor(
    private teacherService: TeacherService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadTeachers();
  }

  ngOnDestroy() {
    // Ensure scroll is restored when component is destroyed
    this.enableBodyScroll();
  }

  loadTeachers() {
    this.isLoading = true;
    const params = this.searchTerm ? { search: this.searchTerm } : {};
    
    this.teacherService.browseTeachers(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.teachers = response.data?.teachers || [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.isLoading = false;
      }
    });
  }

  searchTeachers() {
    this.loadTeachers();
  }

  openTeacherDetail(teacher: any) {
    this.selectedTeacher = null;
    this.showDetailModal = true;
    this.disableBodyScroll(); // Prevent background scrolling
    
    // Load teacher's courses and groups
    this.teacherService.getTeacherCoursesForStudent(teacher._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedTeacher = response.data;
        }
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.showDetailModal = false;
        this.enableBodyScroll(); // Re-enable scroll on error
      }
    });
  }

  closeModal() {
    this.showDetailModal = false;
    this.selectedTeacher = null;
    this.enableBodyScroll(); // Re-enable background scrolling
  }

  // Utility methods to control body scroll
  private disableBodyScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = this.getScrollbarWidth() + 'px'; // Prevent layout shift
  }

  private enableBodyScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  private getScrollbarWidth(): number {
    // Calculate scrollbar width to prevent content shift when hiding scrollbar
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);
    
    const inner = document.createElement('div');
    outer.appendChild(inner);
    
    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode?.removeChild(outer);
    
    return scrollbarWidth;
  }

  joinGroup(group: any, course: any) {
    this.confirmationService.confirm({
      title: '🎓 Join Group',
      message: `You're about to join "${group.name}" for ${course.subject.name}. You'll get access to all course materials and assignments!`,
      confirmText: 'Join Now',
      cancelText: 'Maybe Later',
      type: 'success'
    }).then((confirmed) => {
      if (confirmed) {
        this.teacherService.joinGroup(group._id).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success(response.message || 'Successfully joined group!');
              // Reload teacher detail to update enrollment status
              this.openTeacherDetail({ _id: this.selectedTeacher.teacher._id });
            }
          },
          error: (error) => {
            this.toastService.showApiError(error);
          }
        });
      }
    });
  }

  leaveGroup(group: any, course: any) {
    this.confirmationService.confirm({
      title: '⚠️ Leave Group',
      message: `Are you sure you want to leave "${group.name}"? This will:
      
• Remove you from all group activities
• Revoke access to course materials
• Clear your progress history
      
This action can be reversed by rejoining the group.`,
      confirmText: 'Yes, Leave Group',
      cancelText: 'Stay in Group',
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.teacherService.leaveGroup(group._id).subscribe({
          next: (response) => {
            if (response.success) {
              this.toastService.success(response.message || 'Successfully left group');
              // Reload teacher detail to update enrollment status
              this.openTeacherDetail({ _id: this.selectedTeacher.teacher._id });
            }
          },
          error: (error) => {
            this.toastService.showApiError(error);
          }
        });
      }
    });
  }

  getTeacherInitials(teacher: any): string {
    if (!teacher) return '?';
    const first = teacher.firstName?.charAt(0) || '';
    const last = teacher.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  getScheduleText(schedule: any[]): string {
    if (!schedule || schedule.length === 0) return 'No schedule set';
    return schedule.map(s => `${s.day}: ${s.startTime}-${s.endTime}`).join(', ');
  }

  getTotalCourses(): number {
    return this.teachers.reduce((total, teacher) => total + (teacher.totalCourses || 0), 0);
  }
}

