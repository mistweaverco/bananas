<script lang="ts">
  import { onMount } from 'svelte'
  import Swal from 'sweetalert2'
  import { BananasConnectionState } from './BananasTypes'
  import { useNavigationEnabled, useIsHosting, useHostUrl } from './stores'
  import { mayBeConnectionString, getDataFromBananasUrl, ConnectionType } from './Utils'
  import WebRTC from './WebRTC.svelte'
  import StreamInterface from './StreamInterface.svelte'

  const navigationEnabled = useNavigationEnabled()
  const isHosting = useIsHosting()

  let webRTCComponent: WebRTC
  let connectButton: HTMLButtonElement
  let copyButton: HTMLButtonElement

  let connectionState = BananasConnectionState.DISCONNECTED
  let isConnected = connectionState === BananasConnectionState.CONNECTED
  let isStreaming = false
  let sessionStarted = false
  let connectionStringIsValid: boolean | null = null
  let connectToUserName = ''
  let copyButtonIsLoading = false
  let connectionString = useHostUrl()

  const onConnectionStringChange = async (): Promise<void> => {
    if ($connectionString === '') {
      connectionStringIsValid = null
      return
    }
    connectionStringIsValid = mayBeConnectionString(ConnectionType.PARTICIPANT, $connectionString)
    if (connectionStringIsValid) {
      const banansData = await getDataFromBananasUrl($connectionString)
      connectToUserName = banansData.data.username
    }
  }

  const onConnectionStateChange = (): void => {
    switch (connectionState) {
      case BananasConnectionState.CONNECTED:
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Connection established',
          showConfirmButton: false,
          timer: 1500
        })
        break
      case BananasConnectionState.FAILED:
        Swal.fire({
          position: 'top-end',
          icon: 'error',
          title: 'Connection failed',
          showConfirmButton: false,
          timer: 1500
        })
        break
      case BananasConnectionState.CLOSED:
        Swal.fire({
          position: 'top-end',
          icon: 'info',
          title: 'Connection closed',
          showConfirmButton: false,
          timer: 1500
        })
        break
      default:
        break
    }
  }

  $: $connectionString, onConnectionStringChange()
  $: connectionState, onConnectionStateChange()

  onMount(async () => {
    const settings = await window.BananasApi.getSettings()
    connectButton.addEventListener('click', async () => {
      const data = await getDataFromBananasUrl($connectionString)
      await webRTCComponent.Connect(data.rtcSessionDescription)
      isStreaming = true
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
    $navigationEnabled = false
    $isHosting = true
  }
  const reset = (): void => {
    $connectionString = ''
    isStreaming = false
    sessionStarted = false
    connectionStringIsValid = null
    copyButtonIsLoading = false
    $navigationEnabled = true
    $isHosting = false
  }
  const onDisconnectClick = async (): Promise<void> => {
    await webRTCComponent.Disconnect()
    reset()
  }
</script>

<WebRTC bind:connectionState bind:this={webRTCComponent} bind:isStreaming />

<div class="container p-5">
  <h1 class="title">{!isConnected ? 'Host' : 'Hosting'} a session</h1>
  <div class="fixed-grid has-2-cols">
    <div class="grid">
      <div class="cell">
        <button
          class="button is-link {isConnected ? 'is-hidden' : ''}"
          disabled={sessionStarted}
          on:click={onStartSessionButtonClick}
        >
          <span class="icon">
            <i class="fas fa-play"></i>
          </span>
          <span>{!sessionStarted ? 'Start a new session' : 'Session started'}</span>
        </button>
      </div>

      <div class="cell">
        <button
          class="button is-danger {!sessionStarted ? 'is-hidden' : ''}"
          on:click={onDisconnectClick}
        >
          <span class="icon">
            <i class="fas fa-unlink"></i>
          </span>
          <span>Cancel</span>
        </button>
      </div>

      <div class="cell">
        <button
          class="button is-link {!sessionStarted ? 'is-hidden' : ''} {copyButtonIsLoading
            ? 'is-loading'
            : ''}"
          bind:this={copyButton}
        >
          <span class="icon">
            <i class="fas fa-copy"></i>
          </span>
          <span>Copy my connection string</span>
        </button>
      </div>
    </div>

    <div class="field has-addons {!sessionStarted ? 'is-hidden' : ''}">
      <div class="control has-icons-left has-icons-right">
        <input
          bind:value={$connectionString}
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

<StreamInterface bind:connectionState bind:webRTCComponent bind:isStreaming />
