<script>
  import { onMount } from "svelte";
  import { fade, slide } from "svelte/transition";

  let quill;
  let introQuill;
  let isFullscreen = false;
  let isIntroFullscreen = false;
  let isDragging = false;
  let startY = 0;
  let startHeight = 0;
  let editor;
  let currentEditor = null;

  let featureEditor;
  let showVideoInput = false;
  let videoUrl = "";
  let currentFeatureContent = null; // {type: 'image'|'video', content: string}

  function toggleFullscreen(type = "resource") {
    if (type === "introduction") {
      isIntroFullscreen = !isIntroFullscreen;
    } else {
      isFullscreen = !isFullscreen;
    }
  }

  function handleMouseDown(event, type = "resource") {
    isDragging = true;
    startY = event.clientY;
    editor =
      type === "introduction"
        ? document.querySelector("#introduction-editor")
        : document.querySelector("#editor");
    startHeight = editor.offsetHeight;
    currentEditor = type;

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  function handleMouseMove(event) {
    if (!isDragging) return;

    const deltaY = event.clientY - startY;
    const maxHeight = 500; // Fixed max height of 500px
    const newHeight = Math.min(maxHeight, Math.max(200, startHeight + deltaY));
    editor.style.height = `${newHeight}px`;
  }

  function handleMouseUp() {
    isDragging = false;
    currentEditor = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  function resetFeatureContent() {
    currentFeatureContent = null;
    showVideoInput = false;
    videoUrl = "";

    // Feature element'i default image'a döndür
    const featureElement = document.querySelector(".feature-element");
    if (featureElement) {
      featureElement.innerHTML = `<img src="${featureSrc}" alt="Feature content" class="feature-image" style="object-fit: cover; width: 100%; height: 100%; display: block;"/>`;
    }

    // Quill içeriğini temizle
    if (featureEditor) {
      featureEditor.setContents([]);
    }
  }

  function handleVideoEmbed() {
    if (videoUrl) {
      // Önce state'i güncelle
      currentFeatureContent = {
        type: "video",
        content: videoUrl,
      };

      // Hemen input'u gizle
      showVideoInput = false;

      // Sonra embed işlemini yap
      if (featureEditor) {
        featureEditor.setContents([]);
        featureEditor.focus();
        const range = featureEditor.getSelection() || { index: 0 };
        featureEditor.insertEmbed(range.index, "video", videoUrl);
      }
    }
  }

  onMount(() => {
    if (typeof window !== "undefined") {
      const Font = Quill.import("formats/font");
      const VideoBlot = Quill.import("formats/video");
      const Icons = Quill.import('ui/icons');

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

      // Normal editörler için standart Quill kullan
      introQuill = new Quill("#introduction-editor", {
        modules: {
          toolbar: toolbarOptions,
          syntax: true,
        },
        placeholder: "Please enter introduction text",
        theme: "snow",
      });

      quill = new Quill("#editor", {
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

      // İkonları string olarak tanımla
      Icons.image = `<span class="custom-icon">${icons.fileUpload}</span>`;
      Icons.video = `<span class="custom-icon">${icons.link}</span>`;

      // Modülleri kaydet
      Quill.register({
        'formats/font': Font,
        'formats/video': VideoBlot,
        'ui/icons': Icons
      }, true);

      // Feature toolbar options
      const featureToolbarOptions = [['image', 'video']];

      // Feature editor için Quill kullan
      featureEditor = new Quill('#feature-editor', {
        modules: {
          toolbar: {
            container: featureToolbarOptions,
            handlers: {
              image: function() {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.click();

                input.onchange = () => {
                  const file = input.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      this.quill.setContents([]);
                      currentFeatureContent = {
                        type: 'image',
                        content: file.name
                      };
                      
                      const range = this.quill.getSelection(true);
                      this.quill.insertEmbed(range.index, 'image', e.target.result);
                    };
                    reader.readAsDataURL(file);
                  }
                };
              },
              video: function() {
                showVideoInput = true;
                videoUrl = "";
              }
            }
          }
        },
        theme: "snow",
        placeholder: "",
      });

      featureEditor.on('text-change', function() {
        const img = featureEditor.root.querySelector('img');
        const iframe = featureEditor.root.querySelector('iframe');
        const featureElement = document.querySelector('.feature-element');
        
        if (featureElement) {
          if (img && currentFeatureContent?.type === 'image') {
            featureElement.innerHTML = `<img src="${img.src}" alt="Feature content" class="feature-image" style="object-fit: cover; width: 100%; height: 100%; display: block;"/>`;
          } else if (iframe && currentFeatureContent?.type === 'video') {
            featureElement.innerHTML = `<iframe 
              src="${iframe.getAttribute('src')}" 
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowfullscreen 
              class="feature-video"
              style="width: 100%; height: 100%; border: none;"
              >
            </iframe>`;
          }
        }
      });
    }

    // Store original height after Quill initialization
    const editor = document.querySelector("#editor");
    if (editor) {
      startHeight = editor.offsetHeight;
    }
  });

  // SVG Icons Library
  const icons = {
    delete: `<svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.91663 7.75C1.68746 7.75 1.49128 7.6684 1.32808 7.50521C1.16489 7.34201 1.08329 7.14583 1.08329 6.91667V1.5H0.666626V0.666667H2.74996V0.25H5.24996V0.666667H7.33329V1.5H6.91663V6.91667C6.91663 7.14583 6.83503 7.34201 6.67183 7.50521C6.50864 7.6684 6.31246 7.75 6.08329 7.75H1.91663ZM6.08329 1.5H1.91663V6.91667H6.08329V1.5ZM2.74996 6.08333H3.58329V2.33333H2.74996V6.08333ZM4.41663 6.08333H5.24996V2.33333H4.41663V6.08333Z" fill="currentColor"/>
    </svg>`,

    book: `<svg width="18" height="16" viewBox="0 0 18 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_4023_134)">
        <path d="M7.62667 14.7344C7.95667 14.8531 8.31111 14.6062 8.31111 14.25V2.45625C8.31111 2.325 8.26222 2.19375 8.15833 2.1125C7.55944 1.625 6.18444 1 4.4 1C2.85694 1 1.41472 1.41562 0.553056 1.75312C0.207778 1.89062 0 2.24063 0 2.61875V14.1906C0 14.5625 0.391111 14.8219 0.736389 14.7062C1.69889 14.3781 3.22361 14 4.4 14C5.43583 14 6.81389 14.4375 7.62667 14.7344ZM9.97333 14.7344C10.7861 14.4375 12.1642 14 13.2 14C14.3764 14 15.9011 14.3781 16.8636 14.7062C17.2089 14.825 17.6 14.5625 17.6 14.1906V2.61875C17.6 2.24063 17.3922 1.89062 17.0469 1.75625C16.1853 1.41563 14.7431 1 13.2 1C11.4156 1 10.0406 1.625 9.44167 2.1125C9.34083 2.19375 9.28889 2.325 9.28889 2.45625V14.25C9.28889 14.6062 9.64639 14.8531 9.97333 14.7344Z" fill="currentColor"/>
      </g>
      <defs>
        <clipPath id="clip0_4023_134">
          <rect width="17.6" height="16" fill="white"/>
        </clipPath>
      </defs>
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

    lock: `<svg width="8" height="11" viewBox="0 0 8 11" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 11C0.725 11 0.489583 10.9021 0.29375 10.7063C0.0979167 10.5104 0 10.275 0 10V5C0 4.725 0.0979167 4.48958 0.29375 4.29375C0.489583 4.09792 0.725 4 1 4H1.5V3C1.5 2.30833 1.74375 1.71875 2.23125 1.23125C2.71875 0.74375 3.30833 0.5 4 0.5C4.69167 0.5 5.28125 0.74375 5.76875 1.23125C6.25625 1.71875 6.5 2.30833 6.5 3V4H7C7.275 4 7.51042 4.09792 7.70625 4.29375C7.90208 4.48958 8 4.725 8 5V10C8 10.275 7.90208 10.5104 7.70625 10.7063C7.51042 10.9021 7.275 11 7 11H1ZM1 10H7V5H1V10ZM4 8.5C4.275 8.5 4.51042 8.40208 4.70625 8.20625C4.90208 8.01042 5 7.775 5 7.5C5 7.225 4.90208 6.98958 4.70625 6.79375C4.51042 6.59792 4.275 6.5 4 6.5C3.725 6.5 3.48958 6.59792 3.29375 6.79375C3.09792 6.98958 3 7.225 3 7.5C3 7.775 3.09792 8.01042 3.29375 8.20625C3.48958 8.40208 3.725 8.5 4 8.5ZM2.5 4H5.5V3C5.5 2.58333 5.35417 2.22917 5.0625 1.9375C4.77083 1.64583 4.41667 1.5 4 1.5C3.58333 1.5 3.22917 1.64583 2.9375 1.9375C2.64583 2.22917 2.5 2.58333 2.5 3V4Z" fill="currentColor"/>
          </svg>`,
    arrowUp: `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.8262 7L2.8262 2.04615L0.791336 3.98462L-7.68024e-08 3.23077L3.39144 0L6.78288 3.23077L5.99154 3.98462L3.95668 2.04615L3.95668 7L2.8262 7Z" fill="currentColor"/>
            </svg>`,
    arrowDown: `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.95676 -2.15755e-07L3.95676 4.95385L5.99162 3.01538L6.78296 3.76923L3.39152 7L8.09089e-05 3.76923L0.791417 3.01538L2.82628 4.95385L2.82628 -3.02057e-07L3.95676 -2.15755e-07Z" fill="currentColor"/>
            </svg>`,

    fileUpload: `<svg width="12" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.25 12.75H6.75V9.61875L7.95 10.8188L9 9.75L6 6.75L3 9.75L4.06875 10.8L5.25 9.61875V12.75ZM1.5 15C1.0875 15 0.734375 14.8531 0.440625 14.5594C0.146875 14.2656 0 13.9125 0 13.5V1.5C0 1.0875 0.146875 0.734375 0.440625 0.440625C0.734375 0.146875 1.0875 0 1.5 0H7.5L12 4.5V13.5C12 13.9125 11.8531 14.2656 11.5594 14.5594C11.2656 14.8531 10.9125 15 10.5 15H1.5ZM6.75 5.25V1.5H1.5V13.5H10.5V5.25H6.75Z" fill="#5F5F5F"/>
              </svg>`,

    link: `<svg width="14" height="7" viewBox="0 0 14 7" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.3 7H3.5C2.53167 7 1.70625 6.65875 1.02375 5.97625C0.34125 5.29375 0 4.46833 0 3.5C0 2.53167 0.34125 1.70625 1.02375 1.02375C1.70625 0.34125 2.53167 0 3.5 0H6.3V1.4H3.5C2.91667 1.4 2.42083 1.60417 2.0125 2.0125C1.60417 2.42083 1.4 2.91667 1.4 3.5C1.4 4.08333 1.60417 4.57917 2.0125 4.9875C2.42083 5.39583 2.91667 5.6 3.5 5.6H6.3V7ZM4.2 4.2V2.8H9.8V4.2H4.2ZM7.7 7V5.6H10.5C11.0833 5.6 11.5792 5.39583 11.9875 4.9875C12.3958 4.57917 12.6 4.08333 12.6 3.5C12.6 2.91667 12.3958 2.42083 11.9875 2.0125C11.5792 1.60417 11.0833 1.4 10.5 1.4H7.7V0H10.5C11.4683 0 12.2937 0.34125 12.9762 1.02375C13.6588 1.70625 14 2.53167 14 3.5C14 4.46833 13.6588 5.29375 12.9762 5.97625C12.2937 6.65875 11.4683 7 10.5 7H7.7Z" fill="#5F5F5F"/>
          </svg>`,

    featureCancel: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.84 3L6 5.16L8.16 3L9 3.84L6.84 6L9 8.16L8.16 9L6 6.84L3.84 9L3 8.16L5.16 6L3 3.84L3.84 3ZM6 0C5.17 0 4.39 0.1575 3.66 0.4725C2.93 0.7875 2.295 1.215 1.755 1.755C1.215 2.295 0.7875 2.93 0.4725 3.66C0.1575 4.39 0 5.17 0 6C0 6.83 0.1575 7.61 0.4725 8.34C0.7875 9.07 1.215 9.705 1.755 10.245C2.295 10.785 2.93 10.785 3.66 11.5275C4.39 11.8425 5.17 12 6 12C6.83 12 7.61 11.8425 8.34 11.5275C9.07 11.2125 9.705 10.785 10.245 10.245C10.785 9.705 11.2125 9.07 11.5275 8.34C11.8425 7.61 12 6.83 12 6C12 5.17 11.8425 4.39 11.5275 3.66C11.2125 2.93 10.785 2.295 10.245 1.755C9.705 1.215 9.07 0.7875 8.34 0.4725C7.61 0.1575 6.83 0 6 0ZM6 1.2C7.34 1.2 8.475 1.665 9.405 2.595C10.335 3.525 10.8 4.66 10.8 6C10.8 7.34 10.335 8.475 9.405 9.405C8.475 10.335 7.34 10.8 6 10.8C4.66 10.8 3.525 10.335 2.595 9.405C1.665 8.475 1.2 7.34 1.2 6C1.2 4.66 1.665 3.525 2.595 2.595C3.525 1.665 4.66 1.2 6 1.2Z" fill="#5F5F5F"/>
                    </svg>`,
  };
  //defult image for feature-element
  const featureSrc =
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&auto=format&fit=crop";
</script>

<div class="page-container">
  <div class="introduction-section">
    <div class="section-header">
      <span class="section-label">Introduction</span>
      <span class="position-label">Position {@html icons.lock}</span>
    </div>
    <div class="introduction-form">
      <div
        class="description-container"
        class:fullscreen-mode={isIntroFullscreen}
      >
        <div id="introduction-editor"></div>
        <div class="editor-resize-buttons">
          <button
            class="resize-button"
            aria-label="Toggle fullscreen mode"
            on:click={() => toggleFullscreen("introduction")}
          >
            {@html icons.resize}
          </button>
          <button
            class="editor-expend-button"
            aria-label="Drag to resize editor"
            on:mousedown={(e) => handleMouseDown(e, "introduction")}
          >
            {@html icons.expand}
          </button>
        </div>
      </div>
    </div>
    <button class="delete-btn" aria-label="Delete introduction">
      Delete
      {@html icons.delete}
    </button>
  </div>

  <div class="resource-section">
    <div class="section-header">
      <span class="section-label">Resource</span>
      <span class="position-label">
        Position
        <button class="position-btn" aria-label="Move up">
          {@html icons.arrowUp}
        </button>
        <button class="position-btn" aria-label="Move down">
          {@html icons.arrowDown}
        </button>
      </span>
    </div>
    <div class="resource-form">
      <div class="feature-element">
        <img
          src={currentFeatureContent
            ? currentFeatureContent.type === "image"
              ? currentFeatureContent.content
              : featureSrc
            : featureSrc}
          alt="Feature content"
          class="feature-image"
        />
      </div>
      <div class="form-section">
        <h3>Feature Image/Video/Embed</h3>
        <div class="feature-controls">
          <div id="feature-editor" style="display: none"></div>
          {#if currentFeatureContent}
            <div 
              class="feature-content-info" 
              in:fade={{ duration: 200 }} 
              out:fade={{ duration: 150 }}
            >
              <span class="content-name">{currentFeatureContent.content}</span>
              <button 
                class="feature-cancel-btn" 
                on:click={resetFeatureContent}
                aria-label="Remove feature content"
              >
                {@html icons.featureCancel}
              </button>
            </div>
          {:else if showVideoInput}
            <div 
              class="video-input-container" 
              in:fade={{ duration: 200 }} 
              out:fade={{ duration: 150 }}
            >
              <input
                type="text"
                bind:value={videoUrl}
                placeholder="Youtube link: https://www.youtube.com/watch?v=2cClcL8-aiY"
                class="video-input"
                on:keydown={(e) => e.key === "Enter" && handleVideoEmbed()}
              />
            </div>
          {/if}
        </div>
      </div>

      <div class="form-section">
        <h3>Title</h3>
        <input type="text" placeholder="Enter title" class="title-input" />
      </div>

      <div class="form-section">
        <h3>Description</h3>
        <div class="description-container" class:fullscreen-mode={isFullscreen}>
          <div id="editor"></div>
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
        <input
          type="text"
          placeholder="Add reference +"
          class="reference-input"
        />
      </div>
    </div>
    <button class="delete-btn" aria-label="Delete resource">
      Delete
      {@html icons.delete}
    </button>
  </div>

  <div class="add-resource-box">
    <button class="add-resource-btn">
      {@html icons.book}
      <span>Add New Resource</span>
    </button>
  </div>

  <div class="button-group">
    <button class="cancel-btn">Cancel</button>
    <button class="save-btn">Save Page</button>
  </div>
</div>

<style>
  * {
    font-family: "Lato Extended", "Lato", "Helvetica Neue", "Helvetica", "Arial",
      "sans-serif";
    box-sizing: border-box;
    line-height: 1.6;
    font-size: 15px;
  }

  .page-container {
    max-width: 800px;
    margin: 2rem auto;
  }

  .introduction-form {
    padding: 1rem 0.5rem 0 0.5rem;
    border-radius: 1px;
    border: 1px solid #e5e5e5;
    position: relative;
    background: white;
  }

  .resource-form {
    padding: 2rem;
    border-radius: 1px;
    border: 1px solid #e5e5e5;
    position: relative;
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

  .reference-input {
    padding: 0.5rem 1rem;
    border: 1px solid #ddd;
    border-radius: 1px;
    font-size: 1rem;
  }

  #editor {
    min-height: 200px;
    height: 200px;
    padding: 1rem;
    transition: none; /* Remove transition for smooth dragging */
  }

  :global(.ql-toolbar.ql-snow) {
    border: none;
    padding: 8px 8px 16px 0;
    border-bottom: 1px solid #e5e5e5;
  }

  :global(.ql-container.ql-snow) {
    border: 1px solid #e5e5e5;
  }

  :global(.ql-editor.ql-blank) {
    padding: 0;
  }

  .add-resource-box {
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 1px;
    padding: 2rem;
    margin: 1rem 0;
    display: flex;
    justify-content: center;
  }

  .add-resource-btn {
    background: #6792ff;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 1rem 1rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .button-group {
    display: flex;
    justify-content: flex-start;
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

  .save-btn {
    background: #71be81;
    color: white;
    padding: 0 2rem;
    border: none;
  }

  .cancel-btn {
    background: #f3f3f3;
    color: black;
    padding: 0.5rem 2rem;
    border: none;
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
    object-fit: contain;
    transition: transform 0.3s ease;
    display: block;
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

  .fullscreen-mode #editor,
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
    gap: 1rem;
    margin-bottom: 1rem;
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
  }

  :global(.custom-icon svg) {
    width: 16px;
    height: 16px;
  }

  .feature-content-info {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid #e5e5e5;
    border-radius: 1px;
    flex: 1;
  }

  .content-name {
    flex: 1;
    color: #6792ff;
    text-decoration: underline;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .feature-cancel-btn {
    position: absolute;
    right: -24px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #5f5f5f;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .feature-cancel-btn:hover {
    color: #333;
  }

  .video-input-container {
    display: flex;
    gap: 8px;
    flex: 1;
  }

  .video-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #e5e5e5;
    border-radius: 1px;
    font-size: 14px;
  }

  .video-input:focus {
    outline: none;
  }

  /* Feature controls toolbar styles */
  .feature-controls :global(.ql-toolbar.ql-snow) {
    border: 1px solid #e5e5e5 ;
    border-radius: 1px ;
    padding:4px 8px ;
    background: white ;
    display: flex ;
    align-items: center ;
    width: fit-content ;
  }

  .feature-controls :global(.ql-toolbar .ql-formats) {
    display: flex ;
    margin: 0 ;
  }

  .feature-controls :global(.ql-toolbar button) {
    width: 32px ;
    height: 32px ;
    padding: 4px ;
    background: white ;
    display: flex ;
    align-items: center ;
    justify-content: center ;
    cursor: pointer ;
  }

  .feature-controls :global(.ql-toolbar button.ql-active) {
    color: #6792FF ;
  }

  .feature-controls :global(.ql-container) {
    display: none ;
  }
</style>
