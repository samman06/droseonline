import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, Language } from '../../services/language.service';
import { ClickOutsideDirective } from '../directives/click-outside.directive';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, ClickOutsideDirective],
  template: `
    <div class="relative" (clickOutside)="closeDropdown()">
      <!-- Language Toggle Button -->
      <button
        type="button"
        (click)="toggleDropdown()"
        class="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        [attr.aria-expanded]="isDropdownOpen"
        aria-haspopup="true"
      >
        <!-- Flag Icon -->
        <span class="text-lg">{{ currentLanguage === 'ar' ? '🇪🇬' : '🇬🇧' }}</span>
        
        <!-- Language Label -->
        <span class="hidden sm:inline">{{ currentLanguage === 'ar' ? 'العربية' : 'English' }}</span>
        
        <!-- Dropdown Arrow -->
        <svg
          class="w-4 h-4 transition-transform"
          [class.rotate-180]="isDropdownOpen"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>

      <!-- Dropdown Menu -->
      <div
        *ngIf="isDropdownOpen"
        class="absolute mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50"
        [class.right-0]="!isRtl"
        [class.left-0]="isRtl"
      >
        <div class="py-1" role="menu" aria-orientation="vertical">
          <!-- English Option -->
          <button
            type="button"
            (click)="switchLanguage('en')"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            [class.bg-blue-50]="currentLanguage === 'en'"
            [class.text-blue-700]="currentLanguage === 'en'"
            role="menuitem"
          >
            <span class="text-lg mr-3">🇬🇧</span>
            <span class="flex-1 text-left">English</span>
            <svg
              *ngIf="currentLanguage === 'en'"
              class="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Arabic Option -->
          <button
            type="button"
            (click)="switchLanguage('ar')"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            [class.bg-blue-50]="currentLanguage === 'ar'"
            [class.text-blue-700]="currentLanguage === 'ar'"
            role="menuitem"
          >
            <span class="text-lg mr-3">🇪🇬</span>
            <span class="flex-1 text-left">العربية</span>
            <svg
              *ngIf="currentLanguage === 'ar'"
              class="w-5 h-5 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class LanguageSwitcherComponent implements OnInit {
  currentLanguage: Language = 'en';
  isDropdownOpen: boolean = false;
  isRtl: boolean = false;

  constructor(private languageService: LanguageService) {}

  ngOnInit(): void {
    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
      this.isRtl = this.languageService.isRTL();
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  switchLanguage(lang: Language): void {
    this.languageService.setLanguage(lang);
    this.closeDropdown();
  }
}

