import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bulma/css/bulma.min.css'
import '@sweetalert2/theme-bulma/bulma.min.css'
import App from './App.svelte'
import './overrides.css'

const app = new App({
  target: document.getElementById('app')
})

export default app
