import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../services/auth.service';
import { AvatarService } from '../../services/avatar.service';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClass" class="relative">
      <!-- Image Avatar -->
      <img 
        *ngIf="avatarUrl && !imageError"
        [src]="avatarUrl"
        [alt]="user?.fullName || 'User'"
        (error)="onImageError()"
        [class]="imageClass"
        class="object-cover" />
      
      <!-- Initials Fallback -->
      <div 
        *ngIf="!avatarUrl || imageError"
        [class]="initialsClass"
        class="flex items-center justify-center text-white font-bold">
        {{ initials }}
      </div>

      <!-- Role Badge (optional) -->
      <div 
        *ngIf="showBadge && user"
        class="absolute -bottom-1 -right-1 rounded-full shadow-lg"
        [class]="badgeColorClass"
        [title]="user.role">
        <span class="text-xs">{{ roleIcon }}</span>
      </div>

      <!-- Online Status (optional) -->
      <div 
        *ngIf="showOnlineStatus"
        class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
        [class.bg-green-500]="isOnline"
        [class.bg-gray-400]="!isOnline">
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: inline-block;
    }
  `]
})
export class AvatarComponent implements OnInit {
  @Input() user: User | null = null;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
  @Input() showBadge: boolean = false;
  @Input() showOnlineStatus: boolean = false;
  @Input() isOnline: boolean = false;
  @Input() shape: 'circle' | 'square' | 'rounded' = 'circle';

  avatarUrl: string = '';
  initials: string = '';
  imageError: boolean = false;

  constructor(private avatarService: AvatarService) {}

  ngOnInit() {
    this.loadAvatar();
  }

  loadAvatar() {
    const sizeMap = {
      'xs': 32,
      'sm': 40,
      'md': 48,
      'lg': 64,
      'xl': 96,
      '2xl': 128
    };

    const pixelSize = sizeMap[this.size];
    this.avatarUrl = this.avatarService.getAvatarUrl(this.user, pixelSize);
    this.initials = this.avatarService.getInitials(this.user);
  }

  onImageError() {
    this.imageError = true;
  }

  get containerClass(): string {
    const sizeClasses = {
      'xs': 'w-8 h-8',
      'sm': 'w-10 h-10',
      'md': 'w-12 h-12',
      'lg': 'w-16 h-16',
      'xl': 'w-24 h-24',
      '2xl': 'w-32 h-32'
    };

    const shapeClasses = {
      'circle': 'rounded-full',
      'square': 'rounded-none',
      'rounded': 'rounded-lg'
    };

    return `${sizeClasses[this.size]} ${shapeClasses[this.shape]} overflow-hidden`;
  }

  get imageClass(): string {
    return 'w-full h-full';
  }

  get initialsClass(): string {
    const sizeClasses = {
      'xs': 'text-xs',
      'sm': 'text-sm',
      'md': 'text-base',
      'lg': 'text-xl',
      'xl': 'text-3xl',
      '2xl': 'text-4xl'
    };

    const bgClass = this.avatarService.getAvatarColor(this.user);
    
    return `${bgClass} w-full h-full ${sizeClasses[this.size]}`;
  }

  get roleIcon(): string {
    return this.avatarService.getRoleIcon(this.user?.role || '');
  }

  get badgeColorClass(): string {
    return this.avatarService.getRoleColorClass(this.user?.role || '');
  }
}

