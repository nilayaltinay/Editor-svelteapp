<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  let resourceType = '';
  let title = '';
  let authors = [{
    firstName: '',
    lastName: '',
    year: ''
  }];
  let publicationFields = [];
  let referenceOutput = '';

  function addAuthor() {
    authors = [...authors, {
      firstName: '',
      lastName: '',
      year: ''
    }];
  }

  function removeAuthor(index) {
    authors = authors.filter((_, i) => i !== index);
    updateReference();
  }

  function addPublicationField(fieldType) {
    publicationFields = [...publicationFields, {
      type: fieldType,
      value: '',
      placeholder: getPlaceholder(fieldType)
    }];
  }

  function removePublicationField(index) {
    publicationFields = publicationFields.filter((_, i) => i !== index);
    updateReference();
  }

  function getPlaceholder(fieldType) {
    switch(fieldType) {
      case 'url': return 'Enter URL';
      case 'doi': return 'Enter DOI';
      case 'volume': return 'Enter volume number';
      case 'issue': return 'Enter issue number';
      case 'pages': return 'Enter page numbers';
      default: return `Enter ${fieldType}`;
    }
  }

  function updateReference() {
    const formattedAuthors = authors.map(author => {
      const authorInitial = author.firstName.charAt(0).toUpperCase();
      return `${author.lastName}, ${authorInitial}.`;
    });

    const year = authors[0]?.year || '';
    const authorsWithYear = year ? `${formattedAuthors.join(', & ')} (${year})` : formattedAuthors.join(', & ');

    const publicationInfo = {};
    publicationFields.forEach(field => {
      publicationInfo[field.type] = field.value;
    });

    let reference = '';

    if (resourceType && title) {
      switch(resourceType) {
        case 'book':
          reference = formatBookReference(authorsWithYear, title, publicationInfo);
          break;
        case 'journal':
          reference = formatJournalReference(authorsWithYear, title, publicationInfo);
          break;
        case 'website':
          reference = formatWebsiteReference(authorsWithYear, title, publicationInfo);
          break;
        case 'newspaper':
          reference = formatNewspaperReference(authorsWithYear, title, publicationInfo);
          break;
      }
    }

    referenceOutput = reference;
  }

  function formatBookReference(authors, title, info) {
    let reference = `${authors}. ${title}.`;
    if (info.publisher) reference += ` ${info.publisher}`;
    if (info.location) reference += ` (${info.location})`;
    return reference + '.';
  }

  function formatJournalReference(authors, title, info) {
    let reference = `${authors}. ${title}.`;
    if (info.journal) reference += ` ${info.journal}`;
    if (info.volume) reference += `, ${info.volume}`;
    if (info.issue) reference += `(${info.issue})`;
    if (info.pages) reference += `, ${info.pages}`;
    if (info.doi) reference += `. https://doi.org/${info.doi}`;
    return reference + '.';
  }

  function formatWebsiteReference(authors, title, info) {
    let reference = `${authors}. ${title}.`;
    if (info.publisher) reference += ` ${info.publisher}`;
    if (info.url) reference += `. ${info.url}`;
    return reference + '.';
  }

  function formatNewspaperReference(authors, title, info) {
    let reference = `${authors}. ${title}.`;
    if (info.publisher) reference += ` ${info.publisher}`;
    if (info.url) reference += `. ${info.url}`;
    return reference + '.';
  }



  function saveReference() {
    dispatch('save', { reference: referenceOutput });
  }

  $: {
    if (resourceType || title || authors || publicationFields) {
      updateReference();
    }
  }
</script>

