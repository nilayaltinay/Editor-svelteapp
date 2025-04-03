export class ReferenceValidator {
  static validateForm({ resourceType, title, authors, publicationFields }) {
    const errors = [];
    
    // Resource Type check
    if (!resourceType) {
      errors.push('Please select a resource type');
    }

    // Author check
    const validAuthors = authors.filter(author => 
      author.firstName.trim() || author.lastName.trim() || author.year
    );

    if (validAuthors.length === 0) {
      errors.push('At least one author is required');
    } else {
      validAuthors.forEach((author, index) => {
        // Author fields check
        if (!author.firstName.trim() || !author.lastName.trim() || !author.year) {
          errors.push(`Please fill in all fields for Author ${index + 1}`);
        } else {
          // Name format check
          const nameRegex = /^[a-zA-Z\s-']+$/;
          if (!nameRegex.test(author.firstName.trim())) {
            errors.push(`First name for Author ${index + 1} can only contain letters, spaces, hyphens and apostrophes`);
          }
          if (!nameRegex.test(author.lastName.trim())) {
            errors.push(`Last name for Author ${index + 1} can only contain letters, spaces, hyphens and apostrophes`);
          }

          // Name length check
          if (author.firstName.trim().length < 2) {
            errors.push(`First name for Author ${index + 1} must be at least 2 characters long`);
          }
          if (author.lastName.trim().length < 2) {
            errors.push(`Last name for Author ${index + 1} must be at least 2 characters long`);
          }

          // Year check
          const year = parseInt(author.year);
          if (year < 1900 || year > 2100) {
            errors.push(`Year for Author ${index + 1} must be between 1900 and 2100`);
          }
        }
      });
    }

    // Title check
    if (!title.trim()) {
      errors.push('Please enter a title');
    } else {
      // Title length check
      if (title.trim().length < 3) {
        errors.push('Title must be at least 3 characters long');
      }
      if (title.trim().length > 500) {
        errors.push('Title cannot exceed 500 characters');
      }

      // Title format check
      const titleRegex = /^[a-zA-Z0-9\s.,;:!?()\[\]{}'"-]+$/;
      if (!titleRegex.test(title.trim())) {
        errors.push('Title contains invalid characters');
      }
    }

    // Resource Type specific validations using switch-case
    switch (resourceType) {
      case 'book':
        const hasPublisher = publicationFields.some(field => field.type === 'publisher' && field.value.trim());
        if (!hasPublisher) {
          errors.push('Publisher information is required for books');
        }
        break;

      case 'journal':
        const hasJournal = publicationFields.some(field => field.type === 'journal' && field.value.trim());
        if (!hasJournal) {
          errors.push('Journal name is required for journal articles');
        }
        break;

      case 'website':
      case 'newspaper':
        const hasUrl = publicationFields.some(field => field.type === 'url' && field.value.trim());
        if (!hasUrl) {
          errors.push(`URL is required for ${resourceType === 'website' ? 'websites' : 'newspaper articles'}`);
        }
        break;
    }

    // URL check
    const urlField = publicationFields.find(field => field.type === 'url');
    if (urlField && urlField.value.trim()) {
      try {
        const url = new URL(urlField.value.trim());
        if (url.protocol !== 'https:') {
          errors.push('URL must use HTTPS protocol');
        }
      } catch (e) {
        errors.push('Please enter a valid URL');
      }
    }

    // DOI check
    const doiField = publicationFields.find(field => field.type === 'doi');
    if (doiField && doiField.value.trim()) {
      const doiRegex = /^10\.\d{4,9}\/[-._;()\/:A-Z0-9]+$/i;
      if (!doiRegex.test(doiField.value.trim())) {
        errors.push('Please enter a valid DOI');
      }
    }

    // Page number check
    const pagesField = publicationFields.find(field => field.type === 'pages');
    if (pagesField && pagesField.value.trim()) {
      const pagesRegex = /^\d+(-\d+)?(,\s*\d+(-\d+)?)*$/;
      if (!pagesRegex.test(pagesField.value.trim())) {
        errors.push('Please enter valid page numbers (e.g., 1-10 or 1,2,3)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
} 