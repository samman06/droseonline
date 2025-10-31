import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../services/accounting.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-payment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
                <h1 class="text-3xl font-bold text-gray-900">Student Payments</h1>
                <p class="mt-1 text-sm text-gray-500">Track student enrollment and session payments</p>
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
              <h3 class="text-lg font-semibold text-gray-900 mb-2">Attendance-Based Payment System</h3>
              <p class="text-gray-700 mb-3">
                In this system, student payments are automatically calculated and recorded when you mark attendance. 
                Each time a student is marked as <span class="font-semibold text-green-600">Present</span>, 
                they are automatically charged the session price.
              </p>
              <div class="bg-white rounded-lg p-4 border border-blue-200">
                <h4 class="font-semibold text-gray-900 mb-2">How It Works:</h4>
                <ul class="space-y-2 text-sm text-gray-700">
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 font-bold">1.</span>
                    <span>Go to <strong>Attendance</strong> page and mark students present/absent</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 font-bold">2.</span>
                    <span>System calculates: <code class="bg-gray-100 px-2 py-1 rounded">Present Students × Session Price = Revenue</code></span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 font-bold">3.</span>
                    <span>Revenue is automatically recorded as a transaction</span>
                  </li>
                  <li class="flex items-start gap-2">
                    <span class="text-blue-600 font-bold">4.</span>
                    <span>Group and course totals are updated instantly</span>
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
                <h3 class="font-bold text-gray-900 text-lg">Mark Attendance</h3>
                <p class="text-sm text-gray-600">Generate revenue from sessions</p>
              </div>
            </div>
            <p class="text-sm text-gray-500">
              Mark students as present to automatically record their session payments
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
                <h3 class="font-bold text-gray-900 text-lg">View Transactions</h3>
                <p class="text-sm text-gray-600">All income transactions</p>
              </div>
            </div>
            <p class="text-sm text-gray-500">
              View all student payment transactions recorded from attendance
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
                <h3 class="font-bold text-gray-900 text-lg">Manage Groups</h3>
                <p class="text-sm text-gray-600">Group revenue tracking</p>
              </div>
            </div>
            <p class="text-sm text-gray-500">
              View groups, pricing, and total revenue per group
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

