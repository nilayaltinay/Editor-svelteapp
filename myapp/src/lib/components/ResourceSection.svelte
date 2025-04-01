<script>
    import { onMount, onDestroy } from "svelte";
    import { fade, slide } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
    import Modal from "./modal.svelte";
    import ReferenceHelper from "./ReferenceHelper.svelte";
    import ConfirmationModal from "./ConfirmationModal.svelte";

    export let resource = {
        id: "",
        title: "",
        description: "",
        feature: null,
        references: [],
    };
    export let index = 0;

    // Props değiştiğinde log'la
    $: console.log("ResourceSection props:", { resource, index });

    const dispatch = createEventDispatcher();
    let debounceTimer;
    let updateTimer;

    let quill;
    let featureEditor;

    // Feature state management
    let featureState = {
        showInput: false,
        url: "",
        content: null, // {type: 'image'|'video', content: string, data?: string, html?: string}
    };

    // Reactive assignments for backward compatibility
    $: showVideoInput = featureState.showInput;
    $: videoUrl = featureState.url;
    $: currentFeatureContent = featureState.content;

    let isFullscreen = false;
    let isDragging = false;
    let startY = 0;
    let startHeight = 0;
    let editor;

    let showReferenceModal = false;
    let showDeleteConfirmModal = false;
    let savedReferences = []; // Kaydedilen referansları tutacak array

    function updateFeatureState(updates) {
        featureState = { ...featureState, ...updates };
        if (updates.content) {
            resource.feature = updates.content;
            dispatch("update", {
                id: resource.id,
                field: "feature",
                value: updates.content,
            });
        }
    }

    function prepareForNewContent(type = "none") {
        // Mevcut içeriği temizle
        resetFeatureContent();

        // Video input için özel durum
        if (type === "video") {
            updateFeatureState({
                showInput: true,
            });
        }
    }

    function updateFeatureContent(editor) {
        // Sadece video veya resim eklendiğinde çalışsın
        const img = editor.root.querySelector("img");
        const iframe = editor.root.querySelector("iframe.ql-video");

        if (img && !featureState.content?.type) {
            updateFeatureState({
                content: {
                    type: "image",
                    content: "Image",
                    data: img.src,
                },
            });
        } else if (iframe && !featureState.content?.type) {
            updateFeatureState({
                content: {
                    type: "video",
                    content: featureState.url || "Video",
                    data: iframe.getAttribute("src"),
                },
            });
        }
    }

    function resetFeatureContent() {
        updateFeatureState({
            showInput: false,
            url: "",
            content: null,
        });

        if (featureEditor) {
            featureEditor.setContents([]);
        }

        resource.feature = null;
        dispatch("update", {
            id: resource.id,
            field: "feature",
            value: null,
        });
    }

    function toggleFullscreen() {
        isFullscreen = !isFullscreen;
    }

    function openReferenceModal() {
        showReferenceModal = true;
    }

    function openDeleteConfirmModal() {
        showDeleteConfirmModal = true;
    }

    function confirmDelete() {
        if (resource?.id) {
            dispatch("delete", { id: resource.id });
            showDeleteConfirmModal = false;
        }
    }

    function closeDeleteConfirmModal() {
        showDeleteConfirmModal = false;
    }

    // Event handlers
    function handleVideoEmbed() {
        if (featureState.url) {
            try {
                updateFeatureState({ content: null });
                featureEditor.focus();
                featureEditor.insertEmbed(0, "video", featureState.url);
                updateFeatureState({ showInput: false });
            } catch (error) {
                console.error("Video embed hatası:", error);
                dispatch("error", {
                    id: resource.id,
                    error: "Video eklenirken bir hata oluştu",
                });
            }
        }
    }

    function handleMouseDown(event) {
        isDragging = true;
        startY = event.clientY;
        editor = document.querySelector(`#editor-${resource.id}`);
        startHeight = editor.offsetHeight;

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
        editor.style.height = `${newHeight}px`;
    }

    function handleMouseUp() {
        isDragging = false;
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    }

    function handleDelete() {
        console.log("Delete button clicked");
        openDeleteConfirmModal();
    }

    function handleMoveUp() {
        if (typeof index === "number") {
            dispatch("move", {
                direction: "up",
                currentIndex: index,
            });
        }
    }

    function handleMoveDown() {
        if (typeof index === "number") {
            dispatch("move", {
                direction: "down",
                currentIndex: index,
            });
        }
    }

    function handleSaveReference(event) {
        const reference = event.detail.reference;
        savedReferences = [...savedReferences, reference];
        resource.references = savedReferences;
        dispatch("update", {
            id: resource.id,
            field: "references",
            value: savedReferences,
        });
        showReferenceModal = false;
    }

    onMount(() => {
        if (typeof window !== "undefined") {
            const Font = Quill.import("formats/font");
            const VideoBlot = Quill.import("formats/video");

            // Normal editörler için font whitelist
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
                    "formats/video": VideoBlot,
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

            // Video Blot konfigürasyonu
            VideoBlot.sanitize = function (url) {
                if (
                    url.indexOf("youtube.com") !== -1 ||
                    url.indexOf("youtu.be") !== -1
                ) {
                    const youtubeMatch = url.match(
                        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
                    );
                    if (youtubeMatch && youtubeMatch[1]) {
                        return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
                    }
                }
                return url;
            };

            // Feature editor için özel toolbar options
            const featureToolbarOptions = {
                container: [["image", "video"]],
                handlers: {
                    image: function () {
                        prepareForNewContent("image");

                        // Yeni resim seç
                        const input = document.createElement("input");
                        input.setAttribute("type", "file");
                        input.setAttribute("accept", "image/*");
                        input.click();

                        input.onchange = () => {
                            const file = input.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    currentFeatureContent = {
                                        type: "image",
                                        content: file.name,
                                        data: e.target.result,
                                    };
                                    this.quill.insertEmbed(
                                        0,
                                        "image",
                                        e.target.result,
                                    );
                                };
                                reader.readAsDataURL(file);
                            }
                        };
                    },
                    video: function () {
                        prepareForNewContent("video");
                    },
                },
            };

            // Feature editor için Quill instance oluştur
            featureEditor = new Quill(`#feature-editor-${resource.id}`, {
                modules: {
                    toolbar: featureToolbarOptions,
                },
                theme: "snow",
                placeholder: "",
            });

            // Feature editor toolbar'ındaki butonlara özel ikonları ekle
            const toolbar = featureEditor.getModule("toolbar");
            const toolbarElement = toolbar.container;
            const imageButton = toolbarElement.querySelector(".ql-image");
            const videoButton = toolbarElement.querySelector(".ql-video");

            if (imageButton) {
                imageButton.innerHTML = `<span class="custom-icon">${icons.fileUpload}</span>`;
            }
            if (videoButton) {
                videoButton.innerHTML = `<span class="custom-icon">${icons.link}</span>`;
            }

            let isProcessing = false;
            let textChangeTimeout;

            featureEditor.on("text-change", () => {
                if (isProcessing) return;
                isProcessing = true;

                // Clear existing timeout
                if (textChangeTimeout) {
                    clearTimeout(textChangeTimeout);
                }

                // Set new timeout
                textChangeTimeout = setTimeout(() => {
                    updateFeatureContent(featureEditor);
                    isProcessing = false;
                }, 300);
            });
        }

        // Store original height after Quill initialization
        const editor = document.querySelector(`#editor-${resource.id}`);
        if (editor) {
            startHeight = editor.offsetHeight;
        }
    });

    // SVG Icons Library
    const icons = {
        delete: `<svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.91663 7.75C1.68746 7.75 1.49128 7.6684 1.32808 7.50521C1.16489 7.34201 1.08329 7.14583 1.08329 6.91667V1.5H0.666626V0.666667H2.74996V0.25H5.24996V0.666667H7.33329V1.5H6.91663V6.91667C6.91663 7.14583 6.83503 7.34201 6.67183 7.50521C6.50864 7.6684 6.31246 7.75 6.08329 7.75H1.91663ZM6.08329 1.5H1.91663V6.91667H6.08329V1.5ZM2.74996 6.08333H3.58329V2.33333H2.74996V6.08333ZM4.41663 6.08333H5.24996V2.33333H4.41663V6.08333Z" fill="currentColor"/>
      </svg>`,

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
        arrowUp: `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.8262 7L2.8262 2.04615L0.791336 3.98462L-7.68024e-08 3.23077L3.39144 0L6.78288 3.23077L5.99154 3.98462L3.95668 2.04615L3.95668 7L2.8262 7Z" fill="currentColor"/>
              </svg>`,
        arrowDown: `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.95676 -2.15755e-07L3.95676 4.95385L5.99162 3.01538L6.78296 3.76923L3.39152 7L8.09089e-05 3.76923L0.791417 3.01538L2.82628 4.95385L2.82628 -3.02057e-07L3.95676 -2.15755e-07Z" fill="currentColor"/>
              </svg>`,

        fileUpload: `<svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.25 12.75H6.75V9.61875L7.95 10.8188L9 9.75L6 6.75L3 9.75L4.06875 10.8L5.25 9.61875V12.75ZM1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H7.5L12 4.5V13.5C12 13.9125 11.8531 14.2656 11.5594 14.5594C11.2656 14.8531 10.9125 15 10.5 15H1.5ZM6.75 5.25V1.5H1.5V13.5H10.5V5.25H6.75Z" fill="currentColor"/>
                </svg>`,

        link: `<svg width="14" height="7" viewBox="0 0 14 7" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6.3 7H3.5C2.53167 7 1.70625 6.65875 1.02375 5.97625C0.34125 5.29375 0 4.46833 0 3.5C0 2.53167 0.34125 1.70625 1.02375 1.02375C1.70625 0.34125 2.53167 0 3.5 0H6.3V1.4H3.5C2.91667 1.4 2.42083 1.60417 2.0125 2.0125C1.60417 2.42083 1.4 2.91667 1.4 3.5C1.4 4.08333 1.60417 4.57917 2.0125 4.9875C2.42083 5.39583 2.91667 5.6 3.5 5.6H6.3V7ZM4.2 4.2V2.8H9.8V4.2H4.2ZM7.7 7V5.6H10.5C11.0833 5.6 11.5792 5.39583 11.9875 4.9875C12.3958 4.57917 12.6 4.08333 12.6 3.5C12.6 2.91667 12.3958 2.42083 11.9875 2.0125C11.5792 1.60417 11.0833 1.4 10.5 1.4H7.7V0H10.5C11.4683 0 12.2937 0.34125 12.9762 1.02375C13.6588 1.70625 14 2.53167 14 3.5C14 4.46833 13.6588 5.29375 12.9762 5.97625C12.2937 6.65875 11.4683 7 10.5 7H7.7Z" fill="currentColor"/>
            </svg>`,

        featureCancel: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.84 3L6 5.16L8.16 3L9 3.84L6.84 6L9 8.16L8.16 9L6 6.84L3.84 9L3 8.16L5.16 6L3 3.84L3.84 3ZM6 0C5.17 0 4.39 0.1575 3.66 0.4725C2.93 0.7875 2.295 1.215 1.755 1.755C1.215 2.295 0.7875 2.93 0.4725 3.66C0.1575 4.39 0 5.17 0 6C0 6.83 0.1575 7.61 0.4725 8.34C0.7875 9.07 1.215 9.705 1.755 10.245C2.295 10.785 2.93 10.785 3.66 11.5275C4.39 11.8425 5.17 12 6 12C6.83 12 7.61 11.8425 8.34 11.5275C9.07 11.2125 9.705 10.785 10.245 10.245C10.785 9.705 11.2125 9.07 11.5275 8.34C11.8425 7.61 12 6.83 12 6C12 5.17 11.8425 4.39 11.5275 3.66C11.2125 2.93 10.785 2.295 10.245 1.755C9.705 1.215 9.07 0.7875 8.34 0.4725C7.61 0.1575 6.83 0 6 0ZM6 1.2C7.34 1.2 8.475 1.665 9.405 2.595C10.335 3.525 10.8 4.66 10.8 6C10.8 7.34 10.335 8.475 9.405 9.405C8.475 10.335 7.34 10.8 6 10.8C4.66 10.8 3.525 10.335 2.595 9.405C1.665 8.475 1.2 7.34 1.2 6C1.2 4.66 1.665 3.525 2.595 2.595C3.525 1.665 4.66 1.2 6 1.2Z" fill="#5F5F5F"/>
                      </svg>`,
    };
    //defult image for feature-element
    const featureSrc = "https://placehold.co/500x300?text=No+Image+Selected";

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

    $: if (featureState.content) {
        dispatch("featureUpdate", {
            id: resource.id,
            feature: featureState.content,
        });
    }

    onDestroy(() => {
        if (debounceTimer) clearTimeout(debounceTimer);
        if (updateTimer) clearTimeout(updateTimer);
    });
</script>

<div class="resource-section">
    <div class="section-header">
        <span class="section-label">Resource</span>
        <span class="position-label">
            Position
            <button
                class="position-btn"
                on:click={handleMoveUp}
                aria-label="Move up"
            >
                {@html icons.arrowUp}
            </button>
            <button
                class="position-btn"
                on:click={handleMoveDown}
                aria-label="Move down"
            >
                {@html icons.arrowDown}
            </button>
        </span>
    </div>
    <div class="resource-form">
        <div class="feature-element">
            {#if currentFeatureContent?.type === "video"}
                <iframe
                    src={currentFeatureContent.data}
                    title="Embedded video content"
                    allowFullscreen={true}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    class="feature-video"
                ></iframe>
            {:else}
                <img
                    src={currentFeatureContent?.type === "image"
                        ? currentFeatureContent.data
                        : featureSrc}
                    alt="Feature content"
                    class="feature-image"
                />
            {/if}
        </div>
        <div class="form-section">
            <h3>Feature Image/Video/Embed</h3>
            <div class="feature-controls">
                <div
                    id={`feature-editor-${resource.id}`}
                    style="display: none;"
                ></div>
                {#if showVideoInput || currentFeatureContent}
                    <div
                        class="feature-input-container"
                        in:fade={{ duration: 200 }}
                        out:fade={{ duration: 150 }}
                    >
                        {#if showVideoInput}
                            <input
                                type="text"
                                id={`feature-url-${resource.id}`}
                                name={`feature-url-${resource.id}`}
                                bind:value={featureState.url}
                                placeholder="Youtube link: https://www.youtube.com/watch?v=2cClcL8-aiY"
                                class="feature-input"
                                on:keydown={(e) =>
                                    e.key === "Enter" && handleVideoEmbed()}
                            />
                        {:else if currentFeatureContent}
                            <div class="feature-content-info">
                                <span class="content-name">
                                    {#if currentFeatureContent.type === "video"}
                                        {currentFeatureContent.content}
                                    {:else if currentFeatureContent.type === "image"}
                                        {currentFeatureContent.content}
                                    {/if}
                                </span>
                            </div>
                        {/if}
                        <button
                            class="feature-cancel-btn"
                            on:click={resetFeatureContent}
                            aria-label="Cancel feature input"
                        >
                            {@html icons.featureCancel}
                        </button>
                    </div>
                {/if}
            </div>
        </div>

        <div class="form-section">
            <h3>Title</h3>
            <input
                type="text"
                id={`resource-title-${resource.id}`}
                name={`resource-title-${resource.id}`}
                bind:value={resource.title}
                placeholder="Enter title"
                class="title-input"
            />
        </div>

        <div class="form-section">
            <h3>Description</h3>
            <div
                class="description-container"
                class:fullscreen-mode={isFullscreen}
            >
                <div id={`editor-${resource.id}`}></div>
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
            <h3>References</h3>
            {#if savedReferences.length > 0}
                <div class="references-container">
                    {#each savedReferences as reference}
                        <div class="reference-item">
                            <p>{reference}</p>
                        </div>
                    {/each}
                </div>
            {/if}
            <button class="reference-btn" on:click={openReferenceModal}>
                Add reference +
            </button>
        </div>

        <Modal
            bind:showModal={showReferenceModal}
            title="APA 7th Reference Generator"
        >
            <ReferenceHelper on:save={handleSaveReference} />
        </Modal>
    </div>
    <button
        class="delete-btn"
        on:click={handleDelete}
        aria-label="Delete resource"
    >
        Delete
        {@html icons.delete}
    </button>
</div>

<ConfirmationModal
    show={showDeleteConfirmModal}
    type="delete"
    content={resource.title || "Untitled resource"}
    onConfirm={confirmDelete}
    onCancel={closeDeleteConfirmModal}
/>

<style>
    * {
        font-family: "Inter", "Lato Extended", "Lato", "Helvetica Neue", "Helvetica",
    "Arial", "sans-serif";
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 14px;
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
        background: #FCFCFC;

    }

    .form-section {
        margin-bottom: 1em;
    }

    h3 {
        margin-bottom: 0.5rem;
        color: #333;
    }

    .title-input {
        width: 100%;
        padding: 0.5rem 1rem;
        border: 1px solid #ddd;
        border-radius: 1px;
        font-size: 1rem;
        box-sizing: border-box;
    }

    .title-input:focus {
        outline: none;
    }

    .description-container {
        border: 1px solid #e5e5e5;
        border-radius: 1px;
        background: white;
        position: relative;
        padding: 1rem 1rem 0.5rem 1rem;
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

    .resource-section .delete-btn {
        margin-left: auto;
        display: flex;
    }

    .delete-btn {
        background: #ff5656;
        color: white;
        padding: 0.1rem 1rem;
        border: none;
        cursor: pointer;
        align-items: center;
        gap: 0.5rem;
        font-size: 14px;
        justify-self: end;
    }

    .feature-element {
        width: 100%;
        max-width: 500px;
        height: 300px;
        margin: 0 auto 0 auto;
        border-radius: 8px 8px 0 0;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #f8f9fa;
        position: relative;
    }

    .feature-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
        display: block;
    }

    .feature-video {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        border: none;
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

    .position-btn {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        color: #686868;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .position-btn:hover {
        color: #333;
    }

    .feature-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        min-height: 40px; /* Sabit yükseklik ekledim ki içerik değişirken sıçrama olmasın */
    }

    /* Feature controls toolbar styles */
    .feature-controls :global(.ql-toolbar.ql-snow) {
        border: 1px solid #e5e5e5;
        border-radius: 1px;
        padding: 4px 8px;
        background: white;
        display: flex;
        align-items: center;
        width: fit-content;
    }

    .feature-controls :global(.ql-toolbar .ql-formats) {
        display: flex;
        margin: 0;
    }

    .feature-controls :global(.ql-toolbar button) {
        width: 32px;
        height: 32px;
        padding: 4px;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: #5f5f5f;
        transition: all 0.2s ease;
    }

    .feature-controls :global(.ql-toolbar button:hover) {
        color: #6792ff !important;
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

    .feature-input-container {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }

    .feature-content-info {
        position: relative;
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border: 1px solid #e5e5e5;
        border-radius: 1px;
        flex: 1;
        background: white;
    }

    .feature-input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #e5e5e5;
        border-radius: 1px;
        font-size: 14px;
    }

    .feature-input::placeholder {
        font-style: italic;
    }

    .feature-input:focus {
        outline: none;
    }

    .feature-cancel-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #5f5f5f;
        transition: color 0.2s ease;
        min-width: 24px;
        height: 24px;
    }

    .feature-cancel-btn:hover {
        color: #333;
    }

    .content-name {
        flex: 1;
        color: #6792ff;
        text-decoration: underline;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .reference-btn {
        background: white;
        border: 1px solid #e5e5e5;
        border-radius: 1px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        text-align: left;
        transition: all 0.2s ease;
    }

    .reference-btn:hover {
        background: #f0f2f5;
    }

    .references-container {
        margin-bottom: 1rem;
        border: 1px solid #e5e5e5;
        border-radius: 4px;
        background: white;
    }

    .reference-item {
        padding: 1rem;
        border-bottom: 1px solid #e5e5e5;
    }

    .reference-item:last-child {
        border-bottom: none;
    }

    .reference-item p {
        margin: 0;
        color: #2c3e50;
        font-size: 14px;
        line-height: 1.6;
    }
</style>
