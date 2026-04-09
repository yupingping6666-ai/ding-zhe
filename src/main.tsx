import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ApiProvider } from '@/contexts/ApiContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ApiProvider>
      <App />
    </ApiProvider>
  </React.StrictMode>,
)