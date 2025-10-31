import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AccountingService } from '../../services/accounting.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- Header -->
      <div class="bg-white shadow-sm border-b sticky top-0 z-10">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button (click)="navigateBack()" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div>
              <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? 'Edit Transaction' : 'Add Transaction' }}</h1>
              <p class="mt-1 text-sm text-gray-500">{{ isEditMode ? 'Update transaction details' : 'Record income or expense transaction' }}</p>
              </div>
            </div>
            <div class="flex space-x-3">
              <button (click)="onCancel()" type="button" 
                      [disabled]="isSubmitting"
                      class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button (click)="onSubmit()" type="button"
                      [disabled]="isSubmitting || transactionForm.invalid"
                      class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center">
                <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSubmitting ? 'Saving...' : (isEditMode ? 'Update Transaction' : 'Save Transaction') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form [formGroup]="transactionForm" class="space-y-6">
          <!-- Transaction Type Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Transaction Type</h2>
            
            <div class="grid grid-cols-2 gap-4">
              <label class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                     [class.border-green-500]="transactionForm.get('type')?.value === 'income'"
                     [class.bg-green-50]="transactionForm.get('type')?.value === 'income'"
                     [class.border-gray-200]="transactionForm.get('type')?.value !== 'income'"
                     [class.hover:border-gray-300]="transactionForm.get('type')?.value !== 'income'">
                <input type="radio" formControlName="type" value="income" class="sr-only">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <div class="p-2 rounded-lg" [class.bg-green-500]="transactionForm.get('type')?.value === 'income'" [class.bg-gray-200]="transactionForm.get('type')?.value !== 'income'">
                      <svg class="w-6 h-6" [class.text-white]="transactionForm.get('type')?.value === 'income'" [class.text-gray-600]="transactionForm.get('type')?.value !== 'income'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">Income</p>
                      <p class="text-sm text-gray-500">Money received</p>
                    </div>
                  </div>
                </div>
              </label>

              <label class="relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all"
                     [class.border-red-500]="transactionForm.get('type')?.value === 'expense'"
                     [class.bg-red-50]="transactionForm.get('type')?.value === 'expense'"
                     [class.border-gray-200]="transactionForm.get('type')?.value !== 'expense'"
                     [class.hover:border-gray-300]="transactionForm.get('type')?.value !== 'expense'">
                <input type="radio" formControlName="type" value="expense" class="sr-only">
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <div class="p-2 rounded-lg" [class.bg-red-500]="transactionForm.get('type')?.value === 'expense'" [class.bg-gray-200]="transactionForm.get('type')?.value !== 'expense'">
                      <svg class="w-6 h-6" [class.text-white]="transactionForm.get('type')?.value === 'expense'" [class.text-gray-600]="transactionForm.get('type')?.value !== 'expense'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">Expense</p>
                      <p class="text-sm text-gray-500">Money spent</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <div *ngIf="transactionForm.get('type')?.invalid && transactionForm.get('type')?.touched" class="mt-2 text-sm text-red-600">
              Please select a transaction type
            </div>
          </div>

          <!-- Transaction Details Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select formControlName="category" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option value="">Select category</option>
                  <option *ngFor="let cat of getAvailableCategories()" [value]="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
                <div *ngIf="transactionForm.get('category')?.invalid && transactionForm.get('category')?.touched" class="mt-1 text-sm text-red-600">
                  Category is required
                </div>
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Amount (EGP) *</label>
                <div class="relative">
                  <input type="number" formControlName="amount" step="0.01" min="0" 
                         class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                         placeholder="0.00">
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span class="text-gray-500 text-sm">EGP</span>
                  </div>
                </div>
                <div *ngIf="transactionForm.get('amount')?.invalid && transactionForm.get('amount')?.touched" class="mt-1 text-sm text-red-600">
                  <span *ngIf="transactionForm.get('amount')?.errors?.['required']">Amount is required</span>
                  <span *ngIf="transactionForm.get('amount')?.errors?.['min']">Amount must be greater than 0</span>
                </div>
              </div>

              <!-- Title -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input type="text" formControlName="title" 
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                       placeholder="e.g., Assistant Salary - November 2025">
                <div *ngIf="transactionForm.get('title')?.invalid && transactionForm.get('title')?.touched" class="mt-1 text-sm text-red-600">
                  <span *ngIf="transactionForm.get('title')?.errors?.['required']">Title is required</span>
                  <span *ngIf="transactionForm.get('title')?.errors?.['minlength']">Title must be at least 3 characters</span>
                  <span *ngIf="transactionForm.get('title')?.errors?.['maxlength']">Title must not exceed 100 characters</span>
                </div>
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea formControlName="description" rows="3"
                          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                          placeholder="Add notes or details about this transaction..."></textarea>
              </div>
            </div>
          </div>

          <!-- Payment Information Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Transaction Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Transaction Date *</label>
                <input type="date" formControlName="transactionDate" 
                       [max]="today"
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <div *ngIf="transactionForm.get('transactionDate')?.invalid && transactionForm.get('transactionDate')?.touched" class="mt-1 text-sm text-red-600">
                  <span *ngIf="transactionForm.get('transactionDate')?.errors?.['required']">Date is required</span>
                  <span *ngIf="transactionForm.get('transactionDate')?.errors?.['futureDate']">Date cannot be in the future</span>
                </div>
              </div>

              <!-- Payment Method -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                <select formControlName="paymentMethod" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="mobile_wallet">Mobile Wallet</option>
                  <option value="check">Check</option>
                </select>
                <div *ngIf="transactionForm.get('paymentMethod')?.invalid && transactionForm.get('paymentMethod')?.touched" class="mt-1 text-sm text-red-600">
                  Payment method is required
                </div>
              </div>

              <!-- Receipt/Invoice Number -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Receipt/Invoice Number (Optional)</label>
                <input type="text" formControlName="receiptNumber" 
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                       placeholder="Leave empty for auto-generation">
                <p class="mt-1 text-sm text-gray-500">If left empty, a receipt number will be generated automatically</p>
              </div>
            </div>
          </div>

          <!-- Info Box -->
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div class="flex">
              <svg class="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p class="text-sm text-blue-800 font-medium">Transaction Recording</p>
                <p class="text-sm text-blue-700 mt-1">This will record the transaction in your accounting system. Make sure all details are correct before saving.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: []
})
export class TransactionFormComponent implements OnInit {
  transactionForm: FormGroup;
  isSubmitting = false;
  isEditMode = false;
  transactionId: string | null = null;
  today: string;

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    const now = new Date();
    this.today = now.toISOString().split('T')[0];

