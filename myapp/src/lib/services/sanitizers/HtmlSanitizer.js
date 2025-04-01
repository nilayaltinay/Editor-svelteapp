import BaseSanitizer from './BaseSanitizer';

/**
 * HtmlSanitizer - Clean and secure HTML content
 */
class HtmlSanitizer {
    // Allowed HTML tags
    static ALLOWED_TAGS = [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre'
    ];

    // Allowed HTML attributes
    static ALLOWED_ATTRIBUTES = {
        'a': ['href', 'title', 'target'],
        'img': ['src', 'alt', 'title'],
        'p': ['class'],
        'div': ['class']
    };

    /**
     * Clean HTML content
     * @param {string} html - HTML content to clean
     * @returns {string} - Cleaned HTML content
     */
    static sanitize(html) {
        if (BaseSanitizer.isEmpty(html)) return '';
        if (!BaseSanitizer.isString(html)) return '';

        // Create temporary div
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;

        // Clean DOM recursively
        this.cleanNode(tempDiv);

        return tempDiv.innerHTML;
    }

    /**
     * Clean DOM node
     * @param {Node} node - DOM node to clean
     */
    static cleanNode(node) {
        // Preserve text nodes
        if (node.nodeType === 3) return;

        // For element nodes
        if (node.nodeType === 1) {
            // Check tag
            const tagName = node.tagName.toLowerCase();
            if (!this.ALLOWED_TAGS.includes(tagName)) {
                // Remove disallowed tag, preserve content
                const parent = node.parentNode;
                while (node.firstChild) {
                    parent.insertBefore(node.firstChild, node);
                }
                parent.removeChild(node);
                return;
            }

            // Clean attributes
            const allowedAttrs = this.ALLOWED_ATTRIBUTES[tagName] || [];
            const attributes = node.attributes;
            for (let i = attributes.length - 1; i >= 0; i--) {
                const attr = attributes[i];
                if (!allowedAttrs.includes(attr.name)) {
                    node.removeAttribute(attr.name);
                }
            }

            // Check href attributes
            if (tagName === 'a' && node.href) {
                node.href = BaseSanitizer.sanitizeUrl(node.href);
            }

            // Check src attributes
            if (tagName === 'img' && node.src) {
                node.src = BaseSanitizer.sanitizeUrl(node.src);
            }

            // Clean child nodes
            Array.from(node.childNodes).forEach(child => this.cleanNode(child));
        }
    }

    /**
     * Render HTML content safely
     * @param {string} html - HTML content to render
     * @returns {string} - Safe HTML content
     */
    static render(html) {
        const sanitized = this.sanitize(html);
        return sanitized;
    }
}

export default HtmlSanitizer; 