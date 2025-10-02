import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';

interface DashboardStats {
  overview: {
    totalCourses?: number;
    totalStudents?: number;
    totalTeachers?: number;
    totalAssignments?: number;
    pendingGrading?: number;
    averageGrade?: number;
    attendancePercentage?: number;
  };
  upcomingAssignments?: any[];
  recentGrades?: any[];
  recentUsers?: any[];
  recentSubmissions?: any[];
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      <!-- Welcome Header -->
      <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold">Welcome back, {{ currentUser?.firstName }}!</h1>
            <p class="text-primary-100 mt-1">
              {{ getWelcomeMessage() }}
            </p>
          </div>
          <div class="hidden md:block">
            <svg class="h-16 w-16 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Admin Stats -->
        <div *ngIf="currentUser?.role === 'admin'" class="space-y-6 md:col-span-2 lg:col-span-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Total Students</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalStudents || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Total Teachers</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalTeachers || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Total Courses</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalCourses || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Total Assignments</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalAssignments || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Teacher Stats -->
        <div *ngIf="currentUser?.role === 'teacher'" class="space-y-6 md:col-span-2 lg:col-span-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">My Courses</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalCourses || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">My Students</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalStudents || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Assignments</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalAssignments || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Pending Grading</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.pendingGrading || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Stats -->
        <div *ngIf="currentUser?.role === 'student'" class="space-y-6 md:col-span-2 lg:col-span-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Enrolled Courses</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalCourses || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Average Grade</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.averageGrade || 0 }}%</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Assignments</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.totalAssignments || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-body">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">Attendance</p>
                    <p class="text-2xl font-semibold text-gray-900">{{ stats?.overview?.attendancePercentage || 0 }}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div class="card-body">
            <div class="grid grid-cols-2 gap-4">
              <a *ngIf="currentUser?.role !== 'student'" 
                 routerLink="/assignments/create" 
                 class="flex items-center p-3 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                New Assignment
              </a>
              
              <a routerLink="/courses" 
                 class="flex items-center p-3 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                View Courses
              </a>
              
              <a *ngIf="currentUser?.role === 'student'" 
                 routerLink="/grades" 
                 class="flex items-center p-3 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                My Grades
              </a>
              
              <a *ngIf="currentUser?.role !== 'student'" 
                 routerLink="/attendance" 
                 class="flex items-center p-3 text-sm font-medium text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5 text-primary-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
                Take Attendance
              </a>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div class="card-body">
            <div *ngIf="!hasRecentActivity()" class="text-center py-6">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <p class="mt-2 text-sm text-gray-500">No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardHomeComponent implements OnInit {
  currentUser: User | null = null;
  stats: DashboardStats | null = null;
  isLoading = true;

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadDashboardStats();
      }
    });
  }

  getWelcomeMessage(): string {
    const role = this.currentUser?.role;
    switch (role) {
      case 'admin':
        return 'Manage your educational institution with ease.';
      case 'teacher':
        return 'Teach, inspire, and track your students\' progress.';
      case 'student':
        return 'Continue your learning journey and achieve your goals.';
      default:
        return 'Welcome to your educational dashboard.';
    }
  }

  hasRecentActivity(): boolean {
    return !!(this.stats?.upcomingAssignments?.length || 
              this.stats?.recentGrades?.length || 
              this.stats?.recentUsers?.length || 
              this.stats?.recentSubmissions?.length);
  }

  private loadDashboardStats(): void {
    this.dashboardService.getDashboardStats().subscribe({
      next: (response) => {
        if (response.success) {
          this.stats = response.data.stats;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.isLoading = false;
      }
    });
  }
}
