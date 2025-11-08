# Drose Online - API Documentation

## 📋 Table of Contents
- [Authentication](#authentication)
- [Users & Auth](#users--auth)
- [Students](#students)
- [Teachers](#teachers)
- [Subjects](#subjects)
- [Courses](#courses)
- [Groups](#groups)
- [Assignments](#assignments)
- [Attendance](#attendance)
- [Announcements](#announcements)
- [Calendar](#calendar)
- [Analytics](#analytics)
- [Error Handling](#error-handling)

---

## Base URL

```
Production: https://api.yourdomain.com/api
Development: http://localhost:5000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "role": "teacher",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR..."
  }
}
```

### Register Student

```http
POST /auth/register
Content-Type: application/json

{
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "email": "ahmed@student.eg",
  "password": "password123",
  "dateOfBirth": "2005-01-15",
  "gender": "male"
}
```

---

## Students

### Get All Students

```http
GET /students?page=1&limit=10&search=ahmed&grade=Grade%2010
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search by name, email, or student ID
- `grade` (optional): Filter by grade level
- `isActive` (optional): Filter by active status (true/false)
- `groupId` (optional): Filter by group ID

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "_id": "student_id",
        "firstName": "Ahmed",
        "lastName": "Hassan",
        "fullName": "Ahmed Hassan",
        "email": "ahmed@student.eg",
        "academicInfo": {
          "studentId": "S20241001",
          "currentGrade": "Grade 10",
          "enrollmentDate": "2024-09-01",
          "groups": [...]
        },
        "isActive": true
      }
    ],
    "pagination": {
      "total": 50,
      "pages": 5,
      "page": 1,
      "limit": 10
    }
  }
}
```

**Access Control:**
- **Admin**: Can see all students
- **Teacher**: Can only see students in their courses/groups
- **Student**: Can only see own profile

### Get Student by ID

```http
GET /students/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "student": {
      "_id": "student_id",
      "firstName": "Ahmed",
      "lastName": "Hassan",
      "email": "ahmed@student.eg",
      "academicInfo": {...},
      "statistics": {
        "totalAssignments": 25,
        "submittedAssignments": 22,
        "averageGrade": 85.5,
        "attendanceRate": 92.3
      }
    }
  }
}
```

### Create Student (Admin Only)

```http
POST /students
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "firstName": "Sara",
  "lastName": "Mohamed",
  "email": "sara@student.eg",
  "password": "password123",
  "dateOfBirth": "2006-03-20",
  "gender": "female",
  "academicInfo": {
    "currentGrade": "Grade 9",
    "enrollmentDate": "2024-09-01"
  }
}
```

### Update Student (Admin Only)

```http
PUT /students/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "firstName": "Sara",
  "lastName": "Mohamed Updated",
  "academicInfo": {
    "currentGrade": "Grade 10"
  }
}
```

### Delete Student (Admin Only)

```http
DELETE /students/:id
Authorization: Bearer <admin-token>
```

---

## Teachers

### Get All Teachers (Admin Only)

```http
GET /teachers?page=1&limit=10&search=ahmed
Authorization: Bearer <admin-token>
```

### Get Teacher by ID (Admin Only)

```http
GET /teachers/:id
Authorization: Bearer <admin-token>
```

### Create Teacher (Admin Only)

```http
POST /teachers
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "firstName": "Fatma",
  "lastName": "Ali",
  "email": "fatma@teacher.eg",
  "password": "password123",
  "gender": "female",
  "academicInfo": {
    "employeeId": "T20241001",
    "hireDate": "2024-01-15",
    "department": "Mathematics"
  }
}
```

---

## Subjects

### Get All Subjects

```http
GET /subjects?page=1&limit=10&search=math&isActive=true
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "_id": "subject_id",
        "name": "Mathematics",
        "code": "MATH101",
        "description": "Introduction to Mathematics",
        "gradeLevel": "Secondary",
        "isActive": true,
        "createdBy": {...}
      }
    ],
    "pagination": {...}
  }
}
```

**Access Control:**
- **Admin**: Full CRUD access
- **Teacher**: Read-only access
- **Student**: Read-only access

### Create Subject (Admin Only)

```http
POST /subjects
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Arabic Language",
  "code": "ARAB101",
  "description": "Arabic language and literature",
  "gradeLevel": "Secondary"
}
```

### Update Subject (Admin Only)

```http
PUT /subjects/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Arabic Language - Advanced",
  "isActive": true
}
```

### Delete Subject (Admin Only)

```http
DELETE /subjects/:id
Authorization: Bearer <admin-token>
```

---

## Courses

### Get All Courses

```http
GET /courses?page=1&limit=10
Authorization: Bearer <token>
```

**Access Control:**
- **Admin**: See all courses
- **Teacher**: See courses they teach
- **Student**: See enrolled courses

### Create Course (Admin Only)

```http
POST /courses
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Mathematics - Grade 10",
  "code": "MATH-G10",
  "description": "Mathematics course for Grade 10 students",
  "teacher": "teacher_id",
  "subject": "subject_id",
  "academicYear": "academic_year_id",
  "gradeLevel": "Grade 10",
  "maxStudents": 30
}
```

---

## Groups

### Get All Groups

```http
GET /groups?page=1&limit=10&gradeLevel=Grade%2010
Authorization: Bearer <token>
```

### Create Group (Admin/Teacher)

```http
POST /groups
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Math - Grade 10 - Section A",
  "code": "MATH-G10-SA",
  "description": "Section A for Grade 10 Math",
  "course": "course_id",
  "academicYear": "academic_year_id",
  "gradeLevel": "Grade 10",
  "maxStudents": 15,
  "schedule": [
    {
      "day": "Sunday",
      "startTime": "08:00",
      "endTime": "09:30",
      "room": "Room 101"
    },
    {
      "day": "Tuesday",
      "startTime": "10:00",
      "endTime": "11:30",
      "room": "Room 101"
    }
  ]
}
```

### Enroll Students in Group

```http
POST /groups/:id/enroll
Authorization: Bearer <token>
Content-Type: application/json

{
  "students": ["student_id_1", "student_id_2", "student_id_3"]
}
```

---

## Assignments

### Get All Assignments

```http
GET /assignments?page=1&limit=10&type=homework&status=published
Authorization: Bearer <token>
```

**Query Parameters:**
- `type`: homework, quiz, project
- `status`: draft, published, archived
- `courseId`: Filter by course
- `groupId`: Filter by group

### Create Assignment (Admin/Teacher)

```http
POST /assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Chapter 1 - Algebra Homework",
  "description": "Complete exercises 1-10 from the textbook",
  "type": "homework",
  "dueDate": "2025-11-01T23:59:59Z",
  "maxPoints": 100,
  "course": "course_id",
  "groups": ["group_id_1", "group_id_2"],
  "status": "published"
}
```

### Create Quiz

```http
POST /assignments
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Mid-Term Quiz - Algebra",
  "description": "Test your knowledge",
  "type": "quiz",
  "dueDate": "2025-11-05T14:00:00Z",
  "maxPoints": 50,
  "course": "course_id",
  "groups": ["group_id"],
  "status": "published",
  "questions": [
    {
      "question": "What is 2 + 2?",
      "type": "multiple_choice",
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "4",
      "points": 10
    }
  ]
}
```

### Submit Assignment (Student)

```http
POST /assignments/:id/submissions
Authorization: Bearer <student-token>
Content-Type: multipart/form-data

submissionText: "My answer to the assignment..."
files: [file1, file2]
```

### Grade Submission (Teacher/Admin)

```http
PUT /assignments/:assignmentId/submissions/:submissionId/grade
Authorization: Bearer <teacher-token>
Content-Type: application/json

{
  "grade": 85,
  "feedback": "Good work! Improve on part 3."
}
```

---

## Attendance

### Mark Attendance (Teacher/Admin)

```http
POST /attendance
Authorization: Bearer <token>
Content-Type: application/json

{
  "group": "group_id",
  "subject": "subject_id",
  "teacher": "teacher_id",
  "session": {
    "scheduleIndex": 0,
    "date": "2025-10-22"
  },
  "records": [
    {
      "student": "student_id_1",
      "status": "present"
    },
    {
      "student": "student_id_2",
      "status": "absent",
      "notes": "Sick leave"
    },
    {
      "student": "student_id_3",
      "status": "late"
    }
  ]
}
```

**Status Options**: `present`, `absent`, `late`, `excused`

### Get Attendance Records

```http
GET /attendance?groupId=group_id&date=2025-10-22
Authorization: Bearer <token>
```

---

## Announcements

### Get All Announcements

```http
GET /announcements?page=1&limit=10&priority=urgent
Authorization: Bearer <token>
```

**Query Parameters:**
- `priority`: normal, high, urgent
- `type`: general, exam, event, policy
- `search`: Search in title/content

### Create Announcement (Admin/Teacher)

```http
POST /announcements
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Midterm Exam Schedule",
  "content": "The midterm exams will start on November 1st...",
  "priority": "urgent",
  "type": "exam",
  "audience": "all",
  "publishAt": "2025-10-22T09:00:00Z",
  "expiresAt": "2025-11-01T23:59:59Z",
  "isPublished": true
}
```

---

## Calendar

### Get My Calendar

```http
GET /calendar/my-calendar?month=10&year=2025&view=month&type=assignment
Authorization: Bearer <token>
```

**Query Parameters:**
- `month`: Month number (1-12)
- `year`: Year (e.g., 2025)
- `view`: month, day, week, list
- `type` (optional): assignment, quiz, session, announcement

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "assignment_id",
        "title": "Chapter 1 Homework",
        "type": "assignment",
        "date": "2025-10-25",
        "dueDate": "2025-10-25T23:59:59Z",
        "course": {...},
        "status": "published"
      },
      {
        "id": "session_id",
        "title": "Mathematics - Section A",
        "type": "session",
        "date": "2025-10-23",
        "startTime": "08:00",
        "endTime": "09:30",
        "room": "Room 101",
        "group": {...}
      }
    ]
  }
}
```

### Get Upcoming Events

```http
GET /calendar/upcoming?limit=5
Authorization: Bearer <token>
```

---

## Analytics (Teacher/Admin)

### Get Teacher Overview

```http
GET /analytics/teacher/overview
Authorization: Bearer <teacher-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 120,
    "totalCourses": 4,
    "totalGroups": 8,
    "averageAttendanceRate": 89.5,
    "averageGrade": 82.3,
    "totalAssignments": 45,
    "pendingGrading": 12
  }
}
```

### Get Course Performance

```http
GET /analytics/teacher/course/:courseId/performance
Authorization: Bearer <teacher-token>
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message for developers",
  "userMessage": "User-friendly error message",
  "error": "Detailed error (development only)"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (no permission)
- `404`: Not Found
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

### Common Errors

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "userMessage": "Please login to continue"
}
```

**Forbidden (403):**
```json
{
  "success": false,
  "message": "Access denied. Teachers cannot delete students.",
  "userMessage": "You don't have permission to perform this action"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Max Requests**: 100 requests per window
- **Sensitive Operations**: 5 requests per window (login, register)

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698076800
```

---

## Pagination

All list endpoints support pagination:

**Request:**
```http
GET /students?page=2&limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "students": [...],
    "pagination": {
      "total": 150,
      "pages": 8,
      "page": 2,
      "limit": 20
    }
  }
}
```

---

## File Uploads

File uploads use multipart/form-data:

```http
POST /assignments/:id/submissions
Authorization: Bearer <token>
Content-Type: multipart/form-data

submissionText: "My answer..."
files: [file1.pdf, file2.docx]
```

**Supported File Types:**
- Documents: PDF, DOC, DOCX, TXT
- Images: JPG, PNG, GIF
- Archives: ZIP, RAR

**Max File Size**: 10MB per file

---

## Best Practices

1. **Always include Authorization header** for protected routes
2. **Use pagination** for large datasets
3. **Handle errors gracefully** on the client side
4. **Cache responses** when appropriate
5. **Respect rate limits**
6. **Use HTTPS** in production
7. **Validate input** before sending requests

---

## Support

For API support or questions:
- **Documentation**: This guide
- **Issues**: GitHub Issues
- **Email**: api-support@yourdomain.com

---

**API Version**: 1.0.0  
**Last Updated**: October 2025

