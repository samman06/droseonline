import { Injectable } from '@angular/core';
import { User } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  
  /**
   * Get avatar URL for a user
   * Priority: 
   * 1. User's uploaded avatar
   * 2. Gravatar based on email
   * 3. Generated initials avatar
   */
  getAvatarUrl(user: User | null, size: number = 200): string {
    if (!user) {
      return this.getDefaultAvatar(size);
    }

    // If user has uploaded avatar
    if ((user as any).avatar) {
      return (user as any).avatar;
    }

    // Use Gravatar as fallback
    return this.getGravatarUrl(user.email, size);
  }

  /**
   * Get Gravatar URL based on email
   * Gravatar is a free service that provides avatars based on email
   */
  getGravatarUrl(email: string, size: number = 200): string {
    const hash = this.md5(email.toLowerCase().trim());
    // d=identicon generates a unique geometric pattern if no gravatar exists
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
  }

  /**
   * Get user initials for avatar placeholder
   */
  getInitials(user: User | null): string {
    if (!user) return '?';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  /**
   * Get background color for initials avatar based on role
   */
  getAvatarColor(user: User | null): string {
    if (!user) return 'bg-gray-500';
    
    const colors = {
      admin: 'bg-gradient-to-br from-purple-500 to-indigo-600',
      teacher: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      student: 'bg-gradient-to-br from-green-500 to-teal-600'
    };
    
    return colors[user.role as keyof typeof colors] || 'bg-gray-500';
  }

  /**
   * Get default avatar when no user is provided
   */
  private getDefaultAvatar(size: number): string {
    return `https://ui-avatars.com/api/?name=User&size=${size}&background=random`;
  }

  /**
   * Simple MD5 hash for Gravatar
   * Note: This is for Gravatar only, not for security
   */
  private md5(str: string): string {
    // For production, use a proper MD5 library
    // For now, we'll use a simple hash or just return the email
    // You can install: npm install md5 @types/md5
    // import * as md5 from 'md5';
    // return md5(str);
    
    // Temporary: Use a simple hash (replace with proper md5 in production)
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Validate if URL is a valid image URL
   */
  isValidImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
           lowerUrl.includes('gravatar.com') ||
           lowerUrl.includes('ui-avatars.com');
  }

  /**
   * Convert file to base64 for preview/upload
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Validate and resize image file
   */
  async validateAndResizeImage(file: File, maxSizeKB: number = 500): Promise<string | null> {
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image must be less than 5MB');
    }

    // Convert to base64
    const base64 = await this.fileToBase64(file);

    // For production: implement image resizing here
    // You can use libraries like 'browser-image-compression' or canvas API
    // For now, we'll just return the base64

    return base64;
  }

  /**
   * Get role icon for avatar badge
   */
  getRoleIcon(role: string): string {
    const icons = {
      admin: '👑',
      teacher: '👨‍🏫',
      student: '🎓'
    };
    return icons[role as keyof typeof icons] || '👤';
  }

  /**
   * Get role color class
   */
  getRoleColorClass(role: string): string {
    const colors = {
      admin: 'text-purple-600 bg-purple-100',
      teacher: 'text-blue-600 bg-blue-100',
      student: 'text-green-600 bg-green-100'
    };
    return colors[role as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  }
}

