<script lang="ts">
  import Navigation from './Navigation.svelte'
  import Join from './Join.svelte'
  import Host from './Host.svelte'
  import Settings from './Settings.svelte'
  import { activeView, participantUrl, hostUrl, isHosting } from './stores.svelte'
  import { getDataFromBananasUrl } from './Utils'

  window.onmessage = async (evt: MessageEvent): Promise<void> => {
    const { data } = evt
    if (data.type !== 'openBananasURL') return
    const urlData = await getDataFromBananasUrl(data.url)
    switch (urlData.type) {
      case 'host':
        activeView.value = 'join'
        participantUrl.value = data.url
        break
      case 'participant':
        if (activeView.value !== 'host' || !isHosting.value) return
        hostUrl.value = data.url
        break
    }
  }
</script>

<Navigation />

{#if activeView.value === 'join'}
  <Join />
{:else if activeView.value === 'host'}
  <Host />
{:else if activeView.value === 'settings'}
  <Settings />
{/if}
