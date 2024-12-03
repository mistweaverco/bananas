/// <reference types="svelte" />
/// <reference types="vite/client" />
import { ElectronAPI } from '@electron-toolkit/preload'

type IceServer = {
  urls: string
  username?: string
  credential?: string
}

declare global {
  interface Window {
    electron: ElectronAPI
    BananasApi: {
      toggleRemoteCursors: (state: boolean) => Promise<void>
      remoteCursorPing: (cursorId: string) => Promise<void>
      updateRemoteCursor: (state: {
        id: string
        name: string
        color: string
        x: number
        y: number
      }) => Promise<void>
      updateSettings: (settings: {
        username: string
        color: string
        iceServers: IceServer[]
      }) => Promise<void>
      getSettings: () => Promise<{ username: string; color: string; iceServers: IceServer[] }>
      getAppVersion: () => Promise<string>
    }
  }
}
