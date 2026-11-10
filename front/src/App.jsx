import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ListPage from './pages/ListPage.jsx'
import DetailPage from './pages/DetailPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import AskPage from './pages/AskPage.jsx'
import CalendarPage from './pages/CalendarPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<ListPage />} />
          <Route path="/programs/:id" element={<DetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/ask" element={<AskPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  )
}

export default App
