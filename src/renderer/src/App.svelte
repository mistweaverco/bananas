<script lang="ts">
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  import Navigation from './Navigation.svelte'
</script>

<div class="container">
  <Navigation />
  <button class="button" id="startButton">Start</button>
  <h2>Local</h2>
  <div>
    <!-- svelte-ignore a11y-media-has-caption -->
    <video width="250" id="localVideo" controls autoPlay />
    <textarea class="textarea" id="localOffer"></textarea>
    <button class="button" id="localOfferButton">CreateOffer</button>
  </div>
  <h2>Remote</h2>
  <div>
    <!-- svelte-ignore a11y-media-has-caption -->
    <video width="250" id="remoteVideo" controls autoPlay />
    <textarea class="textarea" id="remoteOffer"></textarea>
    <button class="button" id="remoteOfferButton">Answer</button>
  </div>
</div>
