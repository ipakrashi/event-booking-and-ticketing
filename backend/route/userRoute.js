// backend/route/userRoute.js

import express from 'express'
import { protect, admin, restrictTo } from '../middleware/appMiddleware.js'
import {
    addUser,
    getUsers,
    loginUser,
    logoutUser,
    editUser,
    deleteUser,
} from '../controller/userController.js'
const router = express.Router()
router.post('/', addUser).post('/login', loginUser).post('/logout', logoutUser)
export default router
