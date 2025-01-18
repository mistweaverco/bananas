<script lang="ts">
  import { L } from './translations'
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
  <h1 class="title">{L.about()}</h1>
  <p>You are using <code>{version}</code> of Bananas Screen Sharing</p>
  <hr />

  <button class="button is-secondary" data-url="https://getbananas.net" on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-globe"></i>
    </span>
    <strong>{L.website()}</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/issues/new"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-bug"></i>
    </span>
    <strong>{L.report_a_bug()}</strong>
  </button>
  <button class="button is-secondary" data-url={GITHUB_REPO_URL} on:click={openExternalURL}>
    <span class="icon">
      <i class="fa-solid fa-code"></i>
    </span>
    <strong>{L.see_the_code()}</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/blob/main/PRIVACY.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-lock"></i>
    </span>
    <strong>{L.privacty_policy()}</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/blob/main/TOS.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-book"></i>
    </span>
    <strong>{L.terms_of_service()}</strong>
  </button>
  <button
    class="button is-secondary"
    data-url="{GITHUB_REPO_URL}/blob/main/CODE_OF_CONDUCT.md"
    on:click={openExternalURL}
  >
    <span class="icon">
      <i class="fa-solid fa-heart"></i>
    </span>
    <strong>{L.code_of_conduct()}</strong>
  </button>
  <hr />
  <h2 class="title is-4">{L.shoulders_of_giants()}</h2>
  <p>
    {L.shoulders_of_giants_description()}
  </p>
  <ul>
    {#each randomizedShoulders as shoulder}
      <li>
        <p>
          <a href={shoulder.url} target="_blank" rel="noopener">
            <strong>{shoulder.title}</strong>
            {shoulder.license ? '- ' + shoulder.license : ''}
          </a>
        </p>
        <p>{shoulder.description}</p>
        <p>{shoulder.usage}</p>
        <hr />
      </li>
    {/each}
  </ul>
</div>
