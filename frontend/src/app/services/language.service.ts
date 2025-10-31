import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject: BehaviorSubject<Language>;
  public currentLanguage$: Observable<Language>;

  private readonly STORAGE_KEY = 'selected_language';
  private readonly AVAILABLE_LANGUAGES: Language[] = ['en', 'ar'];
  private readonly DEFAULT_LANGUAGE: Language = 'en';

  constructor(private translate: TranslateService) {
    // Get language from localStorage or use default
    const savedLanguage = this.getSavedLanguage();
    this.currentLanguageSubject = new BehaviorSubject<Language>(savedLanguage);
    this.currentLanguage$ = this.currentLanguageSubject.asObservable();

    // Initialize TranslateService
    this.translate.addLangs(this.AVAILABLE_LANGUAGES);
    this.translate.setDefaultLang(this.DEFAULT_LANGUAGE);
    this.setLanguage(savedLanguage, false); // Don't save again
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  /**
   * Get text direction for current language
   */
  getDirection(): Direction {
    return this.currentLanguageSubject.value === 'ar' ? 'rtl' : 'ltr';
  }

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    return this.getDirection() === 'rtl';
  }

  /**
   * Set language and persist to localStorage
   */
  setLanguage(language: Language, persist: boolean = true): void {
    if (!this.AVAILABLE_LANGUAGES.includes(language)) {
      console.warn(`Language '${language}' not supported. Using default.`);
      language = this.DEFAULT_LANGUAGE;
    }

    // Use TranslateService
    this.translate.use(language).subscribe(() => {
      // Update subject
      this.currentLanguageSubject.next(language);

      // Update HTML attributes
      this.updateDocumentLanguage(language);

      // Persist to localStorage
      if (persist) {
        this.saveLanguage(language);
      }

      console.log(`✅ Language changed to: ${language}`);
    });
  }

  /**
   * Toggle between English and Arabic
   */
  toggleLanguage(): void {
    const newLanguage: Language = this.getCurrentLanguage() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLanguage);
  }

  /**
   * Get language name in its own language
   */
  getLanguageName(language: Language): string {
    const names: Record<Language, string> = {
      en: 'English',
      ar: 'العربية'
    };
    return names[language];
  }

  /**
   * Get all available languages
   */
  getAvailableLanguages(): Language[] {
    return [...this.AVAILABLE_LANGUAGES];
  }

  /**
   * Update HTML document language and direction attributes
   */
  private updateDocumentLanguage(language: Language): void {
    const direction = language === 'ar' ? 'rtl' : 'ltr';
    
    // Set HTML lang attribute
    document.documentElement.lang = language;
    
    // Set HTML dir attribute
    document.documentElement.dir = direction;
    
    // Add/remove RTL class for additional styling if needed
    if (direction === 'rtl') {
      document.documentElement.classList.add('rtl');
      document.documentElement.classList.remove('ltr');
    } else {
      document.documentElement.classList.add('ltr');
      document.documentElement.classList.remove('rtl');
    }
  }

  /**
   * Save language to localStorage
   */
  private saveLanguage(language: Language): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, language);
    } catch (error) {
      console.error('Failed to save language to localStorage:', error);
    }
  }

  /**
   * Get saved language from localStorage
   */
  private getSavedLanguage(): Language {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Language;
      return this.AVAILABLE_LANGUAGES.includes(saved) ? saved : this.DEFAULT_LANGUAGE;
    } catch (error) {
      console.error('Failed to read language from localStorage:', error);
      return this.DEFAULT_LANGUAGE;
    }
  }
}

