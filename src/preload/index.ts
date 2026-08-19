import { ipcRenderer } from 'electron'
import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

let HANDLE_URL_CLICKS = true

const onDocumentReady = (callback: () => void): void => {
  if (document.readyState !== 'complete') {
    document.addEventListener('DOMContentLoaded', callback)
  } else {
    callback()
  }
}

ipcRenderer.on('openBananasURL', (_, url) => {
  if (!HANDLE_URL_CLICKS) return
  onDocumentReady(() => {
    window.postMessage({ type: 'openBananasURL', url }, '*')
  })
})

type IceServer = {
  urls: string
  username?: string
  credential?: string
}

export type ScreenShareSource = {
  id: string
  name: string
  thumbnail: string
  appIcon: string | null
  isScreen: boolean
}

type SelectScreenShareSourceHandler = (sources: ScreenShareSource[]) => Promise<string | null>

let selectScreenShareSourceHandler: SelectScreenShareSourceHandler | null = null

ipcRenderer.on(
  'selectScreenShareSource',
  async (_, payload: { requestId: number; sources: ScreenShareSource[] }) => {
    const sourceId = selectScreenShareSourceHandler
      ? await selectScreenShareSourceHandler(payload.sources)
      : (payload.sources.find((source) => source.isScreen)?.id ?? payload.sources[0]?.id ?? null)
    ipcRenderer.send('screenShareSourceSelected', { requestId: payload.requestId, sourceId })
  }
)

const BananasApi = {
  getAppVersion: async (): Promise<string> => {
    return await ipcRenderer.invoke('getAppVersion')
  },
  handleUrlClicks: (state: boolean | undefined): boolean => {
    if (state) HANDLE_URL_CLICKS = state
    return HANDLE_URL_CLICKS
  },
  getSettings: async (): Promise<{
    username: string
    color: string
    isMicrophoneEnabledOnConnect: boolean
    iceServers: IceServer[]
  }> => {
    return await ipcRenderer.invoke('getSettings')
  },
  updateSettings: async (settings: {
    username: string
    color: string
    isMicrophoneEnabledOnConnect: boolean
    iceServers: IceServer[]
  }): Promise<void> => {
    ipcRenderer.invoke('updateSettings', settings)
  },
  toggleRemoteCursors: async (state: boolean): Promise<void> => {
    ipcRenderer.invoke('toggleRemoteCursors', state)
  },
  remoteCursorPing: async (cursorId: string): Promise<void> => {
    ipcRenderer.invoke('remoteCursorPing', cursorId)
  },
  updateRemoteCursor: async (state: {
    id: string
    name: string
    color: string
    x: number
    y: number
  }): Promise<void> => {
    ipcRenderer.invoke('updateRemoteCursor', state)
  },
  onSelectScreenShareSource: (handler: SelectScreenShareSourceHandler): void => {
    selectScreenShareSourceHandler = handler
  }
}

try {
  contextBridge.exposeInMainWorld('electron', electronAPI)
  contextBridge.exposeInMainWorld('BananasApi', BananasApi)
} catch (error) {
  console.error(error)
}
