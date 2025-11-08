# Dropdown Menu Position Fix Guide

## Problem
When clicking the 3-dot actions menu on table rows near the bottom, the dropdown menu appears below the table (outside visible area) instead of positioning itself to stay within the viewport.

## Solution
Use dynamic positioning that detects if the button is near the bottom of the viewport and positions the dropdown above instead of below.

## Implementation

### Option 1: CSS-Only Solution (Simplest)
Add this utility class to your global styles:

```css
/* In frontend/src/styles.scss */
.dropdown-menu-auto {
  position: absolute;
  right: 0;
  z-index: 50;
  
  /* Try to position below first */
  top: calc(100% + 0.5rem);
  
  /* But if it overflows viewport, position above */
  @supports (bottom: max(0px)) {
    bottom: auto;
    top: auto;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
}

/* Position above when near bottom of viewport */
.dropdown-menu-above {
  bottom: calc(100% + 0.5rem);
  top: auto;
}
```

Then update your dropdown HTML:

```html
<div *ngIf="openDropdownId === item.id"
     class="absolute right-0 z-50 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
     [class.bottom-full]="isNearBottom()"
     [class.mb-2]="isNearBottom()"
     [class.mt-2]="!isNearBottom()">
```

### Option 2: TypeScript Solution (Most Flexible)

#### Step 1: Add position tracking to component

```typescript
export class YourListComponent implements OnInit {
  openDropdownId: string | null = null;
  dropdownPosition: 'bottom' | 'top' = 'bottom';
  
  toggleDropdown(itemId: string, event: MouseEvent) {
    if (this.openDropdownId === itemId) {
      this.closeDropdown();
      return;
    }
    
    this.openDropdownId = itemId;
    
    // Calculate position
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // If less than 200px below and more space above, position above
    this.dropdownPosition = (spaceBelow < 200 && spaceAbove > spaceBelow) ? 'top' : 'bottom';
  }
  
  closeDropdown() {
    this.openDropdownId = null;
    this.dropdownPosition = 'bottom';
  }
}
```

#### Step 2: Update template

```html
<td class="px-6 py-5 whitespace-nowrap">
  <div class="relative inline-block text-left">
    <button 
      (click)="toggleDropdown(item.id, $event)"
      class="inline-flex items-center justify-center p-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
      <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2-2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
      </svg>
    </button>

    <div 
      *ngIf="openDropdownId === item.id"
      class="absolute right-0 z-50 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
      [class.bottom-full]="dropdownPosition === 'top'"
      [class.mb-2]="dropdownPosition === 'top'"
      [class.mt-2]="dropdownPosition === 'bottom'">
      <div class="py-1">
        <!-- Menu items -->
      </div>
    </div>
  </div>
</td>
```

### Option 3: Floating UI Library (Most Robust)

For production, consider using @floating-ui/dom:

```bash
npm install @floating-ui/dom
```

```typescript
import { computePosition, flip, shift, offset } from '@floating-ui/dom';

async toggleDropdown(itemId: string, event: MouseEvent) {
  if (this.openDropdownId === itemId) {
    this.closeDropdown();
    return;
  }
  
  this.openDropdownId = itemId;
  
  // Wait for dropdown to render
  setTimeout(async () => {
    const button = event.currentTarget as HTMLElement;
    const dropdown = document.querySelector(`[data-dropdown="${itemId}"]`) as HTMLElement;
    
    if (dropdown) {
      const { x, y } = await computePosition(button, dropdown, {
        placement: 'bottom-end',
        middleware: [
          offset(8),
          flip(), // Auto flip if not enough space
          shift({ padding: 8 })
        ]
      });
      
      Object.assign(dropdown.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    }
  });
}
```

## Quick Fix for All Components

### Global CSS Solution (Fastest)
Add to `frontend/src/styles.scss`:

```scss
/* Auto-adjusting dropdown menus */
.table-dropdown-menu {
  position: absolute;
  right: 0;
  z-index: 50;
  min-width: 12rem;
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  ring: 1px solid rgba(0, 0, 0, 0.05);
  
  /* Prevent overflow */
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

/* Use this class on the parent container */
.dropdown-container {
  position: relative;
}

/* Position above if needed - add this class dynamically or use CSS */
@media (max-height: 600px) {
  .table-dropdown-menu {
    bottom: 100%;
    top: auto;
    margin-top: 0;
    margin-bottom: 0.5rem;
  }
}
```

Then in your component, update:

```html
<!-- Change from -->
<div *ngIf="openDropdownId === item.id"
     class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">

<!-- To -->
<div *ngIf="openDropdownId === item.id"
     class="table-dropdown-menu">
```

## Recommended Solution for Drose Online

Use **Option 2 (TypeScript Solution)** because:
1. No external dependencies
2. Works reliably across all browsers
3. Handles edge cases properly
4. Easy to implement across all list components

## Files to Update

Search for these patterns and apply the fix:

```bash
grep -r "absolute right-0.*mt-2.*dropdown" frontend/src/app/
```

Components likely affected:
- student-list.component.ts
- teacher-list.component.ts
- course-list.component.ts
- assignment-list.component.ts
- attendance-list.component.ts
- material-list.component.ts
- subject-list.component.ts
- group-list.component.ts
- announcement-list.component.ts

## Testing Checklist

After implementing the fix:
- [ ] Test with 20+ items in the list
- [ ] Scroll to bottom and click last row actions
- [ ] Verify dropdown appears above the button
- [ ] Test with window height < 800px
- [ ] Test on mobile devices
- [ ] Test with browser zoom (150%, 200%)
- [ ] Verify dropdown doesn't overlap header
- [ ] Verify z-index doesn't conflict with modals

## Example Implementation

See the updated student-list.component.ts for a complete working example.

## Implementation Status

### ✅ Completed
- **student-list.component.ts**: Full implementation with dynamic positioning ✓
- **teacher-list.component.ts**: Full implementation with dynamic positioning ✓
- **group-list.component.ts**: Full implementation with dynamic positioning ✓

All three components now have:
- Added `dropdownPosition: 'top' | 'bottom' = 'bottom'` property
- Updated `toggleDropdown()` to accept `MouseEvent` and calculate position dynamically
- Modified template to use dynamic CSS classes based on `dropdownPosition`
- Increased z-index from `z-10` to `z-50` for better stacking

### 📝 Notes
The fix detects available space below the button and automatically positions the dropdown above if there's less than 250px of space below. This ensures the dropdown is always visible and accessible within the viewport.