    this.transactionForm = this.fb.group({
      type: ['expense', Validators.required],
      category: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: [''],
      transactionDate: [this.today, [Validators.required, this.futureDateValidator]],
      paymentMethod: ['', Validators.required],
      receiptNumber: ['']
    });
  }

  ngOnInit(): void {
    // Check if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.transactionId = id;
        this.loadTransaction(id);
      }
    });

    // Watch for type changes to reset category
    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      if (!this.isEditMode) {
        this.transactionForm.patchValue({ category: '' });
      }
    });
  }

  loadTransaction(id: string): void {
    this.isSubmitting = true;
    this.accountingService.getTransaction(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const transaction = response.data.transaction;
          const dateValue: any = transaction.transactionDate;
          const transactionDate = typeof dateValue === 'string' 
            ? dateValue.split('T')[0]
            : new Date(dateValue).toISOString().split('T')[0];

          this.transactionForm.patchValue({
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            title: transaction.title,
            description: transaction.description || '',
            transactionDate: transactionDate,
            paymentMethod: transaction.paymentMethod,
            receiptNumber: transaction.receiptNumber || ''
          });
        }
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('Error loading transaction:', error);
        this.toastService.error('Failed to load transaction');
        this.router.navigate(['/dashboard/accounting/transactions']);
        this.isSubmitting = false;
      }
    });
  }

  getAvailableCategories(): { value: string; label: string }[] {
    const type = this.transactionForm.get('type')?.value;
    let categories: string[] = [];
    
    if (type === 'income') {
      categories = this.accountingService.getIncomeCategories();
    } else if (type === 'expense') {
      categories = this.accountingService.getExpenseCategories();
    }
    
    return categories.map(cat => ({
      value: cat,
      label: this.accountingService.getCategoryLabel(cat)
    }));
  }

  futureDateValidator(control: any) {
    if (!control.value) return null;
    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate > today ? { futureDate: true } : null;
  }

  onSubmit(): void {
    if (this.transactionForm.invalid) {
      Object.keys(this.transactionForm.controls).forEach(key => {
        this.transactionForm.get(key)?.markAsTouched();
      });
      this.toastService.error('Please fill in all required fields correctly');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.transactionForm.value;

    const transactionData: any = {
      type: formValue.type,
      category: formValue.category,
      amount: parseFloat(formValue.amount),
      title: formValue.title,
      description: formValue.description || undefined,
      transactionDate: formValue.transactionDate,
      paymentMethod: formValue.paymentMethod,
      status: 'completed'
    };

    // Only include receiptNumber if provided
    if (formValue.receiptNumber && formValue.receiptNumber.trim()) {
      transactionData.receiptNumber = formValue.receiptNumber.trim();
    }

    if (this.isEditMode && this.transactionId) {
      // Update existing transaction
      this.accountingService.updateTransaction(this.transactionId, transactionData).subscribe({
        next: (response) => {
          this.toastService.success('Transaction updated successfully');
          this.router.navigate(['/dashboard/accounting/transactions']);
        },
        error: (error) => {
          console.error('Error updating transaction:', error);
          this.toastService.error(error.error?.message || 'Failed to update transaction');
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new transaction
      this.accountingService.createTransaction(transactionData).subscribe({
        next: (response) => {
          this.toastService.success('Transaction created successfully');
          this.router.navigate(['/dashboard/accounting']);
        },
        error: (error) => {
          console.error('Error creating transaction:', error);
          this.toastService.error(error.error?.message || 'Failed to create transaction');
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    if (this.transactionForm.dirty) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        this.navigateBack();
      }
    } else {
      this.navigateBack();
    }
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard/accounting']);
  }
}

