import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountingService, FinancialSummary } from '../services/accounting.service';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-accounting-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Financial Management</h1>
              <p class="mt-1 text-sm text-gray-500">Track income, expenses, and student payments</p>
            </div>
            <div class="flex gap-3">
              <button routerLink="/dashboard/accounting/transactions/new" 
                      class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Add Transaction
              </button>
              <button routerLink="/dashboard/accounting/payments/new"
                      class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
                Record Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Period Selector -->
        <div class="mb-6 bg-white rounded-xl shadow-sm p-4">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700">Period:</label>
            <div class="flex gap-2">
              <button *ngFor="let p of periods" 
                      (click)="selectPeriod(p.value)"
                      [class.bg-blue-600]="selectedPeriod === p.value"
                      [class.text-white]="selectedPeriod === p.value"
                      [class.bg-gray-100]="selectedPeriod !== p.value"
                      [class.text-gray-700]="selectedPeriod !== p.value"
                      class="px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                {{ p.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
        </div>

        <div *ngIf="!isLoading && summary">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Total Income -->
            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-xl">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <h3 class="text-white/80 text-sm font-medium mb-1">Total Income</h3>
              <p class="text-3xl font-bold">{{ formatCurrency(summary.totalIncome) }}</p>
              <div class="mt-3 flex items-center text-sm">
                <span class="bg-white/20 px-2 py-1 rounded">This {{ getPeriodLabel() }}</span>
              </div>
            </div>

            <!-- Total Expenses -->
            <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-xl">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
              </div>
              <h3 class="text-white/80 text-sm font-medium mb-1">Total Expenses</h3>
              <p class="text-3xl font-bold">{{ formatCurrency(summary.totalExpenses) }}</p>
              <div class="mt-3 flex items-center text-sm">
                <span class="bg-white/20 px-2 py-1 rounded">This {{ getPeriodLabel() }}</span>
              </div>
            </div>

            <!-- Net Profit -->
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-xl">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                </div>
              </div>
              <h3 class="text-white/80 text-sm font-medium mb-1">Net Profit</h3>
              <p class="text-3xl font-bold">{{ formatCurrency(summary.netProfit) }}</p>
              <div class="mt-3 flex items-center text-sm">
                <span class="bg-white/20 px-2 py-1 rounded">Margin: {{ summary.profitMargin }}%</span>
              </div>
            </div>

            <!-- Student Payments -->
            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <div class="flex items-center justify-between mb-4">
                <div class="bg-white/20 p-3 rounded-xl">
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
              </div>
              <h3 class="text-white/80 text-sm font-medium mb-1">Student Payments</h3>
              <p class="text-3xl font-bold">{{ summary.studentPayments.paymentCount }}</p>
              <div class="mt-3 flex items-center text-sm">
                <span class="bg-white/20 px-2 py-1 rounded">{{ summary.studentPayments.totalStudents }} Students</span>
              </div>
            </div>
          </div>

          <!-- Attendance-Based Revenue Card (if available) -->
          <div *ngIf="summary.attendanceRevenue && summary.attendanceRevenue.total > 0" 
               class="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg p-6 mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-white text-xl font-bold mb-2">📊 Attendance-Based Revenue</h2>
                <p class="text-emerald-100 text-sm">Revenue calculated from marked attendance sessions</p>
                <div class="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-white/80 text-sm">Total Revenue</p>
                    <p class="text-3xl font-bold text-white">{{ formatCurrency(summary.attendanceRevenue.total) }}</p>
                  </div>
                  <div>
                    <p class="text-white/80 text-sm">Sessions Completed</p>
                    <p class="text-3xl font-bold text-white">{{ summary.attendanceRevenue.totalSessions }}</p>
                  </div>
                </div>
              </div>
              <div class="bg-white/20 p-4 rounded-2xl">
                <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
              </div>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Revenue by Groups -->
            <div *ngIf="summary.groupRevenue && summary.groupRevenue.length > 0" 
                 class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-6">💰 Revenue by Group</h2>
              <div class="space-y-3">
                <div *ngFor="let group of summary.groupRevenue" 
                     class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-md transition-all">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <h3 class="font-semibold text-gray-900">{{ group.name }}</h3>
                      <p class="text-xs text-gray-600">{{ group.code }} • {{ group.courseName }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-bold text-emerald-600">{{ formatCurrency(group.totalRevenue) }}</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-blue-200">
                    <div class="text-center">
                      <p class="text-xs text-gray-600">Sessions</p>
                      <p class="text-sm font-semibold text-gray-900">{{ group.totalSessions }}</p>
                    </div>
                    <div class="text-center">
                      <p class="text-xs text-gray-600">Students</p>
                      <p class="text-sm font-semibold text-gray-900">{{ group.studentCount }}</p>
                    </div>
                    <div class="text-center">
                      <p class="text-xs text-gray-600">Avg/Session</p>
                      <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(group.avgRevenuePerSession) }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-4 text-center">
                <a routerLink="/dashboard/groups" 
                   class="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All Groups →
                </a>
              </div>
            </div>

            <!-- Revenue by Courses -->
            <div *ngIf="summary.courseRevenue && summary.courseRevenue.length > 0" 
                 class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-6">📚 Revenue by Course</h2>
              <div class="space-y-3">
                <div *ngFor="let course of summary.courseRevenue" 
                     class="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all">
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <h3 class="font-semibold text-gray-900">{{ course.name }}</h3>
                      <p class="text-xs text-gray-600">{{ course.code }} • {{ course.subjectName }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-bold text-emerald-600">{{ formatCurrency(course.totalRevenue) }}</p>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-purple-200">
                    <div class="text-center">
                      <p class="text-xs text-gray-600">Sessions</p>
                      <p class="text-sm font-semibold text-gray-900">{{ course.totalSessions }}</p>
                    </div>
                    <div class="text-center">
                      <p class="text-xs text-gray-600">Avg/Session</p>
                      <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(course.avgRevenuePerSession) }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-4 text-center">
                <a routerLink="/dashboard/courses" 
                   class="text-sm text-purple-600 hover:text-purple-800 font-medium">
                  View All Courses →
                </a>
              </div>
            </div>
          </div>

          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Pending & Overdue Payments -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-6">💳 Revenue Status</h2>
              <div class="space-y-4">
                <!-- Total Revenue Earned -->
                <div class="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-300">
                  <div class="flex items-center gap-3">
                    <div class="bg-emerald-500 p-3 rounded-lg">
                      <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-bold text-gray-900 text-lg">Total Revenue Earned</p>
                      <p class="text-sm text-gray-600">
                        From {{ summary.studentPayments.totalSessions || 0 }} session(s) • 
                        {{ summary.studentPayments.totalStudents || 0 }} students enrolled
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-bold text-emerald-600">{{ formatCurrency(summary.studentPayments.totalRevenue) }}</p>
                    <p class="text-xs text-emerald-600 font-medium mt-1">✓ Collected via attendance</p>
                  </div>
                </div>

                <!-- Info Box: Attendance-Based System -->
                <div class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div class="flex items-start gap-3">
                    <div class="bg-blue-500 p-2 rounded-lg flex-shrink-0">
                      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div class="flex-1">
                      <p class="font-semibold text-gray-900 mb-1">📋 Attendance-Based Payment System</p>
                      <p class="text-sm text-gray-700 leading-relaxed">
                        Revenue is automatically calculated when you mark attendance. 
                        When a student is marked as <span class="font-semibold text-green-600">Present</span>, 
                        they are charged the session price ({{ summary.attendanceRevenue?.pricePerSession || 'varies' }} EGP/session).
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Revenue Breakdown -->
                <div class="grid grid-cols-2 gap-3">
                  <!-- Sessions Completed -->
                  <div class="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p class="text-xs font-medium text-gray-600">Sessions Completed</p>
                    </div>
                    <p class="text-2xl font-bold text-purple-600">{{ summary.studentPayments.totalSessions || 0 }}</p>
                  </div>

                  <!-- Students Enrolled -->
                  <div class="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div class="flex items-center gap-2 mb-2">
                      <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                      </svg>
                      <p class="text-xs font-medium text-gray-600">Total Students</p>
                    </div>
                    <p class="text-2xl font-bold text-blue-600">{{ summary.studentPayments.totalStudents || 0 }}</p>
                  </div>
                </div>

                <!-- Attendance Revenue Details -->
                <div *ngIf="summary.attendanceRevenue && summary.attendanceRevenue.total > 0"
                     class="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <svg class="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                      <p class="text-xs font-medium text-gray-700">Last Period Revenue</p>
                    </div>
                    <p class="text-sm font-bold text-teal-600">{{ formatCurrency(summary.attendanceRevenue.total) }}</p>
                  </div>
                  <p class="text-xs text-gray-600 mt-1 ml-6">
                    {{ summary.attendanceRevenue.totalSessions }} session(s) this {{ getPeriodLabel() }}
                  </p>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t">
                <a routerLink="/dashboard/attendance" 
                   class="inline-flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-lg font-medium transition-all shadow-sm">
                  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                  Mark Attendance to Generate Revenue
                </a>
              </div>
            </div>

            <!-- Category Breakdown -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-6">Category Breakdown</h2>
              <div class="space-y-3">
                <div *ngFor="let cat of getCategoryBreakdown()" class="relative">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">{{ cat.label }}</span>
                    <span class="text-sm font-bold" [class.text-green-600]="cat.type === 'income'" [class.text-red-600]="cat.type === 'expense'">
                      {{ formatCurrency(cat.total) }}
                    </span>
                  </div>
                  <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      class="h-2.5 rounded-full transition-all"
                      [class.bg-green-500]="cat.type === 'income'"
                      [class.bg-red-500]="cat.type === 'expense'"
                      [style.width.%]="cat.percentage">
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t">
                <a routerLink="/dashboard/accounting/reports" 
                   class="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                  View Full Report
                  <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a routerLink="/dashboard/accounting/transactions" 
                 class="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all group">
                <div class="bg-blue-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">Transactions</p>
                  <p class="text-sm text-gray-600">View all transactions</p>
                </div>
              </a>

              <a routerLink="/dashboard/accounting/payments" 
                 class="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all group">
                <div class="bg-green-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">Student Payments</p>
                  <p class="text-sm text-gray-600">Manage payments</p>
                </div>
              </a>

              <a routerLink="/dashboard/accounting/reports" 
                 class="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all group">
                <div class="bg-purple-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div>
                  <p class="font-semibold text-gray-900">Reports</p>
                  <p class="text-sm text-gray-600">Financial analytics</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AccountingDashboardComponent implements OnInit {
  isLoading = false;
  summary: FinancialSummary | null = null;
  selectedPeriod: string = 'month';
  
  periods = [
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Quarter', value: 'quarter' },
    { label: 'Year', value: 'year' }
  ];

  constructor(
    private accountingService: AccountingService,
    private toastService: ToastService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary() {
    this.isLoading = true;
    this.accountingService.getFinancialSummary({ period: this.selectedPeriod }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.summary = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load financial summary:', error);
        this.toastService.error('Failed to load financial data');
        this.isLoading = false;
      }
    });
  }

  selectPeriod(period: string) {
    this.selectedPeriod = period;
    this.loadSummary();
  }

  getPeriodLabel(): string {
    const period = this.periods.find(p => p.value === this.selectedPeriod);
    return period?.label.toLowerCase() || 'period';
  }

  formatCurrency(amount: number): string {
    return this.accountingService.formatCurrency(amount);
  }

  getPercentage(part: number, total: number): number {
    if (!total || total === 0) return 0;
    return Math.round((part / total) * 100);
  }

  getCategoryBreakdown(): any[] {
    if (!this.summary || !this.summary.categoryBreakdown) {
      return [];
    }

    // Calculate max for percentage
    const max = Math.max(...this.summary.categoryBreakdown.map((c: any) => Math.abs(c.total)));

    return this.summary.categoryBreakdown.slice(0, 8).map((cat: any) => ({
      label: this.accountingService.getCategoryLabel(cat._id.category),
      total: cat.total,
      type: cat._id.type,
      percentage: max > 0 ? (Math.abs(cat.total) / max) * 100 : 0
    }));
  }
}

