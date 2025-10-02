import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Navigation -->
      <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <!-- Logo and Navigation -->
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <div class="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <svg class="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                </div>
                <span class="ml-2 text-xl font-bold text-gray-900">Drose Online</span>
              </div>
              
              <!-- Desktop Navigation -->
              <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a routerLink="/dashboard" 
                   routerLinkActive="border-primary-500 text-gray-900" 
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Dashboard
                </a>
                
                <a *ngIf="currentUser?.role === 'admin'" 
                   routerLink="/students" 
                   routerLinkActive="border-primary-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Students
                </a>
                
                <a *ngIf="currentUser?.role === 'admin'" 
                   routerLink="/teachers" 
                   routerLinkActive="border-primary-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Teachers
                </a>
                
                <a routerLink="/courses" 
                   routerLinkActive="border-primary-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Courses
                </a>
                
                <a routerLink="/assignments" 
                   routerLinkActive="border-primary-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Assignments
                </a>
                
                <a *ngIf="currentUser?.role !== 'student'" 
                   routerLink="/attendance" 
                   routerLinkActive="border-primary-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Attendance
                </a>
                
                <a *ngIf="currentUser?.role === 'admin'" 
                   routerLink="/subjects" 
                   routerLinkActive="border-primary-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Subjects
                </a>
                
                <a *ngIf="currentUser?.role === 'admin'" 
                   routerLink="/groups" 
                   routerLinkActive="border-primary-500 text-gray-900"
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                  Groups
                </a>
              </div>
            </div>

            <!-- User Menu -->
            <div class="flex items-center">
              <!-- Notifications -->
              <button class="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3">
                <span class="sr-only">View notifications</span>
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                </svg>
              </button>

              <!-- Profile dropdown -->
              <div class="relative">
                <div>
                  <button 
                    (click)="toggleUserMenu()" 
                    class="bg-white flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                    id="user-menu-button">
                    <span class="sr-only">Open user menu</span>
                    <div class="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center">
                      <span class="text-sm font-medium text-white">
                        {{ currentUser?.firstName?.charAt(0) || 'U' }}{{ currentUser?.lastName?.charAt(0) || '' }}
                      </span>
                    </div>
                    <div class="ml-3 flex flex-col items-start">
                      <span class="text-sm font-medium text-gray-700">{{ currentUser?.fullName }}</span>
                      <span class="text-xs text-gray-500 capitalize">{{ currentUser?.role }}</span>
                    </div>
                  </button>
                </div>

                <!-- User Menu Dropdown -->
                <div *ngIf="showUserMenu" 
                     class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                     (click)="closeUserMenu()">
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Your Profile
                  </a>
                  <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Settings
                  </a>
                  <button 
                    (click)="logout()" 
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class DashboardLayoutComponent implements OnInit {
  currentUser: User | null = null;
  showUserMenu = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
