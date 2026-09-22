// backend/route/adminRoute.js

import express from 'express'
import { admin, protect, upload } from '../middleware/appMiddleware.js'
import { addRole, getRoles } from '../controller/roleController.js'
import {
    createEventCategory,
    updateEventCategory,
} from '../controller/eventCategoryController.js'
import {
    createVenue,
    getAllVenues,
    updateVenue,
    addAuditorium,
    deleteAuditorium,
    addScreenToAuditorium,
    updateScreenDetails,
    deleteScreen,
} from '../controller/venueController.js'
import {
    createEvent,
    updateEvent,
    deleteEvent,
} from '../controller/eventController.js'
import {
    generateEventPayout,
    recordPayoutDisbursement,
} from '../controller/payoutController.js'
import {
    getAllSubscribers,
    toggleSubscriberStatus,
} from '../controller/newsletterController.js'

const router = express.Router()

// Role routes: /api/admin/role
router
    .route('/role')
    .post(protect, admin, addRole)
    .get(protect, admin, getRoles)

// Category routes: /api/admin/category
router.post('/category', protect, admin, createEventCategory)
router.put('/category/:id', protect, admin, updateEventCategory)

// Venue routes: /api/admin/venues
router
    .route('/venues')
    .post(protect, admin, createVenue)
    .get(protect, admin, getAllVenues)

// Auditorium routes: /api/admin/venues/:venueId/auditoriums
router.post('/venues/:venueId/auditoriums', protect, admin, addAuditorium)
router.delete(
    '/venues/:venueId/auditoriums/:audiId',
    protect,
    admin,
    deleteAuditorium,
)

// Screen routes: /api/admin/venues/:venueId/auditoriums/:audiId/screens
router.post(
    '/venues/:venueId/auditoriums/:audiId/screens',
    protect,
    admin,
    addScreenToAuditorium,
)

// Venue Admin Routes
router.put('/venues/:venueId', protect, admin, updateVenue)
router.put(
    '/venues/:venueId/auditoriums/:audiId/screens/:screenId',
    protect,
    admin,
    updateScreenDetails,
)
router.delete(
    '/venues/:venueId/auditoriums/:audiId/screens/:screenId',
    protect,
    admin,
    deleteScreen,
)

// Event Admin Route:
// Flow: protect (token) -> admin (role) -> upload.single (parse multipart + save file) -> createEvent
router.post('/events', protect, admin, upload.single('poster'), createEvent)
router.put('/events/:id', protect, admin, upload.single('poster'), updateEvent)
router.delete('/events/:id', protect, admin, deleteEvent)

// Admin-only payout operations
router.post('/event/:eventId/generate', protect, admin, generateEventPayout)

router.post('/:payoutId/disburse', protect, admin, recordPayoutDisbursement)

router.get('/newsletter/subscribers', protect, admin, getAllSubscribers)
router.put(
    '/newsletter/subscribers/:id',
    protect,
    admin,
    toggleSubscriberStatus,
)

export default router
