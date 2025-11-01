import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, User } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationsComponent } from '../../shared/notifications/notifications.component';
import { LanguageSwitcherComponent } from '../../shared/language-switcher/language-switcher.component';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NotificationsComponent, LanguageSwitcherComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  sidebarOpen = false;
  notificationCount = 0;
  profileDropdownOpen = false;
  notificationsDropdownOpen = false;
  
  private notificationSubscription?: Subscription;
  private refreshSubscription?: Subscription;

  navigationItems = [
    // Core
    {
      name: 'Dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      route: '/dashboard',
      roles: ['admin', 'teacher', 'assistant', 'student'],
      section: 'main'
    },
    
    // People Management
    {
      name: 'Browse Teachers',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      route: 'browse-teachers',
      roles: ['student'],
      section: 'people'
    },
    {
      name: 'My Students',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13.5 3.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
      route: 'my-students',
      roles: ['teacher', 'assistant'],
      section: 'people'
    },
    {
      name: 'My Assistants',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      route: 'my-assistants',
      roles: ['teacher'],
      section: 'people'
    },
    {
      name: 'Students',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13.5 3.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
      route: 'students',
      roles: ['admin'],
      section: 'people'
    },
    {
      name: 'Teachers',
      icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
      route: 'teachers',
      roles: ['admin'],
      section: 'people'
    },
    
    // Academic Structure
    {
      name: 'Subjects',
      icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
      route: 'subjects',
      roles: ['admin', 'teacher', 'assistant'],
      section: 'academic'
    },
    {
      name: 'Courses',
      icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25',
      route: 'courses',
      roles: ['admin', 'teacher', 'assistant'],
      section: 'academic'
    },
    {
      name: 'Groups',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      route: 'groups',
      roles: ['admin', 'teacher', 'assistant', 'student'],
      section: 'academic'
    },
    
    // Teaching & Learning
    {
      name: 'Attendance',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      route: 'attendance',
      roles: ['admin', 'teacher', 'assistant', 'student'],
      section: 'teaching'
    },
    {
      name: 'Assignments',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
      route: 'assignments',
      roles: ['admin', 'teacher', 'assistant', 'student'],
      section: 'teaching'
    },
    {
      name: 'Materials',
      icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      route: 'materials',
      roles: ['admin', 'teacher', 'assistant', 'student'],
      section: 'teaching'
    },
    {
      name: 'Announcements',
      icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z',
      route: 'announcements',
      roles: ['admin', 'teacher', 'assistant', 'student'],
      section: 'teaching'
    },
    
    // Planning & Reports
    {
      name: 'Calendar',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      route: 'calendar',
      // roles: ['admin', 'teacher', 'assistant', 'student'],
      roles: [],
      section: 'planning'
    },
    {
      name: 'Analytics',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      route: 'analytics',
      // roles: ['admin', 'teacher'],
      roles: [],
      section: 'planning'
    },
    {
      name: 'Accounting',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      route: 'accounting',
      roles: ['teacher', 'admin'],
      section: 'planning'
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Subscribe to notification count
    this.notificationSubscription = this.notificationService.unreadCount$.subscribe(count => {
      this.notificationCount = count;
    });

    // Refresh notifications every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.notificationService.refresh();
    });

    // Close dropdowns on route change
    this.router.events.subscribe(() => {
      this.closeProfileDropdown();
      this.closeNotificationsDropdown();
    });
  }

  ngOnDestroy() {
    this.notificationSubscription?.unsubscribe();
    this.refreshSubscription?.unsubscribe();
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