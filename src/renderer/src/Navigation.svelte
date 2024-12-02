<script lang="ts">
  import { useActiveView, useNavigationEnabled, useIsWatching, useIsHosting } from './stores'
  const activeView = useActiveView()
  const isHosting = useIsHosting()
  const isWatching = useIsWatching()
  const navigationEnabled = useNavigationEnabled()
  const externalLinkClickHandler = (root: HTMLButtonElement, url: string): void => {
    root.classList.add('is-loading')
    setTimeout(() => {
      root.classList.remove('is-loading')
    }, 3000)
    window.open(url)
  }

  const handleTopButtonsClick = (evt: MouseEvent): void => {
    evt.preventDefault()
    const target = evt.target as HTMLButtonElement
    const root = target.closest('button')
    switch (root.dataset.action) {
      case 'join':
        $activeView = 'join'
        break
      case 'host':
        $activeView = 'host'
        break
      case 'settings':
        $activeView = 'settings'
        break
      case 'report-a-bug':
        externalLinkClickHandler(root, 'https://github.com/mistweaverco/bananas/issues/new')
        break
      case 'see-the-code':
        externalLinkClickHandler(root, 'https://github.com/mistweaverco/bananas')
        break
      default:
        break
    }
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
              class="button is-secondary"
              data-action="report-a-bug"
              on:click={handleTopButtonsClick}
            >
              <span class="icon">
                <i class="fa-solid fa-bug"></i>
              </span>
              <strong>Report a bug</strong>
            </button>
            <button
              class="button is-secondary"
              data-action="see-the-code"
              on:click={handleTopButtonsClick}
            >
              <span class="icon">
                <i class="fa-solid fa-code"></i>
              </span>
              <strong>See the code</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</div>
