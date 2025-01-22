<script lang="ts">
  import { onMount } from 'svelte'
  import ColorPicker from 'svelte-awesome-color-picker'
  import { L } from './translations'

  let colorPreviewIcon: HTMLElement
  let usernameValue: string = 'Banana Joe'
  let colorValue: string = '#ffffff'
  let language = 'en'
  const languageOptions = ['en', 'de', 'fr', 'zh']
  let iceServersValue: string = '{ "urls": "stun:stun.l.google.com:19302" }'
  let isUsernameValid = false
  let isColorValid = false
  let isIceServersValid = true
  let modalSuccessIsActive = false
  let modalFailureIsActive = false
  let isMicrophoneEnabledOnConnect = true

  $: colorValue, checkColor()
  $: usernameValue, checkUsername()
  $: iceServersValue, checkIceServers()
  $: isMicrophoneEnabledOnConnect

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
    if (isUsernameValid && isColorValid && isIceServersValid) {
      await window.BananasApi.updateSettings({
        username: usernameValue,
        color: colorValue,
        language,
        isMicrophoneEnabledOnConnect,
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
    language = settings.language
    isMicrophoneEnabledOnConnect = settings.isMicrophoneEnabledOnConnect
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
  <h1 class="title">{L.settings()}</h1>
  <h2>{L.basic()}</h2>
  <form class="form" on:submit={onSubmit}>
    <div class="field">
      <label class="label" for="username">{L.username()}</label>
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
      <label class="label" for="color">{L.color()}</label>
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
    <div class="field">
      <label class="label" for="translation">{L.language()}</label>
      <div class="control has-icons-left has-icons-right">
        <div class="select">
          <select bind:value={language}>
            {#each languageOptions as lang}
              <option>{lang}</option>
            {/each}
          </select>
        </div>
        <span class="icon is-small is-left">
          <i class="fa fa-language"></i>
        </span>
      </div>
      <p class="help">{L.language_description()}</p>
    </div>

    <h2>Media</h2>

    <div class="field">
      <div class="control">
        <label class="checkbox" for="microphone_active_on_connect">
          <input
            bind:checked={isMicrophoneEnabledOnConnect}
            class="checkbox"
            type="checkbox"
            id="microphone_active_on_connect"
            placeholder="#fffff"
          />
          {L.is_microphone_active_on_connect()}
        </label>
      </div>
    </div>

    <h2>{L.advanced()}</h2>

    <div class="field">
      <label class="label" for="ice_servers">{L.stun_turn_server_objects()}</label>
      <div class="control has-icons-left has-icons-right">
        <textarea
          bind:value={iceServersValue}
          class="textarea {isIceServersValid ? 'is-success' : 'is-danger'}"
          id="ice_servers"
          placeholder="&lbrace; &quot;urls&quot;: &quot;stun:stun.l.google.com:19302&quot; &rbrace;"
        ></textarea>
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
