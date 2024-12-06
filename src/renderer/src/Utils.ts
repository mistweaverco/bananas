export const enum ConnectionType {
  HOST = 'host',
  PARTICIPANT = 'participant'
}

export type RTCSessionDescriptionOptions = RTCSessionDescriptionInit

export const externalLinkClickHandler = (root: HTMLButtonElement, url: string): void => {
  root.classList.add('is-loading')
  setTimeout(() => {
    root.classList.remove('is-loading')
  }, 3000)
  window.open(url)
}

export const getUUIDv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const compressJson = async (data: any): Promise<string> => {
  const stream = new Blob([JSON.stringify(data)], {
    type: 'application/json'
  }).stream()
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'))
  const compressedResponse = new Response(compressedStream)
  const blob = await compressedResponse.blob()
  const buffer = await blob.arrayBuffer()
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const decompressJson = async (data: string): Promise<any> => {
  const buffer = new Uint8Array(
    atob(data)
      .split('')
      .map((c) => c.charCodeAt(0))
  )
  const stream = new Blob([buffer], {
    type: 'application/json'
  }).stream()
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'))
  const res = new Response(decompressedStream)
  const blob = await res.blob()
  return JSON.parse(await blob.text())
}

export const mayBeConnectionString = (ct: ConnectionType, str: string): boolean => {
  try {
    const url = new URL(str)
    if (url.protocol !== 'bananas:') return false
    if (url.pathname.slice(2) !== ct) return false
    const token = url.searchParams.get('token')
    const username = url.searchParams.get('username')
    if (!token || !username) return false
    decompressJson(token)
    return true
  } catch (err) {
    return false
  }
}

export const getConnectionString = async (
  ct: ConnectionType,
  offer: RTCSessionDescriptionInit,
  data: {
    username: string
  }
): Promise<string> => {
  const { username } = data
  const token = encodeURIComponent(await compressJson(offer))
  return `bananas://${ct}?username=${encodeURIComponent(username)}&token=${token}`
}

export const getDataFromBananasUrl = async (
  url: string
): Promise<{
  type: ConnectionType
  data: { username: string }
  rtcSessionDescription: RTCSessionDescriptionInit
}> => {
  const u = new URL(url)
  const token = u.searchParams.get('token')
  const username = u.searchParams.get('username')
  return {
    type: u.pathname.slice(2) as ConnectionType,
    data: {
      username: username
    },
    rtcSessionDescription: await decompressJson(decodeURIComponent(token))
  }
}

export const makeVideoDraggable = (video: HTMLVideoElement): void => {
  let startX: number
  let startY: number
  let initialX: number
  let initialY: number
  let isDragging = false
  video.addEventListener('mousedown', (e) => {
    isDragging = true
    startX = e.clientX
    startY = e.clientY
    const transform = getComputedStyle(video).transform

    if (transform !== 'none') {
      const values = transform.split('(')[1].split(')')[0].split(',')
      initialX = parseFloat(values[4])
      initialY = parseFloat(values[5])
    } else {
      initialX = 0
      initialY = 0
    }
    video.style.cursor = 'grabbing'
  })
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return

    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY

    const moveX = initialX + deltaX
    const moveY = initialY + deltaY

    video.style.transform = `translate(${moveX}px, ${moveY}px)`
  })

  document.addEventListener('mouseup', () => {
    if (!isDragging) return
    isDragging = false
    video.style.cursor = 'default'
  })
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

export const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let lastCalled = 0
  return (...args: Parameters<T>): void => {
    const now = Date.now()
    if (now - lastCalled < wait) return
    lastCalled = now
    func(...args)
  }
}
