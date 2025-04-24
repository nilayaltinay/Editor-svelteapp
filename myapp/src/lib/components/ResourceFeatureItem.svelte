<script>
    import { createEventDispatcher } from "svelte";
    import { fade } from "svelte/transition";
    import { onMount, onDestroy } from "svelte";

    export let resource = {
        id: "",
        feature: null,
    };

    const dispatch = createEventDispatcher();

    let quill;
    let featureEditor;
    let featureEditorRoot;
    let featureToolbar;
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

    let errorMessage = ""; // Add error message state
    let videoUrlLength = 0;

    // Feature state functions
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
        // Clear existing content
        resetFeatureContent();

        // Special case for video input
        if (type === "video") {
            updateFeatureState({
                showInput: true,
            });
        }
    }

    function updateFeatureContent(editor) {
        // Only run when video or image is added
        const img = featureEditorRoot.querySelector("img");
        const iframe = featureEditorRoot.querySelector("iframe.ql-video");

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
        errorMessage = ""; // Clear error state
        videoUrlLength = 0; // Clear URL length

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

    // Helper functions for video operations
    function isValidYouTubeUrl(url) {
        return url.includes("youtube.com") || url.includes("youtu.be");
    }

    function extractVideoId(url) {
        // Only accept alphanumeric characters and dash/underscore characters
        const match = url.match(
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        );
        return match ? match[1] : null;
    }

    function createEmbedUrl(videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }

    function cleanYouTubeUrl(url) {
        // Extract video ID from URL
        const videoId = extractVideoId(url);
        if (!videoId) return null;

        // Create clean URL
        return `https://www.youtube.com/watch?v=${videoId}`;
    }

    function setError(message) {
        errorMessage = message;
    }

    function clearError() {
        errorMessage = "";
    }

    function updateVideoFeature(videoUrl, embedUrl) {
        updateFeatureState({
            showInput: false,
            content: {
                type: "video",
                content: videoUrl,
                data: embedUrl,
            },
        });
    }

    function handleVideoEmbed() {
        if (!featureState.url) {
            setError("Please enter a YouTube URL");
            return;
        }

        try {
            const cleanUrl = cleanYouTubeUrl(featureState.url);
            if (!cleanUrl) {
                setError("Please enter a valid YouTube URL");
                return;
            }

            const videoId = extractVideoId(cleanUrl);
            const embedUrl = createEmbedUrl(videoId);
            updateVideoFeature(cleanUrl, embedUrl);
            clearError();
        } catch (error) {
            console.error("Video embed error:", error);
            setError("Error processing video URL");
        }
    }

    // Functions for form operations
    function handleVideoUrlChange(event) {
        const url = event.target.value;
        videoUrlLength = url.length;
        featureState.url = url;
        errorMessage = "";
    }

    onMount(() => {
        if (typeof window !== "undefined") {
            const VideoBlot = Quill.import("formats/video");

            // Video Blot configuration
            VideoBlot.sanitize = function (url) {
                return isValidYouTubeUrl(url) ? url : "";
            };

            Quill.register(
                {
                    "formats/video": VideoBlot,
                },
                true,
            );

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

            // Create Quill instance for feature editor
            featureEditor = new Quill(`#feature-editor-${resource.id}`, {
                modules: {
                    toolbar: featureToolbarOptions,
                },
                theme: "snow",
                placeholder: "",
            });

            // Get toolbar and root references
            featureToolbar = featureEditor.getModule("toolbar");
            featureEditorRoot = featureEditor.root;

            // Add custom icons to buttons in feature editor toolbar
            const imageButton =
                featureToolbar.container.querySelector(".ql-image");
            const videoButton =
                featureToolbar.container.querySelector(".ql-video");

            if (imageButton) {
                imageButton.innerHTML = `<span class="custom-icon">${icons.fileUpload}</span>`;
            }
            if (videoButton) {
                videoButton.innerHTML = `<span class="custom-icon">${icons.link}</span>`;
            }

            // Only update state when image is uploaded
            featureEditor.on("text-change", () => {
                const img = featureEditorRoot.querySelector("img");
                if (img && !featureState.content?.type) {
                    updateFeatureState({
                        content: {
                            type: "image",
                            content: "Image",
                            data: img.src,
                        },
                    });
                }
            });
        }
    });

    $: if (featureState.content) {
        dispatch("featureUpdate", {
            id: resource.id,
            feature: featureState.content,
        });
    }
    // SVG Icons Library
    const icons = {
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
</script>

<div class="feature-element">
    {#if currentFeatureContent?.type === "video"}
        <iframe
            src={currentFeatureContent.data}
            title="Embedded video content"
            sandbox="allow-scripts allow-same-origin allow-presentation"
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
<h3>Feature Image/Video/Embed</h3>
<div class="feature-controls">
    <div id={`feature-editor-${resource.id}`} style="display: none;"></div>
    {#if showVideoInput || currentFeatureContent}
        <div
            class="feature-input-container"
            in:fade={{ duration: 200 }}
            out:fade={{ duration: 150 }}
        >
            {#if showVideoInput}
                <label for={`feature-url-${resource.id}`} class="sr-only"
                    >YouTube Video URL</label
                >
                <input
                    type="url"
                    id={`feature-url-${resource.id}`}
                    name={`feature-url-${resource.id}`}
                    bind:value={featureState.url}
                    placeholder="Youtube link: https://www.youtube.com/watch?v=2cClcL8-aiY"
                    class="feature-input"
                    class:error={!!errorMessage}
                    on:keydown={(e) => e.key === "Enter" && handleVideoEmbed()}
                    on:input={handleVideoUrlChange}
                    maxlength="100"
                    aria-label="YouTube video URL input"
                    aria-invalid={!!errorMessage}
                    aria-describedby={errorMessage
                        ? `error-${resource.id}`
                        : undefined}
                />
                <span class="url-character-count">{videoUrlLength}/100</span>
                {#if errorMessage}
                    <div
                        id={`error-${resource.id}`}
                        class="error-message"
                        role="alert"
                    >
                        {errorMessage}
                    </div>
                {/if}
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

<style>
    * {
        font-family: "Inter", "Lato Extended", "Lato", "Helvetica Neue",
            "Helvetica", "Arial", "sans-serif";
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 14px;
        font-weight: 300;
    }

    h3 {
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: 400;
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

    .feature-controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1rem;
        min-height: 40px;
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
        height: 40px;
    }

    .feature-controls :global(.ql-toolbar .ql-formats) {
        display: flex;
        margin: 0;
        height: 100%;
        align-items: center;
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

    .feature-input-container {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        width: 100%;
        max-width: 100%;
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
        height: 40px;
        line-height: 24px;
    }

    .feature-input {
        flex: 1;
        padding: 8px 12px;
        padding-right: 3.5rem;
        border: 1px solid #e5e5e5;
        border-radius: 1px;
        font-size: 14px;
        width: 100%;
        transition: border-color 0.2s ease;
        height: 40px;
        line-height: 24px;
    }

    .feature-input.error {
        border-color: #ff5656;
    }

    .feature-input::placeholder {
        font-weight: 300;
        font-style: italic;
        line-height: 150%;
        letter-spacing: -1.1%;
        color: #949494;
    }

    .feature-input:focus {
        outline: none;
        border-color: #6792ff;
    }

    .feature-input.error:focus {
        border-color: #ff5656;
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

    .error-message {
        color: #ff5656;
        font-size: 12px;
        margin: 2px;
        position: absolute;
        bottom: -24px;
        left: 0;
    }

    .url-character-count {
        position: absolute;
        right: 45px;
        top: 50%;
        transform: translateY(-50%);
        color: #666;
        font-size: 12px;
        pointer-events: none;
        user-select: none;
        font-weight: 300;
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media screen and (max-width: 360px) {
        .error-message {
            bottom: -44px;
        }
    }
</style>
