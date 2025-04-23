<script>
    import { XssSanitizer } from "$lib/services/sanitizers";
    import { createEventDispatcher } from "svelte";

    export let resource = {
        id: "",
        title: "",
    };

    const dispatch = createEventDispatcher();
    let titleLength = 0;

    function handleTitleChange(event) {
        const sanitizedTitle = XssSanitizer.sanitize(event.target.value);
        const truncatedTitle = sanitizedTitle.slice(0, 100);
        titleLength = truncatedTitle.length;
        resource.title = truncatedTitle;
        dispatch("update", {
            id: resource.id,
            field: "title",
            value: truncatedTitle,
        });
    }
</script>

<div class="title-input-container">
    <label for={`resource-title-${resource.id}`} class="sr-only"
        >Resource Title</label
    >
    <input
        type="text"
        id={`resource-title-${resource.id}`}
        name={`resource-title-${resource.id}`}
        value={resource.title}
        on:input={handleTitleChange}
        placeholder="Enter title"
        class="title-input"
        maxlength="100"
    />
    <span class="character-count">{titleLength}/100</span>
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
    .title-input-container {
        position: relative;
        width: 100%;
    }

    .title-input {
        width: 100%;
        padding: 8px 12px;
        padding-right: 3.5rem;
        border: 1px solid #e5e5e5;
        border-radius: 1px;
        font-size: 14px;
        box-sizing: border-box;
        height: 40px;
        line-height: 24px;
    }

    .title-input::placeholder {
        font-weight: 300;
        font-style: italic;
        line-height: 150%;
        letter-spacing: -1.1%;
        color: #949494;
    }

    .title-input:focus {
        outline: none;
        border-color: #6792ff;
    }

    .character-count {
        position: absolute;
        right: 12px;
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
</style>
