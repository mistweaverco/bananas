<script lang="ts">
  import { useActiveView, useNavigationEnabled, useIsWatching, useIsHosting } from './stores'
  const activeView = useActiveView()
  const isHosting = useIsHosting()
  const isWatching = useIsWatching()
  const navigationEnabled = useNavigationEnabled()

  const handleTopButtonsClick = (evt: MouseEvent): void => {
    evt.preventDefault()
    const target = evt.target as HTMLButtonElement
    const root = target.closest('button')

    $activeView = root.dataset.action
  }
</script>

<div class="container">
  <nav class="navbar" aria-label="main navigation">
    <div class="navbar-brand p-2">
      <div class="navbar-start">
        <div class="navbar-item">
          <div class="buttons">
            <button
              class="button {$activeView === 'join' ? 'is-active is-primary' : 'is-secondary'}"
              data-action="join"
              on:click={handleTopButtonsClick}
              disabled={!$navigationEnabled}
            >
              <span class="icon">
                <i class="fa-solid fa-right-to-bracket"></i>
              </span>
              <strong>Join{!$isWatching ? '' : 'ed'} a session</strong>
            </button>
            <button
              class="button is-secondary {$activeView === 'host'
                ? 'is-active is-primary'
                : 'is-secondary'}"
              data-action="host"
              on:click={handleTopButtonsClick}
              disabled={!$navigationEnabled}
            >
              <span class="icon">
                <i class="fa-solid fa-earth-africa"></i>
              </span>
              <strong>{!$isHosting ? 'Host a session' : 'Hosting a session'}</strong>
            </button>
            <button
              class="button is-secondary {$activeView === 'settings'
                ? 'is-active is-primary'
                : 'is-secondary'}"
              data-action="settings"
              on:click={handleTopButtonsClick}
              disabled={!$navigationEnabled}
            >
              <span class="icon">
                <i class="fa-solid fa-gear"></i>
              </span>
              <strong>Settings</strong>
            </button>
            <button
              class="button is-secondary {$activeView === 'about'
                ? 'is-active is-primary'
                : 'is-secondary'}"
              data-action="about"
              on:click={handleTopButtonsClick}
              disabled={!$navigationEnabled}
            >
              <span class="icon">
                <i class="fa-solid fa-question"></i>
              </span>
              <strong>About</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</div>
