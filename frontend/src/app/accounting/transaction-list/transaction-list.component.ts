import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../services/accounting.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button (click)="navigateBack()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">All Transactions</h1>
                <p class="mt-1 text-sm text-gray-500">View and manage your financial transactions</p>
              </div>
            </div>
            <button (click)="addNewTransaction()" 
                    class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all shadow-sm inline-flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select [(ngModel)]="filters.type" (ngModelChange)="onFiltersChange()" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select [(ngModel)]="filters.category" (ngModelChange)="onFiltersChange()" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">All Categories</option>
                <option *ngFor="let cat of getAllCategories()" [value]="cat.value">{{ cat.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input type="date" [(ngModel)]="filters.startDate" (ngModelChange)="onFiltersChange()" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input type="date" [(ngModel)]="filters.endDate" (ngModelChange)="onFiltersChange()" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between">
            <div *ngIf="hasActiveFilters()" class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">Active filters:</span>
              <span *ngIf="filters.type" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {{ filters.type === 'income' ? 'Income' : 'Expense' }}
              </span>
              <span *ngIf="filters.category" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                {{ accountingService.getCategoryLabel(filters.category) }}
              </span>
            </div>
            <button *ngIf="hasActiveFilters()" (click)="clearFilters()" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm font-medium">Total Income</p>
                <p class="text-3xl font-bold mt-2">{{ formatCurrency(summary.totalIncome) }}</p>
              </div>
              <div class="bg-white/20 p-3 rounded-lg">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-red-100 text-sm font-medium">Total Expenses</p>
                <p class="text-3xl font-bold mt-2">{{ formatCurrency(summary.totalExpenses) }}</p>
              </div>
              <div class="bg-white/20 p-3 rounded-lg">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
            </div>
          </div>
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-100 text-sm font-medium">Net Balance</p>
                <p class="text-3xl font-bold mt-2">{{ formatCurrency(summary.netBalance) }}</p>
              </div>
              <div class="bg-white/20 p-3 rounded-lg">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="isLoading" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Transactions Table -->
        <div *ngIf="!isLoading" class="bg-white rounded-xl shadow-sm border border-gray-200 mt-6 overflow-hidden"
             (click)="closeDropdown()">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                  <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Title</th>
                  <th class="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Amount</th>
                  <th class="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-100">
                <tr *ngFor="let transaction of transactions" class="hover:bg-gray-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {{ formatDate(transaction.transactionDate) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                          [class.bg-green-100]="transaction.type === 'income'"
                          [class.text-green-800]="transaction.type === 'income'"
                          [class.bg-red-100]="transaction.type === 'expense'"
                          [class.text-red-800]="transaction.type === 'expense'">
                      {{ transaction.type === 'income' ? 'Income' : 'Expense' }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {{ accountingService.getCategoryLabel(transaction.category) }}
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-900">
                    <div class="font-medium">{{ transaction.title }}</div>
                    <div *ngIf="transaction.description" class="text-xs text-gray-500 mt-1 truncate max-w-xs">
                      {{ transaction.description }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold"
                      [class.text-green-600]="transaction.type === 'income'"
                      [class.text-red-600]="transaction.type === 'expense'">
                    {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-center relative">
                    <div class="inline-block text-left" (click)="$event.stopPropagation()">
                      <button (click)="toggleDropdown(transaction._id || transaction.id, $event)"
                              class="inline-flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                      </button>
                      <div *ngIf="openDropdownId === (transaction._id || transaction.id)"
                           class="fixed z-[9999] w-48 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
                           [style.top.px]="dropdownTop"
                           [style.left.px]="dropdownLeft">
                        <div class="py-1">
                          <button (click)="editTransaction(transaction); closeDropdown()"
                                  class="group flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                            <svg class="mr-3 h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Edit
                          </button>
                          <div class="border-t border-gray-100"></div>
                          <button (click)="deleteTransaction(transaction); closeDropdown()"
                                  class="group flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors">
                            <svg class="mr-3 h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="transactions.length === 0">
                  <td colspan="6" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center">
                      <svg class="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                      </svg>
                      <p class="text-gray-500 text-lg font-medium">No transactions found</p>
                      <p class="text-gray-400 text-sm mt-1">Create your first transaction to get started</p>
                      <button (click)="addNewTransaction()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        Add Transaction
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div *ngIf="pagination.pages > 1" class="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div class="flex-1 flex justify-between sm:hidden">
              <button (click)="changePage(pagination.page - 1)" [disabled]="pagination.page === 1"
                      class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button (click)="changePage(pagination.page + 1)" [disabled]="pagination.page === pagination.pages"
                      class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm text-gray-700">
                  Showing <span class="font-medium">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
                  to <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                  of <span class="font-medium">{{ pagination.total }}</span> results
                </p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button (click)="changePage(pagination.page - 1)" [disabled]="pagination.page === 1"
                          class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                  <button *ngFor="let page of getVisiblePages()" (click)="changePage(page)"
                          [class.bg-blue-50]="page === pagination.page"
                          [class.border-blue-500]="page === pagination.page"
                          [class.text-blue-600]="page === pagination.page"
                          class="relative inline-flex items-center px-4 py-2 border text-sm font-medium hover:bg-gray-50">
                    {{ page }}
                  </button>
                  <button (click)="changePage(pagination.page + 1)" [disabled]="pagination.page === pagination.pages"
                          class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TransactionListComponent implements OnInit {
  transactions: any[] = [];
  isLoading = false;
  openDropdownId: string | null = null;
  dropdownPosition: 'top' | 'bottom' = 'bottom';
  dropdownTop: number = 0;
  dropdownLeft: number = 0;
  Math = Math;

  filters = {
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  };

  summary = {
    totalIncome: 0,
    totalExpenses: 0,
    netBalance: 0
  };

  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  };

  constructor(
    public accountingService: AccountingService,
    private toastService: ToastService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading = true;
    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit
    };

    if (this.filters.type) params.type = this.filters.type;
    if (this.filters.category) params.category = this.filters.category;
    if (this.filters.startDate) params.startDate = this.filters.startDate;
    if (this.filters.endDate) params.endDate = this.filters.endDate;

    this.accountingService.getTransactions(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.transactions = response.data.transactions || [];
          if (response.data.pagination) {
            this.pagination = {
              ...this.pagination,
              total: response.data.pagination.total,
              pages: response.data.pagination.pages
            };
          }
          this.calculateSummary();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        this.toastService.error('Failed to load transactions');
        this.isLoading = false;
      }
    });
  }

  calculateSummary(): void {
    this.summary.totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    this.summary.totalExpenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    this.summary.netBalance = this.summary.totalIncome - this.summary.totalExpenses;
  }

  getAllCategories(): { value: string; label: string }[] {
    const incomeCategories = this.accountingService.getIncomeCategories();
    const expenseCategories = this.accountingService.getExpenseCategories();
    const allCategories = [...incomeCategories, ...expenseCategories];
    
    return allCategories.map(cat => ({
      value: cat,
      label: this.accountingService.getCategoryLabel(cat)
    }));
  }

  onFiltersChange(): void {
    this.pagination.page = 1;
    this.loadTransactions();
  }

  clearFilters(): void {
    this.filters = {
      type: '',
      category: '',
      startDate: '',
      endDate: ''
    };
    this.pagination.page = 1;
    this.loadTransactions();
  }

  hasActiveFilters(): boolean {
    return !!(this.filters.type || this.filters.category || this.filters.startDate || this.filters.endDate);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.pagination.pages) {
      this.pagination.page = page;
      this.loadTransactions();
    }
  }

  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.pagination.page - Math.floor(maxVisible / 2));
    let end = Math.min(this.pagination.pages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  toggleDropdown(id: string, event?: MouseEvent): void {
    if (this.openDropdownId === id) {
      this.openDropdownId = null;
      return;
    }

    this.openDropdownId = id;

    if (event) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      const dropdownWidth = 192; // 48 * 4 = 192px (w-48)
      const dropdownHeight = 120; // Approximate height of 2 menu items
      
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Calculate horizontal position (align to right of button)
      this.dropdownLeft = rect.right - dropdownWidth;
      
      // Make sure dropdown doesn't go off left edge
      if (this.dropdownLeft < 10) {
        this.dropdownLeft = 10;
      }
      
      // Make sure dropdown doesn't go off right edge
      if (this.dropdownLeft + dropdownWidth > viewportWidth - 10) {
        this.dropdownLeft = viewportWidth - dropdownWidth - 10;
      }
      
      // Calculate vertical position
      if (spaceBelow >= dropdownHeight + 10) {
        // Enough space below, position below button
        this.dropdownTop = rect.bottom + 8;
        this.dropdownPosition = 'bottom';
      } else if (spaceAbove >= dropdownHeight + 10) {
        // Not enough space below but enough above, position above button
        this.dropdownTop = rect.top - dropdownHeight - 8;
        this.dropdownPosition = 'top';
      } else {
        // Not enough space either way, position below and let it scroll
        this.dropdownTop = rect.bottom + 8;
        this.dropdownPosition = 'bottom';
      }
      
      console.log('Dropdown positioning:', {
        spaceBelow,
        spaceAbove,
        position: this.dropdownPosition,
        top: this.dropdownTop,
        left: this.dropdownLeft,
        buttonRect: rect,
        viewportHeight,
        viewportWidth
      });
    }
  }

  closeDropdown(): void {
    this.openDropdownId = null;
  }

  addNewTransaction(): void {
    this.router.navigate(['/dashboard/accounting/transactions/new']);
  }

  editTransaction(transaction: any): void {
    this.router.navigate(['/dashboard/accounting/transactions', transaction._id || transaction.id, 'edit']);
  }

  async deleteTransaction(transaction: any): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Transaction',
      message: `Are you sure you want to delete "${transaction.title}"? This action cannot be undone.`,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed) {
      this.accountingService.deleteTransaction(transaction._id || transaction.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Transaction deleted successfully');
            this.loadTransactions();
          }
        },
        error: (error) => {
          console.error('Error deleting transaction:', error);
          this.toastService.error('Failed to delete transaction');
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return this.accountingService.formatCurrency(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard/accounting']);
  }
}

