import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/variables.css'
import './styles/global.css'
import './styles/components.css'
import './styles/responsive.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* HashRouter permet de naviguer sur GitHub Pages sans configuration serveur. */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
