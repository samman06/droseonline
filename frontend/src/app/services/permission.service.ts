import { Injectable } from '@angular/core';
import { AuthService, User } from './auth.service';

/**
 * Centralized Permission Service
 * Handles all role checks and resource-level permissions across the application
 * 
 * Usage:
 * - Inject into components/services
 * - Use methods in templates: *ngIf="permissionService.canEditGroup(group)"
 * - Use in component logic: if (this.permissionService.isAdmin()) { ... }
 */
@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(private authService: AuthService) {}

  // ==========================================
  // ROLE CHECKS
  // ==========================================

  /**
   * Check if current user is an admin
   */
  isAdmin(): boolean {
    return this.authService.currentUser?.role === 'admin';
  }

  /**
   * Check if current user is a teacher
   */
  isTeacher(): boolean {
    return this.authService.currentUser?.role === 'teacher';
  }

  /**
   * Check if current user is a student
   */
  isStudent(): boolean {
    return this.authService.currentUser?.role === 'student';
  }

  /**
   * Check if current user is either teacher or admin
   * Useful for actions that both roles can perform
   */
  isTeacherOrAdmin(): boolean {
    return this.isTeacher() || this.isAdmin();
  }

  /**
   * Check if current user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const currentRole = this.authService.currentUser?.role;
    return currentRole ? roles.includes(currentRole) : false;
  }

  /**
   * Get current user (helper method)
   */
  private getCurrentUser(): User | null {
    return this.authService.currentUser;
  }

  /**
   * Get current user ID (helper method)
   */
  private getCurrentUserId(): string | undefined {
    return this.authService.currentUser?._id;
  }

  // ==========================================
  // GROUP PERMISSIONS
  // ==========================================

  /**
   * Check if user can create groups
   * Only admin and teachers can create groups
   */
  canCreateGroup(): boolean {
    return this.isTeacherOrAdmin();
  }

  /**
   * Check if user can edit a specific group
   * - Admin: Can edit any group
   * - Teacher: Can edit only their own groups
   * - Student: Cannot edit groups
   */
  canEditGroup(group: any): boolean {
    if (!group) return false;
    
    if (this.isAdmin()) {
      return true;
    }
    
    if (this.isTeacher()) {
      // Teachers can only edit their own groups
      const teacherId = group.course?.teacher?._id || group.course?.teacher;
      return teacherId === this.getCurrentUserId();
    }
    
    return false;
  }

  /**
   * Check if user can delete a specific group
   * - Admin: Can delete any group
   * - Teacher: Can delete only their own groups
   * - Student: Cannot delete groups
   */
  canDeleteGroup(group: any): boolean {
    if (!group) return false;
    
    if (this.isAdmin()) {
      return true;
    }
    
    if (this.isTeacher()) {
      // Teachers can only delete their own groups
      const teacherId = group.course?.teacher?._id || group.course?.teacher;
      return teacherId === this.getCurrentUserId();
    }
    
    return false;
  }

  /**
   * Check if user can view group details
   * - Admin & Teacher: Can view all groups
   * - Student: Can view only enrolled groups or groups they can join
   */
  canViewGroupDetails(group: any): boolean {
    if (!group) return false;
    
    // Admin and teachers can view all groups
    if (this.isTeacherOrAdmin()) {
      return true;
    }
    
    // Students can view any group (to browse and join)
    return true;
  }

  /**
   * Check if user can join a group
   * Only students can join groups
   */
  canJoinGroup(): boolean {
    return this.isStudent();
  }

  /**
   * Check if user can leave a group
   * Only students can leave groups
   */
  canLeaveGroup(): boolean {
    return this.isStudent();
  }

  /**
   * Check if user can manage group students (add/remove)
   * Only admin and teachers can manage students
   */
  canManageGroupStudents(group: any): boolean {
    return this.canEditGroup(group);
  }

  // ==========================================
  // ASSIGNMENT PERMISSIONS
  // ==========================================

  /**
   * Check if user can create assignments
   * Only admin and teachers can create assignments
   */
  canCreateAssignment(): boolean {
    return this.isTeacherOrAdmin();
  }

  /**
   * Check if user can edit a specific assignment
   * - Admin: Can edit any assignment
   * - Teacher: Can edit only their own assignments
   * - Student: Cannot edit assignments
   */
  canEditAssignment(assignment: any): boolean {
    if (!assignment) return false;
    
    if (this.isAdmin()) {
      return true;
    }
    
    if (this.isTeacher()) {
      // Teachers can only edit their own assignments
      const teacherId = assignment.teacher?._id || assignment.teacher;
      return teacherId === this.getCurrentUserId();
    }
    
    return false;
  }

  /**
   * Check if user can delete a specific assignment
   * - Admin: Can delete any assignment
   * - Teacher: Can delete only their own assignments
   * - Student: Cannot delete assignments
   */
  canDeleteAssignment(assignment: any): boolean {
    return this.canEditAssignment(assignment);
  }

  /**
   * Check if user can submit an assignment
   * Only students can submit assignments
   */
  canSubmitAssignment(assignment: any): boolean {
    if (!assignment) return false;
    return this.isStudent();
  }

  /**
   * Check if user can view submissions for an assignment
   * - Admin & Teacher: Can view all submissions
   * - Student: Can view only their own submission
   */
  canViewSubmissions(assignment: any): boolean {
    if (!assignment) return false;
    return this.isTeacherOrAdmin();
  }

  /**
   * Check if user can grade submissions
   * Only admin and teachers can grade
   */
  canGradeSubmissions(assignment: any): boolean {
    return this.canEditAssignment(assignment);
  }

  /**
   * Check if user can release quiz results
   * Only admin and teachers who created the quiz can release results
   */
  canReleaseQuizResults(assignment: any): boolean {
    return this.canEditAssignment(assignment);
  }

  /**
   * Check if user can view assignment analytics
   * Only admin and teachers can view analytics
   */
  canViewAssignmentAnalytics(): boolean {
    return this.isTeacherOrAdmin();
  }

  // ==========================================
  // ATTENDANCE PERMISSIONS
  // ==========================================

  /**
   * Check if user can mark attendance
   * Only admin and teachers can mark attendance
   */
  canMarkAttendance(): boolean {
    return this.isTeacherOrAdmin();
  }

  /**
   * Check if user can edit a specific attendance record
   * - Admin: Can edit any attendance
   * - Teacher: Can edit attendance for their groups
   * - Student: Cannot edit attendance
   */
  canEditAttendance(attendance: any): boolean {
    if (!attendance) return false;
    
    if (this.isAdmin()) {
      return true;
    }
    
    if (this.isTeacher()) {
      // Teachers can edit attendance for their groups
      const teacherId = attendance.teacher?._id || attendance.teacher;
      return teacherId === this.getCurrentUserId();
    }
    
    return false;
  }

  /**
   * Check if user can delete attendance records
   * Only admin can delete attendance records
   */
  canDeleteAttendance(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can view attendance reports/dashboard
   * Admin and teachers can view comprehensive reports
   */
  canViewAttendanceReports(): boolean {
    return this.isTeacherOrAdmin();
  }

  /**
   * Check if user can view their own attendance
   * All users can view their own attendance
   */
  canViewOwnAttendance(): boolean {
    return true; // All roles can view their own attendance
  }

  // ==========================================
  // STUDENT PERMISSIONS
  // ==========================================

  /**
   * Check if user can create students
   * Only admin can create student accounts
   */
  canCreateStudent(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can edit student information
   * - Admin: Can edit any student
   * - Teacher: Can view but not edit
   * - Student: Can edit their own profile only
   */
  canEditStudent(student: any): boolean {
    if (!student) return false;
    
    if (this.isAdmin()) {
      return true;
    }
    
    // Students can edit their own profile
    if (this.isStudent()) {
      const studentId = student._id || student;
      return studentId === this.getCurrentUserId();
    }
    
    return false;
  }

  /**
   * Check if user can delete students
   * Only admin can delete student accounts
   */
  canDeleteStudent(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can view student details
   * - Admin & Teacher: Can view all students
   * - Student: Can view only their own details
   */
  canViewStudent(student: any): boolean {
    if (!student) return false;
    
    if (this.isTeacherOrAdmin()) {
      return true;
    }
    
    if (this.isStudent()) {
      const studentId = student._id || student;
      return studentId === this.getCurrentUserId();
    }
    
    return false;
  }

  // ==========================================
  // TEACHER PERMISSIONS
  // ==========================================

  /**
   * Check if user can create teachers
   * Only admin can create teacher accounts
   */
  canCreateTeacher(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can edit teacher information
   * - Admin: Can edit any teacher
   * - Teacher: Can edit their own profile only
   */
  canEditTeacher(teacher: any): boolean {
    if (!teacher) return false;
    
    if (this.isAdmin()) {
      return true;
    }
    
    if (this.isTeacher()) {
      const teacherId = teacher._id || teacher;
      return teacherId === this.getCurrentUserId();
    }
    
    return false;
  }

  /**
   * Check if user can delete teachers
   * Only admin can delete teacher accounts
   */
  canDeleteTeacher(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can browse teachers (for joining groups)
   * Students can browse teachers, teachers and admin can view all
   */
  canBrowseTeachers(): boolean {
    return true; // All roles can browse teachers
  }

  // ==========================================
  // SUBJECT PERMISSIONS
  // ==========================================

  /**
   * Check if user can create subjects
   * Only admin can create subjects
   */
  canCreateSubject(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can edit subjects
   * Only admin can edit subjects
   */
  canEditSubject(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can delete subjects
   * Only admin can delete subjects
   */
  canDeleteSubject(): boolean {
    return this.isAdmin();
  }

  // ==========================================
  // ANNOUNCEMENT PERMISSIONS
  // ==========================================

  /**
   * Check if user can create announcements
   * Admin and teachers can create announcements
   */
  canCreateAnnouncement(): boolean {
    return this.isTeacherOrAdmin();
  }

  /**
   * Check if user can edit an announcement
   * - Admin: Can edit any announcement
   * - Teacher: Can edit their own announcements
   */
  canEditAnnouncement(announcement: any): boolean {
    if (!announcement) return false;
    
    if (this.isAdmin()) {
      return true;
    }
    
    if (this.isTeacher()) {
      const authorId = announcement.author?._id || announcement.author;
      return authorId === this.getCurrentUserId();
    }
    
    return false;
  }

  /**
   * Check if user can delete announcements
   * Same as edit permissions
   */
  canDeleteAnnouncement(announcement: any): boolean {
    return this.canEditAnnouncement(announcement);
  }

  // ==========================================
  // DASHBOARD & ANALYTICS PERMISSIONS
  // ==========================================

  /**
   * Check if user can access admin dashboard
   */
  canAccessAdminDashboard(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can access teacher dashboard
   */
  canAccessTeacherDashboard(): boolean {
    return this.isTeacher();
  }

  /**
   * Check if user can access student dashboard
   */
  canAccessStudentDashboard(): boolean {
    return this.isStudent();
  }

  /**
   * Check if user can view system-wide analytics
   * Only admin can view system analytics
   */
  canViewSystemAnalytics(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can export data
   * Admin and teachers can export data
   */
  canExportData(): boolean {
    return this.isTeacherOrAdmin();
  }

  // ==========================================
  // USER MANAGEMENT PERMISSIONS
  // ==========================================

  /**
   * Check if user can manage user accounts
   * Only admin can manage users
   */
  canManageUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user can view user list
   * Admin can view all, teachers can view students in their groups
   */
  canViewUserList(): boolean {
    return this.isTeacherOrAdmin();
  }

  /**
   * Check if user can change user roles
   * Only admin can change roles
   */
  canChangeUserRole(): boolean {
    return this.isAdmin();
  }
}

