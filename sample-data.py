# Sample data for testing the Drose Online system
# Run this script after setting up the database

from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime, timedelta
import bcrypt

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['droseonline']

# Clear existing data (optional)
db.users.drop()
db.subjects.drop()
db.academicyears.drop()
db.groups.drop()
db.courses.drop()

print("Creating sample data for Drose Online Educational System...")

# Create Academic Year
academic_year = {
    "_id": ObjectId(),
    "name": "Academic Year 2024-2025",
    "code": "AY2024-25",
    "startDate": datetime(2024, 9, 1),
    "endDate": datetime(2025, 6, 30),
    "isCurrent": True,
    "isActive": True,
    "semesters": [
        {
            "name": "fall",
            "startDate": datetime(2024, 9, 1),
            "endDate": datetime(2024, 12, 31),
            "isActive": True
        },
        {
            "name": "spring",
            "startDate": datetime(2025, 1, 15),
            "endDate": datetime(2025, 6, 30),
            "isActive": False
        }
    ],
    "createdAt": datetime.now(),
    "updatedAt": datetime.now()
}

academic_year_id = db.academicyears.insert_one(academic_year).inserted_id
print(f"✓ Created Academic Year: {academic_year['name']}")

# Create Admin User
admin_password = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
admin_user = {
    "_id": ObjectId(),
    "firstName": "System",
    "lastName": "Administrator",
    "email": "admin@droseonline.com",
    "password": admin_password,
    "role": "admin",
    "isActive": True,
    "academicInfo": {
        "permissions": ["all"]
    },
    "createdAt": datetime.now(),
    "updatedAt": datetime.now()
}

admin_id = db.users.insert_one(admin_user).inserted_id
print(f"✓ Created Admin: {admin_user['email']} (password: admin123)")

# Create Sample Subjects
subjects = [
    {
        "_id": ObjectId(),
        "name": "Introduction to Computer Science",
        "code": "CS101",
        "description": "Fundamentals of computer science and programming",
        "credits": 3,
        "type": "core",
        "level": "beginner",
        "isActive": True,
        "createdBy": admin_id,
        "createdAt": datetime.now()
    },
    {
        "_id": ObjectId(),
        "name": "Mathematics for Engineers",
        "code": "MATH201",
        "description": "Advanced mathematics concepts for engineering",
        "credits": 4,
        "type": "core",
        "level": "intermediate",
        "isActive": True,
        "createdBy": admin_id,
        "createdAt": datetime.now()
    },
    {
        "_id": ObjectId(),
        "name": "Database Systems",
        "code": "CS301",
        "description": "Design and implementation of database systems",
        "credits": 3,
        "type": "core",
        "level": "advanced",
        "isActive": True,
        "createdBy": admin_id,
        "createdAt": datetime.now()
    }
]

subject_ids = []
for subject in subjects:
    subject_id = db.subjects.insert_one(subject).inserted_id
    subject_ids.append(subject_id)
    print(f"✓ Created Subject: {subject['name']} ({subject['code']})")

# Create Sample Teachers
teacher_password = bcrypt.hashpw("teacher123".encode('utf-8'), bcrypt.gensalt())
teachers = [
    {
        "_id": ObjectId(),
        "firstName": "Dr. Sarah",
        "lastName": "Johnson",
        "email": "sarah.johnson@droseonline.com",
        "password": teacher_password,
        "role": "teacher",
        "isActive": True,
        "academicInfo": {
            "employeeId": "EMP001",
            "department": "Computer Science",
            "specialization": ["Programming", "Software Engineering"],
            "subjects": [subject_ids[0], subject_ids[2]]
        },
        "createdAt": datetime.now()
    },
    {
        "_id": ObjectId(),
        "firstName": "Prof. Michael",
        "lastName": "Davis",
        "email": "michael.davis@droseonline.com",
        "password": teacher_password,
        "role": "teacher",
        "isActive": True,
        "academicInfo": {
            "employeeId": "EMP002",
            "department": "Mathematics",
            "specialization": ["Applied Mathematics", "Statistics"],
            "subjects": [subject_ids[1]]
        },
        "createdAt": datetime.now()
    }
]

teacher_ids = []
for teacher in teachers:
    teacher_id = db.users.insert_one(teacher).inserted_id
    teacher_ids.append(teacher_id)
    print(f"✓ Created Teacher: {teacher['firstName']} {teacher['lastName']} (password: teacher123)")

