<script>
    import { createEventDispatcher } from "svelte";

    export let index = 0;
    const dispatch = createEventDispatcher();

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

    // SVG Icons for move up and down
    const icons = {
        arrowUp: `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.8262 7L2.8262 2.04615L0.791336 3.98462L-7.68024e-08 3.23077L3.39144 0L6.78288 3.23077L5.99154 3.98462L3.95668 2.04615L3.95668 7L2.8262 7Z" fill="currentColor"/>
              </svg>`,
        arrowDown: `<svg width="7" height="7" viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.95676 -2.15755e-07L3.95676 4.95385L5.99162 3.01538L6.78296 3.76923L3.39152 7L8.09089e-05 3.76923L0.791417 3.01538L2.82628 4.95385L2.82628 -3.02057e-07L3.95676 -2.15755e-07Z" fill="currentColor"/>
              </svg>`,
    };
</script>

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

<style>
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
</style>
