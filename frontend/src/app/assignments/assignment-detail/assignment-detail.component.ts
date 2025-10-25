import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AssignmentService } from '../../services/assignment.service';
import { SubmissionService } from '../../services/submission.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-assignment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container mx-auto px-4 py-6 space-y-6">
      <!-- Back Button -->
      <button (click)="goBack()" class="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium transition-colors group">
        <svg class="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Back to Assignments
      </button>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
        <p class="mt-4 text-gray-600 font-medium">Loading assignment...</p>
      </div>

      <div *ngIf="!loading && assignment" class="space-y-6">
        <!-- Enhanced Assignment Header with Gradient Banner -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <!-- Gradient Header Banner -->
          <div class="bg-gradient-to-br from-purple-600 to-indigo-600 p-8 text-white">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-3">
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30">
                    {{ assignment.code || 'AS-XXXXX' }}
                  </span>
                  <span [class]="getTypeClassWhite(assignment.type)">{{ assignment.type }}</span>
                  <span *ngIf="isOverdue" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse border-2 border-white">
                    ⏰ OVERDUE
                  </span>
                </div>
                <h1 class="text-4xl font-bold mb-3">{{ assignment.title }}</h1>
                <p class="text-purple-100 text-lg max-w-3xl">{{ assignment.description }}</p>
              </div>
              
              <div class="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-3">
                <button *ngIf="canEdit" 
                        [routerLink]="['/dashboard/assignments', assignment._id, 'edit']"
                        class="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 font-medium shadow-lg transition-all transform hover:-translate-y-0.5">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit Assignment
                </button>
                <!-- Save as Template Button -->
                <button *ngIf="canEdit" 
                        (click)="saveAsTemplate()"
                        class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg font-medium shadow-lg transition-all transform hover:-translate-y-0.5">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
                  </svg>
                  Save as Template
                </button>
                <!-- Quiz-specific button for students -->
                <button *ngIf="isStudent && assignment.type === 'quiz' && canSubmit"
                        [routerLink]="['/dashboard/assignments', assignment._id, 'take-quiz']"
                        class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg transition-all transform hover:-translate-y-0.5">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                  Take Quiz
                </button>
                <!-- Regular submission button for non-quiz assignments -->
                <button *ngIf="isStudent && assignment.type !== 'quiz' && canSubmit"
                        [routerLink]="['/dashboard/assignments', assignment._id, 'submit']"
                        class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-medium shadow-lg transition-all transform hover:-translate-y-0.5">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Submit Work
                </button>
                <!-- Release Results button for teachers (manual visibility only) -->
                <button *ngIf="canEdit && assignment.type === 'quiz' && assignment.quizSettings?.resultsVisibility === 'manual' && !assignment.quizSettings?.resultsReleased"
                        (click)="releaseQuizResults()"
                        class="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg font-medium shadow-lg transition-all transform hover:-translate-y-0.5">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
                  </svg>
                  Release Results
                </button>
              </div>
            </div>
          </div>

          <!-- Assignment Details Grid -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
            <div class="flex items-center space-x-3">
              <div class="p-3 bg-blue-100 rounded-lg">
                <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Due Date</p>
                <p class="font-bold text-sm" [class.text-red-600]="isOverdue">{{ formatDate(assignment.dueDate) }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <div class="p-3 bg-purple-100 rounded-lg">
                <svg class="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Max Points</p>
                <p class="font-bold text-sm">{{ assignment.maxPoints }} pts</p>
              </div>
            </div>
            <div *ngIf="assignment.course" class="flex items-center space-x-3">
              <div class="p-3 bg-green-100 rounded-lg">
                <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Course</p>
                <p class="font-bold text-sm">{{ assignment.course.name }}</p>
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <div class="p-3 bg-indigo-100 rounded-lg">
                <svg class="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-500 font-medium">Teacher</p>
                <p class="font-bold text-sm">{{ assignment.teacher?.firstName }} {{ assignment.teacher?.lastName }}</p>
              </div>
            </div>
          </div>

          <!-- Status Badge Section -->
          <div class="px-6 py-4 bg-white border-t border-gray-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-600">Status:</span>
                <span [class]="getStatusClass(assignment.status)">{{ assignment.status }}</span>
              </div>
              <div class="text-sm text-gray-500">
                Last updated: {{ formatDate(assignment.updatedAt) }}
              </div>
            </div>
          </div>

          <!-- Quiz-Specific Settings (if quiz type) -->
          <div *ngIf="assignment.type === 'quiz' && assignment.quizSettings" class="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-gray-200">
            <h3 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
              </svg>
              Quiz Settings
            </h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <div>
                  <p class="text-xs text-gray-600">Time Limit</p>
                  <p class="text-sm font-semibold text-gray-900">{{ assignment.quizSettings.timeLimit ? assignment.quizSettings.timeLimit + ' min' : 'No limit' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <div>
                  <p class="text-xs text-gray-600">Results Visibility</p>
                  <p class="text-sm font-semibold text-gray-900 capitalize">{{ assignment.quizSettings.resultsVisibility?.replace('_', ' ') || 'After deadline' }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                </svg>
                <div>
                  <p class="text-xs text-gray-600">Questions</p>
                  <p class="text-sm font-semibold text-gray-900">{{ assignment.questions?.length || 0 }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <div>
                  <p class="text-xs text-gray-600">Shuffling</p>
                  <p class="text-sm font-semibold text-gray-900">
                    {{ assignment.quizSettings.shuffleQuestions || assignment.quizSettings.shuffleOptions ? 'Enabled' : 'Disabled' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Enhanced Statistics Cards (Teacher/Admin View) -->
        <div *ngIf="(isTeacher || isAdmin) && assignment.stats" class="space-y-6">
          <!-- Primary Stats Row -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Total Submissions -->
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
              <p class="text-blue-100 text-sm font-medium mb-1">Total Submissions</p>
              <p class="text-4xl font-bold">{{ assignment.stats?.totalSubmissions || 0 }}</p>
              <p class="text-blue-200 text-xs mt-2">{{ getSubmissionRate() }}% submitted</p>
            </div>

            <!-- Graded -->
            <div class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p class="text-green-100 text-sm font-medium mb-1">Graded</p>
              <p class="text-4xl font-bold">{{ assignment.stats?.gradedSubmissions || 0 }}</p>
              <p class="text-green-200 text-xs mt-2">{{ getGradedRate() }}% graded</p>
            </div>

            <!-- Pending -->
            <div class="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <p class="text-yellow-100 text-sm font-medium mb-1">Pending Review</p>
              <p class="text-4xl font-bold">{{ assignment.stats?.pendingSubmissions || 0 }}</p>
              <p class="text-yellow-200 text-xs mt-2">Needs grading</p>
            </div>

            <!-- Average Grade -->
            <div class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white transform hover:-translate-y-1 transition-all duration-300">
              <div class="flex items-center justify-between mb-4">
                <div class="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                  <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
              </div>
              <p class="text-purple-100 text-sm font-medium mb-1">Average Grade</p>
              <p class="text-4xl font-bold">{{ assignment.stats?.averageGrade || 0 }}<span class="text-2xl">%</span></p>
              <p class="text-purple-200 text-xs mt-2">{{ getGradeLabel(assignment.stats?.averageGrade || 0) }}</p>
            </div>
          </div>

          <!-- Secondary Stats & Progress -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Submission Progress -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div class="flex items-center mb-4">
                <div class="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900">Submission Progress</h3>
              </div>
              <div class="space-y-4">
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="font-medium text-gray-700">Overall Completion</span>
                    <span class="font-bold text-blue-600">{{ getSubmissionRate() }}%</span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div class="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                         [style.width.%]="getSubmissionRate()"></div>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-4 mt-4">
                  <div class="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p class="text-xs text-green-600 font-medium">On Time</p>
                    <p class="text-2xl font-bold text-green-700">{{ assignment.stats?.onTimeSubmissions || 0 }}</p>
                  </div>
                  <div class="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p class="text-xs text-red-600 font-medium">Late</p>
                    <p class="text-2xl font-bold text-red-700">{{ assignment.stats?.lateSubmissions || 0 }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grade Distribution -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <div class="flex items-center mb-4">
                <div class="p-2 bg-purple-100 rounded-lg mr-3">
                  <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a2 2 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-900">Grade Distribution</h3>
              </div>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">A (90-100%)</span>
                  <div class="flex items-center space-x-2 flex-1 ml-4">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div class="bg-green-500 h-2 rounded-full" [style.width.%]="getGradePercentage('A')"></div>
                    </div>
                    <span class="text-sm font-bold text-gray-900 w-8">{{ getGradeCount('A') }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">B (80-89%)</span>
                  <div class="flex items-center space-x-2 flex-1 ml-4">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div class="bg-blue-500 h-2 rounded-full" [style.width.%]="getGradePercentage('B')"></div>
                    </div>
                    <span class="text-sm font-bold text-gray-900 w-8">{{ getGradeCount('B') }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">C (70-79%)</span>
                  <div class="flex items-center space-x-2 flex-1 ml-4">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div class="bg-yellow-500 h-2 rounded-full" [style.width.%]="getGradePercentage('C')"></div>
                    </div>
                    <span class="text-sm font-bold text-gray-900 w-8">{{ getGradeCount('C') }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">D (60-69%)</span>
                  <div class="flex items-center space-x-2 flex-1 ml-4">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div class="bg-orange-500 h-2 rounded-full" [style.width.%]="getGradePercentage('D')"></div>
                    </div>
                    <span class="text-sm font-bold text-gray-900 w-8">{{ getGradeCount('D') }}</span>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">F (0-59%)</span>
                  <div class="flex items-center space-x-2 flex-1 ml-4">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div class="bg-red-500 h-2 rounded-full" [style.width.%]="getGradePercentage('F')"></div>
                    </div>
                    <span class="text-sm font-bold text-gray-900 w-8">{{ getGradeCount('F') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Assignment Information Panel (For All Users) -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
            <div class="flex items-center">
              <div class="p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg shadow-md mr-3">
                <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">Assignment Information</h2>
            </div>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <!-- Category -->
              <div class="flex items-start space-x-3">
                <div class="p-2 bg-indigo-100 rounded-lg">
                  <svg class="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Category</p>
                  <p class="text-sm font-bold text-gray-900 capitalize">{{ assignment.category || 'Individual' }}</p>
                </div>
              </div>

              <!-- Weightage -->
              <div class="flex items-start space-x-3">
                <div class="p-2 bg-yellow-100 rounded-lg">
                  <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Weightage</p>
                  <p class="text-sm font-bold text-gray-900">{{ assignment.weightage || 0 }}%</p>
                </div>
              </div>

              <!-- Assigned Date -->
              <div class="flex items-start space-x-3">
                <div class="p-2 bg-green-100 rounded-lg">
                  <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Assigned Date</p>
                  <p class="text-sm font-bold text-gray-900">{{ formatDate(assignment.assignedDate) }}</p>
                </div>
              </div>

              <!-- Groups -->
              <div class="flex items-start space-x-3" *ngIf="assignment.groups && assignment.groups.length > 0">
                <div class="p-2 bg-purple-100 rounded-lg">
                  <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Groups</p>
                  <p class="text-sm font-bold text-gray-900">{{ assignment.groups.length }} group(s)</p>
                </div>
              </div>

              <!-- Submission Type -->
              <div class="flex items-start space-x-3">
                <div class="p-2 bg-pink-100 rounded-lg">
                  <svg class="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Submission Type</p>
                  <p class="text-sm font-bold text-gray-900 capitalize">{{ assignment.submissionType || 'File' }}</p>
                </div>
              </div>

              <!-- Time Remaining -->
              <div class="flex items-start space-x-3">
                <div class="p-2 rounded-lg" [ngClass]="getDaysUntilDue() < 0 ? 'bg-red-100' : getDaysUntilDue() <= 3 ? 'bg-orange-100' : 'bg-blue-100'">
                  <svg class="w-5 h-5" [ngClass]="getDaysUntilDue() < 0 ? 'text-red-600' : getDaysUntilDue() <= 3 ? 'text-orange-600' : 'text-blue-600'" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p class="text-xs text-gray-500 font-medium">Time Remaining</p>
                  <p class="text-sm font-bold" [ngClass]="getDaysUntilDue() < 0 ? 'text-red-600' : getDaysUntilDue() <= 3 ? 'text-orange-600' : 'text-gray-900'">
                    {{ getTimeRemaining() }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Assigned Groups Section -->
        <div *ngIf="assignment.groups && assignment.groups.length > 0" class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div class="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200 p-6">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-md mr-3">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-2xl font-bold text-gray-900">Assigned Groups</h2>
                  <p class="text-sm text-gray-600 mt-1">This assignment is assigned to {{ assignment.groups.length }} group(s)</p>
                </div>
              </div>
              <div class="bg-white rounded-lg px-4 py-2 shadow-md">
                <span class="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {{ assignment.groups.length }}
                </span>
              </div>
            </div>
          </div>
          <div class="p-6">
            <!-- Groups Table -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Code</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Group Name</th>
                    <th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Grade Level</th>
                    <th class="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr *ngFor="let group of assignment.groups; let i = index" 
                      class="hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 transition-colors duration-150">
                    <td class="px-4 py-4">
                      <div class="flex items-center">
                        <div class="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs mr-3">
                          {{ i + 1 }}
                        </div>
                        <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {{ group.code }}
                        </span>
                      </div>
                    </td>
                    <td class="px-4 py-4">
                      <div class="font-bold text-gray-900">{{ group.name }}</div>
                    </td>
                    <td class="px-4 py-4">
                      <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {{ group.gradeLevel }}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-center">
                      <a [routerLink]="['/dashboard/groups', group._id]"
                         class="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-medium rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        View Details
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Empty State (should not happen given the *ngIf, but good for safety) -->
            <div *ngIf="!assignment.groups || assignment.groups.length === 0" 
                 class="text-center py-12 text-gray-500">
              <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              <p class="text-lg font-medium">No groups assigned</p>
              <p class="text-sm mt-1">This assignment hasn't been assigned to any groups yet.</p>
            </div>
          </div>
        </div>

        <!-- Enhanced Instructions & Details -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Instructions & Rubric -->
          <div class="lg:col-span-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200 p-6">
              <div class="flex items-center">
                <div class="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md mr-3">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <h2 class="text-2xl font-bold text-gray-900">Instructions</h2>
              </div>
            </div>
            <div class="p-6">
              <div class="prose max-w-none">
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                  <p class="text-gray-700 whitespace-pre-wrap leading-relaxed">{{ assignment.instructions || 'No additional instructions provided.' }}</p>
                </div>
              </div>

              <div *ngIf="assignment.rubric && assignment.rubric.length > 0" class="mt-8">
                <div class="flex items-center mb-4">
                  <div class="p-2 bg-purple-100 rounded-lg mr-3">
                    <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                      <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <h3 class="text-lg font-bold text-gray-900">Grading Rubric</h3>
                </div>
                <div class="space-y-3">
                  <div *ngFor="let criterion of assignment.rubric; let i = index" 
                       class="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg hover:shadow-md transition-shadow">
                    <div class="flex items-center flex-1">
                      <div class="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                        {{ i + 1 }}
                      </div>
                      <div>
                        <p class="font-bold text-gray-900">{{ criterion.name }}</p>
                        <p *ngIf="criterion.description" class="text-sm text-gray-600 mt-1">{{ criterion.description }}</p>
                      </div>
                    </div>
                    <div class="ml-4 text-right">
                      <span class="text-2xl font-bold text-purple-600">{{ criterion.points }}</span>
                      <span class="text-sm text-gray-500 ml-1">pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Enhanced Settings Sidebar -->
          <div class="lg:col-span-1 space-y-6">
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-5">
                <div class="flex items-center">
                  <div class="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md mr-3">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <h3 class="text-lg font-bold text-gray-900">Settings</h3>
                </div>
              </div>
              <div class="p-5 space-y-4">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-700">Late Submissions</span>
                  </div>
                  <span [class]="assignment.allowLateSubmissions ? 'px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full' : 'px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full'">
                    {{ assignment.allowLateSubmissions ? 'Allowed' : 'Not Allowed' }}
                  </span>
                </div>
                
                <div *ngIf="assignment.allowLateSubmissions && assignment.latePenalty" class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-sm font-medium text-red-700">Late Penalty</span>
                  </div>
                  <span class="text-lg font-bold text-red-600">-{{ assignment.latePenalty }}%</span>
                </div>
                
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a3 3 0 00-3-3H8zm3 1a1 1 0 011 1v1H7V6a1 1 0 011-1h3z" clip-rule="evenodd"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-700">File Upload</span>
                  </div>
                  <span [class]="assignment.requireFileUpload ? 'px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full' : 'px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full'">
                    {{ assignment.requireFileUpload ? 'Required' : 'Optional' }}
                  </span>
                </div>
                
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <svg class="w-5 h-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-700">Multiple Submissions</span>
                  </div>
                  <span [class]="assignment.allowMultipleSubmissions ? 'px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full' : 'px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full'">
                    {{ assignment.allowMultipleSubmissions ? 'Allowed' : 'Not Allowed' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Submissions List (Teacher/Admin View) -->
        <div *ngIf="(isTeacher || isAdmin) && submissions.length > 0" class="bg-white rounded-lg shadow-sm p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Student Submissions</h2>
            <button (click)="exportGrades()" class="text-sm text-blue-600 hover:text-blue-800">
              Export Grades
            </button>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr *ngFor="let submission of submissions" class="hover:bg-gray-50">
                  <td class="px-4 py-3 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                        {{ submission.student?.firstName?.charAt(0) }}{{ submission.student?.lastName?.charAt(0) }}
                      </div>
                      <div class="ml-3">
                        <p class="text-sm font-medium text-gray-900">
                          {{ submission.student?.firstName }} {{ submission.student?.lastName }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {{ formatDate(submission.submittedAt) }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span [class]="getStatusClass(submission.status)">{{ submission.status }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    {{ submission.grade !== undefined ? submission.grade : '-' }} / {{ assignment.maxPoints }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <button 
                      [routerLink]="['/dashboard/assignments/grade', submission._id]"
                      class="text-blue-600 hover:text-blue-800">
                      {{ submission.grade !== undefined ? 'Review' : 'Grade' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Student's Own Submission -->
        <div *ngIf="isStudent && mySubmission" class="bg-white rounded-lg shadow-sm p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Your Submission</h2>
          <div class="space-y-4">
            <div>
              <span class="text-sm text-gray-600">Status:</span>
              <span [class]="getStatusClass(mySubmission.status)" class="ml-2">{{ mySubmission.status }}</span>
            </div>
            <div>
              <span class="text-sm text-gray-600">Submitted:</span>
              <span class="ml-2 font-medium">{{ formatDate(mySubmission.submittedAt) }}</span>
            </div>
            <div *ngIf="mySubmission.grade !== undefined">
              <span class="text-sm text-gray-600">Grade:</span>
              <span class="ml-2 text-lg font-bold">{{ mySubmission.grade }} / {{ assignment.maxPoints }}</span>
              <span class="ml-2 text-gray-600">({{ getPercentage(mySubmission.grade) }}%)</span>
            </div>
            <div *ngIf="mySubmission.feedback" class="pt-4 border-t border-gray-200">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Feedback:</h3>
              <p class="text-gray-900 bg-blue-50 p-4 rounded-lg">{{ mySubmission.feedback }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AssignmentDetailComponent implements OnInit {
  assignment: any = null;
  submissions: any[] = [];
  mySubmission: any = null;
  loading = false;
  assignmentId: string | null = null;
  currentUser: any;

  constructor(
    private assignmentService: AssignmentService,
    private submissionService: SubmissionService,
    private toastService: ToastService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser;
    this.assignmentId = this.route.snapshot.paramMap.get('id');
    
    if (this.assignmentId) {
      this.loadAssignment();
      if (this.isTeacher || this.isAdmin) {
        this.loadSubmissions();
      } else if (this.isStudent) {
        this.loadMySubmission();
      }
    } else {
      this.toastService.showApiError({ message: 'Invalid assignment' });
      this.router.navigate(['/dashboard/assignments']);
    }
  }

  loadAssignment(): void {
    if (!this.assignmentId) return;
    
    this.loading = true;
    this.assignmentService.getAssignment(this.assignmentId).subscribe({
      next: (response: any) => {
        console.log('Assignment detail API response:', response);
        if (response.success && response.data) {
          // Backend returns data: { assignment: {...} }
          this.assignment = response.data.assignment || response.data;
          console.log('Loaded assignment:', this.assignment);
          console.log('Assignment groups:', this.assignment?.groups);
          console.log('Groups length:', this.assignment?.groups?.length);
          
          // Check if groups is an array
          if (this.assignment?.groups) {
            console.log('Groups is array?', Array.isArray(this.assignment.groups));
            console.log('First group:', this.assignment.groups[0]);
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading assignment details:', error);
        this.toastService.showApiError(error);
        this.loading = false;
        this.router.navigate(['/dashboard/assignments']);
      }
    });
  }

  loadSubmissions(): void {
    if (!this.assignmentId) return;
    
    this.submissionService.getAssignmentSubmissions(this.assignmentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.submissions = response.data;
        }
      },
      error: (error: any) => {
        console.error('Failed to load submissions', error);
      }
    });
  }

  loadMySubmission(): void {
    if (!this.assignmentId) return;
    
    this.submissionService.getMySubmission(this.assignmentId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.mySubmission = response.data;
        }
      },
      error: (error) => {
        // It's okay if there's no submission yet
        console.log('No submission found');
      }
    });
  }

  exportGrades(): void {
    if (!this.assignmentId) return;
    
    this.assignmentService.exportAssignmentGrades(this.assignmentId, 'csv').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `assignment-${this.assignmentId}-grades.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.toastService.success('Grades exported successfully');
      },
      error: (error) => {
        this.toastService.showApiError({ message: 'Failed to export grades' });
      }
    });
  }

  get isTeacher(): boolean {
    return this.currentUser?.role === 'teacher';
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get isStudent(): boolean {
    return this.currentUser?.role === 'student';
  }

  get canEdit(): boolean {
    if (this.isAdmin) return true;
    return this.isTeacher && this.assignment?.teacher === this.currentUser?._id;
  }

  get canSubmit(): boolean {
    return this.assignment?.status === 'published' && !this.isOverdue;
  }

  get isOverdue(): boolean {
    if (!this.assignment) return false;
    return new Date(this.assignment.dueDate) < new Date();
  }

  getPercentage(grade: number): number {
    if (!this.assignment?.maxPoints) return 0;
    return Math.round((grade / this.assignment.maxPoints) * 100);
  }

  getSubmissionRate(): number {
    if (!this.assignment?.stats?.totalSubmissions) return 0;
    // Assuming we have total expected students, for now use submissions
    const total = this.submissions.length || this.assignment.stats.totalSubmissions;
    return Math.round((this.assignment.stats.totalSubmissions / Math.max(total, 1)) * 100);
  }

  getGradedRate(): number {
    if (!this.assignment?.stats?.totalSubmissions || !this.assignment?.stats?.gradedSubmissions) return 0;
    return Math.round((this.assignment.stats.gradedSubmissions / this.assignment.stats.totalSubmissions) * 100);
  }

  getGradeLabel(average: number): string {
    if (average >= 90) return 'Excellent';
    if (average >= 80) return 'Good';
    if (average >= 70) return 'Fair';
    if (average >= 60) return 'Needs Improvement';
    return 'Poor';
  }

  getGradeCount(grade: string): number {
    if (!this.submissions || this.submissions.length === 0) return 0;
    
    const gradedSubmissions = this.submissions.filter((s: any) => s.grade !== undefined);
    
    return gradedSubmissions.filter((s: any) => {
      const percentage = this.getPercentage(s.grade);
      switch (grade) {
        case 'A': return percentage >= 90;
        case 'B': return percentage >= 80 && percentage < 90;
        case 'C': return percentage >= 70 && percentage < 80;
        case 'D': return percentage >= 60 && percentage < 70;
        case 'F': return percentage < 60;
        default: return false;
      }
    }).length;
  }

  getGradePercentage(grade: string): number {
    const count = this.getGradeCount(grade);
    if (!this.submissions || this.submissions.length === 0) return 0;
    
    const gradedSubmissions = this.submissions.filter((s: any) => s.grade !== undefined);
    return gradedSubmissions.length > 0 ? Math.round((count / gradedSubmissions.length) * 100) : 0;
  }

  getDaysUntilDue(): number {
    if (!this.assignment?.dueDate) return 0;
    const now = new Date();
    const due = new Date(this.assignment.dueDate);
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getTimeRemaining(): string {
    const days = this.getDaysUntilDue();
    
    if (days < 0) {
      return `Overdue by ${Math.abs(days)} day(s)`;
    } else if (days === 0) {
      return 'Due today';
    } else if (days === 1) {
      return '1 day remaining';
    } else if (days <= 7) {
      return `${days} days remaining`;
    } else {
      const weeks = Math.floor(days / 7);
      return `${weeks} week(s) remaining`;
    }
  }

  getTypeClass(type: string): string {
    const classes: any = {
      homework: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200',
      quiz: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200',
      midterm: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200',
      final: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200',
      project: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200',
      presentation: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-800 border border-pink-200'
    };
    return classes[type] || classes.homework;
  }

  getTypeClassWhite(type: string): string {
    const classes: any = {
      homework: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white',
      quiz: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white',
      midterm: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white',
      final: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white',
      project: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white',
      presentation: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm border border-white/30 text-white'
    };
    return classes[type] || classes.homework;
  }

  getStatusClass(status: string): string {
    const classes: any = {
      draft: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200',
      published: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200',
      submitted: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200',
      graded: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200',
      closed: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200'
    };
    return classes[status] || classes.draft;
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  releaseQuizResults(): void {
    if (!this.assignment?._id) return;

    this.assignmentService.releaseQuizResults(this.assignment._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Quiz results released successfully!');
          // Update the local assignment object to reflect the change
          if (this.assignment.quizSettings) {
            this.assignment.quizSettings.resultsReleased = true;
          }
        }
      },
      error: (error) => {
        this.toastService.showApiError(error);
      }
    });
  }

  saveAsTemplate(): void {
    if (!this.assignment?._id) return;

    // Prompt for template name and description
    const templateName = prompt(
      'Enter a name for this template:',
      this.assignment.title + ' Template'
    );

    if (!templateName) return; // User cancelled

    const templateDescription = prompt(
      'Enter a description for this template (optional):',
      'Reusable template for ' + this.assignment.type + ' assignments'
    );

    // Call API to save as template
    this.assignmentService.saveAsTemplate(this.assignment._id, {
      templateName,
      templateDescription: templateDescription || undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Assignment saved as template successfully! ✓');
        }
      },
      error: (error) => {
        this.toastService.showApiError(error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard/assignments']);
  }
}