# Create Sample Groups
groups = [
    {
        "_id": ObjectId(),
        "name": "Computer Science Group A",
        "code": "CS-A-24",
        "description": "First year computer science students - Group A",
        "academicYear": academic_year_id,
        "level": "freshman",
        "semester": "fall",
        "capacity": 30,
        "currentEnrollment": 0,
        "students": [],
        "isActive": True,
        "createdBy": admin_id,
        "createdAt": datetime.now()
    },
    {
        "_id": ObjectId(),
        "name": "Engineering Mathematics Group",
        "code": "MATH-ENG-24",
        "description": "Engineering students mathematics group",
        "academicYear": academic_year_id,
        "level": "sophomore",
        "semester": "fall",
        "capacity": 25,
        "currentEnrollment": 0,
        "students": [],
        "isActive": True,
        "createdBy": admin_id,
        "createdAt": datetime.now()
    }
]

group_ids = []
for group in groups:
    group_id = db.groups.insert_one(group).inserted_id
    group_ids.append(group_id)
    print(f"✓ Created Group: {group['name']} ({group['code']})")

# Create Sample Students
student_password = bcrypt.hashpw("student123".encode('utf-8'), bcrypt.gensalt())
students = [
    {
        "_id": ObjectId(),
        "firstName": "Emma",
        "lastName": "Wilson",
        "email": "emma.wilson@student.droseonline.com",
        "password": student_password,
        "role": "student",
        "isActive": True,
        "academicInfo": {
            "studentId": "STU001",
            "currentYear": 1,
            "enrollmentDate": datetime(2024, 9, 1),
            "groups": [group_ids[0]]
        },
        "createdAt": datetime.now()
    },
    {
        "_id": ObjectId(),
        "firstName": "James",
        "lastName": "Brown",
        "email": "james.brown@student.droseonline.com",
        "password": student_password,
        "role": "student",
        "isActive": True,
        "academicInfo": {
            "studentId": "STU002",
            "currentYear": 2,
            "enrollmentDate": datetime(2023, 9, 1),
            "groups": [group_ids[1]]
        },
        "createdAt": datetime.now()
    },
    {
        "_id": ObjectId(),
        "firstName": "Sophia",
        "lastName": "Garcia",
        "email": "sophia.garcia@student.droseonline.com",
        "password": student_password,
        "role": "student",
        "isActive": True,
        "academicInfo": {
            "studentId": "STU003",
            "currentYear": 1,
            "enrollmentDate": datetime(2024, 9, 1),
            "groups": [group_ids[0]]
        },
        "createdAt": datetime.now()
    }
]

student_ids = []
for student in students:
    student_id = db.users.insert_one(student).inserted_id
    student_ids.append(student_id)
    print(f"✓ Created Student: {student['firstName']} {student['lastName']} (password: student123)")

# Update groups with students
db.groups.update_one(
    {"_id": group_ids[0]},
    {
        "$push": {
            "students": {
                "$each": [
                    {"student": student_ids[0], "enrollmentDate": datetime.now(), "status": "active"},
                    {"student": student_ids[2], "enrollmentDate": datetime.now(), "status": "active"}
                ]
            }
        },
        "$set": {"currentEnrollment": 2}
    }
)

db.groups.update_one(
    {"_id": group_ids[1]},
    {
        "$push": {
            "students": {"student": student_ids[1], "enrollmentDate": datetime.now(), "status": "active"}
        },
        "$set": {"currentEnrollment": 1}
    }
)

# Create Sample Courses
courses = [
    {
        "_id": ObjectId(),
        "name": "Introduction to Programming",
        "code": "CS101-F24",
        "subject": subject_ids[0],
        "teacher": teacher_ids[0],
        "groups": [group_ids[0]],
        "academicYear": academic_year_id,
        "semester": "fall",
        "startDate": datetime(2024, 9, 1),
        "endDate": datetime(2024, 12, 31),
        "isActive": True,
        "isPublished": True,
        "createdBy": admin_id,
        "createdAt": datetime.now()
    },
    {
        "_id": ObjectId(),
        "name": "Advanced Mathematics",
        "code": "MATH201-F24",
        "subject": subject_ids[1],
        "teacher": teacher_ids[1],
        "groups": [group_ids[1]],
        "academicYear": academic_year_id,
        "semester": "fall",
        "startDate": datetime(2024, 9, 1),
        "endDate": datetime(2024, 12, 31),
        "isActive": True,
        "isPublished": True,
        "createdBy": admin_id,
        "createdAt": datetime.now()
    }
]

for course in courses:
    course_id = db.courses.insert_one(course).inserted_id
    print(f"✓ Created Course: {course['name']} ({course['code']})")

print("\n🎉 Sample data creation completed!")
print("\n📋 Login Credentials:")
print("👤 Admin: admin@droseonline.com / admin123")
print("👨‍🏫 Teacher: sarah.johnson@droseonline.com / teacher123")
print("👨‍🏫 Teacher: michael.davis@droseonline.com / teacher123")
print("👨‍🎓 Student: emma.wilson@student.droseonline.com / student123")
print("👨‍🎓 Student: james.brown@student.droseonline.com / student123")
print("👩‍🎓 Student: sophia.garcia@student.droseonline.com / student123")

client.close()
