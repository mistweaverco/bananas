<script lang="ts">
  import type { RTCSessionDescriptionOptions } from './Utils'
  import type { BananasRemoteCursorData, SettingsData } from './BananasTypes'
  import { BananasConnectionState, BananasReadyState } from './BananasTypes'
  import { getConnectionString, ConnectionType } from './Utils'
  import { getRTCPeerConnectionConfig } from './Config'
  import { onDestroy } from 'svelte'

  export let remoteScreen: HTMLVideoElement | null = null
  export let connectionState: string = BananasConnectionState.DISCONNECTED
  export let isStreaming = false
  export let readyState: BananasReadyState = BananasReadyState.UNINITIALIZED
  export let sessionStarted = false
  export let isConnected = false

  const errorHander = (e: ErrorEvent): void => {
    console.error(e)
  }

  let pc: RTCPeerConnection | null = null
  let remoteCursorPositionsEnabled = false
  let remoteMouseCursorPositionsChannel: RTCDataChannel | null = null
  let remoteCursorPingChannel: RTCDataChannel | null = null
  let signalingChannel: RTCDataChannel | null = null
  let audioStream: MediaStream | null = null
  let videoStream: MediaStream | null = null
  let videoSender: RTCRtpSender | null = null
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
        if (isStreaming) return
        const data = JSON.parse(e.data)
        window.BananasApi.updateRemoteCursor(data)
      }
    }
    if (dc.label === 'remoteCursorPing') {
      remoteCursorPingChannel = dc
      dc.onmessage = function (e: MessageEvent): void {
        if (!remoteCursorPositionsEnabled) return
        if (isStreaming) return
        window.BananasApi.remoteCursorPing(e.data)
      }
    }
    if (dc.label === 'signaling') {
      signalingChannel = dc
      dc.onopen = function (): void {
        readyState = BananasReadyState.READY
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
    cursorData.movements.forEach((m) => {
      const data = {
        ...cursorData,
        x: m.x,
        y: m.y
      }
      remoteMouseCursorPositionsChannel.send(JSON.stringify(data))
    })
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
  export async function RequestStartStreaming(): Promise<boolean> {
    try {
      videoStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      })
      videoSender = pc.addTrack(videoStream.getTracks()[0], videoStream)
      isStreaming = true
      return true
    } catch (e) {
      errorHander(e)
      return false
    }
  }
  export async function RequestStopStreaming(): Promise<boolean> {
    try {
      if (videoStream) {
        pc.removeTrack(videoSender)
        const track = videoSender.track
        if (track) {
          track.stop()
        }
        videoStream = null
        videoSender = null
      }
      isStreaming = false
      return true
    } catch (e) {
      errorHander(e)
      return false
    }
  }
  export async function Setup(): Promise<void> {
    userSettings = await window.BananasApi.getSettings()
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
      if (e.channel.label === 'signaling') {
        setupDataChannel(e.channel)
      }
    }
    pc.ontrack = (evt): void => {
      remoteScreen.srcObject = evt.streams[0]
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
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      })
    } catch (e) {
      errorHander(e)
    }
    if (audioStream) {
      for (const track of audioStream.getTracks()) {
        track.enabled = userSettings.isMicrophoneEnabledOnConnect
        pc.addTrack(track, audioStream)
      }
    }
  }
  export async function CreateParticipantUrl(
    c: RTCSessionDescriptionOptions,
    data: { username: string }
  ): Promise<string> {
    try {
      const desc = new RTCSessionDescription(c)
      await pc.setRemoteDescription(desc)
      if (desc.type === 'offer') {
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
      }
    } catch (e) {
      errorHander(e)
    }
    return await getConnectionString(ConnectionType.PARTICIPANT, pc.localDescription, data)
  }
  export async function CreateHostUrl(data: { username: string }): Promise<string> {
    remoteMouseCursorPositionsChannel = pc.createDataChannel('remoteMouseCursorPositions')
    remoteCursorPingChannel = pc.createDataChannel('remoteCursorPing')
    signalingChannel = pc.createDataChannel('signaling')
    setupDataChannel(remoteMouseCursorPositionsChannel)
    setupDataChannel(remoteCursorPingChannel)
    setupDataChannel(signalingChannel)
    const desc = await pc.createOffer()
    await pc.setLocalDescription(desc)
    return await getConnectionString(ConnectionType.HOST, pc.localDescription, data)
  }
  export function ToggleDisplayStream(): void {
    if (videoStream) {
      for (const track of videoStream.getVideoTracks()) {
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
      if (videoStream) {
        for (const track of videoStream.getTracks()) {
          track.stop()
        }
        videoStream = null
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
    readyState = BananasReadyState.UNINITIALIZED
    sessionStarted = false
    isConnected = false
  }

  onDestroy(() => {
    // Close the peer connection
    if (pc) {
      pc.close()
      pc = null
    }

    // Stop and release all tracks in the audio stream
    if (audioStream) {
      for (const track of audioStream.getTracks()) {
        track.stop()
      }
      audioStream = null
    }

    // Stop and release all tracks in the display/media stream
    if (videoStream) {
      for (const track of videoStream.getTracks()) {
        track.stop()
      }
      videoStream = null
    }

    // Clean up data channels
    if (signalingChannel) {
      signalingChannel.close()
      signalingChannel = null
    }

    if (remoteMouseCursorPositionsChannel) {
      remoteMouseCursorPositionsChannel.close()
      remoteMouseCursorPositionsChannel = null
    }

    if (remoteCursorPingChannel) {
      remoteCursorPingChannel.close()
      remoteCursorPingChannel = null
    }

    // Reset other references
    if (audioElement) {
      audioElement.srcObject = null
      audioElement = null
    }

    if (remoteScreen) {
      remoteScreen.srcObject = null
    }

    userSettings = null
    remoteCursorPositionsEnabled = false
  })
</script>
