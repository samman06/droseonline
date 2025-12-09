import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { GroupService } from '../../services/group.service';
import { ConfirmationService } from '../../services/confirmation.service';
import { TeacherService } from '../../services/teacher.service';
import { SubjectService } from '../../services/subject.service';
import { AuthService, User } from '../../services/auth.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  template: `
    <div class="space-y-6">
      <!-- Header Section with Enhanced Design -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-center space-x-4">
            <div class="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <div>
              <!-- Role-specific headers -->
              <h1 *ngIf="currentUser?.role === 'student'" class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {{ 'groups.myGroups' | translate }}
              </h1>
              <h1 *ngIf="currentUser?.role === 'teacher'" class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {{ 'groups.myTeachingGroups' | translate }}
              </h1>
              <h1 *ngIf="currentUser?.role === 'admin'" class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {{ 'groups.groupsManagement' | translate }}
              </h1>
              
              <!-- Role-specific descriptions -->
              <p *ngIf="currentUser?.role === 'student'" class="mt-1 text-gray-600">{{ 'groups.studentDesc' | translate }}</p>
              <p *ngIf="currentUser?.role === 'teacher'" class="mt-1 text-gray-600">{{ 'groups.teacherDesc' | translate }}</p>
              <p *ngIf="currentUser?.role === 'admin'" class="mt-1 text-gray-600">{{ 'groups.adminDesc' | translate }}</p>
              <div class="mt-2 flex items-center space-x-4 text-sm">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                  </svg>
                  {{ groups.length }} {{ 'groups.groups' | translate }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-4 lg:mt-0 flex space-x-3">
            <!-- View Toggle -->
            <div class="inline-flex bg-white rounded-lg border border-gray-300 p-1">
              <button 
                (click)="viewMode = 'card'"
                [class]="viewMode === 'card' 
                  ? 'px-3 py-2 bg-indigo-600 text-white rounded-md shadow-sm font-medium transition-all' 
                  : 'px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-all'"
                [title]="'common.cardView' | translate"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                </svg>
              </button>
              <button 
                (click)="viewMode = 'table'"
                [class]="viewMode === 'table' 
                  ? 'px-3 py-2 bg-indigo-600 text-white rounded-md shadow-sm font-medium transition-all' 
                  : 'px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-all'"
                [title]="'common.tableView' | translate"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                </svg>
              </button>
            </div>
            
            <!-- Export button - Only for admin and teachers -->
            <button 
              *ngIf="canExport"
              (click)="exportGroups()" 
              class="btn-secondary inline-flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              [disabled]="groups.length === 0"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              {{ 'groups.exportData' | translate }}
            </button>
            
            <!-- Create button - Only for admin and teachers -->
            <button 
              *ngIf="canCreate"
              (click)="navigateToCreate()" 
              class="btn-primary inline-flex items-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              {{ 'groups.addNewGroup' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Enhanced Filters Section -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <!-- Filters Header -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">{{ 'groups.filters' | translate }}</h3>
          <button (click)="clearFilters()" class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
            {{ 'groups.clearFilters' | translate }}
          </button>
        </div>

        <!-- Active Filter Chips -->
        <div *ngIf="hasActiveFilters()" class="flex flex-wrap gap-2 mb-3">
          <span *ngIf="filters.search" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {{ 'groups.search' | translate }}: {{ filters.search }}
            <button (click)="removeFilter('search')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.teacherId && currentUser?.role === 'admin'" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {{ 'groups.teacher' | translate }}: {{ getTeacherName(filters.teacherId) }}
            <button (click)="removeFilter('teacherId')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.subjectId" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {{ 'groups.subject' | translate }}: {{ getSubjectName(filters.subjectId) }}
            <button (click)="removeFilter('subjectId')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
          <span *ngIf="filters.gradeLevel && currentUser?.role !== 'student'" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {{ 'groups.grade' | translate }}: {{ filters.gradeLevel }}
            <button (click)="removeFilter('gradeLevel')" class="ml-2 text-indigo-600 hover:text-indigo-800">×</button>
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div>
            <input 
              class="form-input" 
              [placeholder]="'groups.searchPlaceholder' | translate"
              [(ngModel)]="filters.search" 
              (ngModelChange)="onSearchChange($event)" 
            />
          </div>
          
          <!-- Teacher Filter - Only for admin -->
          <div *ngIf="currentUser?.role === 'admin'">
            <select class="form-select" [(ngModel)]="filters.teacherId" (ngModelChange)="onFiltersChange()">
              <option value="">{{ 'groups.allTeachers' | translate }}</option>
              <option *ngFor="let t of teachers" [value]="t.id || t._id">{{ t.fullName || (t.firstName + ' ' + t.lastName) }}</option>
            </select>
          </div>
          
          <!-- Subject Filter -->
          <div>
            <select class="form-select" [(ngModel)]="filters.subjectId" (ngModelChange)="onFiltersChange()">
              <option value="">{{ 'groups.allSubjects' | translate }}</option>
              <option *ngFor="let s of subjects" [value]="s.id || s._id">{{ s.name }} ({{ s.code }})</option>
            </select>
          </div>
          
          <!-- Grade Filter - Hidden for students (they only see their grade) -->
          <div *ngIf="currentUser?.role !== 'student'">
            <select class="form-select" [(ngModel)]="filters.gradeLevel" (ngModelChange)="onFiltersChange()">
              <option value="">{{ 'groups.allGrades' | translate }}</option>
              <option *ngFor="let g of grades" [value]="g">{{ g }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table View -->
      <div *ngIf="viewMode === 'table'" class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ 'groups.groupName' | translate }}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ 'groups.teacherSubject' | translate }}</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{{ 'groups.schedule' | translate }}</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{{ 'groups.students' | translate }}</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{{ 'groups.status' | translate }}</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{{ 'groups.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200" *ngIf="!isLoading">
              <tr *ngFor="let g of groups" class="hover:bg-gray-50 transition-colors">
                <!-- Group Name + Code -->
                <td class="px-6 py-4">
                  <div class="text-sm font-semibold text-gray-900">
                    <a [routerLink]="['/dashboard/groups', g.id || g._id]" class="hover:text-indigo-600 transition-colors">
                      {{ g.name }}
                    </a>
                  </div>
                  <div class="text-xs text-gray-500 mt-0.5">{{ g.code }}</div>
                </td>

                <!-- Teacher + Subject -->
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ g.course?.teacher?.fullName || '—' }}</div>
                  <div class="text-xs text-gray-500 mt-0.5">{{ g.course?.subject?.name || '—' }}</div>
                </td>

                <!-- Schedule --> 
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ g.gradeLevel }}</div>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span *ngFor="let s of g.schedule?.slice(0, 2)" 
                          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">
                      {{ s.day }}: {{ s.startTime }}
                    </span>
                    <span *ngIf="g.schedule?.length > 2" class="text-xs text-gray-500">
                      +{{ g.schedule.length - 2 }}
                    </span>
                  </div>
                </td>

                <!-- Students Count -->
                <td class="px-6 py-4 text-center">
                  <span class="inline-flex items-center justify-center px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-100 text-indigo-700 border-2 border-indigo-200">
                    <svg class="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                    </svg>
                    {{ g.studentCount || 0 }}/{{ g.capacity || 30 }}
                  </span>
                </td>

                <!-- Status -->
                <td class="px-6 py-4 text-center">
                  <span 
                    *ngIf="(g.studentCount || 0) >= (g.capacity || 30)"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                    {{ 'groups.full' | translate }}
                  </span>
                  <span 
                    *ngIf="(g.studentCount || 0) < (g.capacity || 30)"
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                    {{ 'groups.active' | translate }}
                  </span>
                </td>
                <!-- Actions -->
                <td class="px-6 py-4 text-right">
                  <div class="relative inline-block text-left">
                    <button (click)="toggleDropdown(g.id || g._id, $event)" class="inline-flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200">
                      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <div 
                      *ngIf="openDropdownId === (g.id || g._id)" 
                      [class]="dropdownPosition === 'top' 
                        ? 'absolute right-0 z-50 bottom-full mb-2 w-48 origin-bottom-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'
                        : 'absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'"
                    >
                      <div class="py-1">
                        <!-- View Details - Available to all roles -->
                        <button (click)="viewGroup(g); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-150">
                          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                          {{ 'groups.viewDetails' | translate }}
                        </button>
                        
                        <!-- Edit - Only if user has permission -->
                        <button *ngIf="canEdit(g)" (click)="editGroup(g); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150">
                          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                          {{ 'groups.edit' | translate }}
                        </button>
                        
                        <!-- Delete - Only if user has permission -->
                        <div *ngIf="canDelete(g)" class="border-t border-gray-100"></div>
                        <button *ngIf="canDelete(g)" (click)="deleteGroup(g); closeDropdown()" class="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors duration-150">
                          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                          {{ 'groups.delete' | translate }}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody *ngIf="isLoading">
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">{{ 'groups.loading' | translate }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Card View - Enhanced Modern Design -->
      <div *ngIf="viewMode === 'card'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Loading State -->
        <div *ngIf="isLoading" class="col-span-full flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>

        <!-- Group Cards - Enhanced -->
        <div *ngFor="let g of groups" 
             class="group bg-white rounded-2xl shadow-lg border-2 border-gray-200 hover:border-indigo-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
             (click)="viewGroup(g)">
          
          <!-- Gradient Header with Status -->
          <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div class="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            
            <div class="relative">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
                    {{ g.name }}
                  </h3>
                  <p class="text-indigo-100 text-sm font-medium">{{ g.code }}</p>
                </div>
                <!-- Status Badge -->
                <span 
                  *ngIf="(g.studentCount || 0) >= (g.capacity || 30)"
                  class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-red-500 text-white shadow-lg animate-pulse">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                  {{ 'groups.full' | translate }}
                </span>
                <span 
                  *ngIf="(g.studentCount || 0) < (g.capacity || 30)"
                  class="inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full bg-green-500 text-white shadow-lg">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                  {{ 'groups.active' | translate }}
                </span>
              </div>
              <div class="text-indigo-100 text-sm">{{ g.gradeLevel }}</div>
            </div>
          </div>

          <div class="p-6">
            <!-- Teacher & Subject -->
            <div class="space-y-2 mb-4">
              <div class="flex items-center text-sm">
                <div class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                  </svg>
                </div>
                <span class="font-medium text-gray-900">{{ g.course?.teacher?.fullName || '—' }}</span>
              </div>
              <div class="flex items-center text-sm">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                </div>
                <span class="font-medium text-gray-900">{{ g.course?.subject?.name || '—' }}</span>
              </div>
            </div>

            <!-- Stats Box -->
            <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 mb-4 border border-indigo-200">
              <div class="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div class="text-2xl font-bold text-indigo-600">{{ g.studentCount || 0 }}</div>
                  <div class="text-xs text-gray-600 mt-1">{{ 'groups.studentsEnrolled' | translate }}</div>
                  <div class="text-xs text-gray-400">/ {{ g.capacity || 30 }}</div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-purple-600">{{ g.assignmentCount?.total || 0 }}</div>
                  <div class="text-xs text-gray-600 mt-1">{{ 'groups.assignments' | translate }}</div>
                  <div class="text-xs text-green-600" *ngIf="g.assignmentCount?.published > 0">
                    {{ g.assignmentCount.published }} {{ 'groups.published' | translate }}
                  </div>
                </div>
                <div>
                  <div class="text-2xl font-bold text-pink-600">{{ g.schedule?.length || 0 }}</div>
                  <div class="text-xs text-gray-600 mt-1">{{ 'groups.sessions' | translate }}</div>
                  <div class="text-xs text-gray-400">{{ 'groups.perWeek' | translate }}</div>
                </div>
              </div>
            </div>

            <!-- Schedule Badges -->
            <div class="mb-4">
              <div class="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">{{ 'groups.schedule' | translate }}</div>
              <div class="flex flex-wrap gap-2">
                <span *ngFor="let s of g.schedule" 
                      class="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm border-2"
                      [ngClass]="getDayColorClass(s.day)">
                  <svg class="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                  </svg>
                  {{ s.day | titlecase }}: {{ s.startTime }}
                </span>
                <span *ngIf="!g.schedule || g.schedule.length === 0" class="text-xs text-gray-400 italic">
                  {{ 'groups.noSchedule' | translate }}
                </span>
              </div>
            </div>

            <!-- Action Buttons - Enhanced with Icons -->
            <div class="flex gap-2">
              <button 
                (click)="viewGroup(g); $event.stopPropagation()"
                class="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                {{ 'groups.view' | translate }}
              </button>
              <button 
                *ngIf="canEdit(g)"
                (click)="editGroup(g); $event.stopPropagation()"
                class="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm font-semibold">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                {{ 'groups.edit' | translate }}
              </button>
              <button 
                *ngIf="canDelete(g)"
                (click)="deleteGroup(g); $event.stopPropagation()"
                class="px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State - Enhanced -->
        <div *ngIf="!isLoading && groups.length === 0" class="col-span-full">
          <div class="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-2xl border-2 border-dashed border-indigo-300">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
              <svg class="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900">{{ 'groups.noGroupsFound' | translate }}</h3>
            <p class="mt-2 text-sm text-gray-600">{{ 'groups.tryAdjustingFilters' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-input { @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200; }
    .form-select { @apply w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white; }
    .btn-primary { @apply inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200; }
    .btn-secondary { @apply inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500; }
  `]
})
export class GroupListComponent implements OnInit {
  groups: any[] = [];
  isLoading = false;
  openDropdownId: string | null = null;
  dropdownPosition: 'top' | 'bottom' = 'bottom';
  private searchDebounce: any;
  viewMode: 'card' | 'table' = 'table'; // Default to table view

  // Role-based properties
  currentUser: User | null = null;

  filters: any = { search: '', teacherId: '', subjectId: '', gradeLevel: '' };
  readonly grades = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'];

  teachers: any[] = [];
  subjects: any[] = [];

  constructor(
    private groupService: GroupService,
    private teacherService: TeacherService,
    private subjectService: SubjectService,
    private router: Router,
    private confirmation: ConfirmationService,
    private authService: AuthService,
    public permissionService: PermissionService,
    private translate: TranslateService
  ) {}

  // ==========================================
  // PERMISSION GETTERS (for template use)
  // ==========================================

  /**
   * Check if user can create groups
   */
  get canCreate(): boolean {
    return this.permissionService.canCreateGroup();
  }

  /**
   * Check if user can export data
   */
  get canExport(): boolean {
    return this.permissionService.canExportData();
  }

  /**
   * Check if user can edit a specific group
   */
  canEdit(group: any): boolean {
    return this.permissionService.canEditGroup(group);
  }

  /**
   * Check if user can delete a specific group
   */
  canDelete(group: any): boolean {
    return this.permissionService.canDeleteGroup(group);
  }

  /**
   * Check if user can join a group (students only)
   */
  canJoin(group: any): boolean {
    return this.permissionService.canJoinGroup() && !group.isEnrolled;
  }

  /**
   * Check if user can leave a group (students only)
   */
  canLeave(group: any): boolean {
    return this.permissionService.canLeaveGroup() && group.isEnrolled;
  }

  ngOnInit(): void {
    // Subscribe to current user for role-based logic
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadGroups(); // Reload groups when user changes
    });

    // Load filter data (teachers and subjects)
    this.teacherService.getTeachers({ page: 1, limit: 100 }).subscribe({
      next: res => { const list = res.data?.teachers || res.data || []; this.teachers = Array.isArray(list) ? list : []; }
    });
    this.subjectService.getSubjects({ page: 1, limit: 100 }).subscribe({
      next: res => { const list = res.data?.subjects || res.data || []; this.subjects = Array.isArray(list) ? list : []; }
    });
  }

  /**
   * Load groups based on current user's role
   * - Student: Load only enrolled groups (getMyGroups)
   * - {{ 'groups.teacher' | translate }}: Load groups they teach (getTeacherGroups)
   * - Admin: Load all groups (getAllGroups)
   */
  loadGroups(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    
    // Role-specific data fetching
    let observable;
    switch (this.currentUser.role) {
      case 'student':
        observable = this.groupService.getMyGroups(this.filters);
        break;
      case 'teacher':
        observable = this.groupService.getTeacherGroups(this.filters);
        break;
      case 'admin':
      default:
        observable = this.groupService.getAllGroups(this.filters);
        break;
    }

    observable.subscribe({
      next: (res) => {
        if (res.success) {
          if (res.data?.groups) this.groups = res.data.groups; 
          else if (Array.isArray(res.data)) this.groups = res.data; 
          else this.groups = [];
        } else { 
          this.groups = []; 
        }
        this.isLoading = false;
      },
      error: _ => { 
        this.isLoading = false; 
      }
    });
  }

  onFiltersChange(): void { this.loadGroups(); }
  
  onSearchChange(value: string): void {
    if (this.searchDebounce) {
      clearTimeout(this.searchDebounce);
    }
    this.searchDebounce = setTimeout(() => {
      this.loadGroups();
    }, 300);
  }

  clearFilters(): void {
    this.filters = { search: '', teacherId: '', subjectId: '', gradeLevel: '' };
    this.loadGroups();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.search || this.filters.teacherId || this.filters.subjectId || this.filters.gradeLevel);
  }

  removeFilter(key: 'search' | 'teacherId' | 'subjectId' | 'gradeLevel'): void {
    (this.filters as any)[key] = '';
    this.loadGroups();
  }

  getTeacherName(teacherId: string): string {
    const teacher = this.teachers.find(t => (t.id || t._id) === teacherId);
    return teacher ? (teacher.fullName || (teacher.firstName + ' ' + teacher.lastName)) : 'Unknown';
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => (s.id || s._id) === subjectId);
    return subject ? `${subject.name} (${subject.code})` : 'Unknown';
  }
  navigateToCreate(): void { this.router.navigate(['/dashboard/groups/new']); }
  viewGroup(g: any): void { this.router.navigate(['/dashboard/groups', g.id || g._id]); }
  editGroup(g: any): void { this.router.navigate(['/dashboard/groups', g.id || g._id, 'edit']); }

  async deleteGroup(g: any): Promise<void> {
    const confirmed = await this.confirmation.confirm({ 
      title: this.translate.instant('groups.confirmDelete'), 
      message: `${this.translate.instant('groups.deleteWarning')}`, 
      confirmText: this.translate.instant('groups.delete'), 
      cancelText: this.translate.instant('groups.cancel'), 
      type: 'danger' 
    });
    if (!confirmed) return;
    this.groupService.deleteGroup(g.id || g._id).subscribe({ next: _ => this.loadGroups() });
  }

  toggleDropdown(id: string, event?: MouseEvent): void {
    if (this.openDropdownId === id) {
      this.openDropdownId = null;
      return;
    }

    this.openDropdownId = id;

    // Calculate position dynamically
    if (event) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      
      // If less than 250px below, position dropdown above
      this.dropdownPosition = spaceBelow < 250 ? 'top' : 'bottom';
    }
  }
  
  closeDropdown(): void { this.openDropdownId = null; }
  
  getDayColorClass(day: string): string {
    const dayLower = day.toLowerCase();
    const colorMap: {[key: string]: string} = {
      'sunday': 'bg-purple-100 text-purple-800 border border-purple-300',
      'monday': 'bg-blue-100 text-blue-800 border border-blue-300',
      'tuesday': 'bg-green-100 text-green-800 border border-green-300',
      'wednesday': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      'thursday': 'bg-orange-100 text-orange-800 border border-orange-300',
      'friday': 'bg-red-100 text-red-800 border border-red-300',
      'saturday': 'bg-pink-100 text-pink-800 border border-pink-300'
    };
    return colorMap[dayLower] || 'bg-gray-100 text-gray-800 border border-gray-300';
  }

  // Export method
  exportGroups(): void {
    if (this.groups.length === 0) return;
    
    // Create CSV content
    const headers = ['Group Name', 'Code', 'Teacher', 'Subject', 'Grade Level', 'Students', 'Assignments'];
    const csvContent = [
      headers.join(','),
      ...this.groups.map(group => [
        `"${group.name}"`,
        group.code || '',
        `"${group.course?.teacher?.fullName || ''}"`,
        `"${group.course?.subject?.name || ''}"`,
        group.gradeLevel || '',
        group.currentEnrollment || 0,
        group.assignmentCount?.total || 0
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groups_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
