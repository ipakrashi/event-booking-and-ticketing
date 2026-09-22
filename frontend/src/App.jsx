// frontend/src/App.jsx

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Login from './pages/Login'
import RegisterScreen from './pages/RegisterScreen'
import Home from './pages/Home'
import EventsCatalog from './pages/EventsCatalog'
import EventDetails from './pages/EventDetails'
import GatekeeperScanScreen from './pages/GatekeeperScanScreen'
import MyBookingsScreen from './pages/MyBookingsScreen'
import ProfileScreen from './pages/ProfileScreen'
import ForgotPasswordScreen from './pages/ForgotPasswordScreen'
import ResetPasswordScreen from './pages/ResetPasswordScreen'
import AdminBookingsScreen from './pages/admin/AdminBookingsScreen'
import AdminRolesScreen from './pages/admin/AdminRolesScreen'
import AdminCategoriesScreen from './pages/admin/AdminCategoriesScreen'
import AdminVenuesScreen from './pages/admin/AdminVenuesScreen'

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
                    <Route path='/register' element={<RegisterScreen />} />
                    <Route
                        path='/forgot-password'
                        element={<ForgotPasswordScreen />}
                    />
                    <Route
                        path='/reset-password/:token'
                        element={<ResetPasswordScreen />}
                    />
                    <Route path='/my-bookings' element={<MyBookingsScreen />} />
                    <Route path='/profile' element={<ProfileScreen />} />
                    <Route
                        path='/gatekeeper'
                        element={<GatekeeperScanScreen />}
                    />
                    <Route
                        path='/admin/bookings'
                        element={<AdminBookingsScreen />}
                    />
                    <Route path='/admin/roles' element={<AdminRolesScreen />} />
                    <Route
                        path='/admin/categories'
                        element={<AdminCategoriesScreen />}
                    />
                    <Route
                        path='/admin/venues'
                        element={<AdminVenuesScreen />}
                    />
                </Routes>
            </main>
            <Footer />
        </div>
    )
}

export default App
