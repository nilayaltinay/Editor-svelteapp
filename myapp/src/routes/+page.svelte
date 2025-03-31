<script>
  import { onMount } from "svelte";
  import { fade, slide } from "svelte/transition";
  import Modal from "../lib/components/modal.svelte";
  import ReferenceHelper from "../lib/components/ReferenceHelper.svelte";
  import IntroductionSection from "../lib/components/IntroductionSection.svelte";
  import ResourceSection from "../lib/components/ResourceSection.svelte";
  import ConfirmationModal from "../lib/components/ConfirmationModal.svelte";
  import HeaderSection from "../lib/components/HeaderSection.svelte";

  let showIntroduction = true;
  let resources = [
    {
      id: "1",
      title: "",
      description: "",
      feature: null,
      references: [],
    },
  ];

  let showPublishModal = false;
  let showCancelModal = false;

  function handleResourceUpdate(event) {
    const { id, field, value } = event.detail;
    resources = resources.map((resource) =>
      resource.id === id ? { ...resource, [field]: value } : resource
    );
  }

  function handleResourceDelete(event) {
    const { id } = event.detail;
    if (resources.length > 1) {
        resources = resources.filter((resource) => resource.id !== id);
    }
  }

  function handleResourceMove(event) {
    const { direction, currentIndex } = event.detail;
    
    if (direction === "up" && currentIndex > 0) {
        const newResources = resources.map(r => ({...r})); // Create deep copy
        [newResources[currentIndex], newResources[currentIndex - 1]] = 
        [newResources[currentIndex - 1], newResources[currentIndex]];
        resources = newResources;
    } else if (direction === "down" && currentIndex < resources.length - 1) {
        const newResources = resources.map(r => ({...r})); // Create deep copy
        [newResources[currentIndex], newResources[currentIndex + 1]] = 
        [newResources[currentIndex + 1], newResources[currentIndex]];
        resources = newResources;
    }
  }

  function handleAddResource() {
    // Benzersiz bir ID oluştur - timestamp + random sayı kombinasyonu
    const newId = Date.now() + "-" + Math.floor(Math.random() * 1000);
    const newResource = {
        id: newId,
        title: "",
        description: "",
        feature: null,
        references: [],
    };
    resources = [...resources, newResource];
  }

  function handlePublishClick() {
    showPublishModal = true;
  }

  function handleCancelClick() {
    showCancelModal = true;
  }

  function handlePublishConfirm() {
    // TODO: Implement publish to Canvas logic
    showPublishModal = false;
  }

  function handleCancelConfirm() {
    // TODO: Implement return to home logic
    showCancelModal = false;
  }

  function handleModalCancel() {
    showPublishModal = false;
    showCancelModal = false;
  }

  function handleIntroductionDelete() {
    showIntroduction = false;
  }

</script>



<div class="page-container">
  <HeaderSection />
  {#if showIntroduction}
    <IntroductionSection on:delete={handleIntroductionDelete} />
  {/if}

  {#each resources as resource, index (resource.id)}
    <ResourceSection
      {resource}
      {index}
      on:update={handleResourceUpdate}
      on:delete={handleResourceDelete}
      on:move={handleResourceMove}
    />
  {/each}

  <div class="add-resource-box">
    <button class="add-resource-btn" on:click={handleAddResource}>
      <svg
        width="18"
        height="16"
        viewBox="0 0 18 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clip-path="url(#clip0_4023_134)">
          <path
            d="M7.62667 14.7344C7.95667 14.8531 8.31111 14.6062 8.31111 14.25V2.45625C8.31111 2.325 8.26222 2.19375 8.15833 2.1125C7.55944 1.625 6.18444 1 4.4 1C2.85694 1 1.41472 1.41562 0.553056 1.75312C0.207778 1.89062 0 2.24063 0 2.61875V14.1906C0 14.5625 0.391111 14.8219 0.736389 14.7062C1.69889 14.3781 3.22361 14 4.4 14C5.43583 14 6.81389 14.4375 7.62667 14.7344ZM9.97333 14.7344C10.7861 14.4375 12.1642 14 13.2 14C14.3764 14 15.9011 14.3781 16.8636 14.7062C17.2089 14.825 17.6 14.5625 17.6 14.1906V2.61875C17.6 2.24063 17.3922 1.89062 17.0469 1.75625C16.1853 1.41563 14.7431 1 13.2 1C11.4156 1 10.0406 1.625 9.44167 2.1125C9.34083 2.19375 9.28889 2.325 9.28889 2.45625V14.25C9.28889 14.6062 9.64639 14.8531 9.97333 14.7344Z"
            fill="currentColor"
          />
        </g>
        <defs>
          <clipPath id="clip0_4023_134">
            <rect width="17.6" height="16" fill="white" />
          </clipPath>
        </defs>
      </svg>
      <span>Add New Resource +</span>
    </button>
  </div>

  <div class="button-group">
    <button class="cancel-btn" on:click={handleCancelClick}>Cancel</button>
    <button class="publish-btn" on:click={handlePublishClick}>Publish</button>
  </div>
</div>

<ConfirmationModal
  show={showPublishModal}
  type="publish"
  onConfirm={handlePublishConfirm}
  onCancel={handleModalCancel}
/>

<ConfirmationModal
  show={showCancelModal}
  type="cancel"
  onConfirm={handleCancelConfirm}
  onCancel={handleModalCancel}
/>

<style>
  * {
    font-family: "Lato Extended", "Lato", "Helvetica Neue", "Helvetica", "Arial",
      "sans-serif";
    box-sizing: border-box;
    line-height: 1.6;
    font-size: 14px;
  }

  .page-container {
    max-width: 800px;
    margin: 2rem auto;
  }

  .add-resource-box {
    background: white;
    border: 1px solid #e5e5e5;
    border-radius: 1px;
    padding: 2rem;
    margin-bottom: 0;
    display: flex;
    justify-content: center;
    background: #FCFCFC;

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
    padding-top: 2rem;
  }

  .publish-btn {
    background: #71be81;
    color: white;
    padding: 0.5rem 2rem;
    border: none;
    cursor: pointer;
  }

  .cancel-btn {
    background: #f3f3f3;
    color: black;
    padding: 0.5rem 2rem;
    border: none;
    cursor: pointer;

  }
</style>
