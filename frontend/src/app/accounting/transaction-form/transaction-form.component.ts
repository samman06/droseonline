import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountingService } from '../../services/accounting.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
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
              <h1 class="text-3xl font-bold text-gray-900">{{ isEditMode ? ('accounting.transactionForm.editTransaction' | translate) : ('accounting.transactionForm.addTransaction' | translate) }}</h1>
              <p class="mt-1 text-sm text-gray-500">{{ isEditMode ? ('accounting.transactionForm.updateDetails' | translate) : ('accounting.transactionForm.recordTransaction' | translate) }}</p>
              </div>
            </div>
            <div class="flex space-x-3">
              <button (click)="onCancel()" type="button" 
                      [disabled]="isSubmitting"
                      class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {{ 'common.cancel' | translate }}
              </button>
              <button (click)="onSubmit()" type="button"
                      [disabled]="isSubmitting || transactionForm.invalid"
                      class="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center">
                <svg *ngIf="isSubmitting" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isSubmitting ? ('common.saving' | translate) : (isEditMode ? ('accounting.transactionForm.updateTransaction' | translate) : ('accounting.transactionForm.saveTransaction' | translate)) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Content -->
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Transaction Metadata (Edit Mode Only) -->
        <div *ngIf="isEditMode && transactionMetadata" class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg class="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {{ 'accounting.transactionForm.transactionInformation' | translate }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div class="bg-white rounded-lg p-3">
              <span class="text-gray-600 font-medium">{{ 'accounting.transactionForm.receiptNumber' | translate }}:</span>
              <p class="text-gray-900 font-semibold mt-1">{{ transactionMetadata.receiptNumber || ('accounting.transactionForm.notGenerated' | translate) }}</p>
            </div>
            <div class="bg-white rounded-lg p-3">
              <span class="text-gray-600 font-medium">{{ 'common.status' | translate }}:</span>
              <p class="mt-1">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      [class.bg-green-100]="transactionMetadata.status === 'completed'"
                      [class.text-green-800]="transactionMetadata.status === 'completed'"
                      [class.bg-yellow-100]="transactionMetadata.status === 'pending'"
                      [class.text-yellow-800]="transactionMetadata.status === 'pending'"
                      [class.bg-red-100]="transactionMetadata.status === 'cancelled'"
                      [class.text-red-800]="transactionMetadata.status === 'cancelled'">
                  {{ transactionMetadata.status | titlecase }}
                </span>
              </p>
            </div>
            <div class="bg-white rounded-lg p-3">
              <span class="text-gray-600 font-medium">{{ 'common.createdBy' | translate }}:</span>
              <p class="text-gray-900 mt-1">{{ transactionMetadata.createdBy?.fullName || ('common.system' | translate) }}</p>
              <p class="text-gray-500 text-xs">{{ transactionMetadata.createdAt | date:'medium' }}</p>
            </div>
            <div *ngIf="transactionMetadata.updatedBy" class="bg-white rounded-lg p-3">
              <span class="text-gray-600 font-medium">{{ 'common.lastUpdatedBy' | translate }}:</span>
              <p class="text-gray-900 mt-1">{{ transactionMetadata.updatedBy?.fullName }}</p>
              <p class="text-gray-500 text-xs">{{ transactionMetadata.updatedAt | date:'medium' }}</p>
            </div>
          </div>
        </div>

        <form [formGroup]="transactionForm" class="space-y-6">
          <!-- Transaction Type Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ 'accounting.transactionForm.transactionType' | translate }}</h2>
            
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
                      <p class="font-semibold text-gray-900">{{ 'accounting.transactionForm.income' | translate }}</p>
                      <p class="text-sm text-gray-500">{{ 'accounting.transactionForm.moneyReceived' | translate }}</p>
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
                      <p class="font-semibold text-gray-900">{{ 'accounting.transactionForm.expense' | translate }}</p>
                      <p class="text-sm text-gray-500">{{ 'accounting.transactionForm.moneySpent' | translate }}</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <div *ngIf="transactionForm.get('type')?.invalid && transactionForm.get('type')?.touched" class="mt-2 text-sm text-red-600">
              {{ 'accounting.transactionForm.selectType' | translate }}
            </div>
          </div>

          <!-- Transaction Details Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ 'accounting.transactionForm.transactionDetails' | translate }}</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Category -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'accounting.transactionForm.category' | translate }} *</label>
                <select formControlName="category" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option value="">{{ 'accounting.transactionForm.selectCategory' | translate }}</option>
                  <option *ngFor="let cat of getAvailableCategories()" [value]="cat.value">
                    {{ cat.label }}
                  </option>
                </select>
                <div *ngIf="transactionForm.get('category')?.invalid && transactionForm.get('category')?.touched" class="mt-1 text-sm text-red-600">
                  {{ 'accounting.transactionForm.categoryRequired' | translate }}
                </div>
              </div>

              <!-- Amount -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'accounting.transactionForm.amount' | translate }} (EGP) *</label>
                <div class="relative">
                  <input type="number" formControlName="amount" step="0.01" min="0" 
                         class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                         placeholder="0.00">
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span class="text-gray-500 text-sm">EGP</span>
                  </div>
                </div>
                <div *ngIf="transactionForm.get('amount')?.invalid && transactionForm.get('amount')?.touched" class="mt-1 text-sm text-red-600">
                  <span *ngIf="transactionForm.get('amount')?.errors?.['required']">{{ 'accounting.transactionForm.amountRequired' | translate }}</span>
                  <span *ngIf="transactionForm.get('amount')?.errors?.['min']">{{ 'accounting.transactionForm.amountGreaterThanZero' | translate }}</span>
                </div>
              </div>

              <!-- Title -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'accounting.transactionForm.title' | translate }} *</label>
                <input type="text" formControlName="title" 
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                       [placeholder]="'accounting.transactionForm.titlePlaceholder' | translate">
                <div *ngIf="transactionForm.get('title')?.invalid && transactionForm.get('title')?.touched" class="mt-1 text-sm text-red-600">
                  <span *ngIf="transactionForm.get('title')?.errors?.['required']">{{ 'accounting.transactionForm.titleRequired' | translate }}</span>
                  <span *ngIf="transactionForm.get('title')?.errors?.['minlength']">{{ 'accounting.transactionForm.titleMinLength' | translate }}</span>
                  <span *ngIf="transactionForm.get('title')?.errors?.['maxlength']">{{ 'accounting.transactionForm.titleMaxLength' | translate }}</span>
                </div>
              </div>

              <!-- Description -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'accounting.transactionForm.description' | translate }} ({{ 'common.optional' | translate }})</label>
                <textarea formControlName="description" rows="3"
                          class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                          [placeholder]="'accounting.transactionForm.descriptionPlaceholder' | translate"></textarea>
              </div>
            </div>
          </div>

          <!-- Payment Information Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ 'accounting.transactionForm.paymentInformation' | translate }}</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Transaction Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'accounting.transactionForm.transactionDate' | translate }} *</label>
                <input type="date" formControlName="transactionDate" 
                       [max]="today"
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                <div *ngIf="transactionForm.get('transactionDate')?.invalid && transactionForm.get('transactionDate')?.touched" class="mt-1 text-sm text-red-600">
                  <span *ngIf="transactionForm.get('transactionDate')?.errors?.['required']">{{ 'accounting.transactionForm.dateRequired' | translate }}</span>
                  <span *ngIf="transactionForm.get('transactionDate')?.errors?.['futureDate']">{{ 'accounting.transactionForm.dateCannotBeFuture' | translate }}</span>
                </div>
              </div>

              <!-- Payment Method -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'accounting.transactionForm.paymentMethod' | translate }} *</label>
                <select formControlName="paymentMethod" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                  <option value="">{{ 'accounting.transactionForm.selectMethod' | translate }}</option>
                  <option value="cash">{{ 'accounting.transactionForm.cash' | translate }}</option>
                  <option value="bank_transfer">{{ 'accounting.transactionForm.bankTransfer' | translate }}</option>
                  <option value="credit_card">{{ 'accounting.transactionForm.creditCard' | translate }}</option>
                  <option value="mobile_wallet">{{ 'accounting.transactionForm.mobileWallet' | translate }}</option>
                  <option value="check">{{ 'accounting.transactionForm.check' | translate }}</option>
                </select>
                <div *ngIf="transactionForm.get('paymentMethod')?.invalid && transactionForm.get('paymentMethod')?.touched" class="mt-1 text-sm text-red-600">
                  {{ 'accounting.transactionForm.paymentMethodRequired' | translate }}
                </div>
              </div>

              <!-- Receipt/Invoice Number -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">{{ 'accounting.transactionForm.receiptInvoiceNumber' | translate }} ({{ 'common.optional' | translate }})</label>
                <input type="text" formControlName="receiptNumber" 
                       class="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                       [placeholder]="'accounting.transactionForm.receiptPlaceholder' | translate">
                <p class="mt-1 text-sm text-gray-500">{{ 'accounting.transactionForm.receiptAutoGenerate' | translate }}</p>
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
                <p class="text-sm text-blue-800 font-medium">{{ 'accounting.transactionForm.transactionRecording' | translate }}</p>
                <p class="text-sm text-blue-700 mt-1">{{ 'accounting.transactionForm.recordingMessage' | translate }}</p>
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
  isLoadingTransaction = false;
  transactionId: string | null = null;
  transactionMetadata: any = null;
  today: string;

  constructor(
    private fb: FormBuilder,
    private accountingService: AccountingService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService
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

    // Watch for type changes to reset category (only in create mode, not edit mode)
    this.transactionForm.get('type')?.valueChanges.subscribe(() => {
      if (!this.isEditMode) {
        this.transactionForm.patchValue({ category: '' });
      }
    });
  }

  loadTransaction(id: string): void {
    this.isSubmitting = true;
    this.isLoadingTransaction = true;
    
    this.accountingService.getTransaction(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const transaction = response.data.transaction;
          
          // Store metadata for display
          this.transactionMetadata = {
            _id: transaction._id,
            receiptNumber: transaction.receiptNumber,
            status: transaction.status || 'completed',
            currency: transaction.currency || 'EGP',
            createdBy: transaction.createdBy,
            createdAt: transaction.createdAt,
            updatedBy: transaction.updatedBy,
            updatedAt: transaction.updatedAt
          };
          
          const dateValue: any = transaction.transactionDate;
          const transactionDate = typeof dateValue === 'string' 
            ? dateValue.split('T')[0]
            : new Date(dateValue).toISOString().split('T')[0];

          // Set all fields at once (including type) - no need to split
          this.transactionForm.patchValue({
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            title: transaction.title,
            description: transaction.description || '',
            transactionDate: transactionDate,
            paymentMethod: transaction.paymentMethod,
            receiptNumber: transaction.receiptNumber || ''
          }, { emitEvent: false }); // Don't emit events to avoid triggering valueChanges
          
          // Manually trigger change detection after patching
          this.cdr.detectChanges();
          
          console.log('✅ Transaction loaded successfully:');
          console.log('Raw transaction data:', transaction);
          console.log('Metadata:', this.transactionMetadata);
          console.log('Form value:', this.transactionForm.value);
          console.log('Available categories:', this.getAvailableCategories());
          console.log('Form valid?', this.transactionForm.valid);
          console.log('Form errors:', this.transactionForm.errors);
        }
        this.isSubmitting = false;
        this.isLoadingTransaction = false;
      },
      error: (error) => {
        console.error('Error loading transaction:', error);
        this.toastService.error(this.translate.instant('accounting.transactionForm.failedToLoad'));
        this.router.navigate(['/dashboard/accounting/transactions']);
        this.isSubmitting = false;
        this.isLoadingTransaction = false;
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
      this.toastService.error(this.translate.instant('accounting.transactionForm.fillRequired'));
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
          this.toastService.success(this.translate.instant('accounting.transactionForm.updateSuccess'));
          this.router.navigate(['/dashboard/accounting/transactions']);
        },
        error: (error) => {
          console.error('Error updating transaction:', error);
          this.toastService.error(error.error?.message || this.translate.instant('accounting.transactionForm.updateFailed'));
          this.isSubmitting = false;
        }
      });
    } else {
      // Create new transaction
      this.accountingService.createTransaction(transactionData).subscribe({
        next: (response) => {
          this.toastService.success(this.translate.instant('accounting.transactionForm.createSuccess'));
          this.router.navigate(['/dashboard/accounting']);
        },
        error: (error) => {
          console.error('Error creating transaction:', error);
          this.toastService.error(error.error?.message || this.translate.instant('accounting.transactionForm.createFailed'));
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    if (this.transactionForm.dirty) {
      if (confirm(this.translate.instant('accounting.transactionForm.unsavedChanges'))) {
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

