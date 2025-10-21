import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../../services/group.service';
import { StudentService } from '../../services/student.service';
import { AttendanceService } from '../../services/attendance.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { ToastService } from '../../services/toast.service';
import { AuthService, User } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div class="max-w-7xl mx-auto p-6 space-y-6">
        <!-- Breadcrumb Navigation -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-3">
            <button (click)="goBack()" class="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-all shadow-sm">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
        </button>
            <div class="flex items-center space-x-2 text-sm">
              <span class="text-gray-500 hover:text-gray-700 cursor-pointer" (click)="goBack()">Groups</span>
              <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
              </svg>
              <span class="text-gray-900 font-semibold">{{ group?.name }}</span>
            </div>
      </div>

          <!-- Action Buttons - Admin/Teacher only -->
          <div *ngIf="canEdit || canDelete" class="flex items-center gap-2">
            <button *ngIf="canEdit" (click)="clone()" class="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md" title="Clone Group">
              <svg class="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              <span class="hidden sm:inline">Clone</span>
            </button>
            <button *ngIf="canEdit" (click)="edit()" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span class="hidden sm:inline">Edit</span>
            </button>
            <button *ngIf="canDelete" (click)="delete()" class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span class="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        <!-- Hero Card -->
        <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl overflow-hidden">
          <div class="p-8 text-white relative">
            <!-- Background Pattern -->
            <div class="absolute inset-0 opacity-10">
              <div class="absolute inset-0" style="background-image: url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
            </div>
            
            <div class="relative">
              <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div class="flex-1">
                  <div class="inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-20 backdrop-blur-sm text-sm font-semibold mb-3">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    {{ group?.gradeLevel }}
                  </div>
                  <h1 class="text-4xl font-black mb-2">{{ group?.name }}</h1>
                  <p class="text-indigo-100 font-mono text-lg mb-6">{{ group?.code }}</p>
                  
                  <!-- Course Info Row -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div class="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
                      <div class="p-2 bg-white bg-opacity-20 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <div class="overflow-hidden">
                        <div class="text-indigo-100 text-xs font-medium">Teacher</div>
                        <div class="font-semibold truncate">{{ group?.course?.teacher?.fullName || 'N/A' }}</div>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
                      <div class="p-2 bg-white bg-opacity-20 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                      </div>
                      <div class="overflow-hidden">
                        <div class="text-indigo-100 text-xs font-medium">Subject</div>
                        <div class="font-semibold truncate">{{ group?.course?.subject?.name || 'N/A' }}</div>
                      </div>
                    </div>
                    
                    <div class="flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-3">
                      <div class="p-2 bg-white bg-opacity-20 rounded-lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <div>
                        <div class="text-indigo-100 text-xs font-medium">Price/Session</div>
                        <div class="font-semibold">{{ group?.pricePerSession || 0 }} EGP</div>
                      </div>
                    </div>
        </div>
      </div>

                <!-- Quick Stats -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-3xl font-bold">{{ group?.students?.length || 0 }}</div>
                    <div class="text-indigo-100 text-sm font-medium mt-1">Students</div>
                  </div>
                  <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div class="text-3xl font-bold">{{ group?.assignmentStats?.total || 0 }}</div>
                    <div class="text-indigo-100 text-sm font-medium mt-1">Assignments</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="border-b border-gray-200">
            <nav class="flex -mb-px">
              <button 
                (click)="activeTab = 'overview'"
                [class.border-indigo-600]="activeTab === 'overview'"
                [class.text-indigo-600]="activeTab === 'overview'"
                [class.border-transparent]="activeTab !== 'overview'"
                [class.text-gray-500]="activeTab !== 'overview'"
                class="group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm hover:text-indigo-600 hover:border-indigo-300 transition-all">
                <svg class="w-5 h-5 mr-2" [class.text-indigo-600]="activeTab === 'overview'" [class.text-gray-400]="activeTab !== 'overview'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
                </svg>
                Overview
              </button>
              <button 
                *ngIf="showStudentsTab"
                (click)="activeTab = 'students'"
                [class.border-indigo-600]="activeTab === 'students'"
                [class.text-indigo-600]="activeTab === 'students'"
                [class.border-transparent]="activeTab !== 'students'"
                [class.text-gray-500]="activeTab !== 'students'"
                class="group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm hover:text-indigo-600 hover:border-indigo-300 transition-all">
                <svg class="w-5 h-5 mr-2" [class.text-indigo-600]="activeTab === 'students'" [class.text-gray-400]="activeTab !== 'students'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
                Students
                <span class="ml-2 py-0.5 px-2 rounded-full text-xs font-medium"
                      [class.bg-indigo-100]="activeTab === 'students'"
                      [class.text-indigo-600]="activeTab === 'students'"
                      [class.bg-gray-100]="activeTab !== 'students'"
                      [class.text-gray-600]="activeTab !== 'students'">
                  {{ group?.students?.length || 0 }}
                </span>
              </button>
              <button 
                (click)="activeTab = 'assignments'"
                [class.border-indigo-600]="activeTab === 'assignments'"
                [class.text-indigo-600]="activeTab === 'assignments'"
                [class.border-transparent]="activeTab !== 'assignments'"
                [class.text-gray-500]="activeTab !== 'assignments'"
                class="group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm hover:text-indigo-600 hover:border-indigo-300 transition-all">
                <svg class="w-5 h-5 mr-2" [class.text-indigo-600]="activeTab === 'assignments'" [class.text-gray-400]="activeTab !== 'assignments'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Assignments
                <span class="ml-2 py-0.5 px-2 rounded-full text-xs font-medium"
                      [class.bg-indigo-100]="activeTab === 'assignments'"
                      [class.text-indigo-600]="activeTab === 'assignments'"
                      [class.bg-gray-100]="activeTab !== 'assignments'"
                      [class.text-gray-600]="activeTab !== 'assignments'">
                  {{ group?.assignmentStats?.total || 0 }}
                </span>
              </button>
              <button 
                (click)="activeTab = 'attendance'; loadAttendanceData()"
                [class.border-indigo-600]="activeTab === 'attendance'"
                [class.text-indigo-600]="activeTab === 'attendance'"
                [class.border-transparent]="activeTab !== 'attendance'"
                [class.text-gray-500]="activeTab !== 'attendance'"
                class="group inline-flex items-center px-6 py-4 border-b-2 font-medium text-sm hover:text-indigo-600 hover:border-indigo-300 transition-all">
                <svg class="w-5 h-5 mr-2" [class.text-indigo-600]="activeTab === 'attendance'" [class.text-gray-400]="activeTab !== 'attendance'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
                Attendance
                <span class="ml-2 py-0.5 px-2 rounded-full text-xs font-medium"
                      [class.bg-indigo-100]="activeTab === 'attendance'"
                      [class.text-indigo-600]="activeTab === 'attendance'"
                      [class.bg-gray-100]="activeTab !== 'attendance'"
                      [class.text-gray-600]="activeTab !== 'attendance'">
                  {{ attendanceStats?.totalSessions || 0 }}
                </span>
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div class="p-6">
            <!-- Overview Tab -->
            <div *ngIf="activeTab === 'overview'">
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Statistics Grid -->
                <div class="lg:col-span-2 grid grid-cols-2 gap-4">
                  <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                    <div class="flex items-center justify-between mb-4">
                      <div class="p-3 bg-blue-200 rounded-lg">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-blue-900">{{ group?.students?.length || 0 }}</div>
                    <div class="text-sm text-blue-600 font-medium mt-1">Enrolled Students</div>
                  </div>

                  <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <div class="flex items-center justify-between mb-4">
                      <div class="p-3 bg-purple-200 rounded-lg">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-purple-900">{{ group?.assignmentStats?.total || 0 }}</div>
                    <div class="text-sm text-purple-600 font-medium mt-1">Total Assignments</div>
                  </div>

                  <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <div class="flex items-center justify-between mb-4">
                      <div class="p-3 bg-green-200 rounded-lg">
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-green-900">{{ group?.schedule?.length || 0 }}</div>
                    <div class="text-sm text-green-600 font-medium mt-1">Sessions Per Week</div>
                  </div>

                  <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
                    <div class="flex items-center justify-between mb-4">
                      <div class="p-3 bg-amber-200 rounded-lg">
                        <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-amber-900">{{ getTotalWeeklyHours() }}</div>
                    <div class="text-sm text-amber-600 font-medium mt-1">Total Weekly Hours</div>
                  </div>
                </div>

                <!-- Schedule Card -->
                <div class="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Weekly Schedule
                  </h3>
                  <div class="space-y-3">
                    <div *ngFor="let s of group?.schedule" 
                         class="flex items-center justify-between p-3 rounded-lg"
                         [ngClass]="getDayColorClass(s.day)">
                      <div class="flex items-center space-x-3">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                        </svg>
                        <span class="font-semibold">{{ s.day | titlecase }}</span>
                      </div>
                      <span class="text-sm font-medium">{{ s.startTime }} - {{ s.endTime }}</span>
                    </div>
                    <div *ngIf="!group?.schedule || group?.schedule.length === 0" class="text-center py-4 text-gray-500">
                      No schedule configured
                    </div>
                  </div>
                </div>
              </div>

              <!-- Course Details Card -->
              <div class="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <svg class="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  Course Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p class="text-sm text-gray-600 font-medium mb-1">Course Name</p>
                    <p class="text-lg font-bold text-gray-900">{{ group?.course?.name || 'N/A' }}</p>
                  </div>
                  <div>
                    <p class="text-sm text-gray-600 font-medium mb-1">Course Code</p>
                    <p class="text-lg font-mono font-bold text-gray-900">{{ group?.course?.code || 'N/A' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Students Tab -->
            <div *ngIf="activeTab === 'students'">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Enrolled Students</h3>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ canManageStudents ? 'Manage student enrollment for this group' : 'View students enrolled in this group' }}
                  </p>
                </div>
                <button *ngIf="canManageStudents" (click)="openAddStudentModal()" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Add Student
                </button>
              </div>

              <!-- Students Table -->
              <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Contact</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr *ngFor="let studentEnrollment of group?.students; let i = index" class="hover:bg-gray-50">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ i + 1 }}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10">
                              <div class="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                {{ getInitials(studentEnrollment?.student?.firstName, studentEnrollment?.student?.lastName) }}
                              </div>
                            </div>
                            <div class="ml-4">
                              <div class="text-sm font-medium text-gray-900">
                                {{ studentEnrollment?.student?.fullName }}
                              </div>
                              <div class="text-sm text-gray-500">
                                {{ studentEnrollment?.student?.email }}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <span class="text-sm font-mono text-gray-900">{{ studentEnrollment?.student?.academicInfo?.studentId }}</span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center text-sm text-gray-900">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                            {{ studentEnrollment?.student?.phoneNumber || 'N/A' }}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                          <div class="flex items-center text-sm text-gray-900">
                            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                            {{ studentEnrollment?.student?.parentContact?.primaryPhone || 'N/A' }}
                          </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {{ studentEnrollment?.enrollmentDate | date:'short' }}
                        </td>
                        <td *ngIf="canManageStudents" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button (click)="removeStudent(studentEnrollment?.student?._id || studentEnrollment?.student?.id)" 
                                  class="text-red-600 hover:text-red-900">
                            Remove
                          </button>
                        </td>
                        <td *ngIf="!canManageStudents" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-400">
                          —
                        </td>
                      </tr>
                      <tr *ngIf="!group?.students || group?.students.length === 0">
                        <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                          No students enrolled yet
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Assignments Tab -->
            <div *ngIf="activeTab === 'assignments'">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-lg font-bold text-gray-900">Assignments</h3>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ canCreateAssignment ? 'View and manage assignments for this group' : 'View your assignment results' }}
                  </p>
                </div>
                <button *ngIf="canCreateAssignment" (click)="createAssignmentForGroup()" class="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm">
                  <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Create Assignment
                </button>
              </div>

              <!-- Assignment Stats -->
              <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div class="text-2xl font-bold text-gray-900">{{ group?.assignmentStats?.total || 0 }}</div>
                  <div class="text-xs text-gray-600 font-medium mt-1">Total</div>
                </div>
                <div class="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div class="text-2xl font-bold text-green-700">{{ group?.assignmentStats?.published || 0 }}</div>
                  <div class="text-xs text-green-600 font-medium mt-1">Published</div>
                </div>
                <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div class="text-2xl font-bold text-yellow-700">{{ group?.assignmentStats?.draft || 0 }}</div>
                  <div class="text-xs text-yellow-600 font-medium mt-1">Draft</div>
                </div>
                <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div class="text-2xl font-bold text-blue-700">{{ group?.assignmentStats?.upcoming || 0 }}</div>
                  <div class="text-xs text-blue-600 font-medium mt-1">Upcoming</div>
                </div>
                <div class="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div class="text-2xl font-bold text-red-700">{{ group?.assignmentStats?.overdue || 0 }}</div>
                  <div class="text-xs text-red-600 font-medium mt-1">Overdue</div>
                </div>
              </div>

              <!-- Assignments List -->
              <div class="space-y-3">
                <a *ngFor="let assignment of group?.assignmentStats?.assignments" 
                   [routerLink]="['/dashboard/assignments', assignment._id]"
                   class="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-indigo-300 transition-all">
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2 mb-2">
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold"
                              [ngClass]="{
                                'bg-green-100 text-green-700': assignment.status === 'published',
                                'bg-yellow-100 text-yellow-700': assignment.status === 'draft',
                                'bg-gray-100 text-gray-700': assignment.status === 'closed'
                              }">
                          {{ assignment.status }}
                        </span>
                        <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-100 text-purple-700">
                          {{ assignment.type }}
                        </span>
                        <span class="text-xs text-gray-500 font-mono">{{ assignment.code }}</span>
                      </div>
                      <h4 class="font-semibold text-gray-900 mb-1">{{ assignment.title }}</h4>
                      <div class="flex items-center space-x-4 text-sm text-gray-600">
                        <span class="flex items-center">
                          <svg class="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                          </svg>
                          {{ assignment.dueDate | date:'short' }}
                        </span>
                        <span class="flex items-center">
                          <svg class="w-4 h-4 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                          </svg>
                          {{ assignment.maxPoints }} pts
                        </span>
                      </div>
                    </div>
                    <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                </a>
                
                <div *ngIf="!group?.assignmentStats?.assignments || group?.assignmentStats.assignments.length === 0" 
                     class="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <p class="text-gray-600 font-medium">No assignments yet</p>
                  <p class="text-sm text-gray-500 mt-1">Create assignments for this group to get started</p>
                </div>
              </div>
            </div>

            <!-- Attendance Tab -->
            <div *ngIf="activeTab === 'attendance'">
              <!-- Loading State -->
              <div *ngIf="loadingAttendance" class="flex justify-center items-center py-12">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                  <p class="text-gray-600">Loading attendance data...</p>
                </div>
              </div>

              <!-- Content -->
              <div *ngIf="!loadingAttendance">
                <!-- Header with Quick Action -->
                <div class="flex items-center justify-between mb-6">
                  <div>
                    <h3 class="text-lg font-bold text-gray-900">Attendance Overview</h3>
                    <p class="text-sm text-gray-600 mt-1">
                      {{ canMarkAttendance ? 'Track and manage attendance for this group' : 'View your attendance records' }}
                    </p>
                  </div>
                  <button 
                    *ngIf="canMarkAttendance"
                    (click)="markAttendance()"
                    class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    Mark Attendance
                  </button>
                </div>

                <!-- Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                    <div class="flex items-center justify-between mb-2">
                      <div class="p-2 bg-blue-500 rounded-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-blue-900">{{ attendanceStats?.totalSessions || 0 }}</div>
                    <div class="text-sm font-medium text-blue-700">Total Sessions</div>
                  </div>

                  <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                    <div class="flex items-center justify-between mb-2">
                      <div class="p-2 bg-green-500 rounded-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-green-900">{{ attendanceStats?.averageRate || 0 }}%</div>
                    <div class="text-sm font-medium text-green-700">Average Attendance</div>
                  </div>

                  <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 border border-yellow-200">
                    <div class="flex items-center justify-between mb-2">
                      <div class="p-2 bg-yellow-500 rounded-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-yellow-900">{{ attendanceStats?.latestDate || 'N/A' }}</div>
                    <div class="text-sm font-medium text-yellow-700">Latest Session</div>
                  </div>

                  <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <div class="flex items-center justify-between mb-2">
                      <div class="p-2 bg-purple-500 rounded-lg">
                        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                      </div>
                    </div>
                    <div class="text-3xl font-bold text-purple-900">{{ attendanceStats?.averagePresent || 0 }}</div>
                    <div class="text-sm font-medium text-purple-700">Avg. Students Present</div>
                  </div>
                </div>

                <!-- Recent Attendance Sessions -->
                <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div class="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-900">Recent Sessions</h4>
                  </div>
                  
                  <div *ngIf="recentAttendance.length === 0" class="text-center py-12">
                    <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p class="text-gray-600 font-medium">No attendance records yet</p>
                    <p class="text-sm text-gray-500 mt-1">
                      {{ canMarkAttendance ? 'Mark attendance to start tracking' : 'Attendance will appear here once recorded' }}
                    </p>
                    <button 
                      *ngIf="canMarkAttendance"
                      (click)="markAttendance()"
                      class="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-all">
                      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                      </svg>
                      Mark First Session
                    </button>
                  </div>

                  <div *ngIf="recentAttendance.length > 0" class="divide-y divide-gray-200">
                    <div *ngFor="let session of recentAttendance" 
                         class="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                         (click)="viewAttendance(session._id)">
                      <div class="flex items-center justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-3 mb-2">
                            <span class="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                              {{ session.code || 'N/A' }}
                            </span>
                            <span *ngIf="session.isLocked" class="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                              🔒 Locked
                            </span>
                            <span *ngIf="!session.isLocked" class="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              🔓 Open
                            </span>
                          </div>
                          <div class="text-sm text-gray-900 font-medium mb-1">
                            {{ formatDate(session.session.date) }}
                          </div>
                          <div class="text-xs text-gray-500">
                            {{ session.records?.length || 0 }} students • 
                            {{ calculateRate(session) }}% attendance rate
                          </div>
                        </div>
                        
                        <div class="flex items-center gap-4">
                          <!-- Quick Stats -->
                          <div class="flex items-center gap-2 text-sm">
                            <span class="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                              {{ countPresent(session) }} P
                            </span>
                            <span class="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                              {{ countAbsent(session) }} A
                            </span>
                            <span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-medium">
                              {{ countLate(session) }} L
            </span>
                          </div>
                          
                          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- View All Button -->
                  <div *ngIf="recentAttendance.length > 0" class="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <button 
                      (click)="viewAllAttendance()"
                      class="w-full text-center text-sm font-medium text-purple-600 hover:text-purple-800 transition-colors">
                      View All Attendance Records →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>


    <!-- Add Student Modal -->
    <div *ngIf="showAddStudentModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div class="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-auto" (click)="$event.stopPropagation()">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4 rounded-t-2xl">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <svg class="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
              <h3 class="text-xl font-bold text-white">Add Student to Group</h3>
            </div>
            <button (click)="closeAddStudentModal()" class="text-white hover:text-gray-200 transition-colors">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-6">
          <div class="mb-4">
            <label class="block text-sm font-semibold text-gray-700 mb-2">Search and Select Student</label>
            <input
              type="text"
              [(ngModel)]="studentSearchTerm"
              (input)="searchStudents()"
              placeholder="Search by name, email, or student ID..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div *ngIf="loadingStudents" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p class="text-gray-500 mt-2">Loading students...</p>
          </div>

          <div *ngIf="!loadingStudents && availableStudents.length === 0" class="text-center py-8">
            <svg class="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p class="text-gray-500">No available students found for grade {{ group?.gradeLevel }}</p>
          </div>

          <div *ngIf="!loadingStudents && availableStudents.length > 0" class="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div *ngFor="let student of availableStudents" 
                 (click)="selectStudent(student)"
                 class="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm mr-3">
                {{ getInitials(student.firstName, student.lastName) }}
              </div>
              <div class="flex-1">
                <p class="text-sm font-semibold text-gray-900">{{ student.fullName }}</p>
                <p class="text-xs text-gray-500">{{ student.academicInfo?.studentId }} • {{ student.academicInfo?.currentGrade }}</p>
              </div>
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
          <button (click)="closeAddStudentModal()" class="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .btn-clone-white { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm border-2 border-white border-opacity-30 shadow-lg hover:shadow-xl transition-all duration-200; }
    .btn-edit-white { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-white bg-opacity-20 text-white hover:bg-opacity-30 backdrop-blur-sm border-2 border-white border-opacity-30 shadow-lg hover:shadow-xl transition-all duration-200; }
    .btn-danger-white { @apply inline-flex items-center px-4 py-2.5 text-sm font-semibold rounded-lg bg-red-500 bg-opacity-90 text-white hover:bg-opacity-100 backdrop-blur-sm border-2 border-red-600 shadow-lg hover:shadow-xl transition-all duration-200; }
    .btn-add-student { @apply inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-white text-green-600 hover:bg-green-50 border-2 border-white shadow-md hover:shadow-lg transition-all duration-200; }
  `]
})
export class GroupDetailComponent implements OnInit {
  group: any;
  showAddStudentModal = false;
  availableStudents: any[] = [];
  loadingStudents = false;
  studentSearchTerm = '';
  activeTab = 'overview'; // New property for tab navigation
  
  // Attendance properties
  attendanceStats: any = null;
  recentAttendance: any[] = [];
  loadingAttendance = false;
  
  // Role-based properties
  currentUser: User | null = null;

  constructor(
    private groupService: GroupService,
    private studentService: StudentService,
    private attendanceService: AttendanceService,
    private route: ActivatedRoute, 
    private router: Router, 
    private confirmation: ConfirmationService,
    private toastService: ToastService,
    private authService: AuthService,
    public permissionService: PermissionService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user for role-based permissions
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    
    const id = this.route.snapshot.paramMap.get('id')!;
    this.groupService.getGroup(id).subscribe({ next: res => this.group = res.data?.group });
  }
  
  // PERMISSION GETTERS (for template use)
  get canEdit(): boolean {
    return this.permissionService.canEditGroup(this.group);
  }
  
  get canDelete(): boolean {
    return this.permissionService.canDeleteGroup(this.group);
  }
  
  get canManageStudents(): boolean {
    // Only admin and teacher can manage (add/remove) students
    return this.permissionService.isAdmin() || this.permissionService.isTeacher();
  }
  
  get canCreateAssignment(): boolean {
    return this.permissionService.canCreateAssignment();
  }
  
  get canMarkAttendance(): boolean {
    return this.permissionService.canMarkAttendance();
  }
  
  get showStudentsTab(): boolean {
    // Hide students tab for student role (students shouldn't see other students)
    return this.currentUser?.role !== 'student';
  }

  goBack(): void {
    this.router.navigate(['/dashboard/groups']);
  }

  edit(): void { this.router.navigate(['/dashboard/groups', this.group?.id || this.group?._id, 'edit']); }

  async clone(): Promise<void> {
    const confirmed = await this.confirmation.confirm({ 
      title: 'Clone Group Section', 
      message: `Create a new section based on "${this.group?.name}"? You can modify the schedule and other details after creation.`, 
      confirmText: 'Yes, Clone', 
      cancelText: 'Cancel', 
      type: 'info' 
    });
    
    if (!confirmed) return;

    // Create a clone with modified data
    const cloneData = {
      ...this.group,
      name: `${this.group.name} (Copy)`,
      code: `${this.group.code}-COPY-${Date.now().toString().slice(-4)}`,
      students: [], // Start with no students
      currentEnrollment: 0,
      // Keep the same course (which includes teacher and subject)
      course: this.group.course?._id || this.group.course
    };

    // Remove fields that shouldn't be copied
    delete cloneData._id;
    delete cloneData.id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.classMonitor;
    delete cloneData.createdBy;
    delete cloneData.teacher;  // Remove as it's inherited from course
    delete cloneData.subject;  // Remove as it's inherited from course

    this.groupService.createGroup(cloneData).subscribe({
      next: (response) => {
        const newGroupId = response.data?._id || response.data?.group?._id;
        if (newGroupId) {
          this.router.navigate(['/dashboard/groups', newGroupId, 'edit']);
        } else {
          this.router.navigate(['/dashboard/groups']);
        }
      },
      error: (error) => {
        console.error('Failed to clone group:', error);
        this.toastService.showApiError(error);
      }
    });
  }

  async delete(): Promise<void> {
    const confirmed = await this.confirmation.confirm({ title: 'Delete Group', message: `Delete ${this.group?.name}?`, confirmText: 'Yes, Delete', cancelText: 'Cancel', type: 'danger' });
    if (!confirmed) return;
    this.groupService.deleteGroup(this.group?.id || this.group?._id).subscribe({ next: _ => this.router.navigate(['/dashboard/groups']) });
  }

  getDayColorClass(day: string): string {
    const dayLower = day.toLowerCase();
    const colorMap: {[key: string]: string} = {
      'sunday': 'bg-purple-100 text-purple-800 border-purple-300',
      'monday': 'bg-blue-100 text-blue-800 border-blue-300',
      'tuesday': 'bg-green-100 text-green-800 border-green-300',
      'wednesday': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'thursday': 'bg-orange-100 text-orange-800 border-orange-300',
      'friday': 'bg-red-100 text-red-800 border-red-300',
      'saturday': 'bg-pink-100 text-pink-800 border-pink-300'
    };
    return colorMap[dayLower] || 'bg-gray-100 text-gray-800 border-gray-300';
  }

  getTotalWeeklyHours(): number {
    if (!this.group?.schedule || this.group.schedule.length === 0) return 0;
    
    let totalMinutes = 0;
    for (const slot of this.group.schedule) {
      const start = this.timeToMinutes(slot.startTime);
      const end = this.timeToMinutes(slot.endTime);
      totalMinutes += (end - start);
    }
    
    return Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
  }

  private timeToMinutes(time: string): number {
    if (!time) return 0;
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return `${first}${last}`;
  }

  openAddStudentModal(): void {
    this.showAddStudentModal = true;
    this.studentSearchTerm = '';
    this.availableStudents = [];
    // Automatically search for students when modal opens
    this.searchStudents();
  }

  searchStudents(): void {
    this.loadingStudents = true;
    const params: any = {
      year: this.group?.gradeLevel, // Filter by group's grade level
      limit: 100
    };
    
    if (this.studentSearchTerm) {
      params.search = this.studentSearchTerm;
    }

    console.log('Searching students with params:', params);

    this.studentService.getStudents(params).subscribe({
      next: (res) => {
        console.log('Students API response:', res);
        console.log('Students data:', res.data?.students);
        
        // Filter out students already in the group
        const enrolledStudentIds = this.group?.students?.map((s: any) => s.student?._id || s.student?.id) || [];
        console.log('Already enrolled student IDs:', enrolledStudentIds);
        
        const allStudents = res.data?.students || [];
        console.log('Total students from API:', allStudents.length);
        
        this.availableStudents = allStudents.filter(
          (student: any) => !enrolledStudentIds.includes(student._id || student.id)
        );
        
        console.log('Available students after filtering:', this.availableStudents.length);
        this.loadingStudents = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.toastService.error('Failed to load students');
        this.loadingStudents = false;
      }
    });
  }

  selectStudent(student: any): void {
    const studentId = student._id || student.id;
    const groupId = this.group._id || this.group.id;
    
    this.groupService.addStudent(groupId, studentId).subscribe({
      next: (res) => {
        this.toastService.success(`${student.fullName} added to group successfully`);
        this.closeAddStudentModal();
        // Refresh group data
        this.groupService.getGroup(groupId).subscribe({
          next: res => this.group = res.data?.group
        });
      },
      error: (error) => {
        console.error('Error adding student:', error);
        this.toastService.showApiError(error);
      }
    });
  }

  async removeStudent(studentId: string): Promise<void> {
    const studentEnrollment = this.group?.students?.find((s: any) => 
      (s.student?._id || s.student?.id) === studentId
    );
    const studentName = studentEnrollment?.student?.fullName || 'this student';
    
    const confirmed = await this.confirmation.confirm({
      title: 'Remove Student',
      message: `Remove ${studentName} from this group?`,
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      type: 'warning'
    });
    
    if (!confirmed) return;
    
    const groupId = this.group._id || this.group.id;
    this.groupService.removeStudent(groupId, studentId).subscribe({
      next: () => {
        this.toastService.success(`${studentName} removed from group`);
        // Refresh group data
        this.groupService.getGroup(groupId).subscribe({
          next: res => this.group = res.data?.group
        });
      },
      error: (error) => {
        console.error('Error removing student:', error);
        this.toastService.showApiError(error);
      }
    });
  }

  closeAddStudentModal(): void {
    this.showAddStudentModal = false;
    this.studentSearchTerm = '';
    this.availableStudents = [];
  }

  createAssignmentForGroup(): void {
    // Navigate to assignment creation form with this group pre-selected
    const groupId = this.group._id || this.group.id;
    const groupName = this.group.name;
    
    // Store the group selection in localStorage for the assignment form to pick up
    localStorage.setItem('preSelectedGroup', JSON.stringify({
      id: groupId,
      name: groupName,
      code: this.group.code,
      gradeLevel: this.group.gradeLevel
    }));
    
    this.router.navigate(['/dashboard/assignments/new']);
  }

  // Attendance methods
  loadAttendanceData(): void {
    if (this.loadingAttendance) return; // Prevent duplicate calls
    
    this.loadingAttendance = true;
    const groupId = this.group._id || this.group.id;
    
    // Fetch attendance records for this group
    this.attendanceService.getAttendances({ group: groupId, limit: 10, sort: '-session.date' }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.recentAttendance = response.data.attendances || [];
          this.calculateAttendanceStats();
        }
        this.loadingAttendance = false;
      },
      error: (error) => {
        console.error('Error loading attendance:', error);
        this.toastService.error('Failed to load attendance data');
        this.loadingAttendance = false;
      }
    });
  }

  calculateAttendanceStats(): void {
    if (this.recentAttendance.length === 0) {
      this.attendanceStats = {
        totalSessions: 0,
        averageRate: 0,
        latestDate: 'N/A',
        averagePresent: 0
      };
      return;
    }

    const totalSessions = this.recentAttendance.length;
    let totalRate = 0;
    let totalPresent = 0;

    this.recentAttendance.forEach(session => {
      const rate = this.calculateRate(session);
      totalRate += rate;
      totalPresent += this.countPresent(session);
    });

    const latestSession = this.recentAttendance[0];
    const latestDate = latestSession?.session?.date 
      ? new Date(latestSession.session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : 'N/A';

    this.attendanceStats = {
      totalSessions,
      averageRate: Math.round(totalRate / totalSessions),
      latestDate,
      averagePresent: Math.round(totalPresent / totalSessions)
    };
  }

  calculateRate(session: any): number {
    if (!session.records || session.records.length === 0) return 0;
    const present = session.records.filter((r: any) => r.status === 'present' || r.status === 'late').length;
    return Math.round((present / session.records.length) * 100);
  }

  countPresent(session: any): number {
    if (!session.records) return 0;
    return session.records.filter((r: any) => r.status === 'present').length;
  }

  countAbsent(session: any): number {
    if (!session.records) return 0;
    return session.records.filter((r: any) => r.status === 'absent').length;
  }

  countLate(session: any): number {
    if (!session.records) return 0;
    return session.records.filter((r: any) => r.status === 'late').length;
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  markAttendance(): void {
    const groupId = this.group._id || this.group.id;
    this.router.navigate(['/dashboard/attendance/mark'], { 
      queryParams: { groupId } 
    });
  }

  viewAttendance(attendanceId: string): void {
    this.router.navigate(['/dashboard/attendance', attendanceId]);
  }

  viewAllAttendance(): void {
    const groupId = this.group._id || this.group.id;
    this.router.navigate(['/dashboard/attendance'], { 
      queryParams: { group: groupId } 
    });
  }
}


