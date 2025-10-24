import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ApiService } from './api.service';

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
  files?: Array<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt?: string;
  }>;
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
  private endpoint = 'materials';
  private apiUrl = `${environment.apiBaseUrl}/materials`;

  constructor(
    private api: ApiService,
    private http: HttpClient
  ) {}

  /**
   * Get all materials with filters
   */
  getMaterials(params: MaterialQueryParams = {}): Observable<ApiResponse<MaterialsResponse>> {
    return this.api.get<MaterialsResponse>(this.endpoint, params);
  }

  /**
   * Get single material by ID
   */
  getMaterial(id: string): Observable<ApiResponse<Material>> {
    return this.api.getById<Material>(this.endpoint, id);
  }

  /**
   * Create new material
   * Note: Uses HttpClient directly for FormData support (file uploads)
   */
  createMaterial(material: Partial<Material> | FormData): Observable<ApiResponse<Material>> {
    // Use HttpClient directly for FormData (file uploads)
    // The interceptor will add the Authorization header
    // But we don't set Content-Type for FormData (browser sets it with boundary)
    return this.http.post<ApiResponse<Material>>(this.apiUrl, material);
  }

  /**
   * Update material
   * Note: Accepts both Partial<Material> and FormData for file replacement
   */
  updateMaterial(id: string, material: Partial<Material> | FormData): Observable<ApiResponse<Material>> {
    // If it's FormData (file upload/replacement), use HttpClient directly
    if (material instanceof FormData) {
      return this.http.put<ApiResponse<Material>>(`${this.apiUrl}/${id}`, material);
    }
    // Otherwise use ApiService (JSON)
    return this.api.put<Material>(this.endpoint, id, material);
  }

  /**
   * Delete material
   */
  deleteMaterial(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(this.endpoint, id);
  }

  /**
   * Track material download
   */
  trackDownload(id: string): Observable<ApiResponse<any>> {
    return this.api.post<any>(`${this.endpoint}/${id}/download`, {});
  }

  /**
   * Download material
   */
  downloadMaterial(material: Material): void {
    // Helper function to get full URL
    const getFullUrl = (url: string): string => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url; // Already a full URL (external link)
      }
      // Relative path - prepend backend base URL
      const baseUrl = environment.apiBaseUrl.replace('/api', ''); // Remove /api suffix
      return `${baseUrl}${url}`;
    };

    // Track download
    this.trackDownload(material._id).subscribe({
      next: (response) => {
        if (response.success && response.data?.fileUrl) {
          window.open(getFullUrl(response.data.fileUrl), '_blank');
        } else if (material.fileUrl) {
          window.open(getFullUrl(material.fileUrl), '_blank');
        } else if (material.externalUrl) {
          window.open(getFullUrl(material.externalUrl), '_blank');
        }
      },
      error: () => {
        // Try to download anyway
        if (material.fileUrl) {
          window.open(getFullUrl(material.fileUrl), '_blank');
        } else if (material.externalUrl) {
          window.open(getFullUrl(material.externalUrl), '_blank');
        }
      }
    });
  }

  /**
   * Fetch text file content
   */
  getTextFileContent(fileUrl: string): Observable<string> {
    // Helper function to get full URL
    const getFullUrl = (url: string): string => {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      const baseUrl = environment.apiBaseUrl.replace('/api', '');
      return `${baseUrl}${url}`;
    };

    return this.http.get(getFullUrl(fileUrl), { responseType: 'text' });
  }

  /**
   * Helper to get full URL from relative path
   */
  getFullUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    const baseUrl = environment.apiBaseUrl.replace('/api', '');
    return `${baseUrl}${url}`;
  }
}

