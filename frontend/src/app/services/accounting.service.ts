import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface FinancialTransaction {
  _id?: string;
  type: 'income' | 'expense';
  category: string;
  teacher: string;
  amount: number;
  currency?: string;
  title: string;
  description?: string;
  transactionDate: Date;
  paymentMethod?: string;
  receiptNumber?: string;
  invoiceNumber?: string;
  status?: 'completed' | 'pending' | 'cancelled';
  isRecurring?: boolean;
  recurringFrequency?: string;
  notes?: string;
  tags?: string[];
  createdBy?: any;
  updatedBy?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentPayment {
  _id?: string;
  student: any;
  course: any;
  group?: any;
  teacher: string;
  amount: number;
  currency?: string;
  paymentType: 'enrollment' | 'monthly' | 'installment' | 'material' | 'exam' | 'other';
  status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'refunded';
  totalAmount: number;
  paidAmount: number;
  remainingAmount?: number;
  discount?: number;
  dueDate?: Date;
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
  receiptNumber?: string;
  paymentProgress?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  categoryBreakdown: any[];
  studentPayments: {
    totalRevenue: number;
    totalExpected: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    paidStudents: number;
    partiallyPaidStudents: number;
    pendingStudents: number;
    overdueStudents: number;
    totalStudents: number;
    totalSessions: number;
    paymentCount: number;
  };
  trend: any[];
  period: {
    startDate: Date;
    endDate: Date;
  };
  // New revenue tracking data
  groupRevenue?: {
    _id: string;
    name: string;
    code: string;
    courseName?: string;
    courseCode?: string;
    totalRevenue: number;
    totalSessions: number;
    pricePerSession: number;
    studentCount: number;
    avgRevenuePerSession: number;
  }[];
  courseRevenue?: {
    _id: string;
    name: string;
    code: string;
    subjectName?: string;
    totalRevenue: number;
    totalSessions: number;
    avgRevenuePerSession: number;
  }[];
  attendanceRevenue?: {
    total: number;
    totalSessions: number;
    pricePerSession?: number;
  };
}

export interface QueryParams {
  [key: string]: any;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountingService {
  private readonly ACCOUNTING_ENDPOINT = 'accounting';

  constructor(private api: ApiService) {}

  // ==================== FINANCIAL SUMMARY ====================

  getFinancialSummary(params?: QueryParams): Observable<ApiResponse<FinancialSummary>> {
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/summary`, params);
  }

  // ==================== FINANCIAL TRANSACTIONS ====================

  getTransactions(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/transactions`, params);
  }

  getTransaction(id: string): Observable<ApiResponse<{ transaction: FinancialTransaction }>> {
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/transactions/${id}`);
  }

  createTransaction(transaction: Partial<FinancialTransaction>): Observable<ApiResponse<{ transaction: FinancialTransaction }>> {
    return this.api.post(`${this.ACCOUNTING_ENDPOINT}/transactions`, transaction);
  }

  updateTransaction(id: string, transaction: Partial<FinancialTransaction>): Observable<ApiResponse<{ transaction: FinancialTransaction }>> {
    return this.api.put(`${this.ACCOUNTING_ENDPOINT}/transactions`, id, transaction);
  }

  deleteTransaction(id: string): Observable<ApiResponse<any>> {
    return this.api.delete(`${this.ACCOUNTING_ENDPOINT}/transactions`, id);
  }

  // ==================== STUDENT PAYMENTS ====================

  getPayments(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/payments`, params);
  }

  getPayment(id: string): Observable<ApiResponse<{ payment: StudentPayment }>> {
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/payments/${id}`);
  }

  createPayment(payment: Partial<StudentPayment>): Observable<ApiResponse<{ payment: StudentPayment }>> {
    return this.api.post(`${this.ACCOUNTING_ENDPOINT}/payments`, payment);
  }

  updatePayment(id: string, payment: Partial<StudentPayment>): Observable<ApiResponse<{ payment: StudentPayment }>> {
    return this.api.put(`${this.ACCOUNTING_ENDPOINT}/payments`, id, payment);
  }

  getPaymentStats(params?: QueryParams): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/payments/stats`, params);
  }

  // ==================== REPORTS ====================

  getProfitLossReport(startDate?: Date, endDate?: Date): Observable<ApiResponse<any>> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate.toISOString();
    if (endDate) params['endDate'] = endDate.toISOString();
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/reports/profit-loss`, params);
  }

  // ==================== ATTENDANCE-BASED PAYMENTS ====================

  calculateAttendancePayments(groupId: string, startDate?: Date, endDate?: Date): Observable<ApiResponse<any>> {
    const params: QueryParams = {};
    if (startDate) params['startDate'] = startDate.toISOString();
    if (endDate) params['endDate'] = endDate.toISOString();
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/attendance/calculate/${groupId}`, params);
  }

  generatePaymentsFromAttendance(data: {
    groupId: string;
    startDate?: Date;
    endDate?: Date;
    updateExisting?: boolean;
  }): Observable<ApiResponse<any>> {
    return this.api.post(`${this.ACCOUNTING_ENDPOINT}/attendance/generate-payments`, data);
  }

  getGroupRevenue(groupId: string): Observable<ApiResponse<any>> {
    return this.api.get(`${this.ACCOUNTING_ENDPOINT}/groups/${groupId}/revenue`);
  }

  // ==================== HELPER METHODS ====================

  getIncomeCategories(): string[] {
    return ['student_payment', 'enrollment_fee', 'material_sale', 'exam_fee', 'other_income'];
  }

  getExpenseCategories(): string[] {
    return [
      'assistant_salary',
      'rent',
      'utilities',
      'materials',
      'marketing',
      'maintenance',
      'transportation',
      'equipment',
      'software',
      'other_expense'
    ];
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      // Income
      student_payment: 'Student Payment',
      enrollment_fee: 'Enrollment Fee',
      material_sale: 'Material Sale',
      exam_fee: 'Exam Fee',
      other_income: 'Other Income',
      // Expenses
      assistant_salary: 'Assistant Salary',
      rent: 'Rent',
      utilities: 'Utilities',
      materials: 'Materials',
      marketing: 'Marketing',
      maintenance: 'Maintenance',
      transportation: 'Transportation',
      equipment: 'Equipment',
      software: 'Software',
      other_expense: 'Other Expense'
    };
    return labels[category] || category;
  }

  getPaymentTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      enrollment: 'Enrollment',
      monthly: 'Monthly',
      installment: 'Installment',
      material: 'Material',
      exam: 'Exam',
      other: 'Other'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      pending: 'Pending',
      paid: 'Paid',
      partial: 'Partially Paid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
      completed: 'Completed'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      pending: 'text-yellow-600 bg-yellow-100',
      paid: 'text-green-600 bg-green-100',
      partial: 'text-blue-600 bg-blue-100',
      overdue: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100',
      refunded: 'text-purple-600 bg-purple-100',
      completed: 'text-green-600 bg-green-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  formatCurrency(amount: number, currency: string = 'EGP'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return formatter.format(amount);
  }
}

