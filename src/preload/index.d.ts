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
      updateSettings: (settings: { username: string; color: string }) => Promise<void>
      getSettings: () => Promise<{ username: string; color: string }>
      getAppVersion: () => Promise<string>
    }
  }
}
