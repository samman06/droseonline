import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, TimeoutError, throwError } from 'rxjs';
import { timeout, catchError, retry } from 'rxjs/operators';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  
  constructor(
    private configService: ConfigService,
    private injector: Injector,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only intercept API requests
    if (!request.url.startsWith(this.configService.apiBaseUrl)) {
      return next.handle(request);
    }

    // Get the auth token - ALWAYS check localStorage first (source of truth)
    // Then fallback to AuthService if localStorage is empty
    let token: string | null = null;
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('token');
    }
    
    // If not in localStorage, try AuthService
    if (!token) {
      const authService = this.injector.get(AuthService);
      token = authService.token;
    }

    console.log('🔍 API Interceptor:', {
      url: request.url,
      method: request.method,
      tokenFound: token ? 'YES' : 'NO',
      tokenSource: token ? (localStorage.getItem('token') ? 'localStorage' : 'AuthService') : 'NONE',
      tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    });

    // Clone the request and add common headers
    const headers: any = {
      'Content-Type': 'application/json',
      'X-App-Version': this.configService.version,
      'X-Environment': this.configService.isProduction ? 'production' : 'development'
    };

    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('✅ Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
      this.configService.log('✅ Auth token added to request:', request.url);
    } else {
      console.error('❌ NO TOKEN FOUND! Request will fail with 401');
      console.error('   - localStorage.token:', localStorage.getItem('token') ? 'exists' : 'missing');
      console.error('   - URL:', request.url);
      this.configService.error('❌ No auth token available for request:', request.url);
    }

    const apiRequest = request.clone({
      setHeaders: headers
    });

    console.log('📤 Final request headers:', {
      authorization: apiRequest.headers.get('Authorization') ? 'Bearer ***' : 'MISSING',
      contentType: apiRequest.headers.get('Content-Type')
    });

    // Log request in debug mode
    this.configService.log('HTTP Request:', {
      method: apiRequest.method,
      url: apiRequest.url,
      headers: apiRequest.headers.keys(),
      body: apiRequest.body
    });

    return next.handle(apiRequest).pipe(
      // Apply timeout from environment
      timeout(this.configService.apiTimeout),
      
      // Retry failed requests once (except for POST/PUT/DELETE)
      retry({
        count: apiRequest.method === 'GET' ? 1 : 0,
        delay: (error, retryCount) => {
          this.configService.warn(`Retrying request (attempt ${retryCount + 1}):`, apiRequest.url);
          return throwError(() => error);
        }
      }),
      
      // Handle errors
      catchError((error: HttpErrorResponse | TimeoutError) => {
        if (error instanceof TimeoutError) {
          this.configService.error('Request timeout:', apiRequest.url);
          const timeoutError = {
            error: {
              message: 'The request took too long to complete. Please check your internet connection and try again.',
              userMessage: 'Connection timeout. Please try again.'
            },
            status: 408,
            statusText: 'Request Timeout'
          };
          return throwError(() => timeoutError);
        }

        // Handle HTTP errors with user-friendly messages
        if (error instanceof HttpErrorResponse) {
          let userMessage = 'An error occurred. Please try again.';
          
          switch (error.status) {
            case 0:
              // Network error or CORS issue
              userMessage = 'Unable to connect to the server. Please check your internet connection.';
              break;
            case 400:
              userMessage = error.error?.message || 'Invalid request. Please check your input.';
              break;
            case 401:
              userMessage = 'Your session has expired. Please log in again.';
              // Redirect to login after a short delay
              setTimeout(() => {
                localStorage.clear();
                this.router.navigate(['/auth/login']);
              }, 1500);
              break;
            case 403:
              userMessage = 'You do not have permission to perform this action.';
              break;
            case 404:
              userMessage = 'The requested resource was not found.';
              break;
            case 409:
              userMessage = error.error?.message || 'A conflict occurred. This item may already exist.';
              break;
            case 422:
              userMessage = error.error?.message || 'Validation failed. Please check your input.';
              break;
            case 429:
              userMessage = 'Too many requests. Please wait a moment and try again.';
              break;
            case 500:
            case 502:
            case 503:
            case 504:
              userMessage = 'Server error. Our team has been notified. Please try again later.';
              break;
            default:
              userMessage = error.error?.message || 'An unexpected error occurred. Please try again.';
          }

          this.configService.error('HTTP Error:', {
            status: error.status,
            message: error.message,
            userMessage: userMessage,
            url: apiRequest.url
          });

          // Enhance error object with user-friendly message
          const enhancedError = {
            ...error,
            error: {
              ...error.error,
              userMessage: userMessage
            }
          };

          return throwError(() => enhancedError);
        }

        this.configService.error('Unknown Error:', error);
        return throwError(() => error);
      })
    );
  }
}
