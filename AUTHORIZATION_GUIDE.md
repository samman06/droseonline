# Authorization & Access Control Guide

## Overview
This guide documents the role-based access control (RBAC) system implemented for student and teacher data access.

## Authorization Rules

### 👨‍🏫 Teachers

**What Teachers Can See:**
- ✅ Only students enrolled in their courses/groups
- ✅ Their own profile and data
- ✅ Assignments for their courses
- ✅ Attendance for their sessions
- ✅ Submissions for their assignments

**What Teachers CANNOT See:**
- ❌ Students from other teachers' courses
- ❌ Other teachers' profiles or data
- ❌ Students not enrolled in their groups

**Available Filters:**
- Filter by student name (search)
- Filter by grade level
- Filter by group (only groups they teach)
- Pagination

### 👑 Admin

**Full Access:**
- ✅ All students
- ✅ All teachers
- ✅ All courses, groups, assignments
- ✅ System-wide statistics
- ✅ User management (create, update, delete)

### 👨‍🎓 Students

**What Students Can See:**
- ✅ Their own profile only
- ✅ Active teachers list (limited info)
- ✅ Their assignments and submissions
- ✅ Their attendance records
- ✅ Their enrolled groups and courses

**What Students CANNOT See:**
- ❌ Other students' profiles or data
- ❌ Teacher profiles (except basic info for browsing)

---

## API Endpoints

### Student Endpoints

#### GET /api/students
**Purpose:** List students with filtering

**Authorization:**
- **Teachers:** Only returns students enrolled in their courses/groups
- **Admin:** Returns all students

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)
- `search` - Search by name, email, or student ID
- `grade` - Filter by grade level (e.g., "Grade 10")
- `isActive` - Filter by active status
- `groupId` - Filter by specific group (teachers: validates access)

**Example Request (Teacher):**
```bash
GET /api/students?search=Youssef&grade=Grade%2010
Authorization: Bearer <teacher_token>
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "68f821a0c71f18918f9c896f",
        "firstName": "Youssef",
        "lastName": "Ahmed",
        "email": "youssef.ahmed@student.eg",
        "academicInfo": {
          "currentGrade": "Grade 10",
          "groups": [...]
        }
      }
    ],
    "pagination": {
      "total": 3,
      "pages": 1,
      "page": 1,
      "limit": 10
    }
  }
}
```

---

#### GET /api/students/:id
**Purpose:** Get detailed student profile

**Authorization:**
- **Teachers:** Only if student is enrolled in their courses
- **Admin:** Any student
- **Students:** Own profile only

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "...",
      "firstName": "Youssef",
      "lastName": "Ahmed",
      "academicInfo": {...},
      "statistics": {
        "totalAssignments": 12,
        "completedAssignments": 10,
        "averageGrade": 85.5
      }
    }
  }
}
```

**Response (No Access):**
```json
{
  "success": false,
  "message": "Access denied. This student is not enrolled in your courses."
}
```

---

### Teacher Endpoints

#### GET /api/teachers/:id
**Purpose:** Get teacher profile

**Authorization:**
- **Teachers:** Own profile only
- **Admin:** Any teacher

**Response (No Access):**
```json
{
  "success": false,
  "message": "Access denied. You can only view your own profile."
}
```

---

## Implementation Details

### Backend Logic (routes/students.js)

**Student List Filtering for Teachers:**
```javascript
if (req.user.role === 'teacher') {
  // Get teacher's courses
  const teacherCourses = await Course.find({ teacher: req.user._id });
  const courseIds = teacherCourses.map(c => c._id);
  
  // Get groups for those courses
  const teacherGroups = await Group.find({ course: { $in: courseIds } });
  const groupIds = teacherGroups.map(g => g._id);
  
  // Only show students enrolled in these groups
  query['academicInfo.groups'] = { $in: groupIds };
}
```

**Student Detail Access Check for Teachers:**
```javascript
if (req.user.role === 'teacher') {
  const teacherCourses = await Course.find({ teacher: req.user._id });
  const courseIds = teacherCourses.map(c => c._id);
  
  const teacherGroups = await Group.find({ course: { $in: courseIds } });
  const groupIds = teacherGroups.map(g => g._id.toString());
  
  const studentGroupIds = student.academicInfo.groups.map(g => g._id.toString());
  const hasAccess = studentGroupIds.some(sgId => groupIds.includes(sgId));
  
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. This student is not enrolled in your courses.'
    });
  }
}
```

---

## Testing Results

### Test Scenario 1: Teacher Access
**Teacher:** ahmed.hassan@school.eg (teaches Grade 10 & 11 Arabic)

```bash
# Login as teacher
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ahmed.hassan@school.eg","password":"teacher123"}'

