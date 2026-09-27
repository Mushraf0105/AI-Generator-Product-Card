// Entry point for the React application
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Import global styles including Tailwind CSS v4
import './index.css'

// Import the main application component
import App from './App.jsx'

// Render the application into the DOM using StrictMode for best practices
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
