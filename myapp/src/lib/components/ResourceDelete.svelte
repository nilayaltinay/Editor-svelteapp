<script>
    import { createEventDispatcher } from "svelte";
    import ConfirmationModal from "./ConfirmationModal.svelte";

    export let resource = {
        id: "",
        title: "",
    };

    const dispatch = createEventDispatcher();
    let showDeleteConfirmModal = false;

    function handleDelete() {
        console.log("Delete button clicked");
        openDeleteConfirmModal();
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

    // SVG Delete Icon
    const icons = {
        delete: `<svg width="16" height="16" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.91663 7.75C1.68746 7.75 1.49128 7.6684 1.32808 7.50521C1.16489 7.34201 1.08329 7.14583 1.08329 6.91667V1.5H0.666626V0.666667H2.74996V0.25H5.24996V0.666667H7.33329V1.5H6.91663V6.91667C6.91663 7.14583 6.83503 7.34201 6.67183 7.50521C6.50864 7.6684 6.31246 7.75 6.08329 7.75H1.91663ZM6.08329 1.5H1.91663V6.91667H6.08329V1.5ZM2.74996 6.08333H3.58329V2.33333H2.74996V6.08333ZM4.41663 6.08333H5.24996V2.33333H4.41663V6.08333Z" fill="currentColor"/>
      </svg>`,
    };
</script>

<button class="delete-btn" on:click={handleDelete} aria-label="Delete resource">
    Delete
    {@html icons.delete}
</button>

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
    font-weight: 300;
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
    margin-left: auto;
}


</style>
