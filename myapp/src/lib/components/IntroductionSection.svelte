<script>
    import { onMount } from "svelte";
    import { createEventDispatcher } from 'svelte';
    import ConfirmationModal from './ConfirmationModal.svelte';

    const dispatch = createEventDispatcher();
    
    let introQuill;
    let isIntroFullscreen = false;
    let isDragging = false;
    let startY = 0;
    let startHeight = 0;
    let editor;
    let showDeleteModal = false;

    function toggleFullscreen() {
        isIntroFullscreen = !isIntroFullscreen;
    }

    function handleMouseDown(event) {
        isDragging = true;
        startY = event.clientY;
        editor = document.querySelector("#introduction-editor");
        startHeight = editor.offsetHeight;

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(event) {
        if (!isDragging) return;

        const deltaY = event.clientY - startY;
        const maxHeight = 500;
        const newHeight = Math.min(maxHeight, Math.max(200, startHeight + deltaY));
        editor.style.height = `${newHeight}px`;
    }

    function handleMouseUp() {
        isDragging = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    }

    function handleDelete() {
        showDeleteModal = true;
    }

    function handleConfirmDelete() {
        showDeleteModal = false;
        dispatch('delete');
    }

    function handleCancelDelete() {
        showDeleteModal = false;
    }

    onMount(() => {
        if (typeof window !== "undefined") {
            const Font = Quill.import("formats/font");
            Font.whitelist = [
                "sans-serif", "serif", "monospace", "sofia", "slabo", "roboto",
                "inconsolata", "ubuntu", "inter", "lato-extended", "lato",
                "helvetica-neue", "helvetica", "arial",
            ];
            Quill.register(Font, true);

            const toolbarOptions = [
                [{ header: [1, 2, 3, false] }],
                [{ font: Font.whitelist }],
                ["bold", "italic", "underline"],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ align: [] }],
                [{ link: "Add link" }, "image", "video"],
                ["formula", "code-block"],
                ["clean"],
            ];

            introQuill = new Quill("#introduction-editor", {
                modules: {
                    toolbar: toolbarOptions,
                    syntax: true,
                },
                placeholder: "Please enter introduction text",
                theme: "snow",
            });

            introQuill.on('text-change', () => {
                dispatch('update', {
                    content: introQuill.root.innerHTML
                });
            });
        }

        editor = document.querySelector("#introduction-editor");
        if (editor) {
            startHeight = editor.offsetHeight;
        }
    });

    const icons = {
        delete: `<svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.91663 7.75C1.68746 7.75 1.49128 7.6684 1.32808 7.50521C1.16489 7.34201 1.08329 7.14583 1.08329 6.91667V1.5H0.666626V0.666667H2.74996V0.25H5.24996V0.666667H7.33329V1.5H6.91663V6.91667C6.91663 7.14583 6.83503 7.34201 6.67183 7.50521C6.50864 7.6684 6.31246 7.75 6.08329 7.75H1.91663ZM6.08329 1.5H1.91663V6.91667H6.08329V1.5ZM2.74996 6.08333H3.58329V2.33333H2.74996V6.08333ZM4.41663 6.08333H5.24996V2.33333H4.41663V6.08333Z" fill="currentColor"/>
        </svg>`,
        resize: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 5L5 19M19 5H12M19 5V12M5 19H12M5 19V12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        expand: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
            <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
        </svg>`,
        lock: `<svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 11C0.725 11 0.489583 10.9021 0.29375 10.7063C0.0979167 10.5104 0 10.275 0 10V5C0 4.725 0.0979167 4.48958 0.29375 4.29375C0.489583 4.09792 0.725 4 1 4H1.5V3C1.5 2.30833 1.74375 1.71875 2.23125 1.23125C2.71875 0.74375 3.30833 0.5 4 0.5C4.69167 0.5 5.28125 0.74375 5.76875 1.23125C6.25625 1.71875 6.5 2.30833 6.5 3V4H7C7.275 4 7.51042 4.09792 7.70625 4.29375C7.90208 4.48958 8 4.725 8 5V10C8 10.275 7.90208 10.5104 7.70625 10.7063C7.51042 10.9021 7.275 11 7 11H1ZM1 10H7V5H1V10ZM4 8.5C4.275 8.5 4.51042 8.40208 4.70625 8.20625C4.90208 8.01042 5 7.775 5 7.5C5 7.225 4.90208 6.98958 4.70625 6.79375C4.51042 6.59792 4.275 6.5 4 6.5C3.725 6.5 3.48958 6.59792 3.29375 6.79375C3.09792 6.98958 3 7.225 3 7.5C3 7.775 3.09792 8.01042 3.29375 8.20625C3.48958 8.40208 3.725 8.5 4 8.5ZM2.5 4H5.5V3C5.5 2.58333 5.35417 2.22917 5.0625 1.9375C4.77083 1.64583 4.41667 1.5 4 1.5C3.58333 1.5 3.22917 1.64583 2.9375 1.9375C2.64583 2.22917 2.5 2.58333 2.5 3V4Z" fill="currentColor"/>
        </svg>`
    };
</script>

<div class="introduction-section">
    <div class="section-header">
        <span class="section-label">Introduction</span>
        <span class="position-label">Position {@html icons.lock}</span>
    </div>
    <div class="introduction-form">
        <div class="description-container" class:fullscreen-mode={isIntroFullscreen}>
            <div id="introduction-editor"></div>
            <div class="editor-resize-buttons">
                <button class="resize-button" aria-label="Toggle fullscreen mode" on:click={toggleFullscreen}>
                    {@html icons.resize}
                </button>
                <button class="editor-expend-button" aria-label="Drag to resize editor" on:mousedown={handleMouseDown}>
                    {@html icons.expand}
                </button>
            </div>
        </div>
    </div>
    <button class="delete-btn" on:click={handleDelete} aria-label="Delete introduction">
        Delete
        {@html icons.delete}
    </button>
</div>

<ConfirmationModal 
    show={showDeleteModal}
    type="deleteIntroduction"
    onConfirm={handleConfirmDelete}
    onCancel={handleCancelDelete}
/>

<style>
    * {
      font-family: "Inter", "Lato Extended", "Lato", "Helvetica Neue", "Helvetica",
      "Arial", "sans-serif";
      box-sizing: border-box;
      line-height: 1.6;
      font-size: 14px;
    }
  
   
  
    .introduction-form {
      padding: 1rem 0.5rem 0 0.5rem;
      border-radius: 1px;
      border: 1px solid #e5e5e5;
      position: relative;
      background: #FCFCFC;
    }
  
    .description-container {
      border: 1px solid #e5e5e5;
      border-radius: 1px;
      background: white;
      position: relative;
      padding: 1rem 1rem 0.5rem 1rem;
    }
  
   
    :global(.ql-toolbar.ql-snow) {
      border: none;
      padding: 0 8px 16px 0;
      border-bottom: 1px solid #e5e5e5;
    }
  
    :global(.ql-container.ql-snow) {
      border: 1px solid #e5e5e5;
    }
  
    :global(.ql-editor.ql-blank) {
      padding: 0;
    }
  

  
    .delete-btn {
      background: #ff5656;
      color: white;
      padding: 0.1rem 1rem;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 14px;
      justify-self: end;
    }
  
  
    /* Update font styles to match Quill's class naming */
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="sofia"]::before
      ),
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="sofia"]::before
      ) {
      content: "Sofia";
      font-family: "Sofia", cursive;
    }
  
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="slabo"]::before
      ),
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="slabo"]::before
      ) {
      content: "Slabo";
      font-family: "Slabo", serif;
    }
  
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="roboto"]::before
      ),
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="roboto"]::before
      ) {
      content: "Roboto";
      font-family: "Roboto", sans-serif;
    }
  
    :global(
        .ql-snow
          .ql-picker.ql-font
          .ql-picker-label[data-value="inconsolata"]::before
      ),
    :global(
        .ql-snow
          .ql-picker.ql-font
          .ql-picker-item[data-value="inconsolata"]::before
      ) {
      content: "Inconsolata";
      font-family: "Inconsolata", monospace;
    }
  
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="ubuntu"]::before
      ),
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="ubuntu"]::before
      ) {
      content: "Ubuntu";
      font-family: "Ubuntu", sans-serif;
    }
  
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="inter"]::before
      ),
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="inter"]::before
      ) {
      content: "Inter";
      font-family: "Inter", sans-serif;
    }
  
    :global(
        .ql-snow
          .ql-picker.ql-font
          .ql-picker-label[data-value="lato-extended"]::before
      ),
    :global(
        .ql-snow
          .ql-picker.ql-font
          .ql-picker-item[data-value="lato-extended"]::before
      ) {
      content: "Lato Extended";
      font-family: "Lato Extended", sans-serif;
    }
  
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="lato"]::before
      ),
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="lato"]::before
      ) {
      content: "Lato";
      font-family: "Lato", sans-serif;
    }
  
    :global(
        .ql-snow
          .ql-picker.ql-font
          .ql-picker-label[data-value="helvetica-neue"]::before
      ),
    :global(
        .ql-snow
          .ql-picker.ql-font
          .ql-picker-item[data-value="helvetica-neue"]::before
      ) {
      content: "Helvetica Neue";
      font-family: "Helvetica Neue", sans-serif;
    }
  
    :global(
        .ql-snow
          .ql-picker.ql-font
          .ql-picker-label[data-value="helvetica"]::before
      ),
    :global(
        .ql-snow
          .ql-picker.ql-font
          .ql-picker-item[data-value="helvetica"]::before
      ) {
      content: "Helvetica";
      font-family: "Helvetica", sans-serif;
    }
  
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="arial"]::before
      ),
    :global(
        .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="arial"]::before
      ) {
      content: "Arial";
      font-family: "Arial", sans-serif;
    }
  
    /* Font classes for actual text */
    :global(.ql-font-sofia) {
      font-family: "Sofia", cursive;
    }
    :global(.ql-font-slabo) {
      font-family: "Slabo", serif;
    }
    :global(.ql-font-roboto) {
      font-family: "Roboto", sans-serif;
    }
    :global(.ql-font-inconsolata) {
      font-family: "Inconsolata", monospace;
    }
    :global(.ql-font-ubuntu) {
      font-family: "Ubuntu", sans-serif;
    }
    :global(.ql-font-inter) {
      font-family: "Inter", sans-serif;
    }
    :global(.ql-font-lato-extended) {
      font-family: "Lato Extended", sans-serif;
    }
    :global(.ql-font-lato) {
      font-family: "Lato", sans-serif;
    }
    :global(.ql-font-helvetica-neue) {
      font-family: "Helvetica Neue", sans-serif;
    }
    :global(.ql-font-helvetica) {
      font-family: "Helvetica", sans-serif;
    }
    :global(.ql-font-arial) {
      font-family: "Arial", sans-serif;
    }
  
    .editor-resize-buttons {
      display: flex;
      flex-direction: row;
      gap: 8px;
      justify-content: flex-end;
      margin-top: 8px;
    }
  
    .resize-button,
    .editor-expend-button {
      width: 32px;
      height: 32px;
      border: none;
      background: white;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #666;
      padding: 4px;
    }
  
    .resize-button:hover {
      background: #f8f9fa;
      color: #333;
    }
  
    .editor-expend-button:hover {
      background: #f8f9fa;
      color: #333;
      cursor: ns-resize;
    }
  
    .fullscreen-mode {
      position: fixed !important;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1000;
      background: white;
      padding: 2rem;
      border-radius: 0;
      border: none;
    }
  
    .fullscreen-mode #introduction-editor {
      height: calc(100vh - 150px);
    }
  
    .introduction-section {
      margin-bottom: 2rem;
      position: relative;
    }
  
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0;
    }
  
    .section-label {
      background: #6792ff;
      color: white;
      padding: 0.25rem 0.75rem;
      font-size: 14px;
    }
  
    .position-label {
      color: #686868;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      background: #f2f2f2;
      padding: 4px 12px;
    }
  
    .position-label :global(svg) {
      margin-top: 1px;
      width: 12px;
      height: 14px;
    }
  
    #introduction-editor {
      min-height: 200px;
      height: 200px;
      padding: 1rem;
      transition: none;
    }
  
    .introduction-section .description-container {
      margin-bottom: 0.5rem;
    }
  
    .introduction-section .delete-btn {
      margin-left: auto;
      display: flex;
    }
  
   
    /* Quill default ikonlarını gizle */
    :global(.ql-snow .ql-toolbar button svg:not(.custom-icon svg)) {
      display: none !important;
    }
  
    /* Custom icon stilleri */
    :global(.custom-icon) {
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s ease;
    }
  
    :global(.custom-icon svg) {
      width: 16px;
      height: 16px;
    }
  
  </style>
  