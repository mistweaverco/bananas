import { BrowserWindow, desktopCapturer, ipcMain, session } from 'electron'
import type { DesktopCapturerSource, NativeImage } from 'electron'

export type ScreenShareSource = {
  id: string
  name: string
  thumbnail: string
  appIcon: string | null
  isScreen: boolean
}

const SELECT_CHANNEL = 'selectScreenShareSource'
const SELECTED_CHANNEL = 'screenShareSourceSelected'
const PICKER_TIMEOUT_MS = 120000

let pickerRequestId = 0

const nativeImageToDataUrl = (image?: NativeImage | null): string | null => {
  if (!image || image.isEmpty()) return null
  return image.toDataURL()
}

const serializeSource = (source: DesktopCapturerSource): ScreenShareSource => {
  const isScreen = source.id.startsWith('screen:') || Boolean(source.display_id)
  return {
    id: source.id,
    name: source.name,
    thumbnail: nativeImageToDataUrl(source.thumbnail) ?? '',
    appIcon: nativeImageToDataUrl(source.appIcon),
    isScreen
  }
}

const nextTick = (): Promise<void> => new Promise((resolve) => setImmediate(resolve))

const getDesktopSources = async (): Promise<DesktopCapturerSource[]> => {
  await nextTick()
  const screenThumbnails = { width: 320, height: 180 }
  const screens = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: screenThumbnails
  })

  try {
    const windows = await Promise.race([
      desktopCapturer.getSources({
        types: ['window'],
        thumbnailSize: { width: 160, height: 90 },
        fetchWindowIcons: true
      }),
      new Promise<DesktopCapturerSource[]>((resolve) => {
        setTimeout(() => resolve([]), 5000)
      })
    ])
    return [...screens, ...windows]
  } catch (err) {
    console.error('desktopCapturer.getSources(window) failed', err)
    return screens
  }
}

const respondOnce = (
  callback: (streams: { video?: DesktopCapturerSource }) => void
): ((streams: { video?: DesktopCapturerSource }) => void) => {
  let responded = false
  return (streams): void => {
    if (responded) return
    responded = true
    try {
      callback(streams)
    } catch (err) {
      console.error('setDisplayMediaRequestHandler callback failed', err)
    }
  }
}

const askRendererToPickSource = async (
  win: BrowserWindow,
  sources: ScreenShareSource[]
): Promise<string | null> => {
  if (win.isMinimized()) win.restore()
  const bounds = win.getBounds()
  const minWidth = 680
  const minHeight = 520
  if (bounds.width < minWidth || bounds.height < minHeight) {
    win.setSize(Math.max(bounds.width, minWidth), Math.max(bounds.height, minHeight))
  }
  const wasAlwaysOnTop = win.isAlwaysOnTop()
  win.setAlwaysOnTop(true, 'pop-up-menu')
  win.show()
  win.focus()
  win.moveTop()
  if (process.platform === 'win32') {
    win.flashFrame(true)
  }

  const requestId = ++pickerRequestId

  try {
    return await new Promise<string | null>((resolve) => {
      const finish = (sourceId: string | null): void => {
        clearTimeout(timeoutId)
        ipcMain.removeListener(SELECTED_CHANNEL, onSelected)
        resolve(sourceId)
      }
      const onSelected = (
        _event: Electron.IpcMainEvent,
        payload: { requestId: number; sourceId: string | null }
      ): void => {
        if (payload?.requestId !== requestId) return
        finish(payload.sourceId)
      }
      const timeoutId = setTimeout(() => finish(null), PICKER_TIMEOUT_MS)
      ipcMain.on(SELECTED_CHANNEL, onSelected)
      win.webContents.send(SELECT_CHANNEL, { requestId, sources })
    })
  } finally {
    if (process.platform === 'win32') {
      win.flashFrame(false)
    }
    win.setAlwaysOnTop(wasAlwaysOnTop)
  }
}

export const installDisplayMediaHandler = (getMainWindow: () => BrowserWindow): void => {
  session.defaultSession.setPermissionCheckHandler(() => true)
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(true)
  })

  const handler = async (
    _request: unknown,
    callback: (streams: { video?: DesktopCapturerSource }) => void
  ): Promise<void> => {
    const respond = respondOnce(callback)
    try {
      const capturerSources = await getDesktopSources()
      const win = getMainWindow()
      if (!win || win.isDestroyed()) {
        respond({})
        return
      }

      const selectedId = await askRendererToPickSource(win, capturerSources.map(serializeSource))
      const selected = capturerSources.find((source) => source.id === selectedId)
      if (!selected) {
        respond({})
        return
      }
      respond({ video: selected })
    } catch (err) {
      console.error('display media request failed', err)
      respond({})
    }
  }

  session.defaultSession.setDisplayMediaRequestHandler(handler)
}
