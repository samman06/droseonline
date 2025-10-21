import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { NotificationsComponent } from '../../shared/notifications/notifications.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationsComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit {
  currentUser: User | null = null;
  sidebarOpen = false;
  notificationCount = 3;
  profileDropdownOpen = false;
  notificationsDropdownOpen = false;

  navigationItems = [
    {
      name: 'Dashboard',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2zm0 0V9a2 2 0 012-2h14a2 2 0 012 2v2M7 7V5a2 2 0 012-2h6a2 2 0 012 2v2',
      route: '/dashboard',
      roles: ['admin', 'teacher', 'student']
    },
    {
      name: 'Browse Teachers',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7',
      route: 'browse-teachers',
      roles: ['student']
    },
    {
      name: 'Students',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
      route: 'students',
      roles: ['admin', 'teacher']
    },
    {
      name: 'Teachers',
      icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
      route: 'teachers',
      roles: ['admin']
    },
    {
      name: 'Subjects',
      icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
      route: 'subjects',
      roles: ['admin', 'teacher']
    },
    {
      name: 'Groups',
      icon: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
      route: 'groups',
      roles: ['admin', 'teacher', 'student'] // Added student access
    },
    {
      name: 'Courses',
      icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
      route: 'courses',
      roles: ['admin', 'teacher', 'student']
    },
    {
      name: 'Assignments',
      icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
      route: 'assignments',
      roles: ['admin', 'teacher', 'student']
    },
    {
      name: 'Attendance',
      icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      route: 'attendance',
      roles: ['admin', 'teacher', 'student']
    },
    {
      name: 'Announcements',
      icon: 'M10 34l-8-8 8-8 1.414 1.414L5.828 25h14.344L14.586 19.414 16 18l8 8-8 8z',
      route: 'announcements',
      roles: ['admin', 'teacher', 'student']
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar() {
    this.sidebarOpen = false;
  }

  toggleProfileDropdown() {
    this.profileDropdownOpen = !this.profileDropdownOpen;
    if (this.profileDropdownOpen) {
      this.notificationsDropdownOpen = false; // Close notifications if open
    }
  }

  closeProfileDropdown() {
    this.profileDropdownOpen = false;
  }

  toggleNotificationsDropdown() {
    this.notificationsDropdownOpen = !this.notificationsDropdownOpen;
    if (this.notificationsDropdownOpen) {
      this.profileDropdownOpen = false; // Close profile if open
    }
  }

  closeNotificationsDropdown() {
    this.notificationsDropdownOpen = false;
  }

  getUserAvatar(): string {
    if (!this.currentUser) return '';
    const avatar = (this.currentUser as any).avatar;
    return avatar || '';
  }

  hasUserAvatar(): boolean {
    return !!this.getUserAvatar();
  }

  getUserInitials(): string {
    if (!this.currentUser) return '?';
    return `${this.currentUser.firstName.charAt(0)}${this.currentUser.lastName.charAt(0)}`;
  }

  hasRole(requiredRoles: string[]): boolean {
    if (!this.currentUser) return false;
    return requiredRoles.includes(this.currentUser.role);
  }

  logout() {
    this.authService.logout();
  }

  navigateToProfile() {
    this.router.navigate(['/profile']);
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}