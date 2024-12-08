export enum BananasConnectionState {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed'
}

type BananasRemoteCursorMovement = {
  x: number
  y: number
}

export type BananasRemoteCursorData = {
  id: string
  name: string
  color: string
  movements: BananasRemoteCursorMovement[]
}

type IceServer = {
  urls: string
  username?: string
  credential?: string
}

export type SettingsData = {
  username: string
  color: string
  isMicrophoneEnabledOnConnect: boolean
  iceServers: IceServer[]
}
