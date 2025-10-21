import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { MockAuthService, User, LoginRequest, RegisterRequest, AuthResponse } from './mock-auth.service';
import { environment } from '../../environments/environment';

// Export types properly for isolated modules
export type { User, LoginRequest, RegisterRequest, AuthResponse } from './mock-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = environment.apiBaseUrl;
  private readonly USE_MOCK = environment.features.enableMockData;
  
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
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      this.tokenSubject.next(token);
      
      // Parse user and restore avatar from localStorage if available
      const user = JSON.parse(userStr);
      const avatar = localStorage.getItem('userAvatar');
      if (avatar) {
        (user as any).avatar = avatar;
      }
      
      this.currentUserSubject.next(user);
    }
  }

  get currentUser(): User | null {
    // SIMPLIFIED: Use BehaviorSubject as the primary source of truth
    // BehaviorSubject always has the complete user object (with avatar)
    const subjectUser = this.currentUserSubject.value;
    
    // If we have user in memory, return it directly (it has avatar)
    if (subjectUser) {
      return subjectUser;
    }
    
    // If no user in memory, try to restore from localStorage
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        
        // Restore avatar from localStorage (persists across browser sessions)
        const avatar = localStorage.getItem('userAvatar');
        if (avatar) {
          (user as any).avatar = avatar;
        }
        
        console.log('🔄 AuthService: Restoring user from localStorage with avatar');
        this.currentUserSubject.next(user);
        return user;
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('userAvatar');
        return null;
      }
    }
    
    return null;
  }

  get token(): string | null {
    // Always sync with localStorage as source of truth
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const subjectToken = this.tokenSubject.value;
    
    // If localStorage has a token but subject doesn't, sync it
    if (storedToken && !subjectToken) {
      console.log('🔄 AuthService: Syncing token from localStorage to BehaviorSubject');
      this.tokenSubject.next(storedToken);
      return storedToken;
    }
    
    // If subject has a token but localStorage doesn't, clear subject
    if (!storedToken && subjectToken) {
      console.log('🔄 AuthService: Clearing token from BehaviorSubject (not in localStorage)');
      this.tokenSubject.next(null);
      return null;
    }
    
    // Return localStorage value as source of truth
    return storedToken || subjectToken;
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

    console.log('Attempting login with credentials:', { email: credentials.email });
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          console.log('Login response:', response);
          if (response.success) {
            this.setAuthData(response.data.user, response.data.token);
            console.log('Auth data set successfully');
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('Login error:', error);
          return throwError(() => error);
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
    localStorage.removeItem('userAvatar');
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
            // Use updateCurrentUser method to properly handle avatar storage
            this.updateCurrentUser(response.user);
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
            // Use updateCurrentUser method to properly handle avatar storage
            this.updateCurrentUser(response.data.user);
          }
        })
      );
  }

  // Method to manually update current user (useful after profile updates)
  updateCurrentUser(user: User): void {
    console.log('🔄 Updating current user in AuthService:', user);
    
    // Create a lightweight copy without avatar for localStorage
    const userWithoutAvatar = { ...user };
    delete (userWithoutAvatar as any).avatar;
    
    localStorage.setItem('user', JSON.stringify(userWithoutAvatar));
    
    // Store full user (with avatar) in memory
    this.currentUserSubject.next(user);
    
    // Store avatar separately in localStorage (persists across browser sessions)
    if ((user as any).avatar) {
      try {
        localStorage.setItem('userAvatar', (user as any).avatar);
      } catch (e) {
        console.warn('Could not store avatar in localStorage, keeping in memory only');
      }
    } else {
      localStorage.removeItem('userAvatar');
    }
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
    if (!token) {
      console.warn('No authentication token available');
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
    
    console.log('Creating auth headers with token:', token.substring(0, 20) + '...');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private setAuthData(user: User, token: string): void {
    localStorage.setItem('token', token);
    
    // Create a lightweight copy of user without avatar to avoid localStorage quota issues
    // Base64 images can be 100KB+, but we store avatar separately
    const userWithoutAvatar = { ...user };
    delete (userWithoutAvatar as any).avatar;
    
    localStorage.setItem('user', JSON.stringify(userWithoutAvatar));
    
    // Store full user (with avatar) in memory
    this.tokenSubject.next(token);
    this.currentUserSubject.next(user);
    
    // Store avatar separately in localStorage (persists across browser sessions)
    if ((user as any).avatar) {
      try {
        localStorage.setItem('userAvatar', (user as any).avatar);
      } catch (e) {
        console.warn('Could not store avatar in localStorage, keeping in memory only');
      }
    }
  }
}
