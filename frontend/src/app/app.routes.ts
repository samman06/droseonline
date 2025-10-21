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
  // Courses removed
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
        path: 'browse-teachers',
        canActivate: [RoleGuard],
        data: { roles: ['student'] },
        loadComponent: () => import('./students/teacher-browse/teacher-browse.component').then(m => m.TeacherBrowseComponent)
      },
      {
        path: 'teachers',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./teachers/teacher-list/teacher-list.component').then(m => m.TeacherListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./teachers/teacher-create/teacher-create.component').then(m => m.TeacherCreateComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./teachers/teacher-detail/teacher-detail.component').then(m => m.TeacherDetailComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./teachers/teacher-edit/teacher-edit.component').then(m => m.TeacherEditComponent)
          }
        ]
      },
      // Announcements
      {
        path: 'announcements',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher', 'student'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./announcements/announcement-list/announcement-list.component').then(m => m.AnnouncementListComponent)
          },
          {
            path: 'new',
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
            loadComponent: () => import('./announcements/announcement-form/announcement-form.component').then(m => m.AnnouncementFormComponent)
          },
          {
            path: ':id/edit',
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
            loadComponent: () => import('./announcements/announcement-form/announcement-form.component').then(m => m.AnnouncementFormComponent)
          }
        ]
      },
      // Courses
      {
        path: 'courses',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher', 'student'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./courses/course-list/course-list.component').then(m => m.CourseListComponent)
          },
          {
            path: 'new',
            canActivate: [RoleGuard],
            data: { roles: ['admin'] },
            loadComponent: () => import('./courses/course-form/course-form.component').then(m => m.CourseFormComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./courses/course-detail/course-detail.component').then(m => m.CourseDetailComponent)
          },
          {
            path: ':id/edit',
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
            loadComponent: () => import('./courses/course-form/course-form.component').then(m => m.CourseFormComponent)
          }
        ]
      },
      // Assignments
      {
        path: 'assignments',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher', 'student'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./assignments/assignment-list/assignment-list.component').then(m => m.AssignmentListComponent)
          },
          {
            path: 'new',
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
            loadComponent: () => import('./assignments/assignment-form/assignment-form.component').then(m => m.AssignmentFormComponent)
          },
          {
            path: 'my-submissions',
            canActivate: [RoleGuard],
            data: { roles: ['student'] },
            loadComponent: () => import('./assignments/my-submissions/my-submissions.component').then(m => m.MySubmissionsComponent)
          },
          {
            path: 'grade/:submissionId',
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
            loadComponent: () => import('./assignments/teacher-grading/teacher-grading.component').then(m => m.TeacherGradingComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./assignments/assignment-detail/assignment-detail.component').then(m => m.AssignmentDetailComponent)
          },
          {
            path: ':id/edit',
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
            loadComponent: () => import('./assignments/assignment-form/assignment-form.component').then(m => m.AssignmentFormComponent)
          },
          {
            path: ':id/submit',
            canActivate: [RoleGuard],
            data: { roles: ['student'] },
            loadComponent: () => import('./assignments/student-submission/student-submission.component').then(m => m.StudentSubmissionComponent)
          },
          {
            path: ':id/take-quiz',
            canActivate: [RoleGuard],
            data: { roles: ['student'] },
            loadComponent: () => import('./assignments/quiz-taking/quiz-taking.component').then(m => m.QuizTakingComponent)
          },
          {
            path: ':id/quiz-results/:submissionId',
            loadComponent: () => import('./assignments/quiz-results/quiz-results.component').then(m => m.QuizResultsComponent)
          }
        ]
      },
      {
        path: 'subjects',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./subjects/subject-list/subject-list.component').then(m => m.SubjectListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./subjects/subject-create/subject-create.component').then(m => m.SubjectCreateComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./subjects/subject-edit/subject-edit.component').then(m => m.SubjectEditComponent)
          }
        ]
      },
      {
        path: 'attendance',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher', 'student'] },
        children: [
          {
            path: '',
            loadComponent: () => import('./attendance/attendance-list/attendance-list.component').then(m => m.AttendanceListComponent)
          },
          {
            path: 'dashboard',
            loadComponent: () => import('./attendance/attendance-dashboard/attendance-dashboard.component').then(m => m.AttendanceDashboardComponent)
          },
          {
            path: 'mark',
            loadComponent: () => import('./attendance/attendance-mark/attendance-mark.component').then(m => m.AttendanceMarkComponent),
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
          },
          {
            path: 'mark/:groupId',
            loadComponent: () => import('./attendance/attendance-mark/attendance-mark.component').then(m => m.AttendanceMarkComponent),
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
          },
          {
            path: ':id',
            loadComponent: () => import('./attendance/attendance-detail/attendance-detail.component').then(m => m.AttendanceDetailComponent)
          },
          {
            path: ':id/edit',
            loadComponent: () => import('./attendance/attendance-edit/attendance-edit.component').then(m => m.AttendanceEditComponent),
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] },
          }
        ]
      },
      {
        path: 'groups',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'teacher', 'student'] }, // All roles can access groups
        children: [
          {
            path: '',
            loadComponent: () => import('./groups/group-list/group-list.component').then(m => m.GroupListComponent)
          },
          {
            path: 'new',
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] }, // Only admin/teacher can create
            loadComponent: () => import('./groups/group-create/group-create.component').then(m => m.GroupCreateComponent)
          },
          {
            path: ':id',
            loadComponent: () => import('./groups/group-detail/group-detail.component').then(m => m.GroupDetailComponent)
          },
          {
            path: ':id/edit',
            canActivate: [RoleGuard],
            data: { roles: ['admin', 'teacher'] }, // Only admin/teacher can edit
            loadComponent: () => import('./groups/group-edit/group-edit.component').then(m => m.GroupEditComponent)
          }
        ]
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
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