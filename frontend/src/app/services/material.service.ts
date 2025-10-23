import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  constructor(private api: ApiService) {}

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
   */
  createMaterial(material: Partial<Material>): Observable<ApiResponse<Material>> {
    return this.api.post<Material>(this.endpoint, material);
  }

  /**
   * Update material
   */
  updateMaterial(id: string, material: Partial<Material>): Observable<ApiResponse<Material>> {
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
    // Track download
    this.trackDownload(material._id).subscribe({
      next: (response) => {
        if (response.success && response.data?.fileUrl) {
          window.open(response.data.fileUrl, '_blank');
        } else if (material.fileUrl) {
          window.open(material.fileUrl, '_blank');
        } else if (material.externalUrl) {
          window.open(material.externalUrl, '_blank');
        }
      },
      error: () => {
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

