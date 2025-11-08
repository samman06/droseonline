# Attendance Module - Tabs Refactor

## Overview
Refactor attendance module with role-specific tabs for better UX.

## Student View - 3 Tabs

### Tab 1: My Attendance Records
- View all attendance records
- Filter by group, date range
- Display: Date, Group, Status (Present/Absent/Late/Excused)
- Statistics: Total sessions, present count, attendance rate
- **READ-ONLY** - No edit/delete actions

### Tab 2: My Schedule
- Display weekly schedule from all enrolled groups
- Group by day of week (Monday - Sunday)
- Show: Group name, Subject, Time, Teacher
- Highlight sessions for current day
- Color coding by subject

### Tab 3: Today's Sessions
- Show only today's scheduled sessions
- Real-time: Upcoming, Current, Completed
- Countdown timer for upcoming sessions
- Status badges (Pending, In Progress, Completed)
- Quick view of attendance status

## Teacher View - 3 Tabs

### Tab 1: Mark Attendance (Current Functionality)
- List of attendance sessions
- Filter by group, date, status
- Actions: Mark, Edit, View Details
- Pending sessions highlighted
- Bulk actions available

### Tab 2: My Weekly Schedule
- Display all teaching sessions for the week
- Group by day of week
- Show: Group, Subject, Time, Students count
- Quick attendance marking from schedule
- Color coding by group

### Tab 3: Today's Sessions
- Show only today's teaching sessions
- Timeline view: Past, Current, Upcoming
- Quick mark attendance button
- Student count and attendance status
- Notes and announcements per session

## Implementation Plan

1. Create tab component structure
2. Split existing logic into tab-specific services
3. Add schedule fetching endpoints
4. Implement today's sessions filtering
5. Add animations and transitions
6. Mobile responsive tabs

## API Endpoints Needed

### For Students:
- GET /api/attendance/my-records
- GET /api/attendance/my-schedule
- GET /api/attendance/today-sessions

### For Teachers:
- GET /api/attendance/my-teaching-schedule
- GET /api/attendance/today-teaching-sessions
- POST /api/attendance/quick-mark

## Benefits

- **Clear separation of concerns**
- **Better mobile experience** (tabs instead of long scrolls)
- **Focused views** for specific tasks
- **Improved performance** (lazy load tab content)
- **Better UX** (students see what matters to them)

