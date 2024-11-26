<script lang="ts">
  import { onMount } from 'svelte';
  import { mayBeConnectionString, getOfferFromUrl, ConnectionType } from './Utils';
  import WebRTC from './WebRTC.svelte';
  
  let webRTCComponent: WebRTC;
  let connectionString = '';
  let isLoading = false;
  
  // Reactive declarations instead of manual class manipulation
  $: isValid = mayBeConnectionString(ConnectionType.PARTICIPANT, connectionString);
  $: inputState = connectionString ? (isValid ? 'success' : 'danger') : '';
  $: iconClass = connectionString 
    ? (isValid ? 'fa-check' : 'fa-times')
    : 'fa-question';
  
  // Handlers as functions instead of inline event listeners
  async function handleConnect() {
    if (!isValid) return;
    const offer = getOfferFromUrl(connectionString);
    await webRTCComponent.Connect(offer);
  }
  
  async function handleCopy() {
    isLoading = true;
    await webRTCComponent.Setup();
    const offer = await webRTCComponent.CreateHostUrl();
    await navigator.clipboard.writeText(offer);
    
    // Using a reactive statement instead of directly manipulating classes
    setTimeout(() => {
      isLoading = false;
    }, 400);
  }
</script>

<WebRTC bind:this={webRTCComponent} />

<div class="container p-5">
  <h1 class="title">Host a session</h1>
  <div class="form">
    <div class="field">
      <div class="control">
        <button 
          class="button is-link"
          class:is-loading={isLoading}
          on:click={handleCopy}
        >
          Copy my connection string
        </button>
      </div>
    </div>

    <div class="field">
      <label class="label" for="remote_connection_string">
        Participant connection string
      </label>
      <div class="control has-icons-left has-icons-right">
        <input
          bind:value={connectionString}
          class="input"
          class:is-{inputState}
          type="text"
          id="remote_connection_string"
        />
        <span class="icon is-small is-left">
          <i class="fas fa-user"></i>
        </span>
        <span class="icon is-small is-right">
          <i class="fas {iconClass}"></i>
        </span>
      </div>
      {#if connectionString}
        <p class="help" class:is-success={isValid} class:is-hidden={!isValid}>
          Connection string seems valid.
        </p>
        <p class="help" class:is-danger={!isValid} class:is-hidden={isValid}>
          Connection string seems invalid.
        </p>
      {/if}
    </div>

    <div class="field">
      <div class="control">
        <button 
          class="button is-link" 
          disabled={!isValid}
          on:click={handleConnect}
        >
          Connect
        </button>
      </div>
    </div>
  </div>
</div>
