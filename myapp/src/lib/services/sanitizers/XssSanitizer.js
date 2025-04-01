import BaseSanitizer from './BaseSanitizer';

/**
 * XssSanitizer - Protection against XSS (Cross-Site Scripting) attacks
 */
class XssSanitizer {
    // Dangerous JavaScript events
    static DANGEROUS_EVENTS = [
        'onload', 'onerror', 'onmouseover', 'onmouseout', 'onclick',
        'onkeypress', 'onkeydown', 'onkeyup', 'onblur', 'onfocus',
        'onchange', 'onsubmit', 'onreset', 'onselect', 'onabort'
    ];

    // Dangerous JavaScript protocols
    static DANGEROUS_PROTOCOLS = [
        'javascript:', 'data:', 'vbscript:', 'file:', 'about:'
    ];

    /**
     * Clean string against XSS attacks
     * @param {string} input - String to clean
     * @returns {string} - Cleaned string
     */
    static sanitize(input) {
        if (BaseSanitizer.isEmpty(input)) return '';
        if (!BaseSanitizer.isString(input)) return '';

        let sanitized = input;

        // Escape HTML characters
        sanitized = BaseSanitizer.escapeHtml(sanitized);

        // Clean JavaScript events
        sanitized = this.removeDangerousEvents(sanitized);

        // Clean dangerous protocols
        sanitized = this.removeDangerousProtocols(sanitized);

        // Clean Unicode escape characters
        sanitized = this.removeUnicodeEscapes(sanitized);

        return sanitized;
    }

    /**
     * Clean dangerous JavaScript events
     * @param {string} input - String to clean
     * @returns {string} - Cleaned string
     */
    static removeDangerousEvents(input) {
        let sanitized = input;
        
        // Clean event attributes
        this.DANGEROUS_EVENTS.forEach(event => {
            const regex = new RegExp(event + '\\s*=\\s*["\'].*?["\']', 'gi');
            sanitized = sanitized.replace(regex, '');
        });

        return sanitized;
    }

    /**
     * Clean dangerous protocols
     * @param {string} input - String to clean
     * @returns {string} - Cleaned string
     */
    static removeDangerousProtocols(input) {
        let sanitized = input;
        
        this.DANGEROUS_PROTOCOLS.forEach(protocol => {
            const regex = new RegExp(protocol + '.*?(?=[\\s<>"\']|$)', 'gi');
            sanitized = sanitized.replace(regex, '');
        });

        return sanitized;
    }

    /**
     * Clean Unicode escape characters
     * @param {string} input - String to clean
     * @returns {string} - Cleaned string
     */
    static removeUnicodeEscapes(input) {
        return input.replace(/\\u[\dA-Fa-f]{4}/g, '');
    }

    /**
     * Clean URL against XSS attacks
     * @param {string} url - URL to clean
     * @returns {string} - Cleaned URL
     */
    static sanitizeUrl(url) {
        if (!BaseSanitizer.isString(url)) return '';
        
        // Clean URL
        let sanitized = BaseSanitizer.sanitizeUrl(url);
        
        // Check for dangerous protocols
        if (this.DANGEROUS_PROTOCOLS.some(protocol => 
            sanitized.toLowerCase().startsWith(protocol))) {
            return '';
        }

        return sanitized;
    }
}

export default XssSanitizer; 