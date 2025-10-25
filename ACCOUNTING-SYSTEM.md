# Accounting System Implementation

## Overview
A comprehensive financial management system for teachers to track income, expenses, and student payments.

## Features Implemented

### 1. Backend Models

#### StudentPayment Model (`models/StudentPayment.js`)
Tracks student payment records with the following features:
- **Payment Types**: enrollment, monthly, installment, material, exam, other
- **Payment Status**: pending, paid, partial, overdue, cancelled, refunded
- **Automatic Calculations**: 
  - Remaining amount calculation
  - Status updates based on payment progress
  - Payment progress percentage
- **Receipt Generation**: Automatic receipt number generation (REC-YEAR-NNNNNN)
- **Statistics Method**: `getTeacherStats()` for quick financial overview
- **Relationships**: Links to Student, Course, Group, Teacher, AcademicYear

#### FinancialTransaction Model (`models/FinancialTransaction.js`)
Tracks all income and expenses with:
- **Transaction Types**: income, expense
- **Income Categories**: 
  - student_payment, enrollment_fee, material_sale, exam_fee, other_income
- **Expense Categories**:
  - assistant_salary, rent, utilities, materials, marketing, maintenance, transportation, equipment, software, other_expense
- **Features**:
  - Receipt/Invoice number tracking
  - Multiple payment methods (cash, bank transfer, credit card, mobile wallet, check)
  - Recurring transactions support
  - File attachments for receipts/invoices
  - Tags for better organization
- **Statistics Methods**:
  - `getFinancialSummary()`: Complete financial overview for a period
  - `getMonthlyTrend()`: 6-month trend analysis

### 2. Backend API Routes (`routes/accounting.js`)

#### Financial Summary
- `GET /api/accounting/summary` - Get complete financial overview
  - Query params: startDate, endDate, period (week/month/quarter/year)
  - Returns: income, expenses, profit, student payment stats, trend data

#### Financial Transactions
- `GET /api/accounting/transactions` - List all transactions with filters
  - Filters: type, category, status, date range, search
  - Pagination support
- `GET /api/accounting/transactions/:id` - Get single transaction details
- `POST /api/accounting/transactions` - Create new transaction
- `PUT /api/accounting/transactions/:id` - Update transaction
- `DELETE /api/accounting/transactions/:id` - Delete transaction

#### Student Payments
- `GET /api/accounting/payments` - List all student payments with filters
  - Filters: student, course, group, status, paymentType, date range
  - Pagination support
- `GET /api/accounting/payments/stats` - Get payment statistics
- `POST /api/accounting/payments` - Create new payment record
  - Automatically creates corresponding FinancialTransaction
  - Generates receipt number
- `PUT /api/accounting/payments/:id` - Update payment (record additional payments)
  - Creates transaction for additional payments

#### Reports
- `GET /api/accounting/reports/profit-loss` - Profit & Loss report
  - Date range support
  - Category breakdown
  - Profit margin calculation

### 3. Frontend Service (`frontend/src/app/services/accounting.service.ts`)

Provides Angular service with:
- **Type Definitions**: TypeScript interfaces for all data models
- **API Methods**: Complete CRUD operations for transactions and payments
- **Helper Methods**:
  - `getIncomeCategories()`, `getExpenseCategories()`
  - `getCategoryLabel()` - Human-readable category names
  - `getPaymentTypeLabel()` - Payment type labels
  - `getStatusLabel()`, `getStatusColor()` - Status display helpers
  - `formatCurrency()` - Currency formatting

### 4. Frontend UI (`frontend/src/app/accounting/accounting-dashboard.component.ts`)

Beautiful, responsive Accounting Dashboard with:

#### Key Features:
- **Period Selector**: Week, Month, Quarter, Year views
- **Summary Cards** (4 main metrics):
  - Total Income (green gradient)
  - Total Expenses (red gradient)
  - Net Profit with margin percentage (blue gradient)
  - Student Payments count (purple gradient)
  
#### Payment Status Section:
- Pending Payments (yellow)
- Overdue Payments (red) - requires attention
- Total Collected (green)
- Quick link to view all payments

