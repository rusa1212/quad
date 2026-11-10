import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import BookmarkProvider from './context/BookmarkProvider.jsx'
import ProfileProvider from './context/ProfileProvider.jsx'
import ProgramsProvider from './context/ProgramsProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProgramsProvider>
          <ProfileProvider>
            <BookmarkProvider>
              <App />
            </BookmarkProvider>
          </ProfileProvider>
        </ProgramsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
