/// <reference types="svelte" />
/// <reference types="vite/client" />
import { ElectronAPI } from '@electron-toolkit/preload'

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
        punchHoleServers: string[]
      }) => Promise<void>
      getSettings: () => Promise<{ username: string; color: string; punchHoleServers: string[] }>
    }
  }
}
