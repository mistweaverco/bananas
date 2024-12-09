<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { makeVideoDraggable, getUUIDv4 } from './Utils'
  import WebRTC from './WebRTC.svelte'

  export let remoteScreen: HTMLVideoElement
  export let webRTCComponent: WebRTC | null = null
  export let isReady: boolean = false
  export let isStreaming = false
  export let receivingRemoteScreen: boolean = false

  // Time interval for batching cursor updates (in ms)
  const BATCH_SEND_INTERVAL = 100

  let cursorMovementQueue: { x: number; y: number }[] = []
  let batchTimer: number | null = null

  let isRemoteScreenVisible = false

  let UUID = getUUIDv4()
  let zoomFactor = 1
  let settings = null

  $: isRemoteScreenVisible = isReady && !isStreaming && receivingRemoteScreen

  function sendBatchedCursorUpdates(): void {
    if (cursorMovementQueue.length > 0) {
      webRTCComponent.UpdateRemoteCursor({
        movements: cursorMovementQueue, // Send all queued movements
        name: settings.username,
        id: 'cursor-' + UUID,
        color: settings.color
      })
      cursorMovementQueue = [] // Clear the queue after sending
    }
  }

  onMount(async () => {
    settings = await window.BananasApi.getSettings()

    makeVideoDraggable(remoteScreen)

    remoteScreen.addEventListener('dblclick', () => {
      webRTCComponent.PingRemoteCursor('cursor-' + UUID)
    })

    remoteScreen.addEventListener('mousemove', (e) => {
      const { offsetX, offsetY } = e

      // Normalize cursor position
      const x = offsetX / remoteScreen.clientWidth
      const y = offsetY / remoteScreen.clientHeight

      cursorMovementQueue.push({ x, y })

      if (!batchTimer) {
        batchTimer = window.setInterval(() => {
          sendBatchedCursorUpdates()
        }, BATCH_SEND_INTERVAL)
      }
    })

    remoteScreen.addEventListener('mouseout', () => {
      if (batchTimer) {
        clearInterval(batchTimer)
        batchTimer = null
        sendBatchedCursorUpdates() // Flush the queue immediately
      }
    })
  })

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

  onDestroy(() => {
    if (batchTimer) {
      clearInterval(batchTimer)
      batchTimer = null
    }
    sendBatchedCursorUpdates() // Send any remaining movements
  })
</script>

<!--
INFO:
Show only when not streaming, because we only want one Desktop stream at a time
and if you are the Host, you are already streaming your screen and thus should not
be able to see the remote screen, which would be your own screen.
-->
<div class={isRemoteScreenVisible ? '' : 'is-hidden'}>
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
