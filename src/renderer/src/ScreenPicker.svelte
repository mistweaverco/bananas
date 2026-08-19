<script lang="ts">
  import { onDestroy } from 'svelte'
  import type { ScreenShareSource } from './BananasTypes'
  import { L } from './translations'

  let visible = false
  let sources: ScreenShareSource[] = []
  let selectedId: string | null = null
  let resolvePick: ((sourceId: string | null) => void) | null = null

  $: screens = sources.filter((source) => source.isScreen)
  $: windows = sources.filter((source) => !source.isScreen)

  const finish = (sourceId: string | null): void => {
    visible = false
    sources = []
    selectedId = null
    const resolve = resolvePick
    resolvePick = null
    resolve?.(sourceId)
  }

  const onKeyDown = (evt: KeyboardEvent): void => {
    if (!visible) return
    if (evt.key === 'Escape') {
      evt.preventDefault()
      finish(null)
    }
    if (evt.key === 'Enter' && selectedId) {
      evt.preventDefault()
      finish(selectedId)
    }
  }

  export const pick = (nextSources: ScreenShareSource[]): Promise<string | null> => {
    if (resolvePick) finish(null)
    sources = nextSources
    selectedId = nextSources.find((source) => source.isScreen)?.id ?? nextSources[0]?.id ?? null
    visible = true
    return new Promise((resolve) => {
      resolvePick = resolve
    })
  }

  const selectSource = (sourceId: string): void => {
    selectedId = sourceId
  }

  const shareSource = (sourceId: string): void => {
    finish(sourceId)
  }

  window.addEventListener('keydown', onKeyDown)
  onDestroy(() => {
    window.removeEventListener('keydown', onKeyDown)
    if (resolvePick) finish(null)
  })
</script>

<div class="modal {visible ? 'is-active' : ''}">
  <div
    class="modal-background"
    role="button"
    tabindex="-1"
    on:click={() => finish(null)}
    on:keydown={onKeyDown}
  ></div>
  <div class="modal-card screen-picker-card">
    <header class="modal-card-head">
      <p class="modal-card-title">{L.share_your_screen()}</p>
      <button class="delete" aria-label={L.cancel()} on:click={() => finish(null)}></button>
    </header>
    <section class="modal-card-body">
      {#if sources.length === 0}
        <p>{L.no_screens_found()}</p>
      {:else}
        {#if screens.length}
          <h2 class="title is-6 mb-3">{L.screens()}</h2>
          <div class="screen-picker-grid mb-5">
            {#each screens as source (source.id)}
              <button
                type="button"
                class="screen-picker-item {selectedId === source.id ? 'is-selected' : ''}"
                on:click={() => selectSource(source.id)}
                on:dblclick={() => shareSource(source.id)}
              >
                <span class="screen-picker-thumb">
                  {#if source.thumbnail}
                    <img src={source.thumbnail} alt={source.name} />
                  {:else}
                    <i class="fa-solid fa-display"></i>
                  {/if}
                </span>
                <span class="screen-picker-name">{source.name}</span>
              </button>
            {/each}
          </div>
        {/if}
        {#if windows.length}
          <h2 class="title is-6 mb-3">{L.windows()}</h2>
          <div class="screen-picker-grid">
            {#each windows as source (source.id)}
              <button
                type="button"
                class="screen-picker-item {selectedId === source.id ? 'is-selected' : ''}"
                on:click={() => selectSource(source.id)}
                on:dblclick={() => shareSource(source.id)}
              >
                <span class="screen-picker-thumb">
                  {#if source.thumbnail}
                    <img src={source.thumbnail} alt={source.name} />
                  {:else}
                    <i class="fa-solid fa-window-maximize"></i>
                  {/if}
                  {#if source.appIcon}
                    <img class="screen-picker-app-icon" src={source.appIcon} alt="" />
                  {/if}
                </span>
                <span class="screen-picker-name">{source.name}</span>
              </button>
            {/each}
          </div>
        {/if}
      {/if}
    </section>
    <footer class="modal-card-foot">
      <button class="button is-link" disabled={!selectedId} on:click={() => finish(selectedId)}>
        {L.share()}
      </button>
      <button class="button" on:click={() => finish(null)}>{L.cancel()}</button>
    </footer>
  </div>
</div>

<style>
  .screen-picker-card {
    width: min(720px, calc(100vw - 2rem));
  }

  .screen-picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  .screen-picker-item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.5rem;
    border: 2px solid var(--bulma-border, #dbdbdb);
    border-radius: 8px;
    background: var(--bulma-scheme-main, #fff);
    cursor: pointer;
    text-align: left;
    color: inherit;
  }

  .screen-picker-item.is-selected {
    border-color: var(--bulma-link, #485fc7);
    box-shadow: 0 0 0 1px var(--bulma-link, #485fc7);
  }

  .screen-picker-thumb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 4px;
    background: var(--bulma-scheme-main-bis, #f5f5f5);
    color: var(--bulma-text-weak, #7a7a7a);
    font-size: 1.5rem;
  }

  .screen-picker-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .screen-picker-app-icon {
    position: absolute;
    left: 0.35rem;
    bottom: 0.35rem;
    width: 20px !important;
    height: 20px !important;
    object-fit: contain !important;
  }

  .screen-picker-name {
    font-size: 0.8rem;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
