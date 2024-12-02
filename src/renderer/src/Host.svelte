<script lang="ts">
  import { onMount } from 'svelte'
  import { hostUrl, isHosting, navigationEnabled } from './stores.svelte'
  import { mayBeConnectionString, getDataFromBananasUrl, ConnectionType } from './Utils'
  import WebRTC from './WebRTC.svelte'

  let webRTCComponent: WebRTC
  let connectButton: HTMLButtonElement
  let copyButton: HTMLButtonElement

  let cursorsActive = $state(false)
  let displayStreamActive = $state(false)
  let microphoneActive = $state(true)
  let isStreaming = $state(false)
  let sessionStarted = $state(false)
  let connectionStringIsValid: boolean | null = $state(null)
  let connectToUserName = $state('')
  let copyButtonIsLoading = $state(false)
  let connectionString = $derived(hostUrl.value)

  const onConnectionStringChange = async (): Promise<void> => {
    if (connectionString === '') {
      connectionStringIsValid = null
      return
    }

    connectionStringIsValid = mayBeConnectionString(ConnectionType.PARTICIPANT, connectionString)

    if (connectionStringIsValid) {
      const banansData = await getDataFromBananasUrl(connectionString)
      connectToUserName = banansData.data.username
    }
  }

  $effect(() => {
    onConnectionStringChange()
  })

  const toggleRemoteCursors = (): void => {
    cursorsActive = !cursorsActive
    window.BananasApi.toggleRemoteCursors(cursorsActive)
    webRTCComponent.ToggleRemoteCursors(cursorsActive)
  }

  onMount(async () => {
    const settings = await window.BananasApi.getSettings()
    connectButton.addEventListener('click', async () => {
      const data = await getDataFromBananasUrl(connectionString)
      await webRTCComponent.Connect(data.rtcSessionDescription)
      isStreaming = true
      displayStreamActive = true
    })

    copyButton.addEventListener('click', async () => {
      copyButtonIsLoading = true
      const offer = await webRTCComponent.CreateHostUrl({
        username: settings.username
      })
      navigator.clipboard.writeText(offer)
      setTimeout(() => {
        copyButtonIsLoading = false
      }, 400)
    })
  })
  const onStartSessionButtonClick = async (): Promise<void> => {
    await webRTCComponent.Setup()
    sessionStarted = true
    navigationEnabled.value = false
    isHosting.value = true
  }
  const reset = (): void => {
    hostUrl.value = ''
    cursorsActive = false
    displayStreamActive = false
    microphoneActive = true
    isStreaming = false
    sessionStarted = false
    connectionStringIsValid = null
    copyButtonIsLoading = false
    navigationEnabled.value = true
    isHosting.value = false
  }
  const onDisconnectClick = async (): Promise<void> => {
    await webRTCComponent.Disconnect()
    reset()
  }
  const onMicrophoneToggle = async (): Promise<void> => {
    microphoneActive = !microphoneActive
    webRTCComponent.ToggleMicrophone()
  }
  const onDisplayStreamToggle = async (): Promise<void> => {
    displayStreamActive = !displayStreamActive
    webRTCComponent.ToggleDisplayStream()
    if (!displayStreamActive) {
      cursorsActive = false
      window.BananasApi.toggleRemoteCursors(cursorsActive)
      webRTCComponent.ToggleRemoteCursors(cursorsActive)
    }
  }
</script>

<WebRTC bind:this={webRTCComponent} />

<div class="container p-5">
  <h1 class="title">{!isStreaming ? 'Host' : 'Hosting'} a session</h1>
  <div class={!isStreaming ? 'is-hidden' : ''}>
    <div class="fixed-grid">
      <div class="grid">
        <div class="cell">
          <button
            title={displayStreamActive ? 'Streaming your display' : 'Not streaming your display'}
            class="button {displayStreamActive ? 'is-success' : 'is-danger'}"
            onclick={onDisplayStreamToggle}
          >
            <span class="icon">
              <i class="fa-solid fa-display"></i>
            </span>
          </button>
          <button
            title={microphoneActive ? 'Microphone active' : 'Microphone muted'}
            class="button {microphoneActive ? 'is-success' : 'is-danger'}"
            onclick={onMicrophoneToggle}
          >
            <span class="icon">
              <i class="fas {microphoneActive ? 'fa-microphone' : 'fa-microphone-slash'}"></i>
            </span>
          </button>
          <button
            title={cursorsActive ? 'Remote cursors enabled' : 'Remote cursors disabled'}
            class="button {cursorsActive ? 'is-success' : 'is-danger'} {!displayStreamActive
              ? 'is-hidden'
              : ''}"
            onclick={toggleRemoteCursors}
          >
            <span class="icon">
              <i class="fas fa-mouse-pointer"></i>
            </span>
          </button>
        </div>
        <div class="cell has-text-right">
          <button class="button is-danger" onclick={onDisconnectClick}>
            <span class="icon">
              <i class="fas fa-unlink"></i>
            </span>
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    </div>
  </div>
  <div class="fixed-grid has-2-cols">
    <div class="grid">
      <div class="cell">
        <button
          class="button is-link {isStreaming ? 'is-hidden' : ''}"
          disabled={sessionStarted}
          onclick={onStartSessionButtonClick}
        >
          <span class="icon">
            <i class="fas fa-play"></i>
          </span>
          <span>{!sessionStarted ? 'Start a new session' : 'Session started'}</span>
        </button>
      </div>

      <div class="cell">
        <button
          class="button is-danger {!sessionStarted || isStreaming ? 'is-hidden' : ''}"
          onclick={onDisconnectClick}
        >
          <span class="icon">
            <i class="fas fa-unlink"></i>
          </span>
          <span>Cancel</span>
        </button>
      </div>

      <div class="cell">
        <button
          class="button is-link {!sessionStarted || isStreaming
            ? 'is-hidden'
            : ''} {copyButtonIsLoading ? 'is-loading' : ''}"
          bind:this={copyButton}
        >
          <span class="icon">
            <i class="fas fa-copy"></i>
          </span>
          <span>Copy my connection string</span>
        </button>
      </div>
    </div>

    <div class="field has-addons {!sessionStarted || isStreaming ? 'is-hidden' : ''}">
      <div class="control has-icons-left has-icons-right">
        <input
          bind:value={hostUrl.value}
          placeholder="participant connection string"
          class="input {connectionStringIsValid === null
            ? ''
            : connectionStringIsValid
              ? 'is-success'
              : 'is-danger'}"
          type="text"
        />
        <span class="icon is-small is-left">
          <i class="fas fa-user"></i>
        </span>
        <span class="icon is-small is-right">
          <i
            class="fas fa-question {connectionStringIsValid === null
              ? 'fa-question'
              : connectionStringIsValid
                ? 'fa-check'
                : 'fa-times'}"
          ></i>
        </span>
      </div>
      <div class="control">
        <button
          class="button {connectionStringIsValid === null
            ? 'is-link'
            : connectionStringIsValid
              ? 'is-success'
              : 'is-danger'}"
          bind:this={connectButton}
          disabled={connectionStringIsValid ? false : true}
        >
          <span class="icon">
            <i class="fas fa-link"></i>
          </span>
          <span>Connect {connectionStringIsValid ? connectToUserName : ''} </span>
        </button>
      </div>
    </div>
  </div>
</div>
