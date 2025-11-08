# 📋 Attendance System - User Guide

## How to Use the Attendance System

### Overview
The attendance system allows teachers and admins to track student attendance for group sessions.

---

## 🎯 Quick Start: Recording Attendance

### Method 1: Mark Attendance from Groups Page (RECOMMENDED)

1. **Navigate to Groups**
   - Go to: `/dashboard/groups`
   - You'll see a list of all groups

2. **Select a Group**
   - Click on any group card to view details
   - Example: "Math - Grade 10 - Sat/Wed"

3. **Go to Attendance Tab**
   - In the group details page, click the **"Attendance"** tab
   - You'll see attendance statistics and recent sessions

4. **Click "Mark Attendance"**
   - Purple button in the top right
   - This will take you to the attendance marking page for this group

5. **Mark Each Student**
   - You'll see cards for all enrolled students
   - For each student, click one of these buttons:
     - 🟢 **Present** - Student attended
     - 🔴 **Absent** - Student didn't attend
     - 🟡 **Late** - Student arrived late (you can add minutes)
     - 🔵 **Excused** - Student has valid excuse

6. **Add Minutes Late (Optional)**
   - If you marked a student as "Late"
   - An input field appears
   - Enter how many minutes late (e.g., 15)

7. **Add Notes (Optional)**
   - Each student has a notes field
   - Add any relevant information
   - Example: "Had doctor appointment"

8. **Add Session Notes (Optional)**
   - At the bottom, add overall session notes
   - Example: "Review quiz next class"

9. **Submit Attendance**
   - Click the **"Submit Attendance"** button
   - All students must be marked before submitting
   - The system will save the attendance record

---

### Method 2: Mark Attendance Directly

1. **Navigate to Attendance**
   - Go to: `/dashboard/attendance`
   - Or click "Attendance" in the sidebar

2. **Click "Mark Attendance" Button**
   - Top right corner (purple button)
   - Route: `/dashboard/attendance/mark`

3. **Select a Group**
   - A dropdown will appear
   - Choose the group you want to mark attendance for
   - Students will load automatically

4. **Follow steps 5-9 from Method 1 above**

---

## 📊 Understanding the Attendance Status

### Present (Green) 🟢
- Student attended the full session
- Arrived on time
- No special notes needed

### Absent (Red) 🔴
- Student did not attend
- No excuse provided
- Affects attendance rate negatively

### Late (Yellow) 🟡
- Student attended but arrived late
- **Must specify minutes late**
- Still counts toward attendance rate
- Example: "15 minutes late"

### Excused (Blue) 🔵
- Student absent with valid reason
- Documented excuse (medical, family, etc.)
- Doesn't negatively impact attendance as much
- Add note explaining reason

---

## 🔄 Editing Attendance Records

### If You Made a Mistake:

1. **Go to Attendance List**
   - Navigate to: `/dashboard/attendance`

2. **Find the Session**
   - Use filters to find the session:
     - Filter by group
     - Filter by date
     - Search by code (ATT-000001)

3. **Click on the Session**
   - View the attendance details

4. **Click "Edit" Button**
   - Top right corner
   - Only available if session is not locked

5. **Make Changes**
   - Change student status
   - Update minutes late
   - Modify notes
   - The system tracks all changes with visual indicators

6. **Save Changes**
   - Click "Save Changes (X)" button
   - X = number of changes you made

---

## 🔒 Locked Sessions

### What is a Locked Session?
- After review, admins can "lock" a session
- Prevents accidental changes
- Ensures data integrity

### Can I Edit a Locked Session?
- **Teachers**: No, cannot edit locked sessions
- **Admins**: Yes, can unlock and edit

### How to Unlock (Admins Only):
1. View the locked session
2. Click "Unlock Session" button
3. Confirm the action
4. Now you can edit it

---

## 📈 Viewing Attendance Statistics

### For a Specific Group:

1. **Go to Group Details**
   - Navigate to the group
   - Click "Attendance" tab

2. **View Statistics Cards:**
   - Total Sessions
   - Average Attendance Rate
   - Latest Session Date
   - Average Students Present

3. **View Recent Sessions:**
   - Last 10 sessions listed
   - Click any session to view details

### Overall Statistics:

1. **Go to Attendance Dashboard**
   - Navigate to: `/dashboard/attendance/dashboard`
   - Or click "Dashboard" button from attendance list

2. **View Overview Cards:**
   - Total Sessions
   - Overall Attendance Rate (with trend)
   - Students Present
   - Students At Risk

