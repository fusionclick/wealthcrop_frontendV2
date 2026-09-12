import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import {store} from './redux/store'
import { Provider } from 'react-redux'
import { setupDevApiLogging } from './api/devLogger.js'

setupDevApiLogging()

createRoot(document.getElementById('root')).render(
//  <StrictMode>
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
// </StrictMode>
)
