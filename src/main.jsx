import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ConfigProvider } from './ConfigContext' // 👈 必须有这一行
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 👇 必须用这个包住 App，否则所有页面都会白屏 */}
    <ConfigProvider>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)
