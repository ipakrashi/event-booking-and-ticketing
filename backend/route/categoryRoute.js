import express from 'express'
import { getEventCategories } from '../controller/eventCategoryController.js'
const router = express.Router()
router.get('/', getEventCategories)
export default router
