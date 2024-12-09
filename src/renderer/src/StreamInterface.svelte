<script lang="ts">
  import { onMount } from 'svelte'
  import WebRTC from './WebRTC.svelte'
  import AudioVisualizer from './AudioVisualizer.svelte'

  export let webRTCComponent: WebRTC
  export let isReady: boolean = false
  export let isStreaming = false

  let cursorsActive = false

  let microphoneActive = false
  let visualizerIsActive: boolean = true
  let settings = null

  const toggleRemoteCursors = (): void => {
    cursorsActive = !cursorsActive
    window.BananasApi.toggleRemoteCursors(cursorsActive)
    webRTCComponent.ToggleRemoteCursors(cursorsActive)
  }

  onMount(async () => {
    settings = await window.BananasApi.getSettings()
    microphoneActive = settings.isMicrophoneEnabledOnConnect
  })

  const onDisconnectClick = async (): Promise<void> => {
    await webRTCComponent.Disconnect()
  }

  const onMicrophoneToggle = async (): Promise<void> => {
    microphoneActive = !microphoneActive
    webRTCComponent.ToggleMicrophone()
  }

  const requestStreamer = async (): Promise<void> => {
    console.log('Requesting streamer')
  }
</script>

<div class="container p-5 {isReady ? '' : 'is-hidden'}">
  <div class="fixed-grid">
    <div class="grid">
      <div class="cell">
        <button
          title={isStreaming ? 'Stop streaming your screen' : 'Request to stream your screen'}
          class="button {isStreaming ? 'is-success' : 'is-danger'}"
          on:click={requestStreamer}
        >
          <span class="icon">
            <i class="fa-solid fa-display"></i>
          </span>
        </button>
        <button
          aria-label={microphoneActive ? 'Microphone active' : 'Microphone muted'}
          title={microphoneActive ? 'Microphone active' : 'Microphone muted'}
          class="button {microphoneActive ? 'is-success' : 'is-danger'}"
          on:click={onMicrophoneToggle}
        >
          <span class="icon">
            {#if microphoneActive}
              <AudioVisualizer
                className="icon {!visualizerIsActive ? 'is-hidden' : ''}"
                bind:visualizerIsActive
                stream={webRTCComponent.GetAudioStream()}
              />
              <i class="fas fa-microphone {visualizerIsActive ? 'is-hidden' : ''}"></i>
            {:else}
              <i class="fas fa-microphone-slash"></i>
            {/if}
          </span>
        </button>
        <button
          title={cursorsActive ? 'Remote cursors enabled' : 'Remote cursors disabled'}
          class="button {cursorsActive ? 'is-success' : 'is-danger'} {isStreaming
            ? ''
            : 'is-hidden'}"
          on:click={toggleRemoteCursors}
        >
          <span class="icon">
            <i class="fas fa-mouse-pointer"></i>
          </span>
        </button>
      </div>
      <div class="cell has-text-right">
        <button class="button is-danger" aria-label="Disconnect" on:click={onDisconnectClick}>
          <span class="icon">
            <i class="fas fa-unlink"></i>
          </span>
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  </div>
</div>
