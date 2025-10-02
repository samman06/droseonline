# 🎓 Drose Online - Demo User Credentials

## 🔐 Login Information

### 👤 **ADMINISTRATORS**
| Name | Email | Password | Role | Permissions |
|------|-------|----------|------|-------------|
| System Administrator | `admin@droseonline.com` | `admin123` | Admin | Full system access |
| John Manager | `john.manager@droseonline.com` | `admin123` | Admin | User management, reports |

### 👨‍🏫 **TEACHERS**
| Name | Email | Password | Department | Specialization |
|------|-------|----------|------------|----------------|
| Dr. Sarah Johnson | `sarah.johnson@droseonline.com` | `teacher123` | Computer Science | Programming, Software Engineering |
| Prof. Michael Davis | `michael.davis@droseonline.com` | `teacher123` | Mathematics | Applied Math, Statistics |
| Dr. Emily Wilson | `emily.wilson@droseonline.com` | `teacher123` | Computer Science | Web Development, UI/UX |

### 👨‍🎓 **STUDENTS**
| Name | Email | Password | Year | Group |
|------|-------|----------|------|-------|
| Emma Wilson | `emma.wilson@student.droseonline.com` | `student123` | 1st | CS Group A |
| James Brown | `james.brown@student.droseonline.com` | `student123` | 1st | CS Group A |
| Sophia Garcia | `sophia.garcia@student.droseonline.com` | `student123` | 1st | CS Group B |
| Maya Patel | `maya.patel@student.droseonline.com` | `student123` | 1st | CS Group B |
| Alex Rodriguez | `alex.rodriguez@student.droseonline.com` | `student123` | 3rd | Advanced CS |
| David Kim | `david.kim@student.droseonline.com` | `student123` | 3rd | Advanced CS |

## 📚 **Academic Structure**

### **Subjects Created:**
- **CS101** - Introduction to Computer Science (3 credits)
- **MATH201** - Advanced Mathematics (4 credits)  
- **CS301** - Database Systems (3 credits)
- **CS250** - Web Development (3 credits)
- **CS201** - Data Structures (4 credits)

### **Groups Created:**
- **CS-A-24** - Computer Science Group A (First Year)
- **CS-B-24** - Computer Science Group B (First Year) 
- **CS-ADV-24** - Advanced CS Group (Third Year)

### **Courses Created:**
- **CS101-F24** - Introduction to Programming (Sarah Johnson)
- **MATH201-F24** - Advanced Mathematics (Michael Davis)
- **CS301-F24** - Database Systems (Sarah Johnson)

## 🚀 **Quick Start**

1. **Start MongoDB:** `sudo systemctl start mongod`
2. **Run Demo Data Script:** `node create-demo-data.js`
3. **Start Backend:** `npm run dev` (from project root)
4. **Start Frontend:** `npm start` (from frontend directory)
5. **Access Application:** http://localhost:4200

## 🔍 **Testing Different Roles**

### **As Administrator:**
- Login with `admin@droseonline.com` / `admin123`
- Full access to all modules
- Can manage users, subjects, groups, courses
- Can view system-wide reports and analytics

### **As Teacher:**
- Login with `sarah.johnson@droseonline.com` / `teacher123`
- Can manage their courses and assignments
- Can view student progress and grades
- Can create announcements for their classes

### **As Student:**
- Login with `emma.wilson@student.droseonline.com` / `student123`
- Can view their courses and assignments
- Can submit assignments and take quizzes
- Can see their grades and attendance

## 📊 **Sample Data Includes:**
- ✅ 2 Admin users with different permission levels
- ✅ 3 Teacher users from different departments
- ✅ 6 Student users across different groups
- ✅ 5 Subjects with varying difficulty levels
- ✅ 3 Groups with enrolled students
- ✅ 3 Active courses with schedules
- ✅ Sample assignments (homework, quiz, project)
- ✅ Announcements and notifications
- ✅ Academic year structure with semesters
