<script>
    import { onMount, onDestroy } from "svelte";
    import { fade, slide } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    import ResourceHeader from "./ResourceHeader.svelte";
    import ResourceFeatureItem from "./ResourceFeatureItem.svelte";
    import ResourceTitle from "./ResourceTitle.svelte";
    import ResourceReference from "./ResourceReference.svelte";
    import ResourceDelete from "./ResourceDelete.svelte";
    import { XssSanitizer } from "$lib/services/sanitizers";

    export let resource = {
        id: "",
        title: "",
        description: "",
        feature: null,
        references: [],
    };
    export let index = 0;

    // Logs changes to resource props
    $: console.log("ResourceSection props:", { resource, index });

    const dispatch = createEventDispatcher();
    let debounceTimer;
    let updateTimer;
    let quill;

    let editor;
    let editorElement;

    let isFullscreen = false;
    let isDragging = false;
    let startY = 0;
    let startHeight = 0;

    function toggleFullscreen() {
        isFullscreen = !isFullscreen;
    }

    // Event handlers
    function handleMove(event) {
        const { direction, currentIndex } = event.detail;
        dispatch("move", { direction, currentIndex });
    }

    function handleMouseDown(event) {
        isDragging = true;
        startY = event.clientY;
        startHeight = editorElement.offsetHeight;

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
    }

    function handleMouseMove(event) {
        if (!isDragging) return;

        const deltaY = event.clientY - startY;
        const maxHeight = 500; // Fixed max height of 500px
        const newHeight = Math.min(
            maxHeight,
            Math.max(200, startHeight + deltaY),
        );
        editorElement.style.height = `${newHeight}px`;
    }

    function handleMouseUp() {
        isDragging = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    }

    function handleDelete(event) {
        const { id } = event.detail;
        // Silme işlemini gerçekleştir
        dispatch("delete", { id });
    }

    onMount(() => {
        if (typeof window !== "undefined") {
            const Font = Quill.import("formats/font");

            // Font whitelist for normal editors
            Font.whitelist = [
                "sans-serif",
                "serif",
                "monospace",
                "sofia",
                "slabo",
                "roboto",
                "inconsolata",
                "ubuntu",
                "inter",
                "lato-extended",
                "lato",
                "helvetica-neue",
                "helvetica",
                "arial",
            ];

            Quill.register(
                {
                    "formats/font": Font,
                },
                true,
            );

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

            quill = new Quill(`#editor-${resource.id}`, {
                modules: {
                    toolbar: toolbarOptions,
                    syntax: true,
                },
                placeholder: "Please enter description of resource",
                theme: "snow",
            });
        }

        // Store original height after Quill initialization
        if (editorElement) {
            startHeight = editorElement.offsetHeight;
        }
    });

    // SVG Icons Library
    const icons = {
        resize: ` <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 5L5 19M19 5H12M19 5V12M5 19H12M5 19V12" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
      `,
        expand: ` <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
                <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
                <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
              </svg>
      `,
    };

    // Reactive declarations for editor states
    $: if (quill) {
        quill.on("text-change", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const content = quill.root.innerHTML;
                if (content !== resource.description) {
                    dispatch("update", {
                        id: resource.id,
                        field: "description",
                        value: content,
                    });
                }
            }, 300);
        });
    }

    onDestroy(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (updateTimer) clearTimeout(updateTimer);
    });
</script>

<div class="resource-section">
    <ResourceHeader {index} on:move={handleMove} />
    <div class="resource-form">

        <div class="form-section">
            
            <ResourceFeatureItem
                {resource}
                on:update={(event) => dispatch("update", event.detail)}
            />
        </div>

        <div class="form-section">
            <h3>Title</h3>
            <ResourceTitle
                {resource}
                on:update={(event) => dispatch("update", event.detail)}
            />
        </div>

        <div class="form-section">
            <h3>Description</h3>
            <div
                class="description-container"
                class:fullscreen-mode={isFullscreen}
            >
                <div
                    id={`editor-${resource.id}`}
                    bind:this={editorElement}
                ></div>
                <div class="editor-resize-buttons">
                    <button
                        class="resize-button"
                        aria-label="Toggle fullscreen mode"
                        on:click={toggleFullscreen}
                    >
                        {@html icons.resize}
                    </button>
                    <button
                        class="editor-expend-button"
                        aria-label="Drag to resize editor"
                        on:mousedown={handleMouseDown}
                    >
                        {@html icons.expand}
                    </button>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h3>Reference</h3>
            <ResourceReference
                {resource}
                on:update={(event) => dispatch("update", event.detail)}
            />
        </div>
    </div>
    <ResourceDelete {resource} on:delete={handleDelete} />
</div>

<style>
    * {
        font-family: "Inter", "Lato Extended", "Lato", "Helvetica Neue",
            "Helvetica", "Arial", "sans-serif";
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 14px;
        font-weight: 300;
    }

    .resource-section {
        margin-bottom: 2rem;
        position: relative;
    }

    .resource-form {
        padding: 2rem;
        border-radius: 1px;
        border: 1px solid #e5e5e5;
        position: relative;
        background: #fcfcfc;
    }

    .form-section {
        margin-bottom: 1em;
    }

    h3 {
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: 400;
    }

    .description-container {
        border: 1px solid #e5e5e5;
        border-radius: 1px;
        background: white;
        position: relative;
        padding: 1rem 0.5rem 0.5rem 0.5rem;
    }

    [id^="editor-"] {
        min-height: 200px;
        height: 200px;
        padding: 1rem;
        transition: none; /* Remove transition for smooth dragging */
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

    :global(.ql-editor) {
        padding: 0;
    }

    :global(.ql-editor.ql-blank::before) {
        font-weight: 300;
        font-style: italic;
        line-height: 150%;
        letter-spacing: -1.1%;
        color: #949494;
    }

    /* Update font styles to match Quill's class naming */
    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-label[data-value="sofia"]::before
        ),
    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-item[data-value="sofia"]::before
        ) {
        content: "Sofia";
        font-family: "Sofia", cursive;
    }

    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-label[data-value="slabo"]::before
        ),
    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-item[data-value="slabo"]::before
        ) {
        content: "Slabo";
        font-family: "Slabo", serif;
    }

    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-label[data-value="roboto"]::before
        ),
    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-item[data-value="roboto"]::before
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
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-label[data-value="ubuntu"]::before
        ),
    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-item[data-value="ubuntu"]::before
        ) {
        content: "Ubuntu";
        font-family: "Ubuntu", sans-serif;
    }

    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-label[data-value="inter"]::before
        ),
    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-item[data-value="inter"]::before
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
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-label[data-value="lato"]::before
        ),
    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-item[data-value="lato"]::before
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
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-label[data-value="arial"]::before
        ),
    :global(
            .ql-snow
                .ql-picker.ql-font
                .ql-picker-item[data-value="arial"]::before
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

    .fullscreen-mode [id^="editor-"] {
        height: calc(100vh - 150px);
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

    /* Quill base styles override */
    :global(.ql-snow .ql-picker) {
        color: #444;
        display: inline-block;
        font-size: 14px;
        font-weight: 300;
        height: 24px;
        position: relative;
        vertical-align: middle;
    }
</style>
