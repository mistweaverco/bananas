import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bulma/css/bulma.min.css'
import App from './App.svelte'
import './overrides.css'
import { mount } from 'svelte'

const app = mount(App, { target: document.getElementById('app') })

export default app
