import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Material {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: 'file' | 'link' | 'video' | 'document' | 'presentation' | 'image' | 'other';
  category?: 'lecture_notes' | 'reading' | 'video' | 'practice' | 'syllabus' | 'exam_material' | 'supplementary' | 'other';
  course: {
    _id: string;
    name: string;
    code: string;
  };
  groups?: {
    _id: string;
    name: string;
    code: string;
  }[];
  visibility: 'all_students' | 'specific_groups' | 'teachers_only';
  isPublished: boolean;
  isActive: boolean;
  tags?: string[];
  folder?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  externalUrl?: string;
  uploadedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  uploadDate: string;
  uploadedAgo?: string;
  fileSizeFormatted?: string;
  stats: {
    viewCount: number;
    downloadCount: number;
    lastAccessed?: string;
  };
  relatedAssignment?: {
    _id: string;
    title: string;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface MaterialQueryParams {
  page?: number;
  limit?: number;
  course?: string;
  group?: string;
  type?: string;
  category?: string;
  folder?: string;
  search?: string;
  sort?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface MaterialsResponse {
  materials: Material[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MaterialService {
  private apiUrl = `${environment.apiBaseUrl}/materials`;

  constructor(private http: HttpClient) {}

  /**
   * Get all materials with filters
   */
  getMaterials(params: MaterialQueryParams = {}): Observable<ApiResponse<MaterialsResponse>> {
    console.log('\n' + '='.repeat(80));
    console.log('📚 FRONTEND MaterialService: getMaterials()');
    console.log('='.repeat(80));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('📝 Parameters:', params);
    console.log('🌐 API URL:', this.apiUrl);
    
    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🔐 Authentication Status:');
    console.log('   - Token:', token ? 'EXISTS ✅' : 'MISSING ❌');
    console.log('   - User:', user ? 'EXISTS ✅' : 'MISSING ❌');
    
    if (!token || !user) {
      console.error('❌ NOT AUTHENTICATED!');
      console.error('   You must login first before accessing materials');
      console.error('   Go to /auth/login');
      console.log('='.repeat(80) + '\n');
    } else {
      console.log('   - Token preview:', token.substring(0, 30) + '...');
      try {
        const userData = JSON.parse(user);
        console.log('   - User:', userData.email, '(' + userData.role + ')');
      } catch (e) {
        console.error('   - Failed to parse user data');
      }
    }
    
    // Build HTTP params
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = (params as any)[key];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    console.log('🔧 HTTP Params:', httpParams.toString());
    console.log('📤 Sending GET request...');

    return this.http.get<ApiResponse<MaterialsResponse>>(
      this.apiUrl,
      { params: httpParams }
    ).pipe(
      tap(response => {
        console.log('\n📨 FRONTEND MaterialService: Response received');
        console.log('✅ Success:', response.success);
        
        if (response.success && response.data) {
          console.log('📊 Materials:', response.data.materials.length);
          console.log('📄 Total:', response.data.pagination.total);
          console.log('📖 Page:', response.data.pagination.page, '/', response.data.pagination.pages);
          
          if (response.data.materials.length > 0) {
            const first = response.data.materials[0];
            console.log('📄 First material:');
            console.log('   - ID:', first._id);
            console.log('   - Title:', first.title);
            console.log('   - Type:', first.type);
            console.log('   - Course:', first.course.name);
          }
        } else {
          console.warn('⚠️ Response success=false or no data');
          console.log('   Message:', response.message);
        }
        console.log('='.repeat(80) + '\n');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('\n❌ FRONTEND MaterialService: Error');
        console.error('='.repeat(80));
        console.error('📛 Status:', error.status, error.statusText);
        console.error('💬 Message:', error.error?.message || error.message);
        
        if (error.status === 401) {
          console.error('\n🚨 401 UNAUTHORIZED');
          console.error('='.repeat(80));
          console.error('This means you are NOT logged in or your token is invalid!');
          console.error('');
          console.error('🔍 Possible causes:');
          console.error('   1. No token in localStorage (not logged in)');
          console.error('   2. Token expired');
          console.error('   3. Token invalid');
          console.error('   4. API interceptor not working');
          console.error('');
          console.error('💡 Solutions:');
          console.error('   1. Login again: /auth/login');
          console.error('   2. Clear storage and login:');
          console.error('      localStorage.clear();');
          console.error('      location.href = "/auth/login";');
          console.error('   3. Check browser console for interceptor logs');
          console.error('');
          
          // Check what's in localStorage
          const currentToken = localStorage.getItem('token');
          const currentUser = localStorage.getItem('user');
          console.error('📊 Current localStorage:');
          console.error('   - Token:', currentToken ? 'EXISTS' : 'MISSING');
          console.error('   - User:', currentUser ? 'EXISTS' : 'MISSING');
          
          if (!currentToken) {
            console.error('');
            console.error('❌ NO TOKEN FOUND!');
            console.error('   You are definitely not logged in.');
            console.error('   Please go to /auth/login and login first!');
          }
        } else if (error.status === 403) {
          console.error('\n🚨 403 FORBIDDEN');
          console.error('You don\'t have permission to access this resource');
        } else if (error.status === 0) {
          console.error('\n🚨 NETWORK ERROR');
          console.error('Cannot connect to backend server');
          console.error('Is the backend running on', environment.apiBaseUrl, '?');
        }
        
        console.error('='.repeat(80) + '\n');
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single material by ID
   */
  getMaterial(id: string): Observable<ApiResponse<Material>> {
    console.log('📄 FRONTEND MaterialService: getMaterial(' + id + ')');
    
    return this.http.get<ApiResponse<Material>>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        console.log('✅ Material loaded:', response.data?.title);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to load material:', error.error?.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new material
   */
  createMaterial(material: Partial<Material>): Observable<ApiResponse<Material>> {
    console.log('➕ FRONTEND MaterialService: createMaterial()');
    
    return this.http.post<ApiResponse<Material>>(this.apiUrl, material).pipe(
      tap(response => {
        console.log('✅ Material created:', response.data?._id);
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to create material:', error.error?.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update material
   */
  updateMaterial(id: string, material: Partial<Material>): Observable<ApiResponse<Material>> {
    console.log('✏️ FRONTEND MaterialService: updateMaterial(' + id + ')');
    
    return this.http.put<ApiResponse<Material>>(`${this.apiUrl}/${id}`, material).pipe(
      tap(response => {
        console.log('✅ Material updated');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to update material:', error.error?.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete material
   */
  deleteMaterial(id: string): Observable<ApiResponse<void>> {
    console.log('🗑️ FRONTEND MaterialService: deleteMaterial(' + id + ')');
    
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        console.log('✅ Material deleted');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Failed to delete material:', error.error?.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Track material download
   */
  trackDownload(id: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${id}/download`, {});
  }

  /**
   * Download material
   */
  downloadMaterial(material: Material): void {
    console.log('⬇️ FRONTEND MaterialService: downloadMaterial(' + material._id + ')');
    
    // Track download
    this.trackDownload(material._id).subscribe({
      next: (response) => {
        if (response.success && response.data?.fileUrl) {
          // Open file URL in new tab
          window.open(response.data.fileUrl, '_blank');
          console.log('✅ Download tracked and file opened');
        } else if (material.fileUrl) {
          // Fallback to direct file URL
          window.open(material.fileUrl, '_blank');
          console.log('✅ File opened (no tracking response)');
        } else if (material.externalUrl) {
          // External link
          window.open(material.externalUrl, '_blank');
          console.log('✅ External link opened');
        } else {
          console.error('❌ No file URL available for download');
        }
      },
      error: (error) => {
        console.error('❌ Failed to track download:', error.error?.message);
        // Try to download anyway
        if (material.fileUrl) {
          window.open(material.fileUrl, '_blank');
        } else if (material.externalUrl) {
          window.open(material.externalUrl, '_blank');
        }
      }
    });
  }
}

