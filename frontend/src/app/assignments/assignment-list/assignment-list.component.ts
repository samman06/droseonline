import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AssignmentService, Assignment } from '../../services/assignment.service';
import { ToastService } from '../../services/toast.service';
import { AuthService, User } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-assignment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="container mx-auto px-4 py-6 space-y-6">
      <!-- Enhanced Header Section -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <!-- Role-specific headers -->
              <h1 *ngIf="currentUser?.role === 'student'" class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {{ 'assignments.myAssignments' | translate }}
              </h1>
              <h1 *ngIf="currentUser?.role === 'teacher'" class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {{ 'assignments.myTeachingAssignments' | translate }}
              </h1>
              <h1 *ngIf="currentUser?.role === 'admin'" class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {{ 'assignments.allAssignments' | translate }}
              </h1>
              
              <!-- Role-specific descriptions -->
              <p *ngIf="currentUser?.role === 'student'" class="mt-1 text-gray-600">{{ 'assignments.viewSubmitDesc' | translate }}</p>
              <p *ngIf="currentUser?.role === 'teacher'" class="mt-1 text-gray-600">{{ 'assignments.manageGradeDesc' | translate }}</p>
              <p *ngIf="currentUser?.role === 'admin'" class="mt-1 text-gray-600">{{ 'assignments.manageTrackDesc' | translate }}</p>
              <div class="mt-2 flex items-center space-x-4 text-sm">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                  </svg>
                  {{ assignments.length }} {{ 'common.total' | translate }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 lg:mt-0 flex space-x-3">
            <button *ngIf="canExport" (click)="exportAssignments()" class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              {{ 'common.export' | translate }}
            </button>
            <button 
              *ngIf="canCreateAssignment"
              [routerLink]="['/dashboard/assignments/new']"
              class="btn-primary inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              {{ 'assignments.createAssignment' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Bulk Actions Bar -->
      <div *ngIf="canCreateAssignment && selectedAssignments.size > 0" class="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl shadow-lg border border-purple-300 p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="text-white font-semibold">
              {{ selectedAssignments.size }} {{ 'assignments.assignmentsSelected' | translate }}
            </div>
            <button (click)="selectedAssignments.clear()" class="text-white hover:text-purple-200 text-sm font-medium transition-colors">
              {{ 'assignments.clearSelection' | translate }}
            </button>
          </div>
          <div class="flex space-x-2">
            <button 
              (click)="bulkPublish()" 
              [disabled]="bulkActionInProgress"
              class="inline-flex items-center px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transition-all transform hover:-translate-y-0.5">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              {{ 'assignments.publish' | translate }}
            </button>
            <button 
              (click)="bulkClose()" 
              [disabled]="bulkActionInProgress"
              class="inline-flex items-center px-4 py-2 bg-white text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transition-all transform hover:-translate-y-0.5">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              {{ 'assignments.close' | translate }}
            </button>
            <button 
              (click)="bulkDelete()" 
              [disabled]="bulkActionInProgress"
              class="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transition-all transform hover:-translate-y-0.5">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              {{ 'common.delete' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters & View Toggle -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center space-x-4">
            <h3 class="text-sm font-semibold text-gray-700">{{ 'assignments.filtersAndView' | translate }}</h3>
            <label *ngIf="canCreateAssignment && assignments.length > 0" class="flex items-center cursor-pointer">
              <input type="checkbox" 
                     [checked]="isAllSelected()"
                     (change)="toggleSelectAll()"
                     class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500">
              <span class="ml-2 text-sm text-gray-600">{{ 'common.selectAll' | translate }}</span>
            </label>
          </div>
          <div class="inline-flex rounded-lg bg-gray-100 p-1">
            <button 
              (click)="viewMode = 'card'"
              [class]="viewMode === 'card' 
                ? 'px-3 py-2 bg-white text-gray-900 rounded-md shadow-sm font-medium transition-all' 
                : 'px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-all'"
              [title]="'common.cardView' | translate"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"></path>
              </svg>
            </button>
            <button 
              (click)="viewMode = 'table'"
              [class]="viewMode === 'table' 
                ? 'px-3 py-2 bg-white text-gray-900 rounded-md shadow-sm font-medium transition-all' 
                : 'px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-all'"
              [title]="'common.tableView' | translate"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'common.search' | translate }}</label>
            <input type="text" [(ngModel)]="filters.search" (input)="onSearchChange()" 
                   [placeholder]="'assignments.searchPlaceholder' | translate" 
                   class="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'assignments.type' | translate }}</label>
            <select [(ngModel)]="filters.type" (change)="loadAssignments()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
              <option value="">{{ 'assignments.allTypes' | translate }}</option>
              <option value="homework">{{ 'assignments.types.homework' | translate }}</option>
              <option value="quiz">{{ 'assignments.types.quiz' | translate }}</option>
              <option value="midterm">{{ 'assignments.types.midterm' | translate }}</option>
              <option value="final">{{ 'assignments.types.final' | translate }}</option>
              <option value="project">{{ 'assignments.types.project' | translate }}</option>
              <option value="presentation">{{ 'assignments.types.presentation' | translate }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'assignments.status' | translate }}</label>
            <select [(ngModel)]="filters.status" (change)="loadAssignments()" 
                    class="w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500">
              <option value="">{{ 'assignments.allStatus' | translate }}</option>
              <option value="draft">{{ 'assignments.statusDraft' | translate }}</option>
              <option value="published">{{ 'assignments.statusPublished' | translate }}</option>
              <option value="closed">{{ 'assignments.statusClosed' | translate }}</option>
              <option value="graded">{{ 'assignments.statusGraded' | translate }}</option>
            </select>
          </div>
        </div>
        
        <div *ngIf="filters.search || filters.type || filters.status" class="mt-3 flex items-center justify-between">
          <div class="flex flex-wrap gap-2">
            <span *ngIf="filters.search" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {{ 'common.search' | translate }}: {{ filters.search }}
              <button (click)="filters.search = ''; loadAssignments()" class="ml-2 text-purple-600 hover:text-purple-800">×</button>
            </span>
            <span *ngIf="filters.type" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {{ 'assignments.type' | translate }}: {{ filters.type }}
              <button (click)="filters.type = ''; loadAssignments()" class="ml-2 text-purple-600 hover:text-purple-800">×</button>
            </span>
            <span *ngIf="filters.status" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
              {{ 'assignments.status' | translate }}: {{ filters.status }}
              <button (click)="filters.status = ''; loadAssignments()" class="ml-2 text-purple-600 hover:text-purple-800">×</button>
            </span>
          </div>
          <button (click)="resetFilters()" class="text-sm text-purple-600 hover:text-purple-800 font-medium">
            {{ 'assignments.clearAll' | translate }}
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-16">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600"></div>
        <p class="mt-4 text-gray-600 font-medium">{{ 'assignments.loadingAssignments' | translate }}</p>
      </div>

      <!-- Card View -->
      <div *ngIf="!loading && assignments.length > 0 && viewMode === 'card'" 
           class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let assignment of assignments" 
             class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden group"
             [class.ring-2]="isSelected(assignment._id!)"
             [class.ring-purple-500]="isSelected(assignment._id!)">
          <!-- Card Header with Gradient -->
          <div class="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 relative">
            <!-- Checkbox for selection (teachers/admins only) -->
            <input *ngIf="canCreateAssignment" 
                   type="checkbox" 
                   [checked]="isSelected(assignment._id!)"
                   (change)="toggleSelectAssignment(assignment._id!)"
                   (click)="$event.stopPropagation()"
                   class="absolute top-3 left-3 w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 cursor-pointer z-10">
            <div class="flex items-start justify-between">
              <span [class]="getTypeClass(assignment.type)" [class.ml-8]="canCreateAssignment">
                {{ assignment.type }}
              </span>
              <span *ngIf="isOverdue(assignment)" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse">
                ⏰ {{ 'assignments.overdue' | translate }}
              </span>
            </div>
            <h3 class="text-white font-bold text-lg mt-2 line-clamp-2">{{ assignment.title }}</h3>
            <p class="text-purple-100 text-sm mt-1">{{ assignment.code || 'AS-XXXXX' }}</p>
          </div>
          
          <!-- Card Body -->
          <div class="p-4">
            <p class="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">{{ assignment.description }}</p>
            
            <!-- Status Badge -->
            <div class="flex items-center justify-between mb-4">
              <span [class]="getStatusClass(assignment.status)">{{ assignment.status }}</span>
              <span class="text-sm font-semibold text-purple-600">{{ assignment.maxPoints }} pts</span>
            </div>
            
            <!-- Stats Grid -->
            <div class="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">{{ assignment.stats?.totalSubmissions || 0 }}</div>
                <div class="text-xs text-gray-500 font-medium">{{ 'assignments.submissions' | translate }}</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-indigo-600">{{ assignment.stats?.averageGrade || 0 }}%</div>
                <div class="text-xs text-gray-500 font-medium">{{ 'assignments.avgGrade' | translate }}</div>
              </div>
            </div>
            
            <!-- Due Date -->
            <div class="flex items-center text-sm text-gray-600 mb-4 p-2 bg-blue-50 rounded-lg">
              <svg class="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              <span class="font-medium">{{ 'assignments.due' | translate }}: {{ formatDate(assignment.dueDate) }}</span>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button [routerLink]="['/dashboard/assignments', assignment._id]"
                      class="flex-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                {{ 'common.view' | translate }}
              </button>
              <button *ngIf="canEdit(assignment)" 
                      [routerLink]="['/dashboard/assignments', assignment._id, 'edit']"
                      class="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                {{ 'common.edit' | translate }}
              </button>
              <button *ngIf="canEdit(assignment)" 
                      (click)="cloneAssignment(assignment._id!)"
                      class="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      [title]="'assignments.cloneAssignment' | translate">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
              </button>
              <button *ngIf="isStudent && canSubmit(assignment)"
                      [routerLink]="['/dashboard/assignments', assignment._id, 'submit']"
                      class="flex-1 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg transition-all shadow-sm">
                {{ 'common.submit' | translate }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div *ngIf="!loading && assignments.length > 0 && viewMode === 'table'" class="space-y-4">
        <div *ngFor="let assignment of assignments" 
             class="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all duration-300 overflow-hidden relative"
             [class.ring-2]="isSelected(assignment._id!)"
             [class.ring-purple-500]="isSelected(assignment._id!)">
          <!-- Checkbox for selection (teachers/admins only) -->
          <input *ngIf="canCreateAssignment" 
                 type="checkbox" 
                 [checked]="isSelected(assignment._id!)"
                 (change)="toggleSelectAssignment(assignment._id!)"
                 (click)="$event.stopPropagation()"
                 class="absolute top-6 left-6 w-5 h-5 text-purple-600 bg-white border-gray-300 rounded focus:ring-purple-500 cursor-pointer z-10">
          <div class="p-6" [class.pl-14]="canCreateAssignment">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-3">
                  <span [class]="getTypeClass(assignment.type)">{{ assignment.type }}</span>
                  <span [class]="getStatusClass(assignment.status)">{{ assignment.status }}</span>
                  <span *ngIf="isOverdue(assignment)" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 animate-pulse">
                    ⏰ {{ 'assignments.overdue' | translate }}
                  </span>
                  <span class="text-sm text-gray-500">{{ assignment.code || 'AS-XXXXX' }}</span>
                </div>
                
                <h3 class="text-xl font-bold text-gray-900 mb-2">{{ assignment.title }}</h3>
                <p class="text-gray-600 mb-4 line-clamp-2">{{ assignment.description }}</p>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="flex items-center space-x-2">
                    <div class="p-2 bg-blue-50 rounded-lg">
                      <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">{{ 'assignments.dueDate' | translate }}</p>
                      <p class="text-sm font-semibold text-gray-900">{{ formatDate(assignment.dueDate) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <div class="p-2 bg-purple-50 rounded-lg">
                      <svg class="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">{{ 'assignments.maxPoints' | translate }}</p>
                      <p class="text-sm font-semibold text-gray-900">{{ assignment.maxPoints }}</p>
                    </div>
                  </div>
                  <div *ngIf="assignment.stats" class="flex items-center space-x-2">
                    <div class="p-2 bg-green-50 rounded-lg">
                      <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                        <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">{{ 'assignments.submissions' | translate }}</p>
                      <p class="text-sm font-semibold text-gray-900">{{ assignment.stats?.totalSubmissions || 0 }}</p>
                    </div>
                  </div>
                  <div *ngIf="assignment.stats" class="flex items-center space-x-2">
                    <div class="p-2 bg-indigo-50 rounded-lg">
                      <svg class="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500">{{ 'assignments.avgGrade' | translate }}</p>
                      <p class="text-sm font-semibold text-gray-900">{{ assignment.stats?.averageGrade || 0 }}%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex flex-col gap-2 ml-6">
                <button [routerLink]="['/dashboard/assignments', assignment._id]"
                        class="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors whitespace-nowrap">
                  {{ 'assignments.viewDetails' | translate }}
                </button>
                <button *ngIf="canEdit(assignment)" 
                        [routerLink]="['/dashboard/assignments', assignment._id, 'edit']"
                        class="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  {{ 'common.edit' | translate }}
                </button>
                <button *ngIf="canEdit(assignment)" 
                        (click)="cloneAssignment(assignment._id!)"
                        class="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap">
                  <svg class="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  {{ 'assignments.clone' | translate }}
                </button>
                <button *ngIf="isStudent && canSubmit(assignment)"
                        [routerLink]="['/dashboard/assignments', assignment._id, 'submit']"
                        class="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-lg transition-all shadow-sm">
                  {{ 'assignments.submitWork' | translate }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && assignments.length === 0" class="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12">
        <div class="text-center">
          <div class="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">{{ 'assignments.noAssignmentsFound' | translate }}</h3>
          <p class="text-gray-600 mb-6">
            {{ (filters.search || filters.type || filters.status ? 'assignments.tryAdjustingFilters' : 'assignments.getStartedCreating') | translate }}
          </p>
          <button 
            *ngIf="canCreateAssignment"
            [routerLink]="['/dashboard/assignments/new']"
            class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg transition-all transform hover:-translate-y-0.5">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ 'assignments.createFirstAssignment' | translate }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class AssignmentListComponent implements OnInit {
  assignments: Assignment[] = [];
  loading = false;
  currentUser: User | null = null;
  searchTimeout: any;
  viewMode: 'card' | 'table' = 'table';

  filters = {
    type: '',
    status: '',
    search: ''
  };

  // Bulk selection
  selectedAssignments: Set<string> = new Set();
  bulkActionInProgress = false;

  constructor(
    private assignmentService: AssignmentService,
    private toastService: ToastService,
    private authService: AuthService,
    public permissionService: PermissionService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user for role-based permissions
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadAssignments(); // Reload when user changes
    });
  }

  loadAssignments(): void {
    if (!this.currentUser) return;
    
    this.loading = true;
    const params: any = { page: 1, limit: 50 };
    if (this.filters.type) params.type = this.filters.type;
    if (this.filters.status) params.status = this.filters.status;
    if (this.filters.search) params.search = this.filters.search;

    // Role-specific data loading
    let observable;
    switch (this.currentUser.role) {
      case 'student':
        observable = this.assignmentService.getMyAssignments(params);
        break;
      case 'teacher':
        observable = this.assignmentService.getCurrentTeacherAssignments(params);
        break;
      case 'admin':
      default:
        observable = this.assignmentService.getAllAssignments(params);
        break;
    }

    observable.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Handle nested data structure
          const responseData = response.data as any;
          this.assignments = responseData.assignments || response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadAssignments(), 500);
  }

  resetFilters(): void {
    this.filters = { type: '', status: '', search: '' };
    this.loadAssignments();
  }

  // PERMISSION GETTERS (using PermissionService)
  get canCreateAssignment(): boolean {
    return this.permissionService.canCreateAssignment();
  }

  get isStudent(): boolean {
    return this.permissionService.isStudent();
  }
  
  get canExport(): boolean {
    return this.permissionService.canExportData();
  }

  canEdit(assignment: Assignment): boolean {
    return this.permissionService.canEditAssignment(assignment);
  }

  canSubmit(assignment: Assignment): boolean {
    return assignment.status === 'published' && !this.isOverdue(assignment);
  }

  isOverdue(assignment: Assignment): boolean {
    return new Date(assignment.dueDate) < new Date() && assignment.status === 'published';
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

  getStatusClass(status: string): string {
    const classes: any = {
      draft: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200',
      published: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200',
      closed: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200',
      graded: 'inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200'
    };
    return classes[status] || classes.draft;
  }

  exportAssignments(): void {
    if (this.assignments.length === 0) {
      this.toastService.warning(this.translate.instant('assignments.noAssignmentsToExport'));
      return;
    }

    const csvData = this.assignments.map(a => ({
      Code: a.code || 'N/A',
      Title: a.title,
      Type: a.type,
      Status: a.status,
      'Due Date': this.formatDate(a.dueDate),
      'Max Points': a.maxPoints,
      Submissions: a.stats?.totalSubmissions || 0,
      'Avg Grade': a.stats?.averageGrade || 0
    }));

    const headers = Object.keys(csvData[0]);
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${(row as any)[h]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assignments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.toastService.success(this.translate.instant('assignments.exportedSuccessfully'));
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

  // Bulk selection methods
  toggleSelectAll(): void {
    if (this.selectedAssignments.size === this.assignments.length) {
      this.selectedAssignments.clear();
    } else {
      this.assignments.forEach(a => this.selectedAssignments.add(a._id!));
    }
  }

  toggleSelectAssignment(assignmentId: string): void {
    if (this.selectedAssignments.has(assignmentId)) {
      this.selectedAssignments.delete(assignmentId);
    } else {
      this.selectedAssignments.add(assignmentId);
    }
  }

  isSelected(assignmentId: string): boolean {
    return this.selectedAssignments.has(assignmentId);
  }

  isAllSelected(): boolean {
    return this.assignments.length > 0 && this.selectedAssignments.size === this.assignments.length;
  }

  bulkDelete(): void {
    if (this.selectedAssignments.size === 0) {
      this.toastService.warning(this.translate.instant('assignments.pleaseSelectToDelete'));
      return;
    }

    this.bulkActionInProgress = true;
    const assignmentIds = Array.from(this.selectedAssignments);

    this.assignmentService.bulkDeleteAssignments(assignmentIds).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const { deleted, failed, totalRequested } = response.data;
          if (deleted.length > 0) {
            this.toastService.success(this.translate.instant('assignments.bulkDeleteSuccess', { deleted: deleted.length, total: totalRequested }));
          }
          if (failed.length > 0) {
            const failedReasons = failed.map((f: any) => `${f.title || f.id}: ${f.reason}`).join(', ');
            this.toastService.warning(this.translate.instant('assignments.bulkDeleteFailed', { failed: failed.length, reasons: failedReasons }));
          }
          this.selectedAssignments.clear();
          this.loadAssignments();
        }
        this.bulkActionInProgress = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.bulkActionInProgress = false;
      }
    });
  }

  bulkPublish(): void {
    if (this.selectedAssignments.size === 0) {
      this.toastService.warning(this.translate.instant('assignments.pleaseSelectToPublish'));
      return;
    }

    this.bulkActionInProgress = true;
    const assignmentIds = Array.from(this.selectedAssignments);

    this.assignmentService.bulkPublishAssignments(assignmentIds).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const { published, failed, totalRequested } = response.data;
          if (published.length > 0) {
            this.toastService.success(this.translate.instant('assignments.bulkPublishSuccess', { published: published.length, total: totalRequested }));
          }
          if (failed.length > 0) {
            const failedReasons = failed.map((f: any) => `${f.title || f.id}: ${f.reason}`).join(', ');
            this.toastService.warning(this.translate.instant('assignments.bulkPublishFailed', { failed: failed.length, reasons: failedReasons }));
          }
          this.selectedAssignments.clear();
          this.loadAssignments();
        }
        this.bulkActionInProgress = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.bulkActionInProgress = false;
      }
    });
  }

  bulkClose(): void {
    if (this.selectedAssignments.size === 0) {
      this.toastService.warning(this.translate.instant('assignments.pleaseSelectToClose'));
      return;
    }

    this.bulkActionInProgress = true;
    const assignmentIds = Array.from(this.selectedAssignments);

    this.assignmentService.bulkCloseAssignments(assignmentIds).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const { closed, failed, totalRequested } = response.data;
          if (closed.length > 0) {
            this.toastService.success(this.translate.instant('assignments.bulkCloseSuccess', { closed: closed.length, total: totalRequested }));
          }
          if (failed.length > 0) {
            const failedReasons = failed.map((f: any) => `${f.title || f.id}: ${f.reason}`).join(', ');
            this.toastService.warning(this.translate.instant('assignments.bulkCloseFailed', { failed: failed.length, reasons: failedReasons }));
          }
          this.selectedAssignments.clear();
          this.loadAssignments();
        }
        this.bulkActionInProgress = false;
      },
      error: (error) => {
        this.toastService.showApiError(error);
        this.bulkActionInProgress = false;
      }
    });
  }

  cloneAssignment(assignmentId: string): void {
    this.assignmentService.cloneAssignment(assignmentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(this.translate.instant('assignments.cloneSuccess'));
          this.loadAssignments();
        }
      },
      error: (error) => {
        this.toastService.showApiError(error);
      }
    });
  }
}