# Get students
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer <token>"
```

**Result:** ✅ Returns only 4 students (those in Grade 10-11 Arabic)

---

### Test Scenario 2: Admin Access

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@droseonline.com","password":"admin123"}'

# Get all students
curl http://localhost:5000/api/students \
  -H "Authorization: Bearer <token>"
```

**Result:** ✅ Returns all 15 students

---

### Test Scenario 3: Grade Filter

```bash
# Teacher filters by Grade 10
curl "http://localhost:5000/api/students?grade=Grade%2010" \
  -H "Authorization: Bearer <teacher_token>"
```

**Result:** ✅ Returns 3 Grade 10 students from teacher's courses

---

### Test Scenario 4: Unauthorized Access

```bash
# Teacher tries to access Grade 12 student (not in their courses)
curl http://localhost:5000/api/students/68f821a2c71f18918f9c8981 \
  -H "Authorization: Bearer <teacher_token>"
```

**Result:** ✅ Returns 403 with message: "Access denied. This student is not enrolled in your courses."

---

## Frontend Integration

### Checking User Role
```typescript
// In Angular component
const currentUser = this.authService.currentUser;

if (currentUser.role === 'teacher') {
  // Show limited view
  this.canEditAllStudents = false;
} else if (currentUser.role === 'admin') {
  // Show full access
  this.canEditAllStudents = true;
}
```

### API Calls
```typescript
// Student service automatically handles authorization
this.studentService.getStudents({ 
  search: 'Youssef',
  grade: 'Grade 10'
}).subscribe(response => {
  // Teachers get only their students
  // Admins get all matching students
  this.students = response.data.students;
});
```

---

## Security Considerations

1. **Token-Based Authentication:**
   - All endpoints require valid JWT token
   - Token includes user ID and role

2. **Server-Side Validation:**
   - Never trust client-side role checks
   - All authorization logic on backend

3. **Data Isolation:**
   - Teachers cannot see students outside their courses
   - Students cannot see other students' data

4. **Audit Trail:**
   - All access attempts logged
   - Failed authorization attempts tracked

---

## Future Enhancements

1. **Parent Access:**
   - Parents should see only their children's data
   - Implement parent-student relationship

2. **Grade-Level Teachers:**
   - Some teachers may need grade-level access
   - Add grade-level permissions

3. **Co-Teachers:**
   - Support multiple teachers per course
   - Shared access to students

4. **Temporary Access:**
   - Substitute teachers
   - Guest teacher permissions

---

## Troubleshooting

### Issue: Teacher sees no students

**Check:**
1. Does teacher have any courses assigned?
2. Do those courses have groups?
3. Are students enrolled in those groups?

**Fix:**
```javascript
// Check teacher's courses
await Course.find({ teacher: teacherId });

// Check groups
await Group.find({ course: { $in: courseIds } });

// Check enrollments
await User.find({ 
  role: 'student',
  'academicInfo.groups': { $in: groupIds }
});
```

---

### Issue: 403 Error when accessing student

**Check:**
1. Is the student enrolled in teacher's groups?
2. Is the group active?
3. Is the enrollment status 'active'?

**Fix:**
Verify student's groups match teacher's course groups.

---

## Related Documentation

- [ROLE_BASED_DASHBOARD_GUIDE.md](./ROLE_BASED_DASHBOARD_GUIDE.md) - Dashboard customization by role
- [ATTENDANCE_USER_GUIDE.md](./ATTENDANCE_USER_GUIDE.md) - Attendance access control
- [README.md](./README.md) - General API documentation

---

## Summary

The authorization system ensures:
- ✅ **Data Privacy:** Users only see data they should access
- ✅ **Role Separation:** Clear boundaries between admin, teacher, student
- ✅ **Security:** Server-side validation prevents unauthorized access
- ✅ **Usability:** Teachers see only relevant students for their workflow
- ✅ **Scalability:** System works with any number of teachers/students

This implementation provides a secure, scalable foundation for multi-tenant educational data management.

