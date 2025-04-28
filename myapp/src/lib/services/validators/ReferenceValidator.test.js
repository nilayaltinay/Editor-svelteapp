import { describe, it, expect } from 'vitest';
import { ReferenceValidator } from './ReferenceValidator.js';

describe('ReferenceValidator.validateForm', () => {
  //book reference scenarios
  it('should validate a correct book reference', () => {
    const result = ReferenceValidator.validateForm({
      resourceType: 'book',
      title: 'Test Book',
      authors: [
        { firstName: 'John', lastName: 'Doe', year: '2000' }
      ],
      publicationFields: [
        { type: 'publisher', value: 'Test Publisher' }
      ]
    });
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should return error if no author is provided', () => {
    const result = ReferenceValidator.validateForm({
      resourceType: 'book',
      title: 'Test Book',
      authors: [],
      publicationFields: [
        { type: 'publisher', value: 'Test Publisher' }
      ]
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least one author is required');
  });

  it('should return error for invalid year', () => {
    const result = ReferenceValidator.validateForm({
      resourceType: 'book',
      title: 'Test Book',
      authors: [
        { firstName: 'John', lastName: 'Doe', year: '1800' }
      ],
      publicationFields: [
        { type: 'publisher', value: 'Test Publisher' }
      ]
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Year for Author 1 must be between 1900 and 2100');
  });

  it('should return error for missing publisher in book', () => {
    const result = ReferenceValidator.validateForm({
      resourceType: 'book',
      title: 'Test Book',
      authors: [
        { firstName: 'John', lastName: 'Doe', year: '2000' }
      ],
      publicationFields: []
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Publisher information is required for books');
  });

  //Journal article reference scenarios
  it('should validate a correct journal article reference', () => {
    const result = ReferenceValidator.validateForm({
      resourceType: 'journal',
      title: 'Test Journal Article',
      authors: [
        { firstName: 'John', lastName: 'Doe', year: '2000' }
      ],
      publicationFields: [
        { type: 'journal', value: 'Test Journal' },
        { type: 'volume', value: '1' },
        { type: 'issue', value: '1' },
        { type: 'pages', value: '1-10' }
      ]
    });
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should return error if no author is provided', () => {
    const result = ReferenceValidator.validateForm({
      resourceType: 'journal',
      title: 'Test Journal Article',
      authors: [],
      publicationFields: [
        { type: 'journal', value: 'Test Journal' },
        { type: 'volume', value: '1' },
        { type: 'issue', value: '1' },
        { type: 'pages', value: '1-10' }
      ]
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('At least one author is required');
  });

  it('should return error if title is missing', () => {
    const result = ReferenceValidator.validateForm({
      resourceType: 'journal',
      title: '',
      authors: [
        { firstName: 'John', lastName: 'Doe', year: '2000' }
      ],
      publicationFields: [
        { type: 'journal', value: 'Test Journal' }
      ]
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Please enter a title');
  });

  it('should return error for missing journal in journal article', () => {
    const result = ReferenceValidator.validateForm({
      resourceType: 'journal',
      title: 'Test Journal Article',
      authors: [
        { firstName: 'John', lastName: 'Doe', year: '2000' }
      ],
      publicationFields: [] 
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Journal name is required for journal articles');
  });

  
});