#### Category Breakdown:
- Visual progress bars for top 8 categories
- Color-coded by type (green for income, red for expense)
- Percentage-based visualization
- Link to full report

#### Quick Actions:
- View Transactions
- Manage Student Payments
- Financial Reports & Analytics

### 5. Integration

- **Navigation**: Added "Accounting" menu item in dashboard sidebar (for teachers and admins)
- **Routing**: Added `/dashboard/accounting` route with role guard
- **API**: Registered `/api/accounting` endpoint in server.js
- **Security**: Teacher-only access with automatic filtering by teacher ID

## Usage

### For Teachers:

1. **Access**: Click "Accounting" in the sidebar
2. **View Summary**: See financial overview for selected period
3. **Track Payments**: Monitor student payments (pending, overdue, collected)
4. **Manage Expenses**: Record assistant salaries, rent, materials, etc.
5. **Income Tracking**: Automatic tracking from student payments
6. **Reports**: View profit/loss and category breakdowns

### Adding a Student Payment:
```
POST /api/accounting/payments
{
  "student": "studentId",
  "course": "courseId",
  "group": "groupId",
  "totalAmount": 1000,
  "paidAmount": 500,
  "paymentType": "monthly",
  "dueDate": "2025-11-01",
  "paymentMethod": "cash"
}
```

### Adding an Expense (Assistant Salary):
```
POST /api/accounting/transactions
{
  "type": "expense",
  "category": "assistant_salary",
  "amount": 3000,
  "title": "Assistant Mohamed - November Salary",
  "description": "Monthly salary payment",
  "paymentMethod": "bank_transfer",
  "transactionDate": "2025-11-01"
}
```

### Getting Financial Summary:
```
GET /api/accounting/summary?period=month
```

## Database Schema

### StudentPayment Collection
- student (ref: User)
- course (ref: Course)
- group (ref: Group)
- teacher (ref: User)
- academicYear (ref: AcademicYear)
- totalAmount, paidAmount, remainingAmount, discount
- paymentType, status, dueDate, paidDate
- paymentMethod, receiptNumber, notes
- transaction (ref: FinancialTransaction)
- timestamps

### FinancialTransaction Collection
- type (income/expense)
- category (various income/expense categories)
- teacher (ref: User)
- amount, currency
- title, description
- transactionDate, paymentMethod
- receiptNumber, invoiceNumber
- status (completed/pending/cancelled)
- isRecurring, recurringFrequency
- attachments (array of files)
- tags, notes
- relatedTo (polymorphic reference)
- timestamps

## Benefits for Teachers

1. **Financial Visibility**: Clear view of income vs expenses
2. **Student Tracking**: Monitor which students have paid/pending
3. **Expense Management**: Track all business expenses (salaries, rent, materials)
4. **Profit Analysis**: See actual profit margins and trends
5. **Receipt Management**: Automatic receipt generation
6. **Reports**: Generate profit/loss reports for any period
7. **Overdue Alerts**: Visual indicators for overdue payments
8. **Category Analysis**: Understand where money comes from and goes

## Future Enhancements (Optional)

- Export reports to PDF/Excel
- Email reminders for overdue payments
- Bulk payment import
- Budget planning and forecasting
- Tax report generation
- Multi-currency support with exchange rates
- Payment plans and installment tracking
- Automated recurring expense recording

## Technical Details

- **Backend**: Node.js, Express, Mongoose
- **Frontend**: Angular 18+, Standalone Components
- **Security**: JWT authentication, role-based access control
- **Database**: MongoDB with indexes for performance
- **UI**: Tailwind CSS, responsive design, gradient cards
- **API**: RESTful with pagination and filtering

## Testing

To test the accounting system:
1. Login as a teacher
2. Navigate to "Accounting" in the sidebar
3. View the financial dashboard
4. Try adding a student payment
5. Try adding an expense transaction
6. Switch between different period views
7. Check the category breakdown

All data is automatically filtered by the logged-in teacher's ID for data security.

