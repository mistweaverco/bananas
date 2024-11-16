<script lang="ts">
  const handleTopButtonsClick = (evt: MouseEvent) => {
    evt.preventDefault();
    const target = evt.target as HTMLButtonElement;
    const root = target.closest('button');
    switch (root.dataset.action) {
      case 'reportABug':
        root.classList.add('is-loading');
        setTimeout(() => {
          root.classList.remove('is-loading');
        }, 3000);
        window.open('https://github.com/mistweaverco/bananas/issues/new');
        break;
      case 'seeTheCode':
        root.classList.add('is-loading');
        setTimeout(() => {
          root.classList.remove('is-loading');
        }, 3000);
        window.open('https://github.com/mistweaverco/bananas');
        break;
      default:
        break;
    }
  }
</script>

<nav class="navbar" aria-label="main navigation">
  <div class="navbar-menu p-2">
    <div class="navbar-start">
      <div class="navbar-item">
        <div class="buttons"></div>
      </div>
    </div>

    <div class="navbar-end">
      <div class="navbar-item">
        <div class="buttons">
          <button class="button is-secondary" data-action="reportABug" onClick={handleTopButtonsClick}>
            <span class="icon">
              <i class="fa-solid fa-bug"></i>
            </span>
            <strong>Report a bug</strong>
          </button>
          <button class="button is-primary" data-action="seeTheCode" onClick={handleTopButtonsClick}>
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
<nav class="panel">
  <p class="panel-heading">Dashboard</p>
  <p class="panel-tabs">
    <a data-action="Overview">
      <span class="icon">
        <i class="fa-solid fa-chart-bar"></i>
      </span>
      Start new session
    </a>
  </p>
</nav>
