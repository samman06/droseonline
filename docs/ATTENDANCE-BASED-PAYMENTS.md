# Attendance-Based Payment System

## Overview
Automatically calculate and generate student payments based on attendance records. Every session a student attends counts toward their total payment.

## How It Works

### Formula:
```
Total Payment = Sessions Attended × Price Per Session
```

### Example:
- **Group**: Math Level 1
- **Price Per Session**: 100 EGP
- **Student A attended**: 12 sessions
- **Total Amount**: 12 × 100 = **1,200 EGP**

## Features

### 1. Automatic Calculation
- Counts only "present" attendance status
- Excludes absent, late, or excused sessions
- Links payment records to specific attendance records
- Supports date range filtering

### 2. Payment Generation
- **Auto-generate** payment records for all students in a group
- **Update existing** payments with new attendance data
- **Skip duplicates** to prevent double-billing

### 3. Group Revenue Tracking
- See total revenue per group
- Track expected vs collected amounts
- Monitor payment status (pending, paid, partial, overdue)

## API Endpoints

### 1. Calculate Attendance Payments (Preview)
```http
GET /api/accounting/attendance/calculate/:groupId
```

**Query Parameters:**
- `startDate` (optional): Start date for attendance records
- `endDate` (optional): End date for attendance records

**Response:**
```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "groupId",
      "name": "Math Level 1",
      "code": "MTH-L1-A",
      "pricePerSession": 100
    },
    "period": {
      "startDate": "2025-10-01",
      "endDate": "2025-10-31"
    },
    "summary": {
      "totalSessions": 12,
      "totalStudents": 15,
      "activeStudents": 14,
      "totalRevenue": 18000,
      "pricePerSession": 100
    },
    "calculations": [
      {
        "student": {
          "_id": "studentId",
          "fullName": "Ahmed Mohamed",
          "email": "ahmed@example.com",
          "studentCode": "STD-2024-001"
        },
        "sessionsAttended": 12,
        "pricePerSession": 100,
        "totalAmount": 1200,
        "attendanceRecords": ["att1", "att2", "att3", ...],
        "enrollmentDate": "2025-09-01",
        "status": "active",
        "existingPayment": {
          "_id": "paymentId",
          "paidAmount": 600,
          "remainingAmount": 600,
          "status": "partial"
        }
      }
      // ... more students
    ]
  }
}
```

**Use Case:** Preview calculations before generating actual payment records.

---

### 2. Generate Payment Records
```http
POST /api/accounting/attendance/generate-payments
```

**Request Body:**
```json
{
  "groupId": "groupId",
  "startDate": "2025-10-01",  // optional
  "endDate": "2025-10-31",    // optional
  "updateExisting": false     // set true to update existing payments
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 10 new payments, updated 5, skipped 0",
  "data": {
    "created": [/* array of new payment records */],
    "updated": [/* array of updated payment records */],
    "skipped": [/* array of skipped students with reasons */],
    "summary": {
      "totalCreated": 10,
      "totalUpdated": 5,
      "totalSkipped": 0
    }
  }
}
```

**Use Case:** Create actual payment records that students need to pay.

---

### 3. Get Group Revenue Summary
```http
GET /api/accounting/groups/:groupId/revenue
```

**Response:**
```json
{
  "success": true,
  "data": {
    "group": {
      "_id": "groupId",
      "name": "Math Level 1",
      "code": "MTH-L1-A",
      "course": {
        "_id": "courseId",
        "name": "Mathematics"
      }
    },
    "stats": {
      "totalStudents": 15,
      "pricePerSession": 100,
      "payments": {
        "total": 15,
        "pending": 5,
        "paid": 8,
        "partial": 2,
        "overdue": 0
      },
      "revenue": {
        "expected": 18000,
        "collected": 12000,
        "pending": 6000
      },
      "sessions": {
        "total": 180
      }
    },
    "payments": [/* detailed payment records */]
  }
}
```

**Use Case:** Get complete financial overview for a specific group.

## Workflow Example

### Step 1: Mark Attendance
Teacher marks attendance for each session:
```
Session Date: 2025-10-15
- Ahmed: Present ✓
- Sara: Present ✓
- Mohamed: Absent ✗
```

### Step 2: Calculate Payments (Preview)
At the end of the month, call:
```bash
GET /api/accounting/attendance/calculate/GROUP_ID?startDate=2025-10-01&endDate=2025-10-31
```

