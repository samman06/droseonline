import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AccountingService } from '../../services/accounting.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-payment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TranslateModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button routerLink="/dashboard/accounting" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">{{ 'accounting.studentPayments.title' | translate }}</h1>
                <p class="mt-1 text-sm text-gray-500">{{ 'accounting.studentPayments.subtitle' | translate }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Info Box -->
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div class="flex items-start gap-4">
            <div class="bg-blue-500 p-3 rounded-lg">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ 'accounting.studentPayments.attendanceBasedSystem' | translate }}</h3>
              <p class="text-gray-700 mb-3">
                {{ 'accounting.studentPayments.systemDescription' | translate }}
                <span class="font-semibold text-green-600">{{ 'accounting.studentPayments.present' | translate }}</span>, 
                {{ 'accounting.studentPayments.chargedSessionPrice' | translate }}
              </p>
              <div class="bg-white rounded-lg p-4 border border-blue-200">
                <h4 class="font-semibold text-gray-900 mb-2">{{ 'accounting.studentPayments.howItWorks' | translate }}</h4>
                <ul class="space-y-2 text-sm text-gray-700">
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 font-bold">1.</span>
                    <span>{{ 'accounting.studentPayments.step1' | translate }}</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 font-bold">2.</span>
                    <span>{{ 'accounting.studentPayments.step2' | translate }}</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 font-bold">3.</span>
                    <span>{{ 'accounting.studentPayments.step3' | translate }}</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 font-bold">4.</span>
                    <span>{{ 'accounting.studentPayments.step4' | translate }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a routerLink="/dashboard/attendance" 
             class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group">
            <div class="flex items-center gap-4 mb-4">
              <div class="bg-green-500 p-4 rounded-xl group-hover:scale-110 transition-transform">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-lg">{{ 'accounting.studentPayments.markAttendance' | translate }}</h3>
                <p class="text-sm text-gray-600">{{ 'accounting.studentPayments.generateRevenue' | translate }}</p>
              </div>
            </div>
            <p class="text-sm text-gray-500">
              {{ 'accounting.studentPayments.markAttendanceDescription' | translate }}
            </p>
          </a>

          <a routerLink="/dashboard/accounting/transactions" 
             class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group">
            <div class="flex items-center gap-4 mb-4">
              <div class="bg-blue-500 p-4 rounded-xl group-hover:scale-110 transition-transform">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-lg">{{ 'accounting.studentPayments.viewTransactions' | translate }}</h3>
                <p class="text-sm text-gray-600">{{ 'accounting.studentPayments.allIncomeTransactions' | translate }}</p>
              </div>
            </div>
            <p class="text-sm text-gray-500">
              {{ 'accounting.studentPayments.viewTransactionsDescription' | translate }}
            </p>
          </a>

          <a routerLink="/dashboard/groups" 
             class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all group">
            <div class="flex items-center gap-4 mb-4">
              <div class="bg-purple-500 p-4 rounded-xl group-hover:scale-110 transition-transform">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-gray-900 text-lg">{{ 'accounting.studentPayments.manageGroups' | translate }}</h3>
                <p class="text-sm text-gray-600">{{ 'accounting.studentPayments.groupRevenueTracking' | translate }}</p>
              </div>
            </div>
            <p class="text-sm text-gray-500">
              {{ 'accounting.studentPayments.manageGroupsDescription' | translate }}
            </p>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StudentPaymentListComponent implements OnInit {
  
  constructor(
    private accountingService: AccountingService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Component initialized
  }
}

