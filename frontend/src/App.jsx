// frontend/src/App.jsx

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './pages/Login'
import Home from './pages/Home'
import EventsCatalog from './pages/EventsCatalog'
import EventDetails from './pages/EventDetails'
import GatekeeperScanScreen from './pages/GatekeeperScanScreen'
import MyBookingsScreen from './pages/MyBookingsScreen'

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
                    <Route path='/my-bookings' element={<MyBookingsScreen />} />
                    <Route
                        path='/gatekeeper'
                        element={<GatekeeperScanScreen />}
                    />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default App
