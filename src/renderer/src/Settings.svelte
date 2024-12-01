<script lang="ts">
  import { onMount } from 'svelte'
  import ColorPicker from 'svelte-awesome-color-picker'

  let colorPreviewIcon: HTMLElement
  let usernameValue: string = 'Banana Joe'
  let colorValue: string = '#ffffff'
  let punchHoleServersValue: string = 'stun:stun.l.google.com:19302'
  let isUsernameValid = false
  let isColorValid = false
  let isPunchHoleServersValid = true
  let modalSuccessIsActive = false
  let modalFailureIsActive = false

  $: colorValue, checkColor()
  $: usernameValue, checkUsername()
  $: punchHoleServersValue, checkPunchHoleServers()

  const checkPunchHoleServers = (): void => {
    const servers = punchHoleServersValue.split('\n')
    isPunchHoleServersValid = servers.every((server) => {
      const [protocol, host, port] = server.split(':')
      if (protocol === 'stun' || protocol === 'turn') {
        if (host && port) {
          return true
        }
      }
      return false
    })
  }
  const checkIsValidHexColor = (color: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(color)
  }
  function checkColor(): void {
    if (checkIsValidHexColor(colorValue)) {
      isColorValid = true
      colorPreviewIcon?.style.setProperty('--color', colorValue)
    } else {
      isColorValid = false
    }
  }
  function checkUsername(): void {
    if (usernameValue.length > 0 && usernameValue.length < 32) {
      isUsernameValid = true
    } else {
      isUsernameValid = false
    }
  }
  async function onSubmit(evt: Event): Promise<void> {
    evt.preventDefault()
    if (isUsernameValid && isColorValid && isPunchHoleServersValid) {
      await window.BananasApi.updateSettings({
        username: usernameValue,
        color: colorValue,
        punchHoleServers: punchHoleServersValue.split('\n')
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
    punchHoleServersValue = settings.punchHoleServers.join('\n')
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
      <label class="label" for="color">STUN/TURN Servers (separated by new lines)</label>
      <div class="control has-icons-left has-icons-right">
        <textarea
          bind:value={punchHoleServersValue}
          class="textarea {isPunchHoleServersValid ? 'is-success' : 'is-danger'}"
          id="color"
          placeholder="stun:stun.l.google.com:19302"
        />
      </div>
    </div>

    <div class="field">
      <div class="control">
        <button class="button is-link">Save</button>
      </div>
    </div>
  </form>
</div>

<style>
  span.icon i.fa-palette:before {
    color: var(--color);
    text-shadow: '-1px 0 black, 0 1px black, 1px 0 black, 0 -1px black';
  }
</style>
