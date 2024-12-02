<script lang="ts">
  import { activeView, isHosting, isWatching, navigationEnabled } from './stores.svelte'

  const handleTopButtonsClick = (evt: MouseEvent): void => {
    evt.preventDefault()

    const target = evt.target as HTMLButtonElement
    const root = target.closest('button')

    activeView.value = root.dataset.action
  }
</script>

<div class="container">
  <nav class="navbar" aria-label="main navigation">
    <div class="navbar-brand p-2">
      <div class="navbar-start">
        <div class="navbar-item">
          <div class="buttons">
            <button
              class="button {activeView.value === 'join' ? 'is-active is-primary' : 'is-secondary'}"
              data-action="join"
              onclick={handleTopButtonsClick}
              disabled={!navigationEnabled}
            >
              <span class="icon">
                <i class="fa-solid fa-right-to-bracket"></i>
              </span>
              <strong>Join{!isWatching ? '' : 'ed'} a session</strong>
            </button>
            <button
              class="button is-secondary {activeView.value === 'host'
                ? 'is-active is-primary'
                : 'is-secondary'}"
              data-action="host"
              onclick={handleTopButtonsClick}
              disabled={!navigationEnabled}
            >
              <span class="icon">
                <i class="fa-solid fa-earth-africa"></i>
              </span>
              <strong>{!isHosting ? 'Host a session' : 'Hosting a session'}</strong>
            </button>
            <button
              class="button is-secondary {activeView.value === 'settings'
                ? 'is-active is-primary'
                : 'is-secondary'}"
              data-action="settings"
              onclick={handleTopButtonsClick}
              disabled={!navigationEnabled}
            >
              <span class="icon">
                <i class="fa-solid fa-gear"></i>
              </span>
              <strong>Settings</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</div>
