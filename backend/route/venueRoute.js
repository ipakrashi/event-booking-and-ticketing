// backend/route/venueRoute.js

import express from 'express'
import { getAllVenues } from '../controller/venueController.js'

const router = express.Router()

// Public read access to active venues, auditoriums, and cities
router.get('/', getAllVenues)

export default router
