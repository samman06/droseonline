import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PasswordUtils } from '../utils/password.util';

export interface User {
  id: string;
  _id?: string; // MongoDB ID (for backend compatibility)
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  fullName: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  academicInfo?: any;
  hashedPassword?: string; // Add hashed password field
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  phoneNumber?: string;
  dateOfBirth?: Date;
  academicInfo?: any;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MockAuthService {
  private users: User[] = [
    // Admin users with hashed passwords
    {
      id: '1',
      firstName: 'System',
      lastName: 'Admin',
      fullName: 'System Admin',
      email: 'admin@droseonline.com',
      role: 'admin',
      isActive: true,
      hashedPassword: PasswordUtils.hashPassword('admin123'),
      lastLogin: new Date()
    },
    {
      id: '2',
      firstName: 'Super',
      lastName: 'Admin',
      fullName: 'Super Admin',
      email: 'superadmin@droseonline.com',
      role: 'admin',
      isActive: true,
      hashedPassword: PasswordUtils.hashPassword('admin123'),
      lastLogin: new Date()
    },
    // Teachers
    {
      id: '3',
      firstName: 'Sarah',
      lastName: 'Johnson',
      fullName: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@droseonline.com',
      role: 'teacher',
      isActive: true,
      hashedPassword: PasswordUtils.hashPassword('teacher123'),
      lastLogin: new Date()
    },
    {
      id: '4',
      firstName: 'Michael',
      lastName: 'Davis',
      fullName: 'Prof. Michael Davis',
      email: 'michael.davis@droseonline.com',
      role: 'teacher',
      isActive: true,
      hashedPassword: PasswordUtils.hashPassword('teacher123'),
      lastLogin: new Date()
    },
    {
      id: '5',
      firstName: 'Emily',
      lastName: 'Wilson',
      fullName: 'Dr. Emily Wilson',
      email: 'emily.wilson@droseonline.com',
      role: 'teacher',
      isActive: true,
      hashedPassword: PasswordUtils.hashPassword('teacher123'),
      lastLogin: new Date()
    },
    // Students
    {
      id: '6',
      firstName: 'Emma',
      lastName: 'Wilson',
      fullName: 'Emma Wilson',
      email: 'emma.wilson@student.droseonline.com',
      role: 'student',
      isActive: true,
      hashedPassword: PasswordUtils.hashPassword('student123'),
      lastLogin: new Date(),
      academicInfo: {
        studentId: 'STU001',
        currentYear: 2,
        enrollmentDate: new Date('2023-09-01'),
        groups: ['CS-A', 'Math-101']
      }
    },
    {
      id: '7',
      firstName: 'James',
      lastName: 'Brown',
      fullName: 'James Brown',
      email: 'james.brown@student.droseonline.com',
      role: 'student',
      isActive: true,
      hashedPassword: PasswordUtils.hashPassword('student123'),
      lastLogin: new Date(),
      academicInfo: {
        studentId: 'STU002',
        currentYear: 3,
        enrollmentDate: new Date('2022-09-01'),
        groups: ['CS-B', 'Physics-201']
      }
    },
    {
      id: '8',
      firstName: 'Sophia',
      lastName: 'Garcia',
      fullName: 'Sophia Garcia',
      email: 'sophia.garcia@student.droseonline.com',
      role: 'student',
      isActive: true,
      hashedPassword: PasswordUtils.hashPassword('student123'),
      lastLogin: new Date(),
      academicInfo: {
        studentId: 'STU003',
        currentYear: 1,
        enrollmentDate: new Date('2024-09-01'),
        groups: ['CS-A', 'Math-101', 'English-101']
      }
    }
  ];

  /**
   * Authenticate user with email and password
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      // Simulate API delay
      setTimeout(() => {
        const user = this.users.find(u => u.email === credentials.email);
        
        if (!user) {
          observer.next({
            success: false,
            message: 'Invalid email or password',
            data: null as any
          });
          observer.complete();
          return;
        }

        if (!user.isActive) {
          observer.next({
            success: false,
            message: 'Account is deactivated. Please contact administrator.',
            data: null as any
          });
          observer.complete();
          return;
        }

        // Verify password using consistent hashing
        const isPasswordValid = PasswordUtils.verifyPassword(credentials.password, user.hashedPassword || '');
        
        if (!isPasswordValid) {
          observer.next({
            success: false,
            message: 'Invalid email or password',
            data: null as any
          });
          observer.complete();
          return;
        }

        // Update last login
        user.lastLogin = new Date();

        // Generate mock JWT token
        const token = this.generateToken(user);

        // Return user without password
        const { hashedPassword, ...userWithoutPassword } = user;

        observer.next({
          success: true,
          message: 'Login successful',
          data: {
            user: userWithoutPassword,
            token
          }
        });
        observer.complete();
      }, 1000); // 1 second delay to simulate API call
    });
  }

  /**
   * Register a new user
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        // Check if user already exists
        const existingUser = this.users.find(u => u.email === userData.email);
        
        if (existingUser) {
          observer.next({
            success: false,
            message: 'User with this email already exists',
            data: null as any
          });
          observer.complete();
          return;
        }

        // Create new user with hashed password
        const newUser: User = {
          id: (this.users.length + 1).toString(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          fullName: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: userData.role,
          isActive: true,
          hashedPassword: PasswordUtils.hashPassword(userData.password),
          lastLogin: new Date(),
          academicInfo: userData.academicInfo
        };

        // Add to users array
        this.users.push(newUser);

        // Generate token
        const token = this.generateToken(newUser);

        // Return user without password
        const { hashedPassword, ...userWithoutPassword } = newUser;

        observer.next({
          success: true,
          message: 'Registration successful',
          data: {
            user: userWithoutPassword,
            token
          }
        });
        observer.complete();
      }, 1500);
    });
  }

  /**
   * Change user password
   */
  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        const user = this.users.find(u => u.id === userId);
        
        if (!user) {
          observer.next({
            success: false,
            message: 'User not found'
          });
          observer.complete();
          return;
        }

        // Verify current password
        const isCurrentPasswordValid = PasswordUtils.verifyPassword(currentPassword, user.hashedPassword || '');
        
        if (!isCurrentPasswordValid) {
          observer.next({
            success: false,
            message: 'Current password is incorrect'
          });
          observer.complete();
          return;
        }

        // Update password with new hash
        user.hashedPassword = PasswordUtils.hashPassword(newPassword);

        observer.next({
          success: true,
          message: 'Password changed successfully'
        });
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Get all users (admin only)
   */
  getAllUsers(): Observable<User[]> {
    return of(this.users.map(user => {
      const { hashedPassword, ...userWithoutPassword } = user;
      return userWithoutPassword;
    })).pipe(delay(500));
  }

  /**
   * Create a new user (admin only)
   */
  createUser(userData: RegisterRequest): Observable<AuthResponse> {
    return this.register(userData);
  }

  /**
   * Update user
   */
  updateUser(userId: string, updateData: Partial<User>): Observable<{ success: boolean; message: string; user?: User }> {
    return new Observable(observer => {
      setTimeout(() => {
        const userIndex = this.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          observer.next({
            success: false,
            message: 'User not found'
          });
          observer.complete();
          return;
        }

        // Update user data (except password and sensitive fields)
        const { hashedPassword, ...safeUpdateData } = updateData as any;
        Object.assign(this.users[userIndex], safeUpdateData);

        // Recalculate full name if names changed
        if (updateData.firstName || updateData.lastName) {
          this.users[userIndex].fullName = `${this.users[userIndex].firstName} ${this.users[userIndex].lastName}`;
        }

        const { hashedPassword: _, ...userWithoutPassword } = this.users[userIndex];

        observer.next({
          success: true,
          message: 'User updated successfully',
          user: userWithoutPassword
        });
        observer.complete();
      }, 800);
    });
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): Observable<{ success: boolean; message: string }> {
    return new Observable(observer => {
      setTimeout(() => {
        const userIndex = this.users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
          observer.next({
            success: false,
            message: 'User not found'
          });
          observer.complete();
          return;
        }

        // Remove user from array
        this.users.splice(userIndex, 1);

        observer.next({
          success: true,
          message: 'User deleted successfully'
        });
        observer.complete();
      }, 500);
    });
  }

  /**
   * Generate a mock JWT token
   */
  private generateToken(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }));
    const signature = btoa('mock-signature');
    
    return `${header}.${payload}.${signature}`;
  }
}
