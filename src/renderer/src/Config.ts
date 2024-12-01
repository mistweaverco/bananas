type IceServer = {
  urls: string
  username?: string
  credential?: string
}

export const getRTCPeerConnectionConfig = async (): Promise<RTCConfiguration> => {
  const settings = await window.BananasApi.getSettings()
  const iceServers = settings.iceServers.map((server: IceServer) => {
    return {
      urls: server.urls,
      username: server.username,
      credential: server.credential
    }
  })
  return {
    iceServers
  }
}
