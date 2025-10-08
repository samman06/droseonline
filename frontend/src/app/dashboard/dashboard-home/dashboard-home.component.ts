import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { DashboardService } from '../../services/dashboard.service';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalAssignments: number;
  pendingAssignments: number;
  averageAttendance: number;
  activeStudents?: number;
  activeTeachers?: number;
  completedAssignments?: number;
  totalGroups?: number;
  totalSubjects?: number;
}

interface RecentActivity {
  id: string;
  type: 'assignment' | 'attendance' | 'grade' | 'announcement' | 'enrollment';
  title: string;
  description: string;
  time: string;
  user?: string;
  status?: 'pending' | 'completed' | 'overdue';
}

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8">
      <!-- Header Section with Time & Greeting -->
      <div class="mb-8 relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl opacity-10"></div>
        <div class="relative bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 p-8">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-sm font-semibold text-gray-600 uppercase tracking-wider">Live Dashboard</span>
              </div>
              <h1 class="text-4xl md:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                {{ getGreeting() }}, {{ currentUser?.firstName }}! 👋
              </h1>
              <p class="text-gray-600 text-lg">Here's what's happening with your platform today</p>
            </div>
            <div class="mt-6 md:mt-0 text-right">
              <div class="text-3xl font-bold text-indigo-600">{{ getCurrentTime() }}</div>
              <div class="text-sm text-gray-600">{{ getCurrentDate() }}</div>
              <div class="mt-2">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border-2 border-green-300">
                  <span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-ping"></span>
                  System Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Stats Grid with Eye-Catching Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Students Card -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div class="relative p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-white/20 backdrop-blur-lg rounded-xl">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div class="flex items-center gap-1 px-2 py-1 bg-green-400/30 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <span class="text-xs font-bold text-white">+12%</span>
              </div>
            </div>
            <div>
              <p class="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">Total Students</p>
              <h3 class="text-4xl font-black text-white mb-1">{{ animateNumber(stats.totalStudents) }}</h3>
              <p class="text-white/70 text-xs">{{ stats.activeStudents || Math.floor(stats.totalStudents * 0.85) }} Active Students</p>
            </div>
            <div class="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white rounded-full transition-all duration-1000" [style.width.%]="getActiveStudentsPercentage()"></div>
            </div>
          </div>
        </div>

        <!-- Teachers Card -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div class="relative p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-white/20 backdrop-blur-lg rounded-xl">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"></path>
                </svg>
              </div>
              <div class="flex items-center gap-1 px-2 py-1 bg-green-400/30 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <span class="text-xs font-bold text-white">+5%</span>
              </div>
            </div>
            <div>
              <p class="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">Total Teachers</p>
              <h3 class="text-4xl font-black text-white mb-1">{{ animateNumber(stats.totalTeachers) }}</h3>
              <p class="text-white/70 text-xs">{{ stats.activeTeachers || Math.floor(stats.totalTeachers * 0.95) }} Active Faculty</p>
            </div>
            <div class="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white rounded-full transition-all duration-1000" [style.width.%]="getActiveTeachersPercentage()"></div>
            </div>
          </div>
        </div>

        <!-- Courses Card -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div class="relative p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-white/20 backdrop-blur-lg rounded-xl">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"></path>
                </svg>
              </div>
              <div class="flex items-center gap-1 px-2 py-1 bg-green-400/30 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <span class="text-xs font-bold text-white">+8%</span>
              </div>
            </div>
            <div>
              <p class="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">Total Courses</p>
              <h3 class="text-4xl font-black text-white mb-1">{{ animateNumber(stats.totalCourses) }}</h3>
              <p class="text-white/70 text-xs">{{ stats.totalSubjects || 12 }} Different Subjects</p>
            </div>
            <div class="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white rounded-full transition-all duration-1000" style="width: 75%"></div>
            </div>
          </div>
        </div>

        <!-- Attendance Card -->
        <div class="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer">
          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
          <div class="relative p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="p-3 bg-white/20 backdrop-blur-lg rounded-xl">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="flex items-center gap-1 px-2 py-1 bg-green-400/30 rounded-lg">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
                <span class="text-xs font-bold text-white">+3%</span>
              </div>
            </div>
            <div>
              <p class="text-white/80 text-sm font-semibold uppercase tracking-wide mb-1">Attendance Rate</p>
              <h3 class="text-4xl font-black text-white mb-1">{{ stats.averageAttendance }}%</h3>
              <p class="text-white/70 text-xs">{{ stats.averageAttendance > 85 ? 'Excellent' : stats.averageAttendance > 70 ? 'Good' : 'Needs Improvement' }} Performance</p>
            </div>
            <div class="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
              <div class="h-full bg-white rounded-full transition-all duration-1000" [style.width.%]="stats.averageAttendance"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Secondary Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Assignments Progress -->
        <div class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-800">Assignments</h3>
            <div class="p-2 bg-indigo-100 rounded-lg">
              <svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"></path>
              </svg>
            </div>
          </div>
          <div class="flex items-center justify-center mb-4">
            <div class="relative w-32 h-32">
              <svg class="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="56" stroke="#e5e7eb" stroke-width="8" fill="none"/>
                <circle cx="64" cy="64" r="56" stroke="url(#gradient1)" stroke-width="8" fill="none"
                  [attr.stroke-dasharray]="352"
                  [attr.stroke-dashoffset]="352 - (352 * getAssignmentCompletionPercentage() / 100)"/>
                <defs>
                  <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
                  </linearGradient>
                </defs>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-2xl font-black text-gray-800">{{ getAssignmentCompletionPercentage() }}%</span>
                <span class="text-xs text-gray-500">Complete</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-indigo-600">{{ stats.totalAssignments }}</div>
              <div class="text-xs text-gray-600">Total</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">{{ stats.completedAssignments || Math.floor(stats.totalAssignments * 0.65) }}</div>
              <div class="text-xs text-gray-600">Completed</div>
            </div>
          </div>
        </div>

        <!-- Groups Overview -->
        <div class="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-800">Groups</h3>
            <div class="p-2 bg-purple-100 rounded-lg">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
          </div>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-700">Total Groups</span>
              <span class="text-2xl font-black text-purple-600">{{ stats.totalGroups || 28 }}</span>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Grade 1-6</span>
                <span class="font-semibold">{{ Math.floor((stats.totalGroups || 28) * 0.4) }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-blue-500 to-blue-600" style="width: 40%"></div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Grade 7-9</span>
                <span class="font-semibold">{{ Math.floor((stats.totalGroups || 28) * 0.35) }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-purple-500 to-purple-600" style="width: 35%"></div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Grade 10-12</span>
                <span class="font-semibold">{{ Math.floor((stats.totalGroups || 28) * 0.25) }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-emerald-500 to-emerald-600" style="width: 25%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300">
          <h3 class="text-lg font-bold mb-6">Quick Stats</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 bg-white/10 backdrop-blur-lg rounded-xl">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <span class="font-semibold">Active Today</span>
              </div>
              <span class="text-2xl font-black">{{ Math.floor(stats.totalStudents * 0.72) }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-white/10 backdrop-blur-lg rounded-xl">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <span class="font-semibold">Pending Tasks</span>
              </div>
              <span class="text-2xl font-black">{{ stats.pendingAssignments }}</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-white/10 backdrop-blur-lg rounded-xl">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <span class="font-semibold">New This Week</span>
              </div>
              <span class="text-2xl font-black">{{ Math.floor(Math.random() * 20) + 10 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions & Recent Activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Enhanced Quick Actions -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Quick Actions
            </h2>
            <p class="text-white/80 text-sm mt-1">Get things done faster</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4">
              <a *ngFor="let action of getQuickActions()" 
                 [routerLink]="action.route"
                 class="group relative overflow-hidden flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div class="relative p-3 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="action.icon"></path>
                  </svg>
                </div>
                <span class="relative text-sm font-bold text-gray-800 text-center group-hover:text-indigo-600 transition-colors duration-300">{{ action.name }}</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Enhanced Recent Activities -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
            <h2 class="text-xl font-bold text-white flex items-center gap-2">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Recent Activities
            </h2>
            <p class="text-white/80 text-sm mt-1">Latest updates</p>
          </div>
          <div class="p-6 max-h-96 overflow-y-auto custom-scrollbar">
            <div class="space-y-4">
              <div *ngFor="let activity of recentActivities" class="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200">
                <div class="flex-shrink-0">
                  <div [class]="getActivityBgColor(activity.type)" class="w-12 h-12 rounded-xl flex items-center justify-center">
                    <svg [class]="getActivityColor(activity.type)" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getActivityIcon(activity.type)"></path>
                    </svg>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-bold text-gray-900 mb-1">{{ activity.title }}</p>
                  <p class="text-sm text-gray-600 mb-2">{{ activity.description }}</p>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 flex items-center gap-1">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      {{ activity.time }}
                    </span>
                    <span *ngIf="activity.status" [class]="getStatusClass(activity.status)" class="text-xs font-semibold px-2 py-0.5 rounded-full">
                      {{ activity.status }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Chart Section (Placeholder for future) -->
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-gray-800">Platform Overview</h2>
            <p class="text-sm text-gray-600">Monitor system performance and activity trends</p>
          </div>
          <div class="flex gap-2">
            <button class="px-4 py-2 text-sm font-semibold bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors">Week</button>
            <button class="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">Month</button>
            <button class="px-4 py-2 text-sm font-semibold text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">Year</button>
          </div>
        </div>
        <div class="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
          <div class="text-center">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p class="text-gray-600 font-semibold">Charts Coming Soon</p>
            <p class="text-sm text-gray-500">Advanced analytics and visualizations</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .animate-slide-in {
      animation: slideInUp 0.6s ease-out forwards;
    }

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `]
})
export class DashboardHomeComponent implements OnInit {
  currentUser: User | null = null;
  stats: DashboardStats = {
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    averageAttendance: 0
  };
  
  recentActivities: RecentActivity[] = [];
  isLoading = true;
  currentTime = new Date();
  Math = Math;

  // Quick Actions based on user role
  quickActions = {
    admin: [
      { name: 'Add Student', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z', route: '/dashboard/students/new' },
      { name: 'Add Teacher', icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5', route: '/dashboard/teachers/new' },
      { name: 'Create Group', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', route: '/dashboard/groups/new' },
      { name: 'Add Subject', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', route: '/dashboard/subjects/new' }
    ],
    teacher: [
      { name: 'Take Attendance', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/dashboard/attendance/new' },
      { name: 'Create Assignment', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z', route: '/dashboard/assignments/new' },
      { name: 'My Courses', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', route: '/dashboard/courses' },
      { name: 'Grade Assignments', icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75', route: '/dashboard/assignments/grade' }
    ],
    student: [
      { name: 'My Assignments', icon: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z', route: '/dashboard/assignments' },
      { name: 'My Courses', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25', route: '/dashboard/courses' },
      { name: 'My Grades', icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75', route: '/dashboard/grades' },
      { name: 'Attendance', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z', route: '/dashboard/attendance' }
    ]
  };

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUser;
    this.loadDashboardData();
    
    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
    }, 60000);
  }

  loadDashboardData() {
    this.isLoading = true;
    
    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data.stats || this.stats;
        this.recentActivities = data.recentActivities || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
        this.isLoading = false;
        // Set mock data for now
        this.setMockData();
      }
    });
  }

  private setMockData() {
    // Enhanced mock data
    this.stats = {
      totalStudents: 856,
      totalTeachers: 47,
      totalCourses: 124,
      totalAssignments: 342,
      pendingAssignments: 28,
      averageAttendance: 92.5,
      activeStudents: 729,
      activeTeachers: 45,
      completedAssignments: 223,
      totalGroups: 28,
      totalSubjects: 15
    };

    this.recentActivities = [
      {
        id: '1',
        type: 'assignment',
        title: 'New Assignment Created',
        description: 'Advanced Mathematics - Calculus Problem Set #5',
        time: '15 minutes ago',
        user: 'Dr. Sarah Johnson',
        status: 'completed'
      },
      {
        id: '2',
        type: 'attendance',
        title: 'Attendance Recorded',
        description: 'Grade 12 - Physics Lab Session',
        time: '1 hour ago',
        user: 'Prof. Michael Chen',
        status: 'completed'
      },
      {
        id: '3',
        type: 'grade',
        title: 'Grades Published',
        description: '42 students received grades for Literature Essay',
        time: '2 hours ago',
        user: 'Ms. Emily Rodriguez',
        status: 'completed'
      },
      {
        id: '4',
        type: 'enrollment',
        title: 'New Student Enrolled',
        description: 'John Smith joined Grade 10-A',
        time: '3 hours ago',
        status: 'completed'
      },
      {
        id: '5',
        type: 'announcement',
        title: 'System Update',
        description: 'Dashboard features enhanced with new analytics',
        time: '5 hours ago',
        status: 'completed'
      }
    ];
  }

  getQuickActions() {
    const role = this.currentUser?.role as keyof typeof this.quickActions;
    return this.quickActions[role] || [];
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getCurrentTime(): string {
    return this.currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getCurrentDate(): string {
    return this.currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  animateNumber(num: number): number {
    // Simple number display - could be enhanced with animation library
    return num;
  }

  getActivityIcon(type: string): string {
    const icons = {
      assignment: 'M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z',
      attendance: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      grade: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75',
      announcement: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
      enrollment: 'M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z'
    };
    return icons[type as keyof typeof icons] || icons.announcement;
  }

  getActivityColor(type: string): string {
    const colors = {
      assignment: 'text-blue-600',
      attendance: 'text-green-600',
      grade: 'text-purple-600',
      announcement: 'text-orange-600',
      enrollment: 'text-indigo-600'
    };
    return colors[type as keyof typeof colors] || colors.announcement;
  }

  getActivityBgColor(type: string): string {
    const colors = {
      assignment: 'bg-blue-100',
      attendance: 'bg-green-100',
      grade: 'bg-purple-100',
      announcement: 'bg-orange-100',
      enrollment: 'bg-indigo-100'
    };
    return colors[type as keyof typeof colors] || colors.announcement;
  }

  getStatusClass(status: string): string {
    const classes = {
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700'
    };
    return classes[status as keyof typeof classes] || classes.pending;
  }

  getAssignmentCompletionPercentage(): number {
    if (!this.stats.totalAssignments || this.stats.totalAssignments === 0) {
      return 0;
    }
    const completed = this.stats.completedAssignments || Math.floor(this.stats.totalAssignments * 0.65);
    return Math.round((completed / this.stats.totalAssignments) * 100);
  }

  getActiveStudentsPercentage(): number {
    if (!this.stats.totalStudents || this.stats.totalStudents === 0) {
      return 0;
    }
    const active = this.stats.activeStudents || Math.floor(this.stats.totalStudents * 0.85);
    return Math.round((active / this.stats.totalStudents) * 100);
  }

  getActiveTeachersPercentage(): number {
    if (!this.stats.totalTeachers || this.stats.totalTeachers === 0) {
      return 0;
    }
    const active = this.stats.activeTeachers || Math.floor(this.stats.totalTeachers * 0.95);
    return Math.round((active / this.stats.totalTeachers) * 100);
  }
}