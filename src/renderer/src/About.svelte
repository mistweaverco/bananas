<script lang="ts">
  import { externalLinkClickHandler } from './Utils'
  import shoulders from './About.shoulders-of-giants.json'

  // randomize the order of the shoulders
  const randomizedShoulders = shoulders.sort(() => Math.random() - 0.5)

  let version: string
  ;(async function (): Promise<void> {
    version = await window.BananasApi.getAppVersion()
  })()

  const GITHUB_REPO_URL = 'https://github.com/mistweaverco/bananas'

  function openExternalURL(e: MouseEvent & { currentTarget: HTMLButtonElement }): void {
    const url = e.currentTarget.dataset.url
    if (!url) return

    externalLinkClickHandler(e.currentTarget, url)
  }
</script>

<div class="container p-5 content">
  <h1 class="title">About</h1>
  <p>You are using <code>{version}</code> of Bananas Screen Sharing</p>
  <hr />

  <button class="button is-secondary" data-url="https://getbananas.net" on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-globe"></i>
    </span>
    <strong>Website</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/issues/new"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-bug"></i>
    </span>
    <strong>Report a bug</strong>
  </button>
  <button class="button is-secondary" data-url={GITHUB_REPO_URL} on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-code"></i>
    </span>
    <strong>See the code</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/PRIVACY.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-lock"></i>
    </span>
    <strong>Privacy Policy</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/TOS.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-book"></i>
    </span>
    <strong>Terms of service</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/CODE_OF_CONDUCT.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-heart"></i>
    </span>
    <strong>Code of conduct</strong>
  </button>
  <hr />
  <h2 class="title is-4">Shoulders of Giants</h2>
  <p>
    Bananas Screen Sharing is built on top of the following open-source projects (in no particular
    order):
  </p>
  <ul>
    {#each randomizedShoulders as shoulder}
      <li>
        <p>
          <a href={shoulder.repository} target="_blank" rel="noopener">
            <strong>{shoulder.title}</strong> - {shoulder.license} license
          </a>
        </p>
        <p>{shoulder.description}</p>
        <p>{shoulder.usage}</p>
        <hr />
      </li>
    {/each}
  </ul>
</div>
