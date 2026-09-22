// frontend/src/App.jsx

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './pages/Login'
import Home from './pages/Home'
import EventsCatalog from './pages/EventsCatalog'
import EventDetails from './pages/EventDetails'

const App = () => {
    return (
        <div className='min-h-screen bg-base-200 text-base-content font-sans flex flex-col'>
            <Navbar />
            <main className='flex-1'>
                <Routes>
                    <Route path='/' element={<Home />} />
                    <Route path='/events' element={<EventsCatalog />} />
                    <Route path='/events/:id' element={<EventDetails />} />
                    <Route path='/login' element={<Login />} />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default App
