<script lang="ts">
  import { onMount } from 'svelte'
  import ColorPicker from 'svelte-awesome-color-picker'
  import { checkIsUsernameValid, checkIsValidHexColor, externalLinkClickHandler } from './Utils'

  let colorPreviewIcon: HTMLElement
  let usernameValue: string = 'Banana Joe'
  let colorValue: string = '#ffffff'
  let iceServersValue: string = '{ "urls": "stun:stun.l.google.com:19302" }'
  let isUsernameValid = false
  let isColorValid = false
  let isIceServersValid = true
  let modalSuccessIsActive = false
  let modalFailureIsActive = false

  $: colorValue, checkColor()
  $: usernameValue, checkUsername()
  $: iceServersValue, checkIceServers()

  const GITHUB_REPO_URL = 'https://github.com/mistweaverco/bananas'

  function reportABug(e: MouseEvent & { currentTarget: HTMLButtonElement }): void {
    externalLinkClickHandler(e.currentTarget, `${GITHUB_REPO_URL}/issues/new`)
  }

  function seeTheCode(e: MouseEvent & { currentTarget: HTMLButtonElement }): void {
    externalLinkClickHandler(e.currentTarget, GITHUB_REPO_URL)
  }

  const checkIceServers = (): void => {
    const serversObjects = iceServersValue.split('\n')
    isIceServersValid = serversObjects.every((serverObject) => {
      try {
        const srv = JSON.parse(serverObject)
        return srv.urls && srv.urls.length > 0
      } catch (e) {
        return false
      }
    })
  }

  function checkColor(): void {
    isColorValid = checkIsValidHexColor(colorValue)

    if (isColorValid) colorPreviewIcon?.style.setProperty('--color', colorValue)
  }

  function checkUsername(): void {
    isUsernameValid = checkIsUsernameValid(usernameValue)
  }

  async function onSubmit(evt: Event): Promise<void> {
    evt.preventDefault()
    if (isUsernameValid && isColorValid && isIceServersValid) {
      await window.BananasApi.updateSettings({
        username: usernameValue,
        color: colorValue,
        iceServers: iceServersValue.split('\n').map((srv) => JSON.parse(srv))
      })
      modalSuccessIsActive = true
      setTimeout(() => {
        modalSuccessIsActive = false
      }, 2000)
    } else {
      modalFailureIsActive = true
      setTimeout(() => {
        modalFailureIsActive = false
      }, 2000)
    }
  }
  onMount(async () => {
    const settings = await window.BananasApi.getSettings()
    usernameValue = settings.username
    colorValue = settings.color
    iceServersValue = settings.iceServers.map((srv) => JSON.stringify(srv)).join('\n')
  })
</script>

<div class="modal {modalSuccessIsActive ? 'is-active' : ''}">
  <div class="modal-background"></div>
  <div class="modal-content">
    <div class="box">
      <h1 class="title has-text-success">Success</h1>
      <p>Settings successfully saved.</p>
    </div>
  </div>
</div>

<div class="modal {modalFailureIsActive ? 'is-active' : ''}">
  <div class="modal-background"></div>
  <div class="modal-content">
    <div class="box">
      <h1 class="title has-text-danger">Failure</h1>
      <p>Settings could not be saved.</p>
    </div>
  </div>
</div>

<div class="container p-5 content">
  <h1 class="title">Settings</h1>
  <h2>Basic</h2>
  <form class="form" on:submit={onSubmit}>
    <div class="field">
      <label class="label" for="username">Username</label>
      <div class="control has-icons-left has-icons-right">
        <input
          bind:value={usernameValue}
          class="input {isUsernameValid ? 'is-success' : 'is-danger'}"
          type="text"
          id="username"
          placeholder="Banana Joe"
        />
        <span class="icon is-small is-left">
          <i class="fas fa-user"></i>
        </span>
      </div>
    </div>

    <div class="field">
      <label class="label" for="color">Color</label>
      <div class="control has-icons-left has-icons-right">
        <input
          bind:value={colorValue}
          class="input {isColorValid ? 'is-success' : 'is-danger'}"
          type="text"
          id="color"
          placeholder="#fffff"
        />
        <span class="icon is-small is-left">
          <i bind:this={colorPreviewIcon} class="fas fa-palette"></i>
        </span>
        <ColorPicker bind:hex={colorValue} isTextInput={false} isAlpha={false} />
      </div>
    </div>

    <h2>Advanced</h2>

    <div class="field">
      <label class="label" for="color">STUN/TURN Server Objects (separated by new lines)</label>
      <div class="control has-icons-left has-icons-right">
        <textarea
          bind:value={iceServersValue}
          class="textarea {isIceServersValid ? 'is-success' : 'is-danger'}"
          id="color"
          placeholder="&lbrace; &quot;urls&quot;: &quot;stun:stun.l.google.com:19302&quot; &rbrace;"
        />
      </div>
    </div>

    <div class="field">
      <div class="control">
        <button class="button is-link">Save</button>
      </div>
    </div>
  </form>

  <hr />

  <button class="button is-secondary" data-action="report-a-bug" on:click={reportABug}>
    <span class="icon">
      <i class="fa-solid fa-bug"></i>
    </span>
    <strong>Report a bug</strong>
  </button>
  <button class="button is-secondary" data-action="see-the-code" on:click={seeTheCode}>
    <span class="icon">
      <i class="fa-solid fa-code"></i>
    </span>
    <strong>See the code</strong>
  </button>
</div>

<style>
  span.icon i.fa-palette:before {
    color: var(--color);
    text-shadow: '-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black';
  }
</style>
