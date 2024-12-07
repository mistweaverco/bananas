<script lang="ts">
  import { onMount } from 'svelte'
  import { makeVideoDraggable, getUUIDv4 } from './Utils'
  import WebRTC from './WebRTC.svelte'
  import AudioVisualizer from './AudioVisualizer.svelte'

  export let webRTCComponent: WebRTC

  let remoteScreen: HTMLVideoElement
  let UUID = getUUIDv4()
  let zoomFactor = 1
  let microphoneActive = false
  let isStreaming = false
  let visualizerIsActive: boolean = true

  onMount(async () => {
    const settings = await window.BananasApi.getSettings()
    microphoneActive = settings.isMicrophoneEnabledOnConnect
    makeVideoDraggable(remoteScreen)
    remoteScreen.addEventListener('dblclick', () => {
      webRTCComponent.PingRemoteCursor('cursor-' + UUID)
    })
    remoteScreen.addEventListener('mousemove', (e) => {
      const { offsetX, offsetY } = e
      // TODO: Batch cursor updates
      webRTCComponent.UpdateRemoteCursor({
        x: offsetX / remoteScreen.clientWidth,
        y: offsetY / remoteScreen.clientHeight,
        name: settings.username,
        id: 'cursor-' + UUID,
        color: settings.color
      })
    })
    remoteScreen.addEventListener('play', () => {
      if (!webRTCComponent.IsConnected()) return
      isStreaming = true
    })
  })
  const onDisconnectClick = async (): Promise<void> => {
    await webRTCComponent.Disconnect()
  }
  const onFullscreenClick = (): void => {
    remoteScreen.requestFullscreen()
  }
  const onZoomInClick = (): void => {
    zoomFactor += 0.1
    remoteScreen.style.scale = zoomFactor.toString()
  }
  const onZoomOutClick = (): void => {
    if (zoomFactor <= 1) return
    zoomFactor -= 0.1
    remoteScreen.style.scale = zoomFactor.toString()
  }
  const onMicrophoneToggle = async (): Promise<void> => {
    microphoneActive = !microphoneActive
    webRTCComponent.ToggleMicrophone()
  }
</script>

<div class="container p-5">
  <h1 class="title">{!isStreaming ? 'Join' : 'Joined'} a session</h1>
  <div class={!isStreaming ? 'is-hidden' : ''}>
    <div class="fixed-grid">
      <div class="grid">
        <div class="cell">
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
</div>

<div class={!isStreaming ? 'is-hidden' : ''}>
  <div class="field">
    <label class="label" for="remote_screen">Remote screen</label>
    <div class="control">
      <div class="video-overflow">
        <video bind:this={remoteScreen} id="remote_screen" class="video" autoplay playsinline muted
        ></video>
      </div>
    </div>
  </div>
  <div class="field">
    <div class="control">
      <button class="button is-info" on:click={onZoomInClick}>
        <span class="icon">
          <i class="fas fa-search-plus"></i>
        </span>
        <span>Zoom In</span>
      </button>
      <button class="button is-info" on:click={onZoomOutClick}>
        <span class="icon">
          <i class="fas fa-search-minus"></i>
        </span>
        <span>Zoom Out</span>
      </button>
      <button class="button is-info" on:click={onFullscreenClick}>
        <span class="icon">
          <i class="fas fa-expand"></i>
        </span>
        <span>Fullscreen</span>
      </button>
    </div>
  </div>
</div>

<style>
  .video {
    width: 100%;
    height: auto;
    transition: transform 0.5s linear;
  }
  .video-overflow {
    width: 100%;
    height: auto;
    overflow: hidden;
  }
</style>
