# Avatar System Documentation

## Overview

The avatar system provides a comprehensive solution for displaying user profile images across the application with automatic fallbacks and role-based styling.

## Features

✅ **Multiple Avatar Sources** (in priority order):
1. User-uploaded avatar (custom URL)
2. Gravatar (email-based)
3. Initials-based placeholder with role colors

✅ **Responsive Sizes**: xs, sm, md, lg, xl, 2xl
✅ **Multiple Shapes**: circle, square, rounded
✅ **Role Badges**: Optional role indicator
✅ **Online Status**: Optional online/offline indicator
✅ **Automatic Fallback**: Graceful image loading errors

## Quick Start

### 1. Display User Avatar

```typescript
import { AvatarComponent } from './shared/avatar/avatar.component';

@Component({
  template: `
    <!-- Basic usage -->
    <app-avatar [user]="currentUser"></app-avatar>
    
    <!-- With size -->
    <app-avatar [user]="currentUser" size="lg"></app-avatar>
    
    <!-- With role badge -->
    <app-avatar [user]="currentUser" [showBadge]="true"></app-avatar>
    
    <!-- With online status -->
    <app-avatar 
      [user]="currentUser" 
      [showOnlineStatus]="true"
      [isOnline]="true"></app-avatar>
    
    <!-- Square shape -->
    <app-avatar [user]="currentUser" shape="square"></app-avatar>
  `,
  imports: [AvatarComponent]
})
```

### 2. Get Avatar URL Programmatically

```typescript
import { AvatarService } from './services/avatar.service';

export class MyComponent {
  constructor(private avatarService: AvatarService) {}
  
  getUserAvatar(user: User): string {
    return this.avatarService.getAvatarUrl(user, 200);
  }
  
  getInitials(user: User): string {
    return this.avatarService.getInitials(user);
  }
}
```

## Avatar Component Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `user` | `User \| null` | `null` | User object to display avatar for |
| `size` | `'xs'\|'sm'\|'md'\|'lg'\|'xl'\|'2xl'` | `'md'` | Size of the avatar |
| `showBadge` | `boolean` | `false` | Show role badge on avatar |
| `showOnlineStatus` | `boolean` | `false` | Show online/offline indicator |
| `isOnline` | `boolean` | `false` | Online status (if `showOnlineStatus` is true) |
| `shape` | `'circle'\|'square'\|'rounded'` | `'circle'` | Shape of the avatar |

## Size Reference

| Size | Pixels | Use Case |
|------|--------|----------|
| `xs` | 32px | List items, tags |
| `sm` | 40px | Navigation bar, small cards |
| `md` | 48px | Default, list headers |
| `lg` | 64px | Profile cards, user cards |
| `xl` | 96px | User profile sections |
| `2xl` | 128px | Large profile headers |

## Role Colors

The system automatically applies gradient backgrounds based on user role:

- **Admin**: Purple to Indigo gradient 👑
- **Teacher**: Blue to Cyan gradient 👨‍🏫
- **Student**: Green to Teal gradient 🎓

## Usage Examples

### In Navigation Bar

```html
<div class="flex items-center gap-3">
  <app-avatar [user]="currentUser" size="sm"></app-avatar>
  <span>{{ currentUser?.fullName }}</span>
</div>
```

### In User List

```html
<div *ngFor="let user of users" class="flex items-center gap-4 p-4">
  <app-avatar [user]="user" size="md" [showBadge]="true"></app-avatar>
  <div>
    <h3>{{ user.fullName }}</h3>
    <p class="text-sm text-gray-600">{{ user.email }}</p>
  </div>
</div>
```

### In Profile Header

```html
<div class="profile-header">
  <app-avatar 
    [user]="profileUser" 
    size="2xl" 
    [showBadge]="true"
    shape="rounded"></app-avatar>
  <h1>{{ profileUser?.fullName }}</h1>
</div>
```

### With Online Status

```html
<app-avatar 
  [user]="user" 
  size="lg"
  [showOnlineStatus]="true"
  [isOnline]="user.isActive"></app-avatar>
```

## How to Add/Update Avatar

### Option 1: Gravatar (Automatic)

