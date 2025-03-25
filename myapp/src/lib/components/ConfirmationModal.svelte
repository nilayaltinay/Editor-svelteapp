<script>
    import { fade } from "svelte/transition";
    import { createEventDispatcher } from "svelte";
  
    // Props
    export let show = false;
    export let title = "";
    export let message = "";
    export let confirmText = "Confirm";
    export let cancelText = "Cancel";
    export let type = "default"; // default, delete, save, warning
    export let item = ""; // Onay için gösterilecek öğe adı/başlığı
  
    const dispatch = createEventDispatcher();
  
    function confirm() {
      dispatch("confirm");
      show = false;
    }
  
    function cancel() {
      dispatch("cancel");
      show = false;
    }
  </script>
  
  {#if show}
  <div class="confirm-backdrop" transition:fade={{ duration: 150 }}>
    <div class="confirm-modal" transition:fade={{ duration: 200 }}>
      <div class="confirm-title">{title}</div>
      <div class="confirm-content">
        {#if message}
          <p>{message}</p>
        {/if}
        
        {#if item}
          <p class="confirm-item">{item}</p>
        {/if}
        
        <slot></slot>
      </div>
      <div class="confirm-actions">
        <button class="cancel-btn" on:click={cancel}>
          {cancelText}
        </button>
        <button class="confirm-btn" class:delete-btn={type === 'delete'} 
                class:save-btn={type === 'save'} 
                class:warning-btn={type === 'warning'} 
                on:click={confirm}>
          {confirmText}
        </button>
      </div>
    </div>
  </div>
  {/if}
  
  <style>
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
      padding: 2rem 3rem;
    }
  
    .confirm-title {
      font-size: 16px;
      font-weight: 500;
      text-align: center;
    }
  
    .confirm-content {
      padding: 20px 0;
      text-align: center;
    }
  
    .confirm-item {
      margin: 0;
      font-style: italic;
      color: #555;
    }
  
    .confirm-actions {
      display: flex;
      gap: 1rem;
    }
  
    .cancel-btn, .confirm-btn {
      flex: 1;
      padding: 8px 16px;
      border: none;
      font-size: 14px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
  
    .cancel-btn {
      background-color: white;
      color: #333;
      border: 1px solid rgba(0, 0, 0, 0.2);
    }
  
    .confirm-btn {
      background-color: #6792ff;
      color: white;
    }
  
    .delete-btn {
      background-color: #ff5656;
    }
  
    .save-btn {
      background-color: #46ad5e;
    }
  
    .warning-btn {
      background-color: #ffbb33;
    }
  
    .cancel-btn:hover {
      background-color: #f8f8f8;
    }
  
    .confirm-btn:hover {
      opacity: 0.9;
    }
  </style>