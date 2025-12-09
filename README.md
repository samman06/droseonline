# 🎓 Drose Online - Educational Management System

[![Status](https://img.shields.io/badge/status-production--ready-brightgreen)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

**A comprehensive, bilingual (EN/AR) school management system with full RTL support.**

---

## ✨ Features

### 👥 **User Management**
- **4 User Roles:** Admin, Teacher, Assistant, Student
- Role-based access control (RBAC)
- Secure authentication with JWT
- Profile management with avatars

### 📚 **Academic Management**
- **Subjects & Courses:** Full CRUD with teacher assignments
- **Groups:** Student enrollment, scheduling, capacity management
- **Assignments:** Create, submit, grade with multiple types (homework, quiz, project, essay)
- **Materials:** Upload/share documents, videos, links with students
- **Attendance:** Mark and track student attendance per session

### 📢 **Communication**
- **Announcements:** System-wide or targeted (by group/course/user)
- **Notifications:** Real-time updates for important events
- **Comments:** Discussion on announcements

### 📊 **Analytics & Reporting**
- Teacher dashboards with student performance
- Attendance statistics and reports
- Grade analytics
- Financial tracking (accounting module)

### 🌍 **Internationalization**
- **Bilingual:** Full English & Arabic support
- **RTL Layout:** Complete right-to-left support for Arabic
- **100% Translated:** All UI elements in both languages
- Dynamic language switching

### 🎨 **Modern UI/UX**
- **Dual View Modes:** Table and Card views for all list pages
- Responsive design (desktop, tablet, mobile)
- Beautiful gradient designs
- Consistent empty states
- Professional loading indicators

---

## 🚀 Quick Start

### Prerequisites
```bash
Node.js 18+
MongoDB 6+
npm 9+
```

### Installation

**1. Clone & Install:**
```bash
git clone <repository-url>
cd droseonline
npm install
cd frontend && npm install && cd ..
```

**2. Environment Setup:**
```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

**3. Seed Database:**
```bash
# Create demo data
node seeds/seed-mock-data.js
node seeds/seed-courses-assignments-announcements.js

# Verify data
node seeds/audit-all.js
```

**4. Run Application:**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

**5. Access:**
```
Frontend: http://localhost:4200
Backend API: http://localhost:5000
```

---

## 🔑 Demo Credentials

See [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md) for all test accounts.

**Quick Access:**
```
Admin:     admin@droseonline.com / admin123
Teacher:   ahmed.hassan@teacher.droseonline.com / teacher123
Student:   m.gaber@drose.stud.com / student123
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [PRODUCTION_README.md](PRODUCTION_README.md) | Complete deployment guide |
| [DEMO_CREDENTIALS.md](DEMO_CREDENTIALS.md) | All test accounts |
| [QUICK_TEST_CHECKLIST.md](QUICK_TEST_CHECKLIST.md) | Pre-launch testing guide |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | API endpoints reference |
| [AUTHORIZATION_GUIDE.md](docs/AUTHORIZATION_GUIDE.md) | RBAC implementation |
| [docs/PHASE1_COMPLETE.md](docs/PHASE1_COMPLETE.md) | Data audit completion |

### Additional Guides
- **User Guides:** See `/docs` for role-specific guides
- **Feature Guides:** Attendance, Assignments, Materials, etc.
- **Translation:** See `/docs` for localization status

---

## 🏗️ Project Structure

```
droseonline/
├── backend/
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth, validation, error handling
│   └── utils/            # Helper functions
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── services/     # API services
│   │   │   ├── guards/       # Route guards
│   │   │   ├── shared/       # Shared components
│   │   │   └── [modules]/    # Feature modules
│   │   ├── assets/
│   │   │   └── i18n/         # EN & AR translations
│   │   └── environments/     # Config files
│   └── dist/             # Production build
├── seeds/                # Database seeders & audits
├── docs/                 # Documentation
└── .env                  # Environment variables
```

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 20.x
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **File Upload:** Multer
- **Validation:** Express-validator

### Frontend
- **Framework:** Angular 17
- **UI Library:** Tailwind CSS
- **i18n:** @ngx-translate/core
- **HTTP Client:** Angular HttpClient
- **Charts:** Chart.js
- **Icons:** Heroicons

---

## 📊 Database Status

Run anytime to check data integrity:
```bash
node seeds/audit-all.js
```

**Current Status (as of Phase 1):**
- ✅ 132 Users (1 admin, 13 teachers, 2 assistants, 116 students)
- ✅ 34 Active Groups
- ✅ 17 Active Courses  
- ✅ 31 Upcoming Assignments
- ✅ 84 Materials (placeholders)
- ✅ 5 Active Announcements

---

## 🧪 Testing

### Quick Smoke Test
```bash
# See QUICK_TEST_CHECKLIST.md for full guide

# 1. Verify data
node seeds/audit-all.js

# 2. Start servers
npm run dev              # Terminal 1
cd frontend && npm start # Terminal 2

# 3. Test critical paths
# - Admin: Create student
# - Teacher: Create assignment
# - Student: View materials
```

### Audit Scripts
```bash
node seeds/check-users.js        # User validation
node seeds/check-groups.js       # Group enrollment
node seeds/check-courses.js      # Course assignments
node seeds/check-assignments.js  # Assignment dates
node seeds/check-materials.js    # Material files
node seeds/check-announcements.js # Publication status
```

---

## 🌐 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Start backend (serves frontend)
cd ..
npm start
```

### Deployment Options
1. **Traditional Server:** See [PRODUCTION_README.md](PRODUCTION_README.md#option-1-traditional-server)
2. **Docker:** See [PRODUCTION_README.md](PRODUCTION_README.md#option-2-docker-deployment)
3. **Cloud Platforms:** (Heroku, AWS, Azure, etc.)

---

## 🔧 Maintenance

### Database Backup
```bash
# Manual backup
mongodump --db droseonline --out ./backups/$(date +%Y%m%d)

# Automated (add to crontab)
0 2 * * * mongodump --db droseonline --out /backups/$(date +\%Y\%m\%d)
```

### Data Fixes
```bash
# Fix students without groups
node seeds/fix-student-enrollments.js

# Fix teachers without subjects
node seeds/fix-teachers-subjects.js

# Update assignment dates
node seeds/fix-assignment-dates.js

# Publish draft announcements
node seeds/publish-announcements.js
```

---

## 🎯 Modules Overview

| Module | Features | Status |
|--------|----------|--------|
| **Dashboard** | Role-based home with stats | ✅ Complete |
| **Users** | CRUD, roles, permissions | ✅ Complete |
| **Students** | Enrollment, grades, attendance | ✅ Complete |
| **Teachers** | Assignments, subjects, courses | ✅ Complete |
| **Groups** | Scheduling, enrollment, capacity | ✅ Complete |
| **Courses** | Teacher assignment, groups | ✅ Complete |
| **Subjects** | Active/inactive, metadata | ✅ Complete |
| **Assignments** | Types, grading, submissions | ✅ Complete |
| **Materials** | Upload, share, categorize | ✅ Complete |
| **Attendance** | Mark, track, statistics | ✅ Complete |
| **Announcements** | Publish, target, comments | ✅ Complete |
| **Analytics** | Teacher dashboard, reports | ✅ Complete |
| **Accounting** | Transactions, payments | ✅ Complete |
| **Calendar** | Events, schedules | ✅ Complete |

---

## 🌍 Translation Status

- ✅ **English:** 100% (1,969 keys)
- ✅ **Arabic:** 100% (1,968 keys)
- ✅ **RTL Layout:** Full support
- ✅ **Dynamic Switching:** Working

**Translation Files:**
- `frontend/src/assets/i18n/en.json`
- `frontend/src/assets/i18n/ar.json`

---

## 📝 API Endpoints

**Base URL:** `http://localhost:5000/api`

### Authentication
```
POST   /auth/login
POST   /auth/register
POST   /auth/logout
GET    /auth/me
```

### Users
```
GET    /users
GET    /users/:id
POST   /users
PUT    /users/:id
DELETE /users/:id
```

*See [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for complete API reference.*

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🆘 Support & Troubleshooting

### Common Issues

**Backend won't start:**
```bash
# Check MongoDB
sudo systemctl status mongod

# Check .env file
cat .env
```

**Frontend build fails:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Database errors:**
```bash
# Verify data integrity
node seeds/audit-all.js

# Re-seed if needed
node seeds/seed-mock-data.js
```

---

## 📞 Contact

- **Email:** support@droseonline.com
- **Documentation:** See `/docs` folder
- **Issues:** GitHub Issues

---

## 🎉 Acknowledgments

Built with ❤️ for educational institutions

**Key Technologies:**
- Angular Team
- MongoDB Team
- Tailwind CSS Team
- ngx-translate Contributors

---

**Ready to launch!** 🚀

For production deployment, see [PRODUCTION_README.md](PRODUCTION_README.md)  
For testing, see [QUICK_TEST_CHECKLIST.md](QUICK_TEST_CHECKLIST.md)

