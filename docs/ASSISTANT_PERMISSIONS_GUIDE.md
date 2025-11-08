# Assistant Permissions System - Implementation Guide

## 📋 Overview

The assistant role in the DroSeonline system has a **simple and clear permission model**:

### ✅ What Assistants CAN Do:
Assistants have **FULL ACCESS** to all teaching-related features, exactly like teachers:

1. **Attendance Management**
   - Mark attendance for groups
   - View attendance records
   - Update attendance
   - Bulk update records
   - Lock/unlock sessions

2. **Assignment Management**
   - Create assignments
   - Edit assignments
   - Grade submissions
   - View all submissions
   - Create templates
   - Manage quizzes

3. **Material Management**
   - Upload materials
   - Update materials
   - Delete materials
   - Organize by course/group

4. **Student Management**
   - View student lists
   - View student details
   - Manage student enrollments
   - View student progress

5. **Course & Group Management**
   - View courses
   - View groups
   - Access course materials
   - Manage group activities

6. **Announcements**
   - Create announcements
   - Edit announcements
   - Delete announcements
   - Send to groups/courses

7. **Dashboard & Analytics**
   - View teaching dashboard
   - Access analytics
   - View reports (non-financial)
   - Calendar view

### ❌ What Assistants CANNOT Do:
Assistants are **BLOCKED** from all financial/accounting features:

1. **Financial Data**
   - Cannot view revenue reports
   - Cannot see payment information
   - Cannot access accounting summary
   - Cannot manage student payments
   - Cannot view financial transactions

2. **Accounting Routes**
   - All routes under `/api/accounting/*` are blocked
   - Only teachers and admins can access accounting

## 🔧 Technical Implementation

### Backend (Node.js/Express)

#### Middleware Structure

We use two main middleware functions:

**1. `checkTeacherOrAssistantAccess`**
```javascript
// Used for ALL teaching-related routes
// Allows: admin, teacher, assistant
// Blocks: student, parent, others

// Example usage:
router.post('/api/materials', 
  authenticate, 
  checkTeacherOrAssistantAccess, 
  upload.array('files'), 
  async (req, res) => { ... }
);
```

**2. `checkTeacherAccess`** (in accounting.js)
```javascript
// Used for ALL accounting routes
// Allows: admin, teacher ONLY
// Blocks: assistant, student, parent, others

// Example usage:
router.get('/api/accounting/summary', 
  authenticate, 
  checkTeacherAccess, 
  async (req, res) => { ... }
);
```

#### Route Protection

