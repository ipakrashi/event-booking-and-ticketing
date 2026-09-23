// backend/route/paymentMethodRoute.js

import express from 'express'
import {
    getActivePaymentMethods,
    createPaymentMethod,
} from '../controller/paymentMethodController.js'
import { protect, restrictTo } from '../middleware/appMiddleware.js'

const router = express.Router()

router.get('/', getActivePaymentMethods)
router.post('/', protect, restrictTo('admin'), createPaymentMethod)

export default router
