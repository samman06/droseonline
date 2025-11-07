import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AttendanceService, Attendance } from '../../services/attendance.service';
import { GroupService } from '../../services/group.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { AuthService, User } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-attendance-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-indigo-50/20 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        
        <!-- Header -->
        <div class="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 rounded-2xl shadow-2xl p-8 mb-8 overflow-hidden">
          <div class="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-white opacity-5 rounded-full"></div>
          <div class="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white opacity-5 rounded-full"></div>
          
          <div class="relative z-10">
            <h1 class="text-4xl font-bold text-white mb-2">
              {{ currentUser?.role === 'student' ? ('📋 ' + ('attendance.myAttendance' | translate)) : ('📋 ' + ('attendance.attendanceManagement' | translate)) }}
            </h1>
            <p class="text-purple-100 text-lg">
              {{ currentUser?.role === 'student' ? ('attendance.viewRecordsSchedule' | translate) : ('attendance.trackManageAttendance' | translate) }}
            </p>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-4 px-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
              <!-- Student Tabs -->
              <ng-container *ngIf="currentUser?.role === 'student'">
                <button
                  *ngFor="let tab of studentTabs"
                  (click)="switchTab(tab.id)"
                  [class]="activeTab === tab.id 
                    ? 'border-purple-500 text-purple-600 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-all'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-all'"
                >
                  <span class="text-lg">{{ tab.icon }}</span>
                  <span>{{ tab.label }}</span>
                </button>
              </ng-container>

              <!-- Teacher/Admin Tabs -->
              <ng-container *ngIf="currentUser?.role === 'teacher' || currentUser?.role === 'admin'">
                <button
                  *ngFor="let tab of teacherTabs"
                  (click)="switchTab(tab.id)"
                  [class]="activeTab === tab.id 
                    ? 'border-purple-500 text-purple-600 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-all'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-all'"
                >
                  <span class="text-lg">{{ tab.icon }}</span>
                  <span>{{ tab.label }}</span>
                </button>
              </ng-container>
            </nav>
          </div>
        </div>

        <!-- Tab Content with Fade Transition -->
        <div class="transition-all duration-300" 
             [class.opacity-0]="isTransitioning" 
             [class.opacity-100]="!isTransitioning"
             [class.transform]="isTransitioning"
             [class.scale-95]="isTransitioning">
          
          <!-- ========================================== -->
          <!-- STUDENT TAB 1: My Attendance Records -->
          <!-- ========================================== -->
          <div *ngIf="activeTab === 'records' && currentUser?.role === 'student'">
            
            <!-- Statistics Cards -->
            <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                <p class="text-gray-500 text-xs font-medium">{{ 'attendance.totalSessions' | translate }}</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ studentStats.total || 0 }}</p>
              </div>
              <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                <p class="text-gray-500 text-xs font-medium">{{ 'attendance.present' | translate }}</p>
                <p class="text-2xl font-bold text-green-600 mt-1">{{ studentStats.present || 0 }}</p>
              </div>
              <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-red-500 hover:shadow-xl transition-shadow">
                <p class="text-gray-500 text-xs font-medium">{{ 'attendance.absent' | translate }}</p>
                <p class="text-2xl font-bold text-red-600 mt-1">{{ studentStats.absent || 0 }}</p>
              </div>
              <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
                <p class="text-gray-500 text-xs font-medium">{{ 'attendance.late' | translate }}</p>
                <p class="text-2xl font-bold text-yellow-600 mt-1">{{ studentStats.late || 0 }}</p>
              </div>
              <div class="bg-white rounded-xl shadow-lg p-4 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
                <p class="text-gray-500 text-xs font-medium">{{ 'attendance.attendanceRate' | translate }}</p>
                <p class="text-2xl font-bold text-purple-600 mt-1">{{ studentStats.rate || 0 }}%</p>
              </div>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                </svg>
                {{ 'common.filter' | translate }}
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'groups.group' | translate }}</label>
                  <select 
                    [(ngModel)]="recordsFilters.groupId"
                    (change)="loadStudentRecords()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">{{ 'groups.allGroups' | translate }}</option>
                    <option *ngFor="let group of studentGroups" [value]="group._id">{{ group.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'attendance.status' | translate }}</label>
                  <select 
                    [(ngModel)]="recordsFilters.status"
                    (change)="loadStudentRecords()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">{{ 'attendance.allStatus' | translate }}</option>
                    <option value="present">{{ 'attendance.present' | translate }}</option>
                    <option value="absent">{{ 'attendance.absent' | translate }}</option>
                    <option value="late">{{ 'attendance.late' | translate }}</option>
                    <option value="excused">{{ 'attendance.excused' | translate }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'attendance.fromDate' | translate }}</label>
                  <input 
                    type="date"
                    [(ngModel)]="recordsFilters.dateFrom"
                    (change)="loadStudentRecords()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'attendance.toDate' | translate }}</label>
                  <input 
                    type="date"
                    [(ngModel)]="recordsFilters.dateTo"
                    (change)="loadStudentRecords()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                </div>
              </div>
            </div>

            <!-- Records List -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-900">{{ 'attendance.attendanceRecords' | translate }}</h3>
                <span class="text-sm text-gray-500">{{ studentRecords.length }} {{ 'attendance.records' | translate }}</span>
              </div>
              
              <div *ngIf="isLoadingRecords" class="p-6">
                <div class="animate-pulse space-y-4">
                  <div *ngFor="let i of [1,2,3]" class="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              </div>

              <div *ngIf="!isLoadingRecords && studentRecords.length === 0" class="p-12 text-center">
                <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-gray-500 text-lg font-medium">{{ 'attendance.noRecordsFound' | translate }}</p>
                <p class="text-gray-400 text-sm mt-2">{{ 'attendance.tryAdjustingFilters' | translate }}</p>
              </div>

              <div *ngIf="!isLoadingRecords && studentRecords.length > 0" class="divide-y divide-gray-200">
                <div *ngFor="let record of studentRecords" class="p-6 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <h4 class="text-lg font-semibold text-gray-900">{{ record.group?.name || 'N/A' }}</h4>
                      <p class="text-sm text-gray-500 mt-1">{{ record.group?.course?.subject?.name || 'N/A' }}</p>
                      <div class="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          {{ formatDate(record.sessionDate) }}
                        </span>
                      </div>
                      <p *ngIf="record.notes" class="text-sm text-gray-600 mt-2 italic bg-gray-50 px-3 py-2 rounded-lg">
                        "{{ record.notes }}"
                      </p>
                    </div>
                    <div class="text-right ml-4">
                      <span 
                        class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
                        [ngClass]="{
                          'bg-green-100 text-green-800': record.status === 'present',
                          'bg-red-100 text-red-800': record.status === 'absent',
                          'bg-yellow-100 text-yellow-800': record.status === 'late',
                          'bg-blue-100 text-blue-800': record.status === 'excused'
                        }"
                      >
                        {{ record.status | uppercase }}
                      </span>
                      <p *ngIf="record.status === 'late' && record.minutesLate" class="text-sm text-gray-500 mt-2">
                        {{ record.minutesLate }} {{ 'attendance.minLate' | translate }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- ========================================== -->
          <!-- STUDENT TAB 2: My Schedule -->
          <!-- ========================================== -->
          <div *ngIf="activeTab === 'schedule' && currentUser?.role === 'student'">
            
            <div class="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h2 class="text-2xl font-bold mb-2">📅 {{ 'attendance.weeklySchedule' | translate }}</h2>
              <p class="text-indigo-100">{{ 'attendance.completeScheduleDesc' | translate }}</p>
            </div>

            <div *ngIf="isLoadingSchedule" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div *ngFor="let i of [1,2,3,4,5,6,7]" class="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div class="space-y-3">
                  <div class="h-20 bg-gray-200 rounded"></div>
                  <div class="h-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            <!-- Empty state when no classes scheduled -->
            <div *ngIf="!isLoadingSchedule && getDaysWithClasses().length === 0" class="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ 'attendance.noClassesScheduled' | translate }}</h3>
              <p class="text-gray-500">{{ 'attendance.noClassesThisWeek' | translate }}</p>
            </div>

            <!-- Show only days with classes -->
            <div *ngIf="!isLoadingSchedule && getDaysWithClasses().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div *ngFor="let day of getDaysWithClasses(); let i = index" class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div class="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                  <h3 class="text-lg font-bold text-white capitalize">{{ day }}</h3>
                  <span class="bg-white/20 px-3 py-1 rounded-full text-white text-sm">
                    {{ studentSchedule[day]?.length || 0 }} session(s)
                  </span>
                </div>
                
                <div class="p-6">
                  <div class="space-y-3">
                    <div 
                      *ngFor="let session of studentSchedule[day]"
                      class="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 transition-all hover:shadow-md"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h4 class="font-semibold text-gray-900 mb-1">{{ session.subject }}</h4>
                          <p class="text-sm text-gray-600">{{ session.groupName }}</p>
                          <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            {{ session.teacher }}
                          </p>
                        </div>
                        <div class="text-right ml-3">
                          <p class="text-sm font-medium text-purple-600">{{ session.startTime }}</p>
                          <p class="text-xs text-gray-500">to</p>
                          <p class="text-sm font-medium text-purple-600">{{ session.endTime }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- ========================================== -->
          <!-- STUDENT TAB 3: Today's Sessions -->
          <!-- ========================================== -->
          <div *ngIf="activeTab === 'today' && currentUser?.role === 'student'">
            
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-6">
              <h2 class="text-2xl font-bold mb-2">⏰ Today's Schedule</h2>
              <p class="text-indigo-100">{{ getCurrentDate() }}</p>
              <p class="text-indigo-200 text-sm mt-2">{{ studentTodaySessions.length }} session(s) scheduled</p>
            </div>

            <div *ngIf="isLoadingToday" class="space-y-4">
              <div *ngFor="let i of [1,2,3]" class="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>

            <div *ngIf="!isLoadingToday && studentTodaySessions.length === 0" class="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">No Sessions Today</h3>
              <p class="text-gray-500">You have no scheduled sessions for today. Enjoy your free time! 🎉</p>
            </div>

            <div *ngIf="!isLoadingToday && studentTodaySessions.length > 0" class="space-y-4">
              <div 
                *ngFor="let session of studentTodaySessions; let i = index"
                class="bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all"
                [ngClass]="{
                  'border-green-500': session.attendanceStatus === 'present',
                  'border-red-500': session.attendanceStatus === 'absent',
                  'border-yellow-500': session.attendanceStatus === 'late',
                  'border-blue-500': session.attendanceStatus === 'excused',
                  'border-gray-300': session.attendanceStatus === 'pending'
                }"
              >
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <div class="flex items-center gap-3">
                      <span class="text-2xl font-bold text-gray-300">#{{ i + 1 }}</span>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">{{ session.subject }}</h3>
                        <p class="text-gray-600 mt-1">{{ session.groupName }} <span class="text-gray-400">• {{ session.groupCode }}</span></p>
                      </div>
                    </div>
                  </div>
                  <span 
                    class="px-4 py-2 rounded-full text-sm font-medium"
                    [ngClass]="{
                      'bg-green-100 text-green-800': session.attendanceStatus === 'present',
                      'bg-red-100 text-red-800': session.attendanceStatus === 'absent',
                      'bg-yellow-100 text-yellow-800': session.attendanceStatus === 'late',
                      'bg-blue-100 text-blue-800': session.attendanceStatus === 'excused',
                      'bg-gray-100 text-gray-800': session.attendanceStatus === 'pending'
                    }"
                  >
                    {{ session.attendanceStatus === 'pending' ? 'NOT MARKED' : session.attendanceStatus | uppercase }}
                  </span>
                </div>
                
                <div class="flex items-center gap-6 text-sm text-gray-600">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span class="font-medium">{{ session.teacher }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="font-medium">{{ session.startTime }} - {{ session.endTime }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- ========================================== -->
          <!-- TEACHER TAB 1: Mark Attendance (Existing Logic) -->
          <!-- ========================================== -->
          <div *ngIf="activeTab === 'mark' && (currentUser?.role === 'teacher' || currentUser?.role === 'admin')">
            
            <!-- Quick Actions -->
            <div class="flex gap-3 mb-6">
              <button 
                *ngIf="canViewReports"
                (click)="goToDashboard()"
                class="px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Dashboard
              </button>
              <button 
                *ngIf="canExport"
                (click)="exportData()"
                class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Export
              </button>
              <button 
                *ngIf="canMarkAttendance"
                (click)="showPendingGroups()"
                class="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-medium rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Pending Today
                <span class="bg-white text-orange-600 px-2 py-1 rounded-full text-xs font-semibold">{{ pendingCount }}</span>
              </button>
            </div>

            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 text-sm font-medium">Total Sessions</p>
                    <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.totalSessions || 0 }}</p>
                  </div>
                  <div class="bg-purple-100 rounded-full p-3">
                    <svg class="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 text-sm font-medium">Overall Rate</p>
                    <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.overallRate || 0 }}%</p>
                  </div>
                  <div class="bg-green-100 rounded-full p-3">
                    <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 text-sm font-medium">Completed</p>
                    <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.completedSessions || 0 }}</p>
                  </div>
                  <div class="bg-blue-100 rounded-full p-3">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-500 text-sm font-medium">Pending</p>
                    <p class="text-3xl font-bold text-gray-900 mt-2">{{ stats.pendingSessions || 0 }}</p>
                  </div>
                  <div class="bg-orange-100 rounded-full p-3">
                    <svg class="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Filters for Teachers -->
            <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                  </svg>
                  Filters
                </h3>
                <button 
                  *ngIf="hasActiveFilters()"
                  (click)="clearAllFilters()"
                  class="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Clear All
                </button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input 
                    type="text"
                    [(ngModel)]="filters.search"
                    (ngModelChange)="onSearchChange()"
                    placeholder="Search code, group..."
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Group</label>
                  <select 
                    [(ngModel)]="filters.groupId"
                    (change)="applyFilters()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">All Groups</option>
                    <option *ngFor="let group of groups" [value]="group._id">{{ group.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select 
                    [(ngModel)]="filters.isCompleted"
                    (change)="applyFilters()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">All Status</option>
                    <option value="true">Completed</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input 
                    type="date"
                    [(ngModel)]="filters.dateFrom"
                    (change)="applyFilters()"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                </div>
              </div>

              <!-- Active Filters Tags -->
              <div *ngIf="hasActiveFilters()" class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                <span *ngIf="filters.search" class="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  Search: "{{ filters.search }}"
                  <button (click)="removeFilter('search')" class="hover:text-purple-900">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
                <span *ngIf="filters.groupId" class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  Group Filter
                  <button (click)="removeFilter('groupId')" class="hover:text-blue-900">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
                <span *ngIf="filters.isCompleted" class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {{ 'attendance.status' | translate }}: {{ filters.isCompleted === 'true' ? ('attendance.completed' | translate) : ('attendance.pending' | translate) }}
                  <button (click)="removeFilter('isCompleted')" class="hover:text-green-900">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                </span>
              </div>
            </div>

            <!-- Attendance List -->
            <div class="bg-white rounded-xl shadow-lg overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900">{{ 'attendance.attendanceSessions' | translate }}</h3>
              </div>
              
              <div *ngIf="loading" class="p-6">
                <div class="animate-pulse space-y-4">
                  <div *ngFor="let i of [1,2,3,4,5]" class="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              </div>

              <div *ngIf="!loading && attendances.length === 0" class="p-12 text-center">
                <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ 'attendance.noAttendanceRecords' | translate }}</h3>
                <p class="text-gray-500 mb-4">{{ 'attendance.noSessionsMatchingFilters' | translate }}</p>
                <button 
                  *ngIf="canMarkAttendance"
                  (click)="router.navigate(['/dashboard/attendance/mark'])"
                  class="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {{ 'attendance.markAttendance' | translate }}
                </button>
              </div>

              <div *ngIf="!loading && attendances.length > 0" class="divide-y divide-gray-200">
                <div *ngFor="let attendance of attendances" class="p-6 hover:bg-gray-50 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <h4 class="text-lg font-semibold text-gray-900">{{ attendance.group?.name || 'N/A' }}</h4>
                        <span class="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          {{ attendance.code }}
                        </span>
                        <span 
                          class="px-3 py-1 rounded-full text-xs font-medium"
                          [ngClass]="{
                            'bg-green-100 text-green-800': attendance.isCompleted,
                            'bg-orange-100 text-orange-800': !attendance.isCompleted
                          }"
                        >
                          {{ attendance.isCompleted ? 'Completed' : 'Pending' }}
                        </span>
                      </div>
                      <div class="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                          </svg>
                          {{ formatDate(attendance.session.date) }}
                        </span>
                        <span class="flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                          </svg>
                          {{ attendance.records.length || 0 }} students
                        </span>
                      </div>
                      <div *ngIf="attendance.stats" class="flex items-center gap-4 text-sm">
                        <span class="text-green-600 font-medium">
                          ✓ {{ attendance.stats.present }} Present
                        </span>
                        <span class="text-red-600 font-medium">
                          ✗ {{ attendance.stats.absent }} Absent
                        </span>
                        <span class="text-yellow-600 font-medium">
                          ⏱ {{ attendance.stats.late }} Late
                        </span>
                        <span class="text-gray-600">
                          Rate: <span class="font-semibold">{{ attendance.stats.rate }}%</span>
                        </span>
                        <span *ngIf="attendance.sessionRevenue && attendance.sessionRevenue > 0" class="text-emerald-600 font-medium flex items-center gap-1">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                          </svg>
                          {{ attendance.sessionRevenue }} EGP
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 ml-4">
                      <button 
                        (click)="viewAttendance(attendance._id)"
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                      <button 
                        *ngIf="canEditAttendance"
                        (click)="editAttendance(attendance._id)"
                        class="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button 
                        *ngIf="canDeleteAttendance"
                        (click)="deleteAttendance(attendance._id)"
                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div *ngIf="!loading && totalPages > 1" class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div class="text-sm text-gray-600">
                  Showing {{ ((currentPage - 1) * filters.limit) + 1 }} to {{ Math.min(currentPage * filters.limit, totalAttendances) }} of {{ totalAttendances }} results
                </div>
                <div class="flex gap-2">
                  <button 
                    (click)="previousPage()"
                    [disabled]="currentPage === 1"
                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button 
                    *ngFor="let page of getPageNumbers()"
                    (click)="goToPage(page)"
                    [class]="page === currentPage 
                      ? 'px-4 py-2 bg-purple-600 text-white rounded-lg font-medium'
                      : 'px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'"
                  >
                    {{ page }}
                  </button>
                  <button 
                    (click)="nextPage()"
                    [disabled]="currentPage === totalPages"
                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- ========================================== -->
          <!-- TEACHER TAB 2: My Teaching Schedule -->
          <!-- ========================================== -->
          <div *ngIf="activeTab === 'teaching-schedule' && (currentUser?.role === 'teacher' || currentUser?.role === 'admin')">
            
            <div class="mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h2 class="text-2xl font-bold mb-2">📅 My Teaching Schedule</h2>
              <p class="text-indigo-100">Complete schedule of all your teaching sessions</p>
            </div>

            <div *ngIf="isLoadingTeachingSchedule" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div *ngFor="let i of [1,2,3,4,5,6,7]" class="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div class="space-y-3">
                  <div class="h-24 bg-gray-200 rounded"></div>
                  <div class="h-24 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>

            <!-- Empty state when no teaching sessions scheduled -->
            <div *ngIf="!isLoadingTeachingSchedule && getTeacherDaysWithClasses().length === 0" class="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">No Teaching Sessions Scheduled</h3>
              <p class="text-gray-500">You don't have any teaching sessions scheduled this week.</p>
            </div>

            <!-- Show only days with teaching sessions -->
            <div *ngIf="!isLoadingTeachingSchedule && getTeacherDaysWithClasses().length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div *ngFor="let day of getTeacherDaysWithClasses(); let i = index" class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div class="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                  <h3 class="text-lg font-bold text-white capitalize">{{ day }}</h3>
                  <span class="bg-white/20 px-3 py-1 rounded-full text-white text-sm">
                    {{ teacherSchedule[day]?.length || 0 }} session(s)
                  </span>
                </div>
                
                <div class="p-6">
                  <div class="space-y-3">
                    <div 
                      *ngFor="let session of teacherSchedule[day]"
                      class="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 transition-all hover:shadow-md group"
                    >
                      <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                          <h4 class="font-semibold text-gray-900 mb-1">{{ session.subject }}</h4>
                          <p class="text-sm text-gray-600">{{ session.groupName }} <span class="text-gray-400">• {{ session.groupCode }}</span></p>
                          <p class="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                            {{ session.studentsCount }} students
                          </p>
                        </div>
                        <div class="text-right ml-3">
                          <p class="text-sm font-medium text-indigo-600">{{ session.startTime }}</p>
                          <p class="text-xs text-gray-500">to</p>
                          <p class="text-sm font-medium text-indigo-600">{{ session.endTime }}</p>
                        </div>
                      </div>
                      <button 
                        (click)="quickMarkAttendance(session.groupId)"
                        class="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium opacity-0 group-hover:opacity-100"
                      >
                        Quick Mark Attendance
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- ========================================== -->
          <!-- TEACHER TAB 3: Today's Teaching Sessions -->
          <!-- ========================================== -->
          <div *ngIf="activeTab === 'teaching-today' && (currentUser?.role === 'teacher' || currentUser?.role === 'admin')">
            
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-6">
              <h2 class="text-2xl font-bold mb-2">⏰ Today's Teaching Sessions</h2>
              <p class="text-indigo-100">{{ getCurrentDate() }}</p>
              <p class="text-indigo-200 text-sm mt-2">
                {{ teacherTodaySessions.length }} session(s) scheduled • 
                {{ getPendingCount(teacherTodaySessions) }} pending
              </p>
            </div>

            <div *ngIf="isLoadingTeachingToday" class="space-y-4">
              <div *ngFor="let i of [1,2,3]" class="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                <div class="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div class="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>

            <div *ngIf="!isLoadingTeachingToday && teacherTodaySessions.length === 0" class="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg class="w-20 h-20 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">No Teaching Sessions Today</h3>
              <p class="text-gray-500">You have no scheduled teaching sessions for today. Enjoy your day! ☕</p>
            </div>

            <div *ngIf="!isLoadingTeachingToday && teacherTodaySessions.length > 0" class="space-y-4">
              <div 
                *ngFor="let session of teacherTodaySessions; let i = index"
                class="bg-white rounded-xl shadow-lg p-6 border-l-4 hover:shadow-xl transition-all"
                [ngClass]="{
                  'border-green-500': session.attendanceStatus === 'completed',
                  'border-orange-500': session.attendanceStatus === 'in_progress',
                  'border-gray-300': session.attendanceStatus === 'pending'
                }"
              >
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <div class="flex items-center gap-3">
                      <span class="text-2xl font-bold text-gray-300">#{{ i + 1 }}</span>
                      <div>
                        <h3 class="text-xl font-bold text-gray-900">{{ session.subject }}</h3>
                        <p class="text-gray-600 mt-1">{{ session.groupName }} <span class="text-gray-400">• {{ session.groupCode }}</span></p>
                      </div>
                    </div>
                  </div>
                  <span 
                    class="px-4 py-2 rounded-full text-sm font-medium"
                    [ngClass]="{
                      'bg-green-100 text-green-800': session.attendanceStatus === 'completed',
                      'bg-orange-100 text-orange-800': session.attendanceStatus === 'in_progress',
                      'bg-gray-100 text-gray-800': session.attendanceStatus === 'pending'
                    }"
                  >
                    {{ session.attendanceStatus === 'pending' ? 'NOT MARKED' : 
                       session.attendanceStatus === 'in_progress' ? 'IN PROGRESS' : 'COMPLETED' }}
                  </span>
                </div>
                
                <div class="flex items-center gap-6 text-sm text-gray-600 mb-4">
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="font-medium">{{ session.startTime }} - {{ session.endTime }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                    </svg>
                    <span class="font-medium">{{ session.studentsCount }} students</span>
                  </div>
                  <div *ngIf="session.attendanceStatus !== 'pending'" class="flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="font-medium">{{ session.recordedStudents }} recorded</span>
                  </div>
                </div>

                <div class="flex gap-3">
                  <button 
                    *ngIf="session.attendanceStatus === 'pending'"
                    (click)="quickMarkAttendance(session.groupId)"
                    class="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                    </svg>
                    {{ 'attendance.markAttendance' | translate }}
                  </button>
                  <button 
                    *ngIf="session.attendanceStatus !== 'pending'"
                    (click)="viewAttendance(session.attendanceId)"
                    class="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    {{ 'common.details' | translate }}
                  </button>
                  <button 
                    *ngIf="session.attendanceStatus === 'in_progress'"
                    (click)="editAttendance(session.attendanceId)"
                    class="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    {{ 'common.edit' | translate }}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Scrollbar hide for mobile tabs */
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }

    /* Tab transitions */
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Smooth tab content animation */
    .transition-all {
      transition: all 0.3s ease-in-out;
    }
  `]
})
export class AttendanceListComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: string = 'records';
  isTransitioning: boolean = false;
  Math = Math; // Expose Math to template

  // Tab definitions
  studentTabs = [
    { id: 'records', label: 'My Attendance', icon: '📋' },
    { id: 'schedule', label: 'My Schedule', icon: '📅' },
    { id: 'today', label: 'Today', icon: '⏰' }
  ];

  teacherTabs = [
    { id: 'mark', label: 'Mark Attendance', icon: '✓' },
    { id: 'teaching-schedule', label: 'My Schedule', icon: '📅' },
    { id: 'teaching-today', label: 'Today', icon: '⏰' }
  ];

  daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  // Student data
  studentRecords: any[] = [];
  studentStats: any = {};
  studentGroups: any[] = [];
  studentSchedule: any = {};
  studentTodaySessions: any[] = [];
  recordsFilters: any = { page: 1, limit: 20, groupId: '', status: '', dateFrom: '', dateTo: '' };
  isLoadingRecords: boolean = false;
  isLoadingSchedule: boolean = false;
  isLoadingToday: boolean = false;

  // Teacher data (existing logic)
  attendances: Attendance[] = [];
  groups: any[] = [];
  teachers: any[] = [];
  subjects: any[] = [];
  loading: boolean = false;
  stats: any = {};
  pendingCount: number = 0;
  teacherSchedule: any = {};
  teacherTodaySessions: any[] = [];
  isLoadingTeachingSchedule: boolean = false;
  isLoadingTeachingToday: boolean = false;

  // Pagination
  currentPage: number = 1;
  totalPages: number = 1;
  totalAttendances: number = 0;

  // Filters
  filters: any = {
    search: '',
    groupId: '',
    teacherId: '',
    subjectId: '',
    isCompleted: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10
  };

  private searchTimeout: any;

  constructor(
    private attendanceService: AttendanceService,
    private groupService: GroupService,
    private teacherService: TeacherService,
    private subjectService: SubjectService,
    private authService: AuthService,
    public router: Router,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private permissionService: PermissionService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    
    // Set default tab based on role
    if (this.currentUser?.role === 'student') {
      this.activeTab = 'records';
    } else {
      this.activeTab = 'mark';
      // Load groups for teachers
      this.loadGroups();
    }

    // Load initial tab data
    this.loadTabData();
  }

  switchTab(tabId: string): void {
    if (this.activeTab === tabId) return;
    
    this.isTransitioning = true;
    this.activeTab = tabId;
    
    // Smooth transition
    setTimeout(() => {
      this.loadTabData();
      this.isTransitioning = false;
    }, 150);
  }

  loadTabData(): void {
    switch (this.activeTab) {
      // Student tabs
      case 'records':
        this.loadStudentRecords();
        break;
      case 'schedule':
        this.loadStudentSchedule();
        break;
      case 'today':
        this.loadStudentTodaySessions();
        break;
      
      // Teacher tabs
      case 'mark':
        this.loadAttendances();
        this.loadStats();
        break;
      case 'teaching-schedule':
        this.loadTeacherSchedule();
        break;
      case 'teaching-today':
        this.loadTeacherTodaySessions();
        break;
    }
  }

  // ==========================================
  // STUDENT TAB DATA LOADING
  // ==========================================

  loadStudentRecords(): void {
    this.isLoadingRecords = true;
    
    // Clean up filters (remove empty strings)
    const cleanFilters = Object.keys(this.recordsFilters).reduce((acc: any, key) => {
      if (this.recordsFilters[key] !== '') {
        acc[key] = this.recordsFilters[key];
      }
      return acc;
    }, {});

    this.attendanceService.getMyAttendanceRecords(cleanFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.studentRecords = response.data.records || [];
          this.studentStats = response.data.stats || {};
        }
        this.isLoadingRecords = false;
      },
      error: (error) => {
        console.error('Error loading student records:', error);
        this.toastService.error(this.translate.instant('attendance.failedToLoadRecords'));
        this.isLoadingRecords = false;
      }
    });

    // Load groups for filter (once)
    if (this.studentGroups.length === 0) {
      this.groupService.getGroups({ limit: 100 }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.studentGroups = response.data.groups || [];
          }
        },
        error: (error) => console.error('Error loading groups:', error)
      });
    }
  }

  loadStudentSchedule(): void {
    this.isLoadingSchedule = true;
    this.attendanceService.getMySchedule().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.studentSchedule = response.data.schedule || {};
        }
        this.isLoadingSchedule = false;
      },
      error: (error) => {
        console.error('Error loading student schedule:', error);
        this.toastService.error(this.translate.instant('attendance.failedToLoadSchedule'));
        this.isLoadingSchedule = false;
      }
    });
  }

  // Get only days that have scheduled classes (for students)
  getDaysWithClasses(): string[] {
    return this.daysOfWeek.filter(day => 
      this.studentSchedule[day] && this.studentSchedule[day].length > 0
    );
  }

  // Get only days that have teaching sessions (for teachers)
  getTeacherDaysWithClasses(): string[] {
    return this.daysOfWeek.filter(day => 
      this.teacherSchedule[day] && this.teacherSchedule[day].length > 0
    );
  }

  loadStudentTodaySessions(): void {
    this.isLoadingToday = true;
    this.attendanceService.getTodaySessions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.studentTodaySessions = response.data.sessions || [];
        }
        this.isLoadingToday = false;
      },
      error: (error) => {
        console.error('Error loading today sessions:', error);
        this.toastService.error(this.translate.instant('attendance.failedToLoadTodaySessions'));
        this.isLoadingToday = false;
      }
    });
  }

  // ==========================================
  // TEACHER TAB DATA LOADING
  // ==========================================

  loadAttendances(): void {
    this.loading = true;
    this.attendanceService.getAttendances(this.filters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.attendances = response.data.attendances || [];
          // Handle pagination properties
          const pagination = response.data.pagination;
          this.currentPage = pagination?.page || 1;
          this.totalPages = pagination?.pages || 1;
          this.totalAttendances = pagination?.total || 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading attendances:', error);
        this.toastService.error(this.translate.instant('attendance.failedToLoadRecords'));
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    this.attendanceService.getDashboardStatistics().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Use dashboard statistics endpoint
          this.stats = {
            totalSessions: response.data.totalSessions || 0,
            completedSessions: response.data.completedSessions || 0,
            pendingSessions: response.data.pendingSessions || 0,
            overallRate: response.data.overallRate || 0
          };
          this.pendingCount = response.data.todaysPending?.length || 0;
        }
      },
      error: (error) => console.error('Error loading stats:', error)
    });
  }

  loadGroups(): void {
    this.groupService.getGroups({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.groups = response.data.groups || [];
        }
      },
      error: (error) => console.error('Error loading groups:', error)
    });
  }

  loadTeacherSchedule(): void {
    this.isLoadingTeachingSchedule = true;
    this.attendanceService.getMyTeachingSchedule().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teacherSchedule = response.data.schedule || {};
        }
        this.isLoadingTeachingSchedule = false;
      },
      error: (error) => {
        console.error('Error loading teaching schedule:', error);
        this.toastService.error(this.translate.instant('attendance.failedToLoadTeachingSchedule'));
        this.isLoadingTeachingSchedule = false;
      }
    });
  }

  loadTeacherTodaySessions(): void {
    this.isLoadingTeachingToday = true;
    this.attendanceService.getTodayTeachingSessions().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.teacherTodaySessions = response.data.sessions || [];
        }
        this.isLoadingTeachingToday = false;
      },
      error: (error) => {
        console.error('Error loading today teaching sessions:', error);
        this.toastService.error(this.translate.instant('attendance.failedToLoadTodaySessions'));
        this.isLoadingTeachingToday = false;
      }
    });
  }

  // ==========================================
  // EVENT HANDLERS & ACTIONS
  // ==========================================

  quickMarkAttendance(groupId: string | undefined): void {
    if (groupId) {
      this.router.navigate(['/dashboard/attendance/mark', groupId]);
    }
  }

  viewAttendance(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/dashboard/attendance', id]);
    }
  }

  editAttendance(id: string | undefined): void {
    if (id) {
      this.router.navigate(['/dashboard/attendance/edit', id]);
    }
  }

  onSearchChange(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.applyFilters();
    }, 500);
  }

  applyFilters(): void {
    this.filters.page = 1;
    this.loadAttendances();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.filters.search ||
      this.filters.groupId ||
      this.filters.teacherId ||
      this.filters.subjectId ||
      this.filters.isCompleted ||
      this.filters.dateFrom ||
      this.filters.dateTo
    );
  }

  removeFilter(filterName: keyof typeof this.filters): void {
    (this.filters as any)[filterName] = '';
    this.applyFilters();
  }

  clearAllFilters(): void {
    this.filters = {
      search: '',
      groupId: '',
      teacherId: '',
      subjectId: '',
      isCompleted: '',
      dateFrom: '',
      dateTo: '',
      page: 1,
      limit: 10
    };
    this.applyFilters();
  }

  deleteAttendance(id: string | undefined): void {
    if (!id) return;
    
    this.confirmationService.confirm({
      title: this.translate.instant('attendance.deleteAttendanceRecord'),
      message: this.translate.instant('attendance.deleteConfirmMessage'),
      confirmText: this.translate.instant('common.delete'),
      cancelText: this.translate.instant('common.cancel'),
      type: 'danger'
    }).then((confirmed) => {
      if (confirmed) {
        this.attendanceService.deleteAttendance(id).subscribe({
          next: () => {
            this.toastService.success(this.translate.instant('attendance.recordDeletedSuccessfully'));
            this.loadAttendances();
            this.loadStats();
          },
          error: (error) => {
            console.error('Error deleting attendance:', error);
            this.toastService.error(this.translate.instant('attendance.failedToDeleteRecord'));
          }
        });
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard/attendance/dashboard']);
  }

  showPendingGroups(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.filters = {
      ...this.filters,
      dateFrom: today.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      isCompleted: 'false'
    };
    
    this.loadAttendances();
    this.toastService.info(this.translate.instant('attendance.showingPendingSessions', { count: this.pendingCount }));
  }

  exportData(): void {
    const params = {
      ...this.filters,
      format: 'csv' as const
    };
    
    this.attendanceService.exportAttendance(params).subscribe({
      next: (blob: any) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success(this.translate.instant('attendance.exportedSuccessfully'));
      },
      error: (error) => {
        console.error('Error exporting data:', error);
        this.toastService.error(this.translate.instant('attendance.failedToExport'));
      }
    });
  }

  // Pagination
  previousPage(): void {
    if (this.currentPage > 1) {
      this.filters.page = this.currentPage - 1;
      this.loadAttendances();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.filters.page = this.currentPage + 1;
      this.loadAttendances();
    }
  }

  goToPage(page: number): void {
    this.filters.page = page;
    this.loadAttendances();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) {
          pages.push(i);
        }
      } else if (this.currentPage >= this.totalPages - 2) {
        for (let i = this.totalPages - maxVisible + 1; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }

  // Permission getters
  get canMarkAttendance(): boolean {
    return this.permissionService.canMarkAttendance();
  }

  get canExport(): boolean {
    return this.permissionService.canExportData();
  }

  get canViewReports(): boolean {
    return true;
  }

  get canEditAttendance(): boolean {
    return this.permissionService.isAdmin() || this.permissionService.isTeacher();
  }

  get canDeleteAttendance(): boolean {
    return this.permissionService.isAdmin();
  }

  // Utility methods
  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getPendingCount(sessions: any[]): number {
    return sessions.filter(s => s.attendanceStatus === 'pending').length;
  }
}

