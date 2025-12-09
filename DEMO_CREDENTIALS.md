# 🔑 Demo Credentials

**Quick Access Guide for Testing & Demos**

---

## 🎯 Quick Start

All passwords follow this pattern:
- **Admin:** `admin123`
- **Teachers:** `teacher123`
- **Assistants:** `assistant123`
- **Students:** `student123`

---

## 👨‍💼 Administrator

```
Email:    admin@droseonline.com
Password: admin123
Role:     Admin
```

**Access:**
- Full system access
- User management
- All modules (CRUD)
- Analytics & reports
- System settings

---

## 👨‍🏫 Teachers (Sample)

### Teacher 1
```
Email:    ahmed.hassan@teacher.droseonline.com
Password: teacher123
Subject:  Arabic Language
```

### Teacher 2
```
Email:    fatma.ali@teacher.droseonline.com
Password: teacher123
Subject:  English Language
```

### Teacher 3
```
Email:    mohamed.ibrahim@teacher.droseonline.com
Password: teacher123
Subject:  Mathematics
```

**Find All Teachers:**
```bash
node seeds/check-users.js | grep -A 2 "TEACHER"
```

**Access:**
- Their courses & groups
- Their students
- Create assignments
- Mark attendance
- View materials
- View announcements

---

## 🤝 Assistants

### Assistant 1
```
Email:    mohamed@droseonline.com
Password: assistant123
```

### Assistant 2
```
Email:    assistant@droseonline.com
Password: assistant123
```

**Access:**
- Similar to teachers
- Assist assigned teachers
- Limited course management

---

## 👨‍🎓 Students (Sample)

### Student 1
```
Email:    m.gaber@drose.stud.com
Password: student123
Grade:    [Check via UI]
Groups:   1 group
```

### Find More Students
```bash
node seeds/check-users.js | grep -A 3 "STUDENT"
```

**Access:**
- View assignments
- Submit work
- View materials
- Check announcements
- View grades
- Browse teachers

---

## 🔍 How to Get All Credentials

### Via Database Query
```bash
# All users with their roles
node seeds/check-users.js
```

### Via Admin Panel
1. Login as admin
2. Navigate to User Management
3. View all users with details

---

## 📊 Data Summary

**Total Users:** 132
- Admin: 1
- Teachers: 13
- Assistants: 2
- Students: 116

**All students are enrolled in 2-4 groups**  
**All teachers have subject assignments**

---

## 🎬 Demo Scenarios

### Scenario 1: Teacher Workflow
```
Login as:     ahmed.hassan@teacher.droseonline.com
Demonstrate:  
  1. View my students
  2. Create an assignment
  3. Mark attendance
  4. Upload materials
```

### Scenario 2: Student Experience
```
Login as:     m.gaber@drose.stud.com
Demonstrate:  
  1. View assignments
  2. Access materials
  3. Check announcements
  4. Browse teachers
```

### Scenario 3: Admin Management
```
Login as:     admin@droseonline.com
Demonstrate:  
  1. User management
  2. Create new group
  3. Assign students
  4. View analytics
  5. Manage announcements
```

---

## 🔒 Security Notes

**For Production:**
- [ ] Change all default passwords
- [ ] Use strong password policy
- [ ] Enable email verification
- [ ] Add 2FA for admins
- [ ] Rotate secrets regularly

**For Demo/Testing:**
- These credentials are safe to use
- Reset database periodically
- Monitor for unauthorized access

---

## 🆘 Troubleshooting

**Can't login?**
1. Check database is running: `node seeds/audit-all.js`
2. Verify backend is running: http://localhost:5000
3. Check browser console for errors

**User not found?**
1. Run: `node seeds/check-users.js`
2. Find correct email from output
3. Use exact email (case-sensitive)

**Password incorrect?**
- Double-check role-based password pattern
- Ensure no extra spaces
- Try resetting via forgot password (if implemented)