Users automatically get an avatar based on their email through [Gravatar](https://gravatar.com). They can:

1. Go to gravatar.com
2. Sign up with their email
3. Upload their photo
4. It will automatically appear in your app!

### Option 2: Custom Avatar URL

Users can add a custom avatar URL in their profile:

**Frontend** (profile page):
```html
<div class="form-group">
  <label>Avatar URL</label>
  <input 
    type="url" 
    formControlName="avatar"
    placeholder="https://example.com/my-photo.jpg">
  
  <!-- Preview -->
  <div *ngIf="profileForm.get('avatar')?.value" class="mt-2">
    <app-avatar [user]="getPreviewUser()"></app-avatar>
  </div>
</div>
```

**Backend** (already configured):
```javascript
// routes/auth.js
// 'avatar' is now in allowedUpdates array
```

### Option 3: File Upload (Future Enhancement)

For production, implement file upload with:

```typescript
// In profile component
async uploadAvatar(event: any) {
  const file = event.target.files[0];
  
  try {
    // Validate and resize
    const base64 = await this.avatarService.validateAndResizeImage(file);
    
    // Update profile
    this.profileForm.patchValue({ avatar: base64 });
    
    // Save
    this.saveProfile();
  } catch (error) {
    this.toastService.error(error.message);
  }
}
```

```html
<input 
  type="file" 
  accept="image/*"
  (change)="uploadAvatar($event)"
  hidden
  #fileInput>
<button (click)="fileInput.click()">Upload Photo</button>
```

## Avatar Service API

### Methods

#### `getAvatarUrl(user: User | null, size: number = 200): string`
Get the best available avatar URL for a user.

#### `getGravatarUrl(email: string, size: number = 200): string`
Get Gravatar URL based on email.

#### `getInitials(user: User | null): string`
Get user initials (e.g., "JD" for John Doe).

#### `getAvatarColor(user: User | null): string`
Get Tailwind color class based on role.

#### `getRoleIcon(role: string): string`
Get emoji icon for role.

#### `getRoleColorClass(role: string): string`
Get badge color classes for role.

#### `isValidImageUrl(url: string): boolean`
Validate if a URL is likely an image.

#### `fileToBase64(file: File): Promise<string>`
Convert file to base64 string.

#### `validateAndResizeImage(file: File, maxSizeKB: number): Promise<string | null>`
Validate and optionally resize an image file.

## Database Schema

The `User` model already includes an avatar field:

```javascript
// models/User.js
avatar: {
  type: String,
  default: null
}
```

Accepted values:
- `null` - Uses Gravatar or initials
- URL string - `"https://example.com/photo.jpg"`
- Base64 string - `"data:image/jpeg;base64,/9j/4AAQ..."`

## Best Practices

### 1. Always Provide User Context

```typescript
// ✅ Good
<app-avatar [user]="currentUser"></app-avatar>

// ❌ Bad (will show default avatar)
<app-avatar></app-avatar>
```

### 2. Choose Appropriate Sizes

```typescript
// Navigation - small
<app-avatar [user]="user" size="sm"></app-avatar>

// Lists - medium
<app-avatar [user]="user" size="md"></app-avatar>

// Profile pages - large
<app-avatar [user]="user" size="xl"></app-avatar>
```

### 3. Show Badges When Helpful

```typescript
// User lists - show role badges
<app-avatar [user]="user" [showBadge]="true"></app-avatar>

// Own profile - no need for badge
<app-avatar [user]="currentUser" [showBadge]="false"></app-avatar>
```

### 4. Handle Loading States

```typescript
<div *ngIf="user; else loading">
  <app-avatar [user]="user"></app-avatar>
</div>
<ng-template #loading>
  <div class="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
</ng-template>
```

## Customization

### Custom Colors

Override role colors by extending the AvatarService:

```typescript
// In avatar.service.ts
getAvatarColor(user: User | null): string {
  if (!user) return 'bg-gray-500';
  
  const customColors = {
    admin: 'bg-gradient-to-br from-red-500 to-pink-600',
    teacher: 'bg-gradient-to-br from-yellow-500 to-orange-600',
    student: 'bg-gradient-to-br from-purple-500 to-violet-600'
  };
  
  return customColors[user.role] || 'bg-gray-500';
}
```

### Custom Shapes

Add new shapes to the AvatarComponent:

```typescript
@Input() shape: 'circle' | 'square' | 'rounded' | 'hexagon' = 'circle';

const shapeClasses = {
  'circle': 'rounded-full',
  'square': 'rounded-none',
  'rounded': 'rounded-lg',
  'hexagon': 'clip-hexagon' // Add custom CSS
};
```

## Production Recommendations

### 1. Use Cloud Storage

Instead of base64 or URLs, upload to:

- **AWS S3** + CloudFront CDN
- **Cloudinary** (image optimization included)
- **Firebase Storage**
- **Azure Blob Storage**

Example flow:
```
User selects image → 
Upload to S3 → 
Get URL → 
Save URL to database → 
Display avatar with CDN URL
```

### 2. Image Optimization

- **Max size**: 5MB
- **Recommended dimensions**: 512x512px
- **Format**: WebP (with JPEG fallback)
- **Compression**: 80-85% quality

### 3. Security

- Validate file types on backend
- Scan uploaded images for malware
- Use signed URLs for private images
- Implement rate limiting on uploads

### 4. Performance

- Lazy load avatars in long lists
- Use srcset for responsive images
- Cache avatar URLs
- Use CDN for delivery

## Troubleshooting

### Avatar Not Showing

1. Check if user object is provided
2. Check browser console for image errors
3. Verify avatar URL is accessible
4. Check Gravatar for user's email

### Initials Not Displaying

1. Ensure user has firstName and lastName
2. Check browser console for errors
3. Verify AvatarService is injected

### Wrong Colors

1. Check user.role is set correctly
2. Verify role is one of: admin, teacher, student
3. Check Tailwind CSS classes are compiled

## Future Enhancements

- [ ] Image cropping tool
- [ ] Multiple avatar uploads (gallery)
- [ ] Avatar themes/frames
- [ ] Animated avatars
- [ ] Avatar history
- [ ] Admin ability to moderate avatars
- [ ] AI-generated avatars
- [ ] Integration with OAuth providers (Google, Microsoft)

## Support

For issues or questions:
1. Check this documentation
2. Review example implementations
3. Check browser console for errors
4. Verify backend logs

---

**Last Updated**: October 2025
**Version**: 1.0.0

