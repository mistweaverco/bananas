export const getRTCPeerConnectionConfig = async (): Promise<RTCConfiguration> => {
  const settings = await window.BananasApi.getSettings()
  const iceServers = settings.punchHoleServers.map((url) => ({ urls: url }))
  return {
    iceServers
  }
}
