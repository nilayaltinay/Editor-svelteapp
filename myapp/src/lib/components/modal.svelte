<script>
    import { fade } from "svelte/transition";

    export let showModal = false; //Controls the visibility of the modal
    export let title = ""; //The title text displayed in the modal header

    //Closes the modal by setting showModal to false
    function closeModal() {
        showModal = false;
    }

    //Handles the Escape key to close the modal
    function handleKeydown(event) {
        if (event.key === "Escape") {
            closeModal();
        }
    }
</script>

<!-- Modal Container - Only shown when 'showModal' prop is true -->
{#if showModal}
    <div
        class="modal-backdrop transition:fade={{ duration: 150 }}"
        on:keydown={handleKeydown}
        tabindex="0"
        role="dialog"
        aria-modal="true"
    >
        <!-- Modal Content Container with Event Propagation Control -->
        <div
            class="modal-content"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="dialog"
            tabindex="0"
            transition:fade={{ duration: 200 }}
        >
            <!-- Close Button - Closes the modal -->
            <button class="close-button" on:click={closeModal}>&times;</button>
            <!-- Modal Header Section -->
            <div class="modal-header">
                <h2>{title}</h2>
            </div>
            <!-- Modal Body - Content Slot -->
            <div class="modal-body">
                <slot />
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        padding: 30px;
        border-radius: 4px;
        width: 70%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
    }

    .modal-header {
        text-align: center;
        color: #2c3e50;
        margin-bottom: 2rem;
    }

    .close-button {
        position: absolute;
        right: 20px;
        top: 20px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        color: #666;
        line-height: 1;
    }

    .close-button:hover {
        color: #333;
    }

    .modal-body {
        position: relative;
    }
</style>