This shows:
- Ahmed: 12 sessions × 100 EGP = 1,200 EGP
- Sara: 10 sessions × 100 EGP = 1,000 EGP
- Mohamed: 8 sessions × 100 EGP = 800 EGP

### Step 3: Generate Payment Records
If calculations look correct, generate actual payments:
```bash
POST /api/accounting/attendance/generate-payments
{
  "groupId": "GROUP_ID",
  "startDate": "2025-10-01",
  "endDate": "2025-10-31"
}
```

This creates payment records that students can view and pay.

### Step 4: Track Revenue
View group revenue dashboard:
```bash
GET /api/accounting/groups/GROUP_ID/revenue
```

Shows expected vs collected amounts and payment status.

## Database Schema Updates

### StudentPayment Model - New Fields:
```javascript
{
  paymentType: 'session_based',  // New enum value
  sessionsAttended: Number,      // Count of attended sessions
  pricePerSession: Number,       // Price per session (from group)
  attendanceRecords: [ObjectId], // References to Attendance records
  // ... existing fields
}
```

## Frontend Integration

### Service Methods (accounting.service.ts):

```typescript
// Preview calculation
calculateAttendancePayments(groupId: string, startDate?: Date, endDate?: Date)

// Generate payment records
generatePaymentsFromAttendance({
  groupId: string,
  startDate?: Date,
  endDate?: Date,
  updateExisting?: boolean
})

// Get group revenue
getGroupRevenue(groupId: string)
```

## Usage Scenarios

### Scenario 1: Monthly Billing
At the end of each month:
1. Calculate payments for October
2. Generate payment records
3. Students receive their bills
4. Track who has paid

### Scenario 2: Semester Billing
At the end of semester:
1. Calculate payments for entire semester (Sep-Dec)
2. Generate one payment record per student
3. Show total sessions attended
4. Collect payments

### Scenario 3: Update Existing Payments
If new sessions are added after initial billing:
1. Calculate again with `updateExisting: true`
2. System updates payment amounts
3. Students see updated bills

### Scenario 4: Partial Period Billing
Bill for specific date range:
```
startDate: "2025-10-01"
endDate: "2025-10-15"
```
Only sessions in this range count toward payment.

## Benefits

1. **Accurate Billing**: Only charge for attended sessions
2. **Fair System**: Students only pay for what they attend
3. **Automated**: No manual calculation needed
4. **Transparent**: Students see which sessions they're paying for
5. **Flexible**: Support different date ranges and billing periods
6. **Revenue Tracking**: Clear visibility into expected vs collected amounts

## Best Practices

1. **Set Price Per Session** in Group settings before generating payments
2. **Regular Attendance**: Mark attendance consistently for accurate billing
3. **Preview First**: Always call `/calculate` before `/generate-payments`
4. **Monthly Billing**: Generate payments at consistent intervals (e.g., end of month)
5. **Update Existing**: Use `updateExisting: true` only when necessary
6. **Date Ranges**: Use date filters to bill for specific periods

## Future Enhancements

- Attendance rate discounts (e.g., 10% off if > 90% attendance)
- Late attendance penalty options
- Bulk payment generation for multiple groups
- Email notifications for generated payments
- Payment reminders for pending amounts
- Export payment reports to PDF/Excel

## Testing

### Test Workflow:
1. Create a group with `pricePerSession: 100`
2. Add students to the group
3. Mark attendance for several sessions
4. Call calculate endpoint to preview
5. Call generate endpoint to create payments
6. Verify payment records are created correctly
7. Check group revenue summary

### Example Test Data:
```javascript
// Group
{
  name: "Math Level 1",
  pricePerSession: 100,
  students: [student1, student2, student3]
}

// Attendance (3 sessions)
Session 1: student1 (present), student2 (present), student3 (absent)
Session 2: student1 (present), student2 (absent), student3 (present)
Session 3: student1 (present), student2 (present), student3 (present)

// Expected Payments
student1: 3 × 100 = 300 EGP
student2: 2 × 100 = 200 EGP
student3: 2 × 100 = 200 EGP
Total: 700 EGP
```

## Summary

This attendance-based payment system provides an automated, fair, and transparent way to bill students based on their actual attendance. It integrates seamlessly with the existing attendance tracking system and accounting features.

