<script>
    import { fade } from 'svelte/transition';
    
    export let show = false;
    export let type = 'publish'; // 'publish' | 'cancel' | 'delete'
    export let content = ''; // Custom content to show below title
    export let isHtml = false; // Whether content should be rendered as HTML
    export let onConfirm = () => {};
    export let onCancel = () => {};
    
    const MODAL_PRESETS = {
        publish: {
            title: 'Save and publish page',
            subtitle: 'Module 3 Resources',
            confirmText: 'Publish',
            confirmButtonClass: 'btn-success',
            cancelText: 'Cancel'
        },
        cancel: {
            title: 'Cancel and return home',
            subtitle: 'You will lose any unsaved changes',
            confirmText: 'Confirm',
            confirmButtonClass: 'btn-danger',
            cancelText: 'Cancel'
        },
        delete: {
            title: 'Delete resource',
            subtitle: '',
            confirmText: 'Delete',
            confirmButtonClass: 'btn-danger',
            cancelText: 'Cancel'
        },
        deleteIntroduction: {
            title: 'Delete Introduction',
            subtitle: 'You will lose Introduction of the Resource Page',
            confirmText: 'Delete',
            confirmButtonClass: 'btn-danger',
            cancelText: 'Cancel'
        },
        deleteReference:{
            title: 'Delete Reference',
            subtitle: '',
            confirmText: 'Delete',
            confirmButtonClass: 'btn-danger',
            cancelText: 'Cancel'
        }
    };

    $: modalConfig = MODAL_PRESETS[type];
</script>

{#if show}
<div class="confirm-backdrop" transition:fade={{ duration: 150 }}>
    <div class="confirm-modal" transition:fade={{ duration: 200 }}>
        <div class="confirm-header">
            <h2 class="confirm-title">{modalConfig.title}</h2>
            {#if modalConfig.subtitle}
                <p class="confirm-subtitle">{modalConfig.subtitle}</p>
            {/if}
            {#if content}
                {#if isHtml}
                    <p class="confirm-content" bind:innerHTML={content} contenteditable="false"></p>
                {:else}
                    <p class="confirm-content">{content}</p>
                {/if}
            {/if}
        </div>
        <div class="confirm-actions">
            <button class="cancel-btn" on:click={onCancel}>
                {modalConfig.cancelText}
            </button>
            <button class={`confirm-btn ${modalConfig.confirmButtonClass}`} on:click={onConfirm}>
                {modalConfig.confirmText}
            </button>
        </div>
    </div>
</div>
{/if}

<style>
    * {
        font-family: "Inter", "Lato Extended", "Lato", "Helvetica Neue", "Helvetica",
    "Arial", "sans-serif";
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 14px;
        font-weight: 300;
    }
    .confirm-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .confirm-modal {
        background-color: white;
        width: 400px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        padding: 2rem;
    }

    .confirm-header {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .confirm-title {
        font-size: 16px;
        font-weight: 500;
        margin: 0;
        color: #333;
    }

    .confirm-subtitle {
        font-size: 14px;
        color: #666;
        margin: 0.5rem 0 0 0;
        font-style: italic;
    }

    .confirm-content {
        font-size: 14px;
        color: #555;
        margin: 1rem 0 0 0;
        font-style: italic;
        word-wrap: break-word;
        overflow-wrap: break-word;
        max-width: 100%;
    }

    .confirm-content :global(a) {
        color: #6792ff;
        text-decoration: none;
        transition: color 0.3s ease;
        word-wrap: break-word;
        overflow-wrap: break-word;
        display: inline-block;
        max-width: 100%;
    }

    .confirm-content :global(a:hover) {
        color: #4a6cd4;
        text-decoration: underline;
    }

    .confirm-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
    }

    .cancel-btn, .confirm-btn {
        padding: 4px 24px;
        border: none;
        font-size: 14px;
        cursor: pointer;
        transition: background-color 0.2s;
        min-width: 100px;
    }

    .cancel-btn {
        background-color: white;
        color: #333;
        border: 1px solid #ddd;
    }

    .confirm-btn {
        color: white;
    }

    .btn-success {
        background-color: #71be81;
    }

    .btn-success:hover {
        background-color: #5ca96b;
    }

    .btn-danger {
        background-color: #ff5656;
    }

    .btn-danger:hover {
        background-color: #ff3636;
    }

    .cancel-btn:hover {
        background-color: #f8f8f8;
    }
</style>
