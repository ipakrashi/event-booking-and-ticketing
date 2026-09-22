// backend/route/newsletterRoute.js

import express from 'express'
import { subscribeNewsletter } from '../controller/newsletterController.js'

const router = express.Router()

router.post('/subscribe', subscribeNewsletter)

export default router
