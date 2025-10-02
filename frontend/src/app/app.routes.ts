import { Routes } from '@angular/router';
import { AuthGuard, GuestGuard, RoleGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [GuestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  // Redirect direct module access to dashboard
  {
    path: 'students',
    redirectTo: '/dashboard/students',
    pathMatch: 'prefix'
  },
  {
    path: 'teachers',
    redirectTo: '/dashboard/teachers',
    pathMatch: 'full'
  },
  {
    path: 'courses',
    redirectTo: '/dashboard/courses',
    pathMatch: 'full'
  },
  {
    path: 'assignments',
    redirectTo: '/dashboard/assignments',
    pathMatch: 'full'
  },
  {
    path: 'subjects',
    redirectTo: '/dashboard/subjects',
    pathMatch: 'full'
  },
  {
    path: 'groups',
    redirectTo: '/dashboard/groups',
    pathMatch: 'full'
  },
  {
    path: 'attendance',
    redirectTo: '/dashboard/attendance',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadComponent: () => import('./layout/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent)
      },
      {
        path: 'students',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./students/student-list/student-list.component').then(m => m.StudentListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./students/student-create/student-create.component').then(m => m.StudentCreateComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./students/student-detail/student-detail.component').then(m => m.StudentDetailComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./students/student-edit/student-edit.component').then(m => m.StudentEditComponent)
          }
        ]
      },
      {
        path: 'teachers',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./teachers/teacher-list/teacher-list.component').then(m => m.TeacherListComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./courses/course-list/course-list.component').then(m => m.CourseListComponent)
      },
      {
        path: 'assignments',
        loadComponent: () => import('./assignments/assignment-list/assignment-list.component').then(m => m.AssignmentListComponent)
      },
      {
        path: 'subjects',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher'] },
        loadComponent: () => import('./subjects/subject-list/subject-list.component').then(m => m.SubjectListComponent)
      },
      {
        path: 'groups',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('./groups/group-list/group-list.component').then(m => m.GroupListComponent)
      },
      {
        path: 'attendance',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher'] },
        loadComponent: () => import('./attendance/attendance-list/attendance-list.component').then(m => m.AttendanceListComponent)
      },
      {
        path: 'admin',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        children: [
          {
            path: 'users',
            loadComponent: () => import('./admin/user-management/user-management.component').then(m => m.UserManagementComponent)
          }
        ]
      }
    ]
  },
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];