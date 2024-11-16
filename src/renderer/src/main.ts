import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bulma/css/bulma.min.css'
import App from './App.svelte'

// import { webRTC } from "./lib/WebRTC";

// const startFunc = async () => {
//   await webRTC({
//     localVideo: document.getElementById("localVideo") as HTMLVideoElement,
//     remoteVideo: document.getElementById("remoteVideo") as HTMLVideoElement,
//     localOffer: document.getElementById("localOffer") as HTMLTextAreaElement,
//     remoteOffer: document.getElementById("remoteOffer") as HTMLTextAreaElement,
//     localOfferButton: document.getElementById(
//       "localOfferButton",
//     ) as HTMLButtonElement,
//     remoteOfferButton: document.getElementById(
//       "remoteOfferButton",
//     ) as HTMLButtonElement,
//   });
// };

const app = new App({
  target: document.getElementById('app')
})

export default app
