// backend/route/reviewRoute.js

import express from 'express'
import { getLatestReviews } from '../controller/reviewController.js'

const router = express.Router()

router.get('/latest', getLatestReviews)

export default router
