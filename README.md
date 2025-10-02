# 🎓 Drose Online Educational Management System

A comprehensive full-stack educational management system built with **Node.js**, **MongoDB**, **Angular**, and **Tailwind CSS**. This system provides complete CRUD operations and management tools for educational institutions.

## 🌟 Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student)
- Secure password hashing with bcrypt
- Protected routes and API endpoints

### 👥 User Management
- **Students**: Profile management, enrollment, grades, attendance tracking
- **Teachers**: Course management, assignment creation, grading, attendance recording
- **Admins**: Complete system administration, user management, reports

### 📚 Academic Management
- **Subjects**: Curriculum management with prerequisites and syllabus
- **Courses**: Course creation with schedules, materials, and assessments
- **Groups**: Student organization and class management
- **Academic Years**: Semester and year-based organization

### 📝 Assignment System
- Multiple assignment types (homework, quiz, midterm, final, project)
- File uploads and submissions
- Auto-grading for quizzes
- Rubric-based grading
- Late submission tracking

### 📊 Attendance Management
- Digital attendance recording
- Multiple attendance statuses (present, absent, late, excused)
- Attendance analytics and reporting
- Automated calculations

### 📢 Communication
- Announcement system with targeted audiences
- Comments and discussions
- Notification system
- Real-time updates

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling

### Frontend
- **Angular 18** - Frontend framework
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **RxJS** - Reactive programming
- **Standalone Components** - Modern Angular architecture

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd droseonline
   ```

2. **Backend Setup**
   ```bash
   # Install backend dependencies
   npm install

   # Create environment file
   cp .env.example .env
   # Edit .env with your configurations

   # Start MongoDB service
   # For Ubuntu/Debian: sudo systemctl start mongod
   # For macOS with Homebrew: brew services start mongodb-community

   # Start the backend server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install

   # Start the development server
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📋 API Documentation

### Authentication Endpoints
```
POST /api/auth/register    - Register new user
POST /api/auth/login       - User login
GET  /api/auth/me          - Get current user
PUT  /api/auth/profile     - Update profile
POST /api/auth/logout      - Logout user
```

### Student Management
```
GET    /api/students           - List all students
GET    /api/students/:id       - Get student details
PUT    /api/students/:id       - Update student
GET    /api/students/:id/courses    - Get student courses
GET    /api/students/:id/grades     - Get student grades
```

### Course Management
```
GET    /api/courses           - List courses
POST   /api/courses           - Create course
GET    /api/courses/:id       - Get course details
PUT    /api/courses/:id       - Update course
DELETE /api/courses/:id       - Delete course
```

### Assignment Management
```
GET    /api/assignments           - List assignments
POST   /api/assignments           - Create assignment
GET    /api/assignments/:id       - Get assignment
PUT    /api/assignments/:id       - Update assignment
POST   /api/assignments/:id/submissions - Submit assignment
```

## 🎨 UI/UX Features

### Modern Design
- Clean, professional interface
- Responsive design for all devices
- Dark/light theme support
- Intuitive navigation

### User Experience
- Role-based dashboards
- Real-time updates
- Advanced filtering and search
- Pagination and data management
- Loading states and error handling

## 🔒 Security Features

- JWT token authentication
- Password encryption
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- Role-based authorization

## 📊 Database Schema

The system uses MongoDB with the following main collections:
- `users` - Students, teachers, and administrators
- `subjects` - Academic subjects and curriculum
- `groups` - Student groups and classes
- `courses` - Course instances
- `assignments` - Assignments and tasks
- `submissions` - Student submissions
- `attendance` - Attendance records
- `announcements` - System announcements
- `academicyears` - Academic year management

## 🚀 Deployment

### Production Environment
1. Set NODE_ENV=production
2. Configure production MongoDB URI
3. Set secure JWT secrets
4. Configure email services
5. Set up file storage (AWS S3/Cloudinary)
6. Configure SSL certificates

### Environment Variables
```bash
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
EMAIL_HOST=your_email_host
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_email_password
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

Built for educational purposes to demonstrate modern full-stack development practices with:
- RESTful API design
- Modern Angular architecture
- MongoDB best practices
- Authentication and authorization
- Beautiful UI with Tailwind CSS

## 📞 Support

For support and questions, please create an issue in the repository.

---

**Drose Online** - Empowering Education Through Technology 🎓