3. **View Trends:**
   - 7-day attendance trend chart
   - Week-over-week comparison
   - Month-over-month comparison

4. **View Insights:**
   - Top Performing Groups (highest attendance)
   - Students At Risk (< 70% attendance)
   - Today's Pending Sessions

---

## 💡 Best Practices

### When to Mark Attendance:
✅ **Immediately after class** - While memory is fresh
✅ **During class** - As students arrive
✅ **Within 24 hours** - While it's still recent

### For Late Students:
1. Mark them as "Present" initially
2. Change to "Late" when they arrive
3. Record exact minutes late
4. Add note if needed (e.g., "Bus delay")

### For Absent Students:
1. Check if they have a valid excuse
2. If yes → Mark as "Excused" + add note
3. If no → Mark as "Absent"
4. Follow up if pattern develops

### Session Notes:
- Document what was covered
- Note any disruptions
- Record makeup class plans
- Add homework assignments

---

## 🎓 Example Workflow

### Scenario: Monday Math Class - Grade 10

**Step 1: Before Class**
- Navigate to Groups → Math - Grade 10 - Mon/Wed
- Click "Attendance" tab
- Click "Mark Attendance"

**Step 2: During Class (Opening)**
- As students arrive, mark them:
  - Ahmed → Present (on time)
  - Sara → Late (5 minutes)
  - Mohamed → Not here yet...

**Step 3: Mid-Class**
- Mohamed arrives 20 minutes late
  - Change to "Late"
  - Enter "20" minutes
  - Add note: "Traffic jam"

**Step 4: After Class**
- Fatima never showed up
  - Her parent called earlier
  - Mark as "Excused"
  - Note: "Family emergency"
  
- Add session notes:
  - "Covered Chapter 5 - Algebra"
  - "Homework: Problems 1-10"
  - "Quiz next Monday"

**Step 5: Submit**
- Review all students are marked
- Click "Submit Attendance"
- ✅ Done!

---

## 🔍 Finding Past Attendance

### By Date:
1. Go to Attendance List
2. Use date filters:
   - From Date: 2025-10-01
   - To Date: 2025-10-31
3. Click "Apply Filters"

### By Group:
1. Go to Attendance List
2. Select group from dropdown
3. View all sessions for that group

### By Student:
1. Go to Students List
2. Click on student
3. View their attendance stats in sidebar

### By Code:
1. Go to Attendance List
2. Use search box
3. Enter code (e.g., ATT-000123)

---

## ⚠️ Common Issues & Solutions

### "All students must be marked"
**Problem**: Trying to submit without marking all students
**Solution**: Scroll through and ensure every student has a status

### "Session is locked"
**Problem**: Trying to edit a locked session
**Solution**: 
- Teachers: Contact admin to unlock
- Admins: Click "Unlock" button first

### "No students in this group"
**Problem**: Group has no enrolled students
**Solution**: 
1. Go to group details
2. Click "Students" tab
3. Click "Add Student"
4. Enroll students first

### "Wrong group selected"
**Problem**: Marked attendance for wrong group
**Solution**:
1. Go to attendance list
2. Find the incorrect session
3. Delete it (if not locked)
4. Mark attendance for correct group

---

## 📱 Quick Reference

### Navigation Shortcuts:
```
/dashboard/attendance              → View all attendance records
/dashboard/attendance/dashboard    → Statistics dashboard
/dashboard/attendance/mark         → Mark new attendance
/dashboard/groups                  → View all groups
/dashboard/groups/:id              → Group details + attendance tab
```

### Keyboard Shortcuts:
- Click student card → Opens status buttons
- Tab → Move between fields
- Enter → Submit (when button focused)

### Status Colors:
- 🟢 Green = Present
- 🔴 Red = Absent  
- 🟡 Yellow = Late
- 🔵 Blue = Excused

---

## 📞 Need Help?

### For Teachers:
- Contact your admin if you can't edit a session
- Report any bugs or issues
- Request training if needed

### For Admins:
- You have full access to all features
- You can unlock sessions
- You can edit any attendance record
- Check dashboard regularly for at-risk students

---

## 🎯 Success Tips

1. **Be Consistent**: Mark attendance every session
2. **Be Timely**: Record within 24 hours
3. **Be Detailed**: Use notes for context
4. **Be Accurate**: Double-check before submitting
5. **Be Proactive**: Check dashboard for trends
6. **Be Responsive**: Follow up on at-risk students

---

**Last Updated**: October 18, 2025
**Version**: 1.0

