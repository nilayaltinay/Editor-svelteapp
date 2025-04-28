import { describe, it, expect } from 'vitest';
import { ReferenceValidator } from './ReferenceValidator.js';

describe('ReferenceValidator.validateForm', () => {

    //book reference scenarios
    describe('Book reference scenarios', () => {
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
    });

    //Journal article reference scenarios
    describe('Journal article reference scenarios', () => {
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

    //Website reference scenarios
    describe('Website reference scenarios', () => {
        it('should validate a correct website reference', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'website',
                title: 'Test Website',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'url', value: 'https://www.example.com' }
                ]
            });
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        it('should return error for missing URL in website', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'website',
                title: 'Test Website',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: []
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('URL is required for websites');
        });

        it('should return error for invalid URL in website', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'website',
                title: 'Test Website',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'url', value: 'not-a-url' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Please enter a valid URL');
        });

        it('should return error if URL is not HTTPS', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'website',
                title: 'Test Website',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'url', value: 'http://example.com' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('URL must use HTTPS protocol');
        });

    });

    //Newspaper article reference scenarios
    describe('Newspaper article reference scenarios', () => {
        it('should validate a correct newspaper article reference', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'newspaper',
                title: 'Test Newspaper Article',
                authors: [
                    { firstName: 'Jane', lastName: 'Smith', year: '2021' }
                ],
                publicationFields: [
                    { type: 'url', value: 'https://www.example.com/news' }
                ]
            });
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
        });
    
        it('should return error if url is missing', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'newspaper',
                title: 'Test Newspaper Article',
                authors: [
                    { firstName: 'Jane', lastName: 'Smith', year: '2021' }
                ],
                publicationFields: []
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('URL is required for newspaper articles');
        });
    
        it('should return error if url is invalid', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'newspaper',
                title: 'Test Newspaper Article',
                authors: [
                    { firstName: 'Jane', lastName: 'Smith', year: '2021' }
                ],
                publicationFields: [
                    { type: 'url', value: 'not-a-url' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Please enter a valid URL');
        });
    
        it('should return error if url is not HTTPS', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'newspaper',
                title: 'Test Newspaper Article',
                authors: [
                    { firstName: 'Jane', lastName: 'Smith', year: '2021' }
                ],
                publicationFields: [
                    { type: 'url', value: 'http://example.com/news' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('URL must use HTTPS protocol');
        });
    });

    //common validations for each resource type
    describe('Common validations for all resource types', () => {
        //Author validations
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

        it('should return error if author first name is too short', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'journal',
                title: 'Test Journal',
                authors: [
                    { firstName: 'J', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'journal', value: 'Test Journal' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('First name for Author 1 must be at least 2 characters long');
        });

        it('should return error if author first name contains invalid characters', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'newspaper',
                title: 'Test Newspaper',
                authors: [
                    { firstName: 'J@hn', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'publisher', value: 'Test Publisher' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain("First name for Author 1 can only contain letters, spaces, hyphens and apostrophes");
        });

        it('should return error if author year is out of range', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'website',
                title: 'Test Website',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2200' }
                ],
                publicationFields: [
                    { type: 'journal', value: 'Test Journal' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Year for Author 1 must be between 1900 and 2100');
        });

        //Title validations
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

        it('should return error if title is too short', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'book',
                title: 'A',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'publisher', value: 'Test Publisher' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Title must be at least 3 characters long');
        });

        it('should return error if title contains invalid characters', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'website',
                title: 'Test@Website!',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'journal', value: 'Test Journal' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Title contains invalid characters');
        });

        //DOI validations
        it('should return error for invalid DOI', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'journal',
                title: 'Test Journal',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'journal', value: 'Test Journal' },
                    { type: 'doi', value: 'invalid-doi' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Please enter a valid DOI');
        });

        //Pages validations
        it('should return error if pages field is invalid', () => {
            const result = ReferenceValidator.validateForm({
                resourceType: 'journal',
                title: 'Test Journal',
                authors: [
                    { firstName: 'John', lastName: 'Doe', year: '2000' }
                ],
                publicationFields: [
                    { type: 'journal', value: 'Test Journal' },
                    { type: 'pages', value: 'abc' }
                ]
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Please enter valid page numbers (e.g., 1-10 or 1,2,3)');
        });
    });

});