<div class="reference-helper">
  <div class="form-group">
    <label for="resource-type">Resource Type:</label>
    <select id="resource-type" bind:value={resourceType} required>
      <option value="">Select a resource type</option>
      <option value="book">Book</option>
      <option value="journal">Journal Article</option>
      <option value="website">Website</option>
      <option value="newspaper">Newspaper Article</option>
    </select>
  </div>

  <div class="form-group">
    <label for="authors-container">Authors:</label>
    <div id="authors-container" class="authors-container">
      {#each authors as author, i}
        <div class="author-inputs">
          <input type="text" id={`author-first-${i}`} bind:value={author.firstName} placeholder="First Name" required>
          <input type="text" id={`author-last-${i}`} bind:value={author.lastName} placeholder="Last Name" required>
          <input type="number" id={`author-year-${i}`} bind:value={author.year} placeholder="Year" min="1900" max="2100" required>
          {#if i > 0}
            <button type="button" class="remove-author" on:click={() => removeAuthor(i)} aria-label="Remove author">×</button>
          {/if}
        </div>
      {/each}
    </div>
    <button type="button" class="secondary-button" on:click={addAuthor}>+ Add Another Author</button>
  </div>

  <div class="form-group">
    <label for="reference-title">Title:</label>
    <input type="text" id="reference-title" bind:value={title} required>
  </div>

  <div class="form-group">
    <label for="publication-container">Publication Information:</label>
    <div id="publication-container" class="publication-fields">
      {#each publicationFields as field, i}
        <div class="publication-field">
          <input type={field.type === 'url' ? 'url' : 'text'} 
                 id={`publication-field-${i}`}
                 bind:value={field.value} 
                 placeholder={field.placeholder} 
                 required>
          <button type="button" class="remove-field" on:click={() => removePublicationField(i)}>×</button>
        </div>
      {/each}
    </div>
    <div class="publication-buttons">
      <button type="button" class="secondary-button" on:click={() => addPublicationField('publisher')}>Add Publisher</button>
      <button type="button" class="secondary-button" on:click={() => addPublicationField('location')}>Add Location</button>
      <button type="button" class="secondary-button" on:click={() => addPublicationField('journal')}>Add Journal Name</button>
      <button type="button" class="secondary-button" on:click={() => addPublicationField('volume')}>Add Volume</button>
      <button type="button" class="secondary-button" on:click={() => addPublicationField('issue')}>Add Issue</button>
      <button type="button" class="secondary-button" on:click={() => addPublicationField('pages')}>Add Pages</button>
    </div>
  </div>

  <div class="form-group">
    <label for="additional-container">Additional Information:</label>
    <div id="additional-container" class="additional-buttons">
      <button type="button" class="secondary-button" on:click={() => addPublicationField('url')}>Add URL</button>
      <button type="button" class="secondary-button" on:click={() => addPublicationField('doi')}>Add DOI</button>
    </div>
  </div>

  <div class="result-container">
    <h2>Generated Reference:</h2>
    <div class="reference-output">{referenceOutput}</div>
    <div class="button-group">
      <button class="save-button" on:click={saveReference}>Save Reference</button>
    </div>
  </div>
</div>

<style>
  
  *{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .reference-helper {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #333;
    line-height: 1.6;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #2c3e50;
  }

  input, select {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    outline: none;
  }

  .author-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 1rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .remove-author, .remove-field {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 0.5rem;
    width: auto;
  }

  .publication-field {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    align-items: center;
  }

  .publication-buttons, .additional-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .secondary-button {
    background-color: #ecf0f1;
    color: #2c3e50;
    padding: 0.5rem 1rem;
    border: 1px solid #bdc3c7;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.3s;
  }

  .secondary-button:hover {
    background-color: #bdc3c7;
  }

  .result-container {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid #ddd;
  }

  .reference-output {
    background-color: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    margin: 1rem 0;
    min-height: 50px;
    white-space: pre-wrap;
  }

  .button-group {
    display: flex;
    gap: 1rem;
  }

  .save-button {
    flex: 1;
    background-color: #2ecc71;
    color: white;
    padding: 0.8rem 2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
  }

  .save-button:hover {
    background-color: #27ae60;
  }

  @media (max-width: 600px) {
    .author-inputs {
      grid-template-columns: 1fr;
    }

    .publication-buttons, .additional-buttons {
      flex-direction: column;
    }

    .button-group {
      flex-direction: column;
    }
  }

  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0 30px white inset !important;
    -webkit-text-fill-color: inherit !important;
    transition: background-color 5000s ease-in-out 0s;
  }

  input:focus {
    outline: none;
    border-color: #6792ff;
  }
</style> 