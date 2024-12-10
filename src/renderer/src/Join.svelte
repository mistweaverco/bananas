<script lang="ts">
  import { onMount } from 'svelte'
  import Swal from 'sweetalert2'
  import { BananasConnectionState, BananasReadyState } from './BananasTypes'
  import { mayBeConnectionString, getDataFromBananasUrl, ConnectionType } from './Utils'
  import { useNavigationEnabled, useIsWatching, useParticipantUrl } from './stores'
  import WebRTC from './WebRTC.svelte'
  import StreamInterface from './StreamInterface.svelte'
  import RemoteScreen from './RemoteScreen.svelte'

  const navigationEnabled = useNavigationEnabled()
  const isWatching = useIsWatching()

  let remoteScreen: HTMLVideoElement
  let connectButton: HTMLButtonElement
  let connectToUserName = ''
  let connectionState = BananasConnectionState.DISCONNECTED
  let connectionString = useParticipantUrl()
  let connectionStringIsValid: boolean | null = null
  let copyButton: HTMLButtonElement
  let copyButtonIsLoading = false
  let isConnected = false
  let isReady = false
  let isStreaming = false
  let readyState = BananasReadyState.UNINITIALIZED
  let sessionStarted = false
  let webRTCComponent: WebRTC

  $: isConnected = connectionState === BananasConnectionState.CONNECTED
  $: (isReady = readyState === BananasReadyState.READY), onReadyStateChange()

  const onConnectionStringChange = async (): Promise<void> => {
    if ($connectionString === '') {
      connectionStringIsValid = null
      return
    }
    connectionStringIsValid = mayBeConnectionString(ConnectionType.HOST, $connectionString)
    if (connectionStringIsValid) {
      const bananasData = await getDataFromBananasUrl($connectionString)
      connectToUserName = bananasData.data.username
    }
  }

  const onReadyStateChange = (): void => {
    switch (readyState) {
      case BananasReadyState.READY:
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Connection ready',
          showConfirmButton: false,
          timer: 1500
        })
        break
      default:
        break
    }
  }

  const onConnectionStateChange = (): void => {
    switch (connectionState) {
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
      await webRTCComponent.Setup()
      const data = await getDataFromBananasUrl($connectionString)
      await webRTCComponent.Connect(data.rtcSessionDescription)
      sessionStarted = true
      $isWatching = true
      $navigationEnabled = false
    })
    copyButton.addEventListener('click', async () => {
      copyButtonIsLoading = true
      const remoteData = await getDataFromBananasUrl($connectionString)
      const data = await webRTCComponent.CreateParticipantUrl(remoteData.rtcSessionDescription, {
        username: settings.username
      })
      navigator.clipboard.writeText(data)
      setTimeout(() => {
        copyButtonIsLoading = false
      }, 400)
    })
  })
  const reset = (): void => {
    $connectionString = ''
    connectionStringIsValid = null
    isConnected = false
    $navigationEnabled = true
    $isWatching = false
  }
  const onDisconnectClick = async (): Promise<void> => {
    await webRTCComponent.Disconnect()
    reset()
  }
</script>

<WebRTC
  bind:connectionState
  bind:isConnected
  bind:isStreaming
  bind:readyState
  bind:remoteScreen
  bind:sessionStarted
  bind:this={webRTCComponent}
/>

<div class="container p-5 {isReady ? 'is-hidden' : ''}">
  <h1 class="title">{!isConnected ? 'Join' : 'Joined'} a session</h1>
  <div class="fixed-grid has-2-cols">
    <div class="grid">
      <div class="cell">
        <div class="field has-addons {sessionStarted ? 'is-hidden' : ''}">
          <div class="control has-icons-left has-icons-right">
            <input
              bind:value={$connectionString}
              placeholder="host connection string"
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
        <div class="control">
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
      <div class="cell">
        <button
          class="button is-danger {!isConnected ? 'is-hidden' : ''}"
          on:click={onDisconnectClick}
        >
          <span class="icon">
            <i class="fas fa-unlink"></i>
          </span>
          <span>Cancel</span>
        </button>
      </div>
    </div>
  </div>
</div>

<StreamInterface bind:isReady bind:isStreaming bind:webRTCComponent />

<RemoteScreen bind:remoteScreen />
