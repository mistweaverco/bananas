<script lang="ts">
  import type { RTCSessionDescriptionOptions } from './Utils'
  import type { BananasRemoteCursorData, SettingsData } from './BananasTypes'
  import { getConnectionString, ConnectionType } from './Utils'
  import { getRTCPeerConnectionConfig } from './Config'

  export let connectionState: string = 'disconnected'

  const errorHander = (e: ErrorEvent): void => {
    console.error(e)
  }

  let remoteVideo: HTMLVideoElement | null = null
  let pc: RTCPeerConnection | null = null
  let remoteCursorPositionsEnabled = false
  let remoteMouseCursorPositionsChannel: RTCDataChannel | null = null
  let remoteCursorPingChannel: RTCDataChannel | null = null
  let audioStream: MediaStream | null = null
  let stream: MediaStream | null = null
  let audioElement: HTMLAudioElement | null = null
  let userSettings: SettingsData | null = null

  const remoteMouseCursorPositionsChannelIsReady = (): boolean => {
    if (!remoteMouseCursorPositionsChannel) return false
    if (remoteMouseCursorPositionsChannel.readyState === 'open') return true
    return false
  }

  const remoteCursorPingChannelIsReady = (): boolean => {
    if (!remoteCursorPingChannel) return false
    if (remoteCursorPingChannel.readyState === 'open') return true
    return false
  }

  const setupDataChannel = (dc: RTCDataChannel): void => {
    if (dc.label === 'remoteMouseCursorPositions') {
      remoteMouseCursorPositionsChannel = dc
      dc.onmessage = function (e: MessageEvent): void {
        if (!remoteCursorPositionsEnabled) return
        if (remoteVideo) return
        const data = JSON.parse(e.data)
        window.BananasApi.updateRemoteCursor(data)
      }
    }
    if (dc.label === 'remoteCursorPing') {
      remoteCursorPingChannel = dc
      dc.onmessage = function (e: MessageEvent): void {
        if (!remoteCursorPositionsEnabled) return
        if (remoteVideo) return
        window.BananasApi.remoteCursorPing(e.data)
      }
    }
  }
  export function PingRemoteCursor(cursorId: string): void {
    if (!remoteCursorPingChannelIsReady()) {
      console.error('remoteCursorPingChannel not ready')
      return
    }
    remoteCursorPingChannel.send(cursorId)
  }
  export function UpdateRemoteCursor(cursorData: BananasRemoteCursorData): void {
    if (!remoteMouseCursorPositionsChannelIsReady()) {
      console.error('remoteMouseCursorPositionsChannel not ready')
      return
    }
    remoteMouseCursorPositionsChannel.send(JSON.stringify(cursorData))
  }
  export function HasAudioInput(): boolean {
    return audioStream !== null
  }
  export function GetAudioStream(): MediaStream | null {
    return audioStream
  }
  export function ToggleRemoteCursors(enabled: boolean): boolean {
    if (!remoteMouseCursorPositionsChannel) return false
    if (remoteMouseCursorPositionsChannel.readyState !== 'open') return false
    remoteCursorPositionsEnabled = enabled
    return enabled
  }

  const ICE_GATHERING_TIMEOUT_MS = 10000

  const waitForIceGatheringComplete = async (): Promise<void> => {
    if (!pc) return
    if (pc.iceGatheringState === 'complete') return
    await new Promise<void>((resolve) => {
      const cleanup = (): void => {
        pc?.removeEventListener('icegatheringstatechange', onStateChange)
        clearTimeout(timeoutId)
      }
      const onStateChange = (): void => {
        if (pc?.iceGatheringState === 'complete') {
          cleanup()
          resolve()
        }
      }
      const timeoutId = setTimeout(() => {
        cleanup()
        console.warn('ICE gathering timed out; continuing with current candidates')
        resolve()
      }, ICE_GATHERING_TIMEOUT_MS)
      pc.addEventListener('icegatheringstatechange', onStateChange)
      onStateChange()
    })
  }

  const addGuestAudioTracks = (): void => {
    if (!pc || !audioStream || !userSettings) return
    const senders = pc.getSenders()
    for (const track of audioStream.getTracks()) {
      track.enabled = userSettings.isMicrophoneEnabledOnConnect
      if (!senders.some((sender) => sender.track?.id === track.id)) {
        pc.addTrack(track, audioStream)
      }
    }
  }

  export async function Setup(v: HTMLVideoElement = null): Promise<'ok' | 'cancelled' | 'failed'> {
    userSettings = await window.BananasApi.getSettings()
    remoteVideo = v
    audioElement = document.createElement('audio')
    audioElement.controls = true
    audioElement.autoplay = true
    if (pc) {
      pc.close()
      pc = null
    }
    pc = new RTCPeerConnection(await getRTCPeerConnectionConfig())
    pc.ondatachannel = (e: RTCDataChannelEvent): void => {
      if (e.channel.label === 'remoteMouseCursorPositions') {
        setupDataChannel(e.channel)
      }
      if (e.channel.label === 'remoteCursorPing') {
        setupDataChannel(e.channel)
      }
    }
    pc.ontrack = (evt): void => {
      if (remoteVideo) {
        remoteVideo.srcObject = evt.streams[0]
      }
      if (audioStream) {
        audioElement.srcObject = evt.streams[0]
      }
    }
    pc.onicecandidate = function (e: RTCPeerConnectionIceEvent): void {
      const cand = e.candidate
      if (!cand) {
        console.log('icecandidate gathering: complete')
      } else {
        console.log('new icecandidate')
      }
    }
    pc.oniceconnectionstatechange = function (): void {
      connectionState = pc.iceConnectionState
    }
    if (!remoteVideo) {
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        if (!stream?.getVideoTracks().length) {
          return 'failed'
        }
        for (const track of stream.getTracks()) {
          pc.addTrack(track, stream)
        }
      } catch (e) {
        if (e && typeof e === 'object' && 'name' in e && e.name === 'NotAllowedError') {
          return 'cancelled'
        }
        errorHander(e)
        return 'failed'
      }
    }
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      })
    } catch (e) {
      errorHander(e)
    }
    if (!remoteVideo && stream && audioStream) {
      for (const track of audioStream.getTracks()) {
        track.enabled = userSettings.isMicrophoneEnabledOnConnect
        pc.addTrack(track, stream)
      }
    }
    return 'ok'
  }
  export async function CreateParticipantUrl(
    c: RTCSessionDescriptionOptions,
    data: { username: string }
  ): Promise<string> {
    if (pc?.localDescription?.type !== 'answer') {
      try {
        const desc = new RTCSessionDescription(c)
        await pc.setRemoteDescription(desc)
        if (remoteVideo) {
          addGuestAudioTracks()
        }
        if (desc.type === 'offer') {
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
        }
      } catch (e) {
        errorHander(e)
      }
    }
    await waitForIceGatheringComplete()
    return await getConnectionString(ConnectionType.PARTICIPANT, pc.localDescription, data)
  }
  export async function CreateHostUrl(data: { username: string }): Promise<string> {
    if (pc?.localDescription?.type !== 'offer') {
      remoteMouseCursorPositionsChannel = pc.createDataChannel('remoteMouseCursorPositions')
      remoteCursorPingChannel = pc.createDataChannel('remoteCursorPing')
      setupDataChannel(remoteMouseCursorPositionsChannel)
      setupDataChannel(remoteCursorPingChannel)
      const desc = await pc.createOffer()
      await pc.setLocalDescription(desc)
    }
    await waitForIceGatheringComplete()
    return await getConnectionString(ConnectionType.HOST, pc.localDescription, data)
  }
  export function ToggleDisplayStream(): void {
    if (stream) {
      for (const track of stream.getVideoTracks()) {
        track.enabled = !track.enabled
      }
    }
  }
  export function ToggleMicrophone(): void {
    if (audioStream) {
      for (const track of audioStream.getAudioTracks()) {
        track.enabled = !track.enabled
      }
    }
  }
  export function IsMicrophoneActive(): boolean {
    if (audioStream) {
      for (const track of audioStream.getAudioTracks()) {
        return track.enabled
      }
    }
    return false
  }
  export async function Connect(c: RTCSessionDescriptionOptions): Promise<void> {
    try {
      const desc = new RTCSessionDescription(c)
      await pc.setRemoteDescription(desc)
      if (remoteVideo) {
        addGuestAudioTracks()
      }
      if (desc.type === 'offer') {
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
      }
    } catch (e) {
      errorHander(e)
    }
  }
  export function IsConnected(): boolean {
    return pc ? pc.connectionState === 'connected' : false
  }
  export async function Disconnect(): Promise<void> {
    try {
      pc.close()
      pc = null
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop()
        }
        stream = null
      }
      if (audioStream) {
        for (const track of audioStream.getTracks()) {
          track.stop()
        }
        audioStream = null
      }
    } catch (e) {
      errorHander(e)
    }
  }
</script>
