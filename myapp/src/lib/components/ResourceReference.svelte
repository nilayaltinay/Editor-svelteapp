<script>

import { createEventDispatcher } from "svelte";
    import Modal from "./modal.svelte";
    import ReferenceHelper from "./ReferenceHelper.svelte";
    import ConfirmationModal from "./ConfirmationModal.svelte";

    export let resource = {
        id: "",
        references: []
    };

    const dispatch = createEventDispatcher();
    
    let showReferenceModal = false;
    let showDeleteReferenceModal = false;
    let savedReferences = []; // Array to store saved references
    let editingReferenceIndex = null; // Index of the reference being edited
    let referenceToDeleteIndex = null; // Index of the reference to be deleted
    let isEditing = false; // Flag indicating if we are in edit mode

    function openReferenceModal() {
        isEditing = false;
        editingReferenceIndex = null;
        showReferenceModal = true;
    }

    function handleEditReference(index) {
        editingReferenceIndex = index;
        isEditing = true;
        showReferenceModal = true;
    }

    function handleSaveReference(event) {
        const reference = event.detail.reference;
        const formData = event.detail.formData; // Get new form data

        if (isEditing && editingReferenceIndex !== null) {
            // Update existing reference
            savedReferences = savedReferences.map((ref, i) =>
                i === editingReferenceIndex
                    ? {
                          text: reference,
                          formData: formData,
                      }
                    : ref,
            );
        } else {
            // Add new reference
            savedReferences = [
                ...savedReferences,
                {
                    text: reference,
                    formData: formData,
                },
            ];
        }

        resource.references = savedReferences;
        dispatch("update", {
            id: resource.id,
            field: "references",
            value: savedReferences,
        });

        // Clear state
        showReferenceModal = false;
        isEditing = false;
        editingReferenceIndex = null;
    }

    function handleDeleteReference(index) {
        referenceToDeleteIndex = index;
        showDeleteReferenceModal = true;
    }

    function confirmDeleteReference() {
        if (referenceToDeleteIndex !== null) {
            savedReferences = savedReferences.filter(
                (_, i) => i !== referenceToDeleteIndex,
            );
            resource.references = savedReferences;
            dispatch("update", {
                id: resource.id,
                field: "references",
                value: savedReferences,
            });
            closeDeleteReferenceModal();
        }
    }

    function closeDeleteReferenceModal() {
        showDeleteReferenceModal = false;
        referenceToDeleteIndex = null;
    }

    const icons = {
        edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clip-path="url(#clip0_76_4984)">
              <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
            </g>
            <defs>
              <clipPath id="clip0_76_4984">
                <rect width="24" height="24" fill="white"/>
              </clipPath>
            </defs>
          </svg>`,

        delete: `<svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.91663 7.75C1.68746 7.75 1.49128 7.6684 1.32808 7.50521C1.16489 7.34201 1.08329 7.14583 1.08329 6.91667V1.5H0.666626V0.666667H2.74996V0.25H5.24996V0.666667H7.33329V1.5H6.91663V6.91667C6.91663 7.14583 6.83503 7.34201 6.67183 7.50521C6.50864 7.6684 6.31246 7.75 6.08329 7.75H1.91663ZM6.08329 1.5H1.91663V6.91667H6.08329V1.5ZM2.74996 6.08333H3.58329V2.33333H2.74996V6.08333ZM4.41663 6.08333H5.24996V2.33333H4.41663V6.08333Z" fill="currentColor"/>
      </svg>`,
    };
</script>

{#if savedReferences.length > 0}
    <div class="references-container">
        {#each savedReferences as reference, index}
            <div class="reference-item">
                <p bind:innerHTML={reference.text} contenteditable="false"></p>
                <div class="reference-actions">
                    <button
                        class="action-btn edit-btn"
                        on:click={() => handleEditReference(index)}
                        aria-label="Edit reference"
                    >
                        {@html icons.edit}
                    </button>
                    <button
                        class="action-btn delete-btn"
                        on:click={() => handleDeleteReference(index)}
                        aria-label="Delete reference"
                    >
                        {@html icons.delete}
                    </button>
                </div>
            </div>
        {/each}
    </div>
{/if}
<button class="reference-btn" on:click={openReferenceModal}>
    Add reference +
</button>

<Modal bind:showModal={showReferenceModal} title="APA 7th Reference Generator">
    <ReferenceHelper
        on:save={handleSaveReference}
        {isEditing}
        reference={isEditing ? savedReferences[editingReferenceIndex] : null}
    />
</Modal>

<ConfirmationModal
    show={showDeleteReferenceModal}
    type="deleteReference"
    content={savedReferences[referenceToDeleteIndex]?.text || "Reference"}
    isHtml={true}
    onConfirm={confirmDeleteReference}
    onCancel={closeDeleteReferenceModal}
/>

<style>
    * {
        font-family: "Inter", "Lato Extended", "Lato", "Helvetica Neue",
            "Helvetica", "Arial", "sans-serif";
        box-sizing: border-box;
        line-height: 1.6;
        font-size: 14px;
        font-weight: 300;
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
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    .reference-item:last-child {
        border-bottom: none;
    }

    .reference-item p {
        margin: 0;
        color: #2c3e50;
        font-size: 14px;
        line-height: 1.6;
        flex: 1;
    }

    .reference-item p :global(a) {
        color: #6792ff;
        text-decoration: none;
        transition: color 0.3s ease;
    }

    .reference-item p :global(a:hover) {
        color: #4a6cd4;
        text-decoration: underline;
    }

    .reference-actions {
        display: flex;
        align-self: center;
        transition: opacity 0.2s ease;
    }

    .action-btn {
        background: none;
        border: none;
        padding: 4px;
        cursor: pointer;
        color: #666;
        transition: color 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        width: 24px;
        height: 24px;
    }

    .action-btn:hover {
        background: #f5f5f5;
    }

    .edit-btn:hover {
        color: #1a5aff;
    }
</style>
