import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AttendanceService } from '../../services/attendance.service';
import { ToastService } from '../../services/toast.service';
import { AuthService, User } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-attendance-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <!-- Role-specific headers -->
              <h1 *ngIf="currentUser?.role === 'student'" class="text-4xl font-bold text-gray-900 mb-2">{{ 'attendance.myAttendanceOverview' | translate }}</h1>
              <h1 *ngIf="currentUser?.role === 'teacher'" class="text-4xl font-bold text-gray-900 mb-2">{{ 'attendance.classAttendanceDashboard' | translate }}</h1>
              <h1 *ngIf="currentUser?.role === 'admin'" class="text-4xl font-bold text-gray-900 mb-2">{{ 'attendance.attendanceDashboard' | translate }}</h1>
              
              <!-- Role-specific descriptions -->
              <p *ngIf="currentUser?.role === 'student'" class="text-gray-600">{{ 'attendance.personalStatsDesc' | translate }}</p>
              <p *ngIf="currentUser?.role === 'teacher'" class="text-gray-600">{{ 'attendance.teachingGroupsDesc' | translate }}</p>
              <p *ngIf="currentUser?.role === 'admin'" class="text-gray-600">{{ 'attendance.systemWideDesc' | translate }}</p>
            </div>
            <div class="flex gap-3">
              <button 
                (click)="refresh()"
                [disabled]="isLoading"
                class="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-50">
                <svg class="w-5 h-5" [class.animate-spin]="isLoading" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                {{ 'common.refresh' | translate }}
              </button>
              <button 
                *ngIf="canMarkAttendance"
                (click)="markAttendance()"
                class="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                {{ 'attendance.markAttendance' | translate }}
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex justify-center items-center py-20">
          <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <p class="text-gray-600 font-medium">{{ 'attendance.loadingDashboard' | translate }}</p>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !isLoading" class="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6">
          <div class="flex items-center">
            <svg class="w-6 h-6 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <p class="text-red-800 font-medium">{{ error }}</p>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div *ngIf="!isLoading && !error && data">
          
          <!-- Overview Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 bg-white/20 rounded-lg">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
              <div class="text-4xl font-bold mb-2">{{ data.overview.totalSessions }}</div>
              <div class="text-blue-100 text-sm font-medium">{{ 'attendance.totalSessions' | translate }}</div>
              <div class="mt-3 text-xs text-blue-100">
                {{ data.overview.completedSessions }} {{ 'attendance.completed' | translate }} • {{ data.overview.pendingSessions }} {{ 'attendance.pending' | translate }}
              </div>
            </div>

            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 bg-white/20 rounded-lg">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div *ngIf="data.comparisons.weekOverWeek.change !== 0" 
                     class="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                     [ngClass]="{
                       'bg-green-400 bg-opacity-30': data.comparisons.weekOverWeek.change > 0,
                       'bg-red-400 bg-opacity-30': data.comparisons.weekOverWeek.change < 0
                     }">
                  <svg *ngIf="data.comparisons.weekOverWeek.change > 0" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                  <svg *ngIf="data.comparisons.weekOverWeek.change < 0" class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                  {{ data.comparisons.weekOverWeek.change > 0 ? '+' : '' }}{{ data.comparisons.weekOverWeek.change }}%
                </div>
              </div>
              <div class="text-4xl font-bold mb-2">{{ data.overview.overallRate }}%</div>
              <div class="text-green-100 text-sm font-medium">{{ 'attendance.overallAttendanceRate' | translate }}</div>
              <div class="mt-3 text-xs text-green-100">{{ 'attendance.last7Days' | translate }}</div>
            </div>

            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 bg-white/20 rounded-lg">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
              </div>
              <div class="text-4xl font-bold mb-2">{{ data.overview.totalPresent }}</div>
              <div class="text-purple-100 text-sm font-medium">{{ 'attendance.studentsPresent' | translate }}</div>
              <div class="mt-3 text-xs text-purple-100">
                {{ data.overview.totalAbsent }} {{ 'attendance.absent' | translate }} • {{ data.overview.totalLate }} {{ 'attendance.late' | translate }}
              </div>
            </div>

            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 bg-white/20 rounded-lg">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
              </div>
              <div class="text-4xl font-bold mb-2">{{ data.studentsAtRisk.length }}</div>
              <div class="text-orange-100 text-sm font-medium">{{ 'attendance.studentsAtRisk' | translate }}</div>
              <div class="mt-3 text-xs text-orange-100">&lt; 70% {{ 'attendance.attendanceRate' | translate }}</div>
            </div>
          </div>

          <!-- Comparisons Section -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <!-- Week over Week -->
            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                {{ 'attendance.weekOverWeek' | translate }}
              </h3>
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-3xl font-bold text-gray-900">{{ data.comparisons.weekOverWeek.thisWeek }}%</div>
                  <div class="text-sm text-gray-600 mt-1">{{ 'attendance.thisWeek' | translate }}</div>
                </div>
                <div class="text-center px-4">
                  <div class="flex items-center gap-1 text-2xl font-bold"
                       [class.text-green-600]="data.comparisons.weekOverWeek.change > 0"
                       [class.text-red-600]="data.comparisons.weekOverWeek.change < 0"
                       [class.text-gray-600]="data.comparisons.weekOverWeek.change === 0">
                    <svg *ngIf="data.comparisons.weekOverWeek.change > 0" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <svg *ngIf="data.comparisons.weekOverWeek.change < 0" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span>{{ data.comparisons.weekOverWeek.change > 0 ? '+' : '' }}{{ data.comparisons.weekOverWeek.change }}%</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">{{ 'attendance.vsLastWeek' | translate }}</div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-semibold text-gray-600">{{ data.comparisons.weekOverWeek.lastWeek }}%</div>
                  <div class="text-sm text-gray-600 mt-1">{{ 'attendance.lastWeek' | translate }}</div>
                </div>
              </div>
            </div>

            <!-- Month over Month -->
            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                {{ 'attendance.monthOverMonth' | translate }}
              </h3>
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-3xl font-bold text-gray-900">{{ data.comparisons.monthOverMonth.thisMonth }}%</div>
                  <div class="text-sm text-gray-600 mt-1">{{ 'attendance.thisMonth' | translate }}</div>
                </div>
                <div class="text-center px-4">
                  <div class="flex items-center gap-1 text-2xl font-bold"
                       [class.text-green-600]="data.comparisons.monthOverMonth.change > 0"
                       [class.text-red-600]="data.comparisons.monthOverMonth.change < 0"
                       [class.text-gray-600]="data.comparisons.monthOverMonth.change === 0">
                    <svg *ngIf="data.comparisons.monthOverMonth.change > 0" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <svg *ngIf="data.comparisons.monthOverMonth.change < 0" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    <span>{{ data.comparisons.monthOverMonth.change > 0 ? '+' : '' }}{{ data.comparisons.monthOverMonth.change }}%</span>
                  </div>
                  <div class="text-xs text-gray-500 mt-1">{{ 'attendance.vsLastMonth' | translate }}</div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-semibold text-gray-600">{{ data.comparisons.monthOverMonth.lastMonth }}%</div>
                  <div class="text-sm text-gray-600 mt-1">{{ 'attendance.lastMonth' | translate }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Attendance Trends Chart (Simple Bar Chart) -->
          <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
            <h3 class="text-lg font-semibold text-gray-900 mb-6">{{ 'attendance.dayAttendanceTrend' | translate: {days: 7} }}</h3>
            <div class="flex items-end justify-between gap-2 h-64">
              <div *ngFor="let day of data.trends" class="flex-1 flex flex-col items-center">
                <div class="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-lg transition-all hover:from-purple-700 hover:to-indigo-600 relative group"
                     [style.height.%]="day.rate">
                  <div class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {{ day.rate }}% • {{ day.students }} {{ 'common.students' | translate }}
                  </div>
                </div>
                <div class="text-xs text-gray-600 mt-2 text-center">
                  {{ formatTrendDate(day.date) }}
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Top Performing Groups -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div class="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                  {{ 'attendance.topPerformingGroups' | translate }}
                </h3>
                <p class="text-sm text-gray-600 mt-1">{{ 'attendance.bestAttendanceRates' | translate }}</p>
              </div>
              <div class="p-6">
                <div *ngIf="data.topGroups.length === 0" class="text-center py-8 text-gray-500">
                  {{ 'attendance.noDataAvailable' | translate }}
                </div>
                <div *ngIf="data.topGroups.length > 0" class="space-y-3">
                  <div *ngFor="let group of data.topGroups; let i = index" 
                       class="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-100 hover:shadow-md transition-all">
                    <div class="flex items-center gap-3">
                      <div class="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-sm">
                        {{ i + 1 }}
                      </div>
                      <div>
                        <div class="font-medium text-gray-900">{{ group.group?.name || 'N/A' }}</div>
                        <div class="text-xs text-gray-500">{{ group.totalRecords }} {{ 'attendance.records' | translate }}</div>
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-bold text-green-600">{{ group.rate }}%</div>
                      <div class="text-xs text-gray-500">{{ group.presentCount }}/{{ group.totalRecords }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Students At Risk -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div class="px-6 py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                  {{ 'attendance.studentsAtRisk' | translate }}
                </h3>
                <p class="text-sm text-gray-600 mt-1">{{ 'attendance.rateBelow70' | translate }}</p>
              </div>
              <div class="p-6">
                <div *ngIf="data.studentsAtRisk.length === 0" class="text-center py-8 text-gray-500">
                  <svg class="w-16 h-16 mx-auto text-green-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <p class="text-green-600 font-medium">{{ 'attendance.allStudentsDoingGreat' | translate }}</p>
                </div>
                <div *ngIf="data.studentsAtRisk.length > 0" class="space-y-3">
                  <div *ngFor="let student of data.studentsAtRisk" 
                       class="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-white rounded-lg border border-red-100 hover:shadow-md transition-all">
                    <div>
                      <div class="font-medium text-gray-900">{{ student.student?.fullName || 'N/A' }}</div>
                      <div class="text-xs text-gray-500">
                        {{ student.presentCount }} {{ 'attendance.present' | translate }} • {{ student.absentCount }} {{ 'attendance.absent' | translate }}
                      </div>
                    </div>
                    <div class="text-right">
                      <div class="text-2xl font-bold text-red-600">{{ student.rate }}%</div>
                      <div class="text-xs text-gray-500">{{ student.totalRecords }} {{ 'attendance.sessions' | translate }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Today's Pending Sessions -->
          <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div class="px-6 py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ 'attendance.todaysPendingSessions' | translate }}
              </h3>
              <p class="text-sm text-gray-600 mt-1">{{ 'attendance.sessionsScheduledToday' | translate }}</p>
            </div>
            <div class="p-6">
              <div *ngIf="data.todaysPending.length === 0" class="text-center py-8 text-gray-500">
                {{ 'attendance.noPendingSessionsToday' | translate }}
              </div>
              <div *ngIf="data.todaysPending.length > 0" class="space-y-3">
                <div *ngFor="let session of data.todaysPending"
                     class="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-white rounded-lg border border-yellow-100 hover:shadow-md transition-all">
                  <div class="flex-1">
                    <div class="font-medium text-gray-900">{{ session.group?.name || 'N/A' }}</div>
                    <div class="text-sm text-gray-600 mt-1">
                      {{ session.subject?.name }} • {{ session.teacher?.fullName }}
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                      {{ session.code }} • {{ session.studentCount }} {{ 'common.students' | translate }}
                    </div>
                  </div>
                  <button 
                    (click)="markAttendance(session._id)"
                    class="px-4 py-2 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-all">
                    {{ 'attendance.markAttendance' | translate }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AttendanceDashboardComponent implements OnInit {
  data: any = null;
  isLoading = false;
  error = '';
  
  // Role-based properties
  currentUser: User | null = null;

  constructor(
    private attendanceService: AttendanceService,
    private toastService: ToastService,
    private router: Router,
    private authService: AuthService,
    public permissionService: PermissionService,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    // Subscribe to current user for role-based permissions
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadDashboard(); // Reload when user changes
    });
  }

  loadDashboard() {
    this.isLoading = true;
    this.error = '';

    this.attendanceService.getDashboardStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.data = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.error = error.error?.message || 'Failed to load dashboard statistics';
        this.isLoading = false;
        this.toastService.error(this.error);
      }
    });
  }

  refresh() {
    this.loadDashboard();
    this.toastService.success(this.translate.instant('attendance.dashboardRefreshed'));
  }

  formatTrendDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
  }

  markAttendance(sessionId?: string) {
    if (sessionId) {
      this.router.navigate(['/dashboard/attendance', sessionId, 'edit']);
    } else {
      this.router.navigate(['/dashboard/attendance/mark']);
    }
  }

  // PERMISSION GETTERS (using PermissionService)
  get canMarkAttendance(): boolean {
    return this.permissionService.canMarkAttendance();
  }

  get canViewSystemStats(): boolean {
    // Admin can see system-wide stats, teacher sees their groups, student sees own stats
    return true; // All roles have access, but data is filtered by backend
  }
}