##### Teaching Routes (Allow Assistants)
All these routes use `checkTeacherOrAssistantAccess`:
- `/api/attendance/*` - Attendance management
- `/api/assignments/*` - Assignment management
- `/api/materials/*` - Material management
- `/api/announcements/*` - Announcement management
- `/api/courses/*` - Course viewing and management
- `/api/groups/*` - Group viewing and management
- `/api/students/*` - Student viewing (teacher's students)
- `/api/calendar/*` - Calendar events
- `/api/dashboard/*` - Dashboard data

##### Accounting Routes (Block Assistants)
All these routes use `checkTeacherAccess` or `authorize('teacher', 'admin')`:
- `/api/accounting/summary` - Financial summary
- `/api/accounting/payments` - Payment management
- `/api/accounting/transactions` - Transaction history
- `/api/accounting/reports` - Financial reports
- `/api/accounting/revenue` - Revenue tracking

### Frontend (Angular)

#### Role-Based UI

The frontend uses role guards to hide/show features:

```typescript
// Route guard - already implemented
{
  path: 'accounting',
  canActivate: [RoleGuard],
  data: { roles: ['admin', 'teacher'] }, // Assistants not allowed
  loadComponent: () => import('./accounting/...')
}

// All teaching routes allow assistants
{
  path: 'materials',
  canActivate: [RoleGuard],
  data: { roles: ['admin', 'teacher', 'assistant'] }, // Assistants allowed
  loadComponent: () => import('./materials/...')
}
```

#### User Service

Check user role in components:

```typescript
export class MyComponent {
  isTeacher = this.authService.currentUser?.role === 'teacher';
  isAssistant = this.authService.currentUser?.role === 'assistant';
  canAccessAccounting = this.isTeacher || this.authService.isAdmin();
  
  // Hide accounting menu for assistants
  showAccountingMenu(): boolean {
    return this.authService.currentUser?.role !== 'assistant';
  }
}
```

## 🗄️ Database Schema

### User Model - Assistant Info

```javascript
{
  role: 'assistant',
  assistantInfo: {
    assignedTeacher: ObjectId,  // Reference to teacher
    assignedDate: Date,         // When assigned
    permissions: [String]       // For display only (not enforced)
  }
}
```

**Note**: The `permissions` array in `assistantInfo` is for **UI display purposes only**. The backend doesn't enforce these individual permissions - assistants always have full teaching access.

## 📊 Permission Matrix

| Feature | Admin | Teacher | Assistant | Student | Parent |
|---------|-------|---------|-----------|---------|--------|
| Mark Attendance | ✅ | ✅ | ✅ | ❌ | ❌ |
| Grade Assignments | ✅ | ✅ | ✅ | ❌ | ❌ |
| Upload Materials | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Announcements | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Students | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage Groups | ✅ | ✅ | ✅ | ❌ | ❌ |
| **View Accounting** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Financial Reports** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Manage Payments** | ✅ | ✅ | ❌ | ❌ | ❌ |

## 🔐 Security Considerations

### Resource Ownership

When an assistant performs an action, the system:
1. Authenticates the assistant
2. Stores `req.assistantTeacherId` in the middleware
3. Uses the assigned teacher's ID for resource filtering

```javascript
// In checkTeacherOrAssistantAccess middleware
if (req.user.role === 'assistant') {
  req.assistantTeacherId = req.user.assistantInfo.assignedTeacher;
}

// In route handlers
const teacherId = req.user.role === 'assistant' 
  ? req.assistantTeacherId 
  : req.user._id;

// Use teacherId to filter resources
const groups = await Group.find({ teacher: teacherId });
```

### Data Isolation

Assistants only see data from their assigned teacher:
- Groups taught by their teacher
- Students in those groups
- Materials for those courses
- Assignments for those courses
- **Never** see other teachers' data
- **Never** see financial/accounting data

## 🎯 API Examples

### Successful Request (Assistant)

```bash
# Assistant can mark attendance
POST /api/attendance
Authorization: Bearer <assistant_token>
{
  "groupId": "...",
  "sessionDate": "2024-10-25",
  "records": [...]
}

Response: 200 OK
{
  "success": true,
  "message": "Attendance marked successfully"
}
```

### Blocked Request (Assistant trying to access accounting)

```bash
# Assistant cannot access accounting
GET /api/accounting/summary
Authorization: Bearer <assistant_token>

Response: 403 Forbidden
{
  "success": false,
  "message": "Access denied - teachers only"
}
```

## 🧪 Testing

### Test Scenarios

1. **Assistant can access teaching features**
   - Login as assistant
   - Try marking attendance → Should work
   - Try uploading material → Should work
   - Try creating assignment → Should work

2. **Assistant cannot access accounting**
   - Login as assistant
   - Try accessing /accounting/summary → Should fail (403)
   - Try viewing payment history → Should fail (403)
   - Verify accounting menu is hidden in UI

3. **Assistant sees only their teacher's data**
   - Login as assistant
   - View groups → Only see assigned teacher's groups
   - View students → Only see students in those groups
   - Cannot see other teachers' data

## 📝 Best Practices

### For Teachers

1. **Assigning Assistants**
   - Only assign trusted individuals
   - Remember assistants have FULL teaching access
   - They can modify grades, attendance, materials, etc.
   - They CANNOT see your financial data

2. **Monitoring**
   - Review actions periodically
   - Check attendance records
   - Verify grading
   - Use audit logs if available

### For Developers

1. **Adding New Routes**
   - Teaching-related? Use `checkTeacherOrAssistantAccess`
   - Accounting-related? Use `checkTeacherAccess` or `authorize('teacher', 'admin')`
   - Always test with assistant account

2. **Frontend Components**
   - Hide accounting links for assistants
   - Show full teaching functionality
   - Use role guards on routes
   - Test UI with assistant login

## 🚀 Future Enhancements (Optional)

While the current system is simple and effective, possible enhancements:

1. **Granular Permissions** (if needed later)
   - Actually enforce the permissions array
   - Allow teachers to limit specific actions
   - Create permission presets

2. **Activity Logging**
   - Track all assistant actions
   - Show "performed by assistant" in logs
   - Audit trail for sensitive operations

3. **Notifications**
   - Notify teacher when assistant makes changes
   - Weekly summary of assistant activities
   - Alerts for critical actions

## 📞 Support

For questions or issues:
- Check this documentation first
- Review the ASSISTANT-ROLE-IMPLEMENTATION.md file
- Test with the demo assistant account
- Contact development team

---

## Summary

**Simple Rule**: Assistants = Teachers, EXCEPT for Accounting

This makes the system easy to understand, maintain, and use. Assistants are trusted helpers who can do everything a teacher does in teaching and student management, but cannot access any financial information.

