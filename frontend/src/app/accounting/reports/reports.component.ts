import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountingService, FinancialSummary } from '../../services/accounting.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-accounting-reports',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule],
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
                <h1 class="text-3xl font-bold text-gray-900">{{ 'accounting.reports.financialReports' | translate }}</h1>
                <p class="mt-1 text-sm text-gray-500">{{ 'accounting.reports.comprehensiveAnalysis' | translate }}</p>
              </div>
            </div>
            <button (click)="exportReport()" 
                    class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              {{ 'accounting.reports.exportReport' | translate }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading && summary" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 class="text-white/80 text-sm font-medium mb-2">{{ 'accounting.reports.totalIncome' | translate }}</h3>
            <p class="text-3xl font-bold">{{ formatCurrency(summary.totalIncome) }}</p>
          </div>
          <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 class="text-white/80 text-sm font-medium mb-2">{{ 'accounting.reports.totalExpenses' | translate }}</h3>
            <p class="text-3xl font-bold">{{ formatCurrency(summary.totalExpenses) }}</p>
          </div>
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 class="text-white/80 text-sm font-medium mb-2">{{ 'accounting.reports.netProfit' | translate }}</h3>
            <p class="text-3xl font-bold">{{ formatCurrency(summary.netProfit) }}</p>
          </div>
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 class="text-white/80 text-sm font-medium mb-2">{{ 'accounting.reports.profitMargin' | translate }}</h3>
            <p class="text-3xl font-bold">{{ calculateProfitMargin() }}%</p>
          </div>
        </div>

        <!-- Income vs Expenses Chart Placeholder -->
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-6">{{ 'accounting.reports.incomeVsExpensesOverview' | translate }}</h2>
          <div class="grid grid-cols-2 gap-6">
            <div class="text-center p-8 bg-green-50 rounded-xl border-2 border-green-200">
              <div class="text-6xl font-bold text-green-600">{{ formatCurrency(summary.totalIncome) }}</div>
              <p class="text-lg font-medium text-gray-700 mt-2">{{ 'accounting.reports.totalIncome' | translate }}</p>
            </div>
            <div class="text-center p-8 bg-red-50 rounded-xl border-2 border-red-200">
              <div class="text-6xl font-bold text-red-600">{{ formatCurrency(summary.totalExpenses) }}</div>
              <p class="text-lg font-medium text-gray-700 mt-2">{{ 'accounting.reports.totalExpenses' | translate }}</p>
            </div>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Income Breakdown -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6">{{ 'accounting.reports.incomeByCategory' | translate }}</h2>
            <div class="space-y-4">
              <div *ngFor="let cat of getIncomeBreakdown()" class="border-b border-gray-100 pb-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-700">{{ cat.label }}</span>
                  <span class="font-bold text-green-600">{{ formatCurrency(cat.total) }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-green-500 h-2 rounded-full" [style.width.%]="cat.percentage"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ cat.percentage.toFixed(1) }}% {{ 'accounting.reports.ofTotalIncome' | translate }}</p>
              </div>
            </div>
          </div>

          <!-- Expense Breakdown -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-6">{{ 'accounting.reports.expensesByCategory' | translate }}</h2>
            <div class="space-y-4">
              <div *ngFor="let cat of getExpenseBreakdown()" class="border-b border-gray-100 pb-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-700">{{ cat.label }}</span>
                  <span class="font-bold text-red-600">{{ formatCurrency(cat.total) }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-red-500 h-2 rounded-full" [style.width.%]="cat.percentage"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">{{ cat.percentage.toFixed(1) }}% {{ 'accounting.reports.ofTotalExpenses' | translate }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Revenue by Group -->
        <div *ngIf="summary.groupRevenue && summary.groupRevenue.length > 0" class="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-6">{{ 'accounting.reports.revenueByGroup' | translate }}</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">{{ 'accounting.reports.group' | translate }}</th>
                  <th class="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">{{ 'accounting.reports.course' | translate }}</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">{{ 'accounting.reports.students' | translate }}</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">{{ 'accounting.reports.sessions' | translate }}</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">{{ 'accounting.reports.revenue' | translate }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr *ngFor="let group of summary.groupRevenue" class="hover:bg-gray-50">
                  <td class="px-6 py-4 font-medium text-gray-900">{{ group.name }}</td>
                  <td class="px-6 py-4 text-gray-600">{{ group.courseName }}</td>
                  <td class="px-6 py-4 text-right text-gray-900">{{ group.studentCount }}</td>
                  <td class="px-6 py-4 text-right text-gray-900">{{ group.totalSessions }}</td>
                  <td class="px-6 py-4 text-right font-bold text-green-600">{{ formatCurrency(group.totalRevenue) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ReportsComponent implements OnInit {
  isLoading = false;
  summary: FinancialSummary | null = null;

  constructor(
    private accountingService: AccountingService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading = true;
    this.accountingService.getFinancialSummary().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.summary = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading financial summary:', error);
        this.toastService.error(this.translate.instant('accounting.reports.failedToLoad'));
        this.isLoading = false;
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  calculateProfitMargin(): string {
    if (!this.summary || this.summary.totalIncome === 0) return '0';
    const margin = (this.summary.netProfit / this.summary.totalIncome) * 100;
    return margin.toFixed(1);
  }

  getIncomeBreakdown(): any[] {
    if (!this.summary || !this.summary.categoryBreakdown) return [];
    const total = this.summary.totalIncome;
    return this.summary.categoryBreakdown
      .filter((cat: any) => cat.type === 'income')
      .map((cat: any) => ({
        category: cat.category,
        label: cat.label,
        total: cat.total,
        percentage: total > 0 ? (cat.total / total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  getExpenseBreakdown(): any[] {
    if (!this.summary || !this.summary.categoryBreakdown) return [];
    const total = this.summary.totalExpenses;
    return this.summary.categoryBreakdown
      .filter((cat: any) => cat.type === 'expense')
      .map((cat: any) => ({
        category: cat.category,
        label: cat.label,
        total: cat.total,
        percentage: total > 0 ? (cat.total / total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  exportReport(): void {
    this.toastService.info(this.translate.instant('accounting.reports.exportComingSoon'));
  }
}

