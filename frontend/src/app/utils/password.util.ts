import * as CryptoJS from 'crypto-js';

/**
 * Password utility functions for consistent hashing and comparison
 */
export class PasswordUtils {
  private static readonly SALT_ROUNDS = 10;
  private static readonly SECRET_KEY = 'droseonline-secret-key-2024';

  /**
   * Hash a plain text password using SHA-256 with salt
   * @param plainPassword - The plain text password to hash
   * @returns The hashed password string
   */
  static hashPassword(plainPassword: string): string {
    // Generate a salt
    const salt = CryptoJS.lib.WordArray.random(128/8).toString();
    
    // Hash the password with salt and secret key
    const hash = CryptoJS.SHA256(plainPassword + salt + this.SECRET_KEY).toString();
    
    // Return salt + hash combined
    return salt + ':' + hash;
  }

  /**
   * Verify a plain text password against a hashed password
   * @param plainPassword - The plain text password to verify
   * @param hashedPassword - The stored hashed password
   * @returns True if passwords match, false otherwise
   */
  static verifyPassword(plainPassword: string, hashedPassword: string): boolean {
    try {
      // Split salt and hash
      const [salt, hash] = hashedPassword.split(':');
      
      if (!salt || !hash) {
        // If no salt/hash format, treat as plain text for demo credentials
        return plainPassword === hashedPassword;
      }
      
      // Hash the input password with the same salt
      const inputHash = CryptoJS.SHA256(plainPassword + salt + this.SECRET_KEY).toString();
      
      // Compare hashes
      return inputHash === hash;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Generate a secure random password
   * @param length - Length of the password (default: 12)
   * @returns A randomly generated password
   */
  static generatePassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  /**
   * Check password strength
   * @param password - The password to check
   * @returns Object with strength score and requirements
   */
  static checkPasswordStrength(password: string): {
    score: number;
    requirements: {
      length: boolean;
      uppercase: boolean;
      lowercase: boolean;
      numbers: boolean;
      special: boolean;
    };
    feedback: string[];
  } {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    let score = 0;
    const feedback: string[] = [];

    if (requirements.length) score += 20;
    else feedback.push('Password should be at least 8 characters long');

    if (requirements.uppercase) score += 20;
    else feedback.push('Add uppercase letters');

    if (requirements.lowercase) score += 20;
    else feedback.push('Add lowercase letters');

    if (requirements.numbers) score += 20;
    else feedback.push('Add numbers');

    if (requirements.special) score += 20;
    else feedback.push('Add special characters');

    return {
      score,
      requirements,
      feedback
    };
  }
}
