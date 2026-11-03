import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import BookmarkProvider from './context/BookmarkProvider.jsx'
import ProfileProvider from './context/ProfileProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ProfileProvider>
        <BookmarkProvider>
          <App />
        </BookmarkProvider>
      </ProfileProvider>
    </BrowserRouter>
  </StrictMode>,
)
