/**
 * BaseSanitizer - Basic sanitizer functions
 * This class provides fundamental functions for other sanitizers
 */

class BaseSanitizer {
    /**
     * Check if string is empty
     * @param {string} input - String to check
     * @returns {boolean} - True if empty, false otherwise
     */
    static isEmpty(input) {
        return !input || input.trim().length === 0;
    }

    /**
     * Check if value is string type
     * @param {any} input - Value to check
     * @returns {boolean} - True if string, false otherwise
     */
    static isString(input) {
        return typeof input === 'string';
    }

    /**
     * Remove dangerous characters
     * @param {string} input - String to clean
     * @returns {string} - Cleaned string
     */
    static removeDangerousChars(input) {
        if (!this.isString(input)) return '';
        
        // Clean dangerous characters using regex
        return input.replace(/[<>]/g, '');
    }

    /**
     * Escape HTML characters
     * @param {string} input - String to escape
     * @returns {string} - Escaped string
     */
    static escapeHtml(input) {
        if (!this.isString(input)) return '';
        
        // Sadece gerçekten tehlikeli olan karakterleri escape et
        const dangerousChars = {
            '<': '&lt;',
            '>': '&gt;'
        };
        
        return input.replace(/[<>]/g, char => dangerousChars[char]);
    }

    /**
     * Clean URL
     * @param {string} url - URL to clean
     * @returns {string} - Cleaned URL
     */
    static sanitizeUrl(url) {
        if (!this.isString(url)) return '';
        
        try {
            const urlObj = new URL(url);
            return urlObj.toString();
        } catch (e) {
            return '';
        }
    }
}

export default BaseSanitizer; 