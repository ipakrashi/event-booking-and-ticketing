// backend/route/courierRoute.js

import express from 'express'
import {
    getCouriers,
    createCourier,
    deleteCourier,
} from '../controller/courierController.js'
import { protect, admin } from '../middleware/appMiddleware.js'

const router = express.Router()

router.route('/').get(protect, getCouriers).post(protect, admin, createCourier)
router.route('/:id').delete(protect, admin, deleteCourier)

export default router
