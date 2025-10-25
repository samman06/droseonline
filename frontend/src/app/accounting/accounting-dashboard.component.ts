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

          <!-- Two Column Layout -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Pending & Overdue Payments -->
            <div class="bg-white rounded-2xl shadow-lg p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-6">Payment Status</h2>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div class="flex items-center gap-3">
                    <div class="bg-yellow-500 p-2 rounded-lg">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">Pending Payments</p>
                      <p class="text-sm text-gray-600">Awaiting collection</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-yellow-600">{{ formatCurrency(summary.studentPayments.totalPending) }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                  <div class="flex items-center gap-3">
                    <div class="bg-red-500 p-2 rounded-lg">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">Overdue Payments</p>
                      <p class="text-sm text-gray-600">Requires attention</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-red-600">{{ formatCurrency(summary.studentPayments.totalOverdue) }}</p>
                  </div>
                </div>

                <div class="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div class="flex items-center gap-3">
                    <div class="bg-green-500 p-2 rounded-lg">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">Total Collected</p>
                      <p class="text-sm text-gray-600">From students</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-green-600">{{ formatCurrency(summary.studentPayments.totalRevenue) }}</p>
                  </div>
                </div>
              </div>

              <div class="mt-6 pt-6 border-t">
                <a routerLink="/dashboard/accounting/payments" 
                   class="inline-flex items-center justify-center w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                  View All Payments
                  <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                  </svg>
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

