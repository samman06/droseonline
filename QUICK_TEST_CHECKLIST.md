# 🧪 Quick Smoke Test Checklist

**Purpose:** Verify critical functionality before launch  
**Time Required:** 30-40 minutes  
**Priority:** Test blockers only, document minor issues for post-launch

---

## Prerequisites

### 1. Start Backend
```bash
npm run dev
```
Expected: Server running on http://localhost:5000

### 2. Start Frontend
```bash
cd frontend
npm start
```
Expected: App running on http://localhost:4200

### 3. Verify Data
```bash
node seeds/audit-all.js
```
Expected: No critical issues

---

## Test Scenarios

### 🔐 **Scenario 1: Admin Login & Basic CRUD** (10 min)

**Credentials:**
```
Email: admin@droseonline.com
Password: admin123
```

**Tests:**
- [ ] Login successful
- [ ] Dashboard loads without errors
- [ ] Navigate to Students → list appears
- [ ] Click "Create Student" → form opens
- [ ] Fill required fields → Submit → Success toast
- [ ] New student appears in list
- [ ] Click student → detail page loads
- [ ] Navigate to Announcements → 5 announcements visible
- [ ] Switch language to Arabic → UI flips to RTL
- [ ] Switch back to English

**Console Check:** Open DevTools → No red errors

---

### 👨‍🏫 **Scenario 2: Teacher Login & Core Features** (10 min)

**Find Teacher Credentials:**
```bash
# Pick any teacher from check-users.js output
# Example: 
Email: ahmed.hassan@teacher.droseonline.com (or similar)
Password: teacher123
```

**Tests:**
- [ ] Login successful
- [ ] Dashboard shows teacher-specific data
- [ ] Navigate to "My Students" → students appear
- [ ] Navigate to Assignments → can view assignments
- [ ] Click "Create Assignment" → form opens
- [ ] Select course & group → Save → Success
- [ ] Navigate to Attendance → groups visible
- [ ] Click "Mark Attendance" → interface loads
- [ ] View Materials → materials list appears

**Console Check:** No critical errors

---

### 👨‍🎓 **Scenario 3: Student Login & Access** (5 min)

**Find Student Credentials:**
```bash
# Pick any enrolled student
Email: [student email from database]
Password: student123
```

**Tests:**
- [ ] Login successful
- [ ] Dashboard shows student view
- [ ] Navigate to Assignments → can view assignments
- [ ] Navigate to Materials → can access materials
- [ ] Navigate to Announcements → 5 visible
- [ ] All menu items accessible (no 403/404)

**Console Check:** No errors

---

### 🔄 **Scenario 4: Auth & Security** (5 min)

**Tests:**
- [ ] Logout works (any role)
- [ ] Can't access dashboard without login
- [ ] Login with wrong password → error shown
- [ ] Student can't access teacher routes
- [ ] Teacher can't access admin-only routes

---

## 🐛 Issue Tracking

### Critical Issues (Must Fix Before Launch)
- [ ] None found ✅

### Minor Issues (Document for Post-Launch)
```
Example:
- [ ] Assignment form: Date picker shows old date format
- [ ] Student list: Attendance rate color not showing
```

### Known Limitations (Acceptable for v1.0)
- [ ] Materials are placeholders (files added via UI)
- [ ] Some CSS components exceed budget (cosmetic)
- [ ] Mobile responsiveness can be improved

---

## ✅ Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Status:** 
- [ ] ✅ Ready to Launch
- [ ] ⚠️ Minor issues (launch with notes)
- [ ] ❌ Critical issues (do not launch)

**Notes:**
```
[Add any observations here]
```

---

## 🚀 Next Steps After Testing

If **✅ Ready to Launch**:
1. Run final audit: `node seeds/audit-all.js`
2. Commit any last fixes
3. Create deployment branch
4. Deploy to production

If **⚠️ Minor Issues**:
1. Document issues in project board
2. Prioritize for next sprint
3. Deploy with known limitations

If **❌ Critical Issues**:
1. Fix immediately
2. Re-test
3. Then deploy

