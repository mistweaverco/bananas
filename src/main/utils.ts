import { is } from '@electron-toolkit/utils'
import { join } from 'path'

export const loadWindowContents = (win: Electron.BrowserWindow, file: string): void => {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/' + file)
  } else {
    win.loadFile(join(__dirname, '../renderer/' + file))
  }
}

export const isInProductionMode = (): boolean => {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) return false
  return true
}

export const debounce = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>): void => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}
