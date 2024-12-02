<script lang="ts">
  import Navigation from './Navigation.svelte'
  import Join from './Join.svelte'
  import Host from './Host.svelte'
  import Settings from './Settings.svelte'
  import {
    useActiveView,
    useNavigationEnabled,
    useIsHosting,
    useIsWatching,
    useParticipantUrl,
    useHostUrl
  } from './stores'
  import { getDataFromBananasUrl } from './Utils'
  const activeView = useActiveView()
  const participantUrl = useParticipantUrl()
  const hostUrl = useHostUrl()
  const isHosting = useIsHosting()
  useNavigationEnabled()
  useIsWatching()
  window.onmessage = async (evt: MessageEvent): Promise<void> => {
    const { data } = evt
    if (data.type !== 'openBananasURL') return
    const urlData = await getDataFromBananasUrl(data.url)
    switch (urlData.type) {
      case 'host':
        $activeView = 'join'
        $participantUrl = data.url
        break
      case 'participant':
        if ($activeView !== 'host' || !$isHosting) return
        $hostUrl = data.url
        break
    }
  }
</script>

<Navigation />

{#if $activeView === 'join'}
  <Join />
{:else if $activeView === 'host'}
  <Host />
{:else if $activeView === 'settings'}
  <Settings />
{/if}
