import express from 'express'
import { protect, admin } from '../middleware/appMiddleware.js'
import {
    addUser,
    getUsers,
    loginUser,
    logoutUser,
    editUser,
    deleteUser,
} from '../controller/userController.js'

const router = express.Router()

// Public authentication & registration routes
router.post('/', addUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)

// Admin-only user directory route
router.get('/', protect, admin, getUsers)

// Profile & Permission Management (Self or Admin)
router.route('/:id').put(protect, editUser).delete(protect, admin, deleteUser)

export default router
