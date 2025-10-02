import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of } from 'rxjs';
import { Router } from '@angular/router';
import { MockAuthService, User, LoginRequest, RegisterRequest, AuthResponse } from './mock-auth.service';

// Export types properly for isolated modules
export type { User, LoginRequest, RegisterRequest, AuthResponse } from './mock-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:5000/api';
  private readonly USE_MOCK = true; // Set to false when real backend is available
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private mockAuthService: MockAuthService
  ) {
    // Load user and token from localStorage on service initialization
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'admin';
  }

  get isTeacher(): boolean {
    return this.currentUser?.role === 'teacher';
  }

  get isStudent(): boolean {
    return this.currentUser?.role === 'student';
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    if (this.USE_MOCK) {
      return this.mockAuthService.login(credentials).pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
          }
        })
      );
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
          }
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    if (this.USE_MOCK) {
      return this.mockAuthService.register(userData).pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
          }
        })
      );
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/auth/register`, userData)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
          }
        })
      );
  }

  createUser(userData: RegisterRequest): Observable<AuthResponse> {
    if (this.USE_MOCK) {
      return this.mockAuthService.createUser(userData);
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/users`, userData, {
      headers: this.getAuthHeaders()
    });
  }

  getAllUsers(): Observable<User[]> {
    if (this.USE_MOCK) {
      return this.mockAuthService.getAllUsers();
    }

    return this.http.get<User[]>(`${this.API_URL}/users`, {
      headers: this.getAuthHeaders()
    });
  }

  updateUser(userId: string, updateData: Partial<User>): Observable<any> {
    if (this.USE_MOCK) {
      return this.mockAuthService.updateUser(userId, updateData);
    }

    return this.http.put<any>(`${this.API_URL}/users/${userId}`, updateData, {
      headers: this.getAuthHeaders()
    });
  }

  deleteUser(userId: string): Observable<any> {
    if (this.USE_MOCK) {
      return this.mockAuthService.deleteUser(userId);
    }

    return this.http.delete<any>(`${this.API_URL}/users/${userId}`, {
      headers: this.getAuthHeaders()
    });
  }

  logout(): void {
    if (!this.USE_MOCK) {
      // Call backend logout endpoint
      this.http.post(`${this.API_URL}/auth/logout`, {}).subscribe();
    }
    
    // Clear local data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    
    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  changePassword(passwordData: { currentPassword: string; newPassword: string }): Observable<any> {
    if (this.USE_MOCK && this.currentUser) {
      return this.mockAuthService.changePassword(
        this.currentUser.id, 
        passwordData.currentPassword, 
        passwordData.newPassword
      );
    }

    return this.http.put<any>(`${this.API_URL}/auth/change-password`, passwordData, {
      headers: this.getAuthHeaders()
    });
  }

  refreshToken(): Observable<any> {
    if (this.USE_MOCK) {
      // For mock service, just return current token
      return of({ success: true, data: { token: this.token } });
    }

    return this.http.post<any>(`${this.API_URL}/auth/refresh-token`, {})
      .pipe(
        tap(response => {
          if (response.success) {
            this.tokenSubject.next(response.data.token);
            localStorage.setItem('token', response.data.token);
          }
        })
      );
  }

  verifyToken(): Observable<any> {
    if (this.USE_MOCK) {
      // For mock service, always return valid
      return of({ success: true, valid: true });
    }

    return this.http.get<any>(`${this.API_URL}/auth/verify-token`, {
      headers: this.getAuthHeaders()
    });
  }

  validateToken(): Observable<any> {
    return this.verifyToken();
  }

  updateProfile(profileData: Partial<User>): Observable<any> {
    if (this.USE_MOCK && this.currentUser) {
      return this.mockAuthService.updateUser(this.currentUser.id, profileData).pipe(
        tap(response => {
          if (response.success && response.user) {
            this.currentUserSubject.next(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        })
      );
    }

    return this.http.put<any>(`${this.API_URL}/auth/profile`, profileData, {
      headers: this.getAuthHeaders()
    })
      .pipe(
        tap(response => {
          if (response.success) {
            this.currentUserSubject.next(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }
        })
      );
  }

  forgotPassword(email: string): Observable<any> {
    if (this.USE_MOCK) {
      // Mock forgot password - always return success
      return of({ 
        success: true, 
        message: 'Password reset instructions sent to your email' 
      });
    }

    return this.http.post<any>(`${this.API_URL}/auth/forgot-password`, { email });
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.token;
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  private setAuthData(user: User, token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
  }
}
