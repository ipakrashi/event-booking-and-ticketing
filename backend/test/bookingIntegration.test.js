import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import jwt from 'jsonwebtoken'
import app from '../app.js'
import User from '../model/user.js'
import Event from '../model/event.js'
import Booking from '../model/booking.js'
import Role from '../model/role.js'

let mongoServer
let customerCookie
let adminCookie
let customerUser
let adminUser
let sampleEvent
let targetTier

// Helper to sign JWT using the exact environment secret and payload expected by protect
const createAuthCookie = (user, roleName) => {
    const token = jwt.sign(
        {
            userId: user._id,
            role: roleName,
            tokenVersion: user.tokenVersion ?? 0,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' },
    )
    return `jwt=${token}`
}

beforeAll(async () => {
    // Ensure JWT_SECRET fallback exists if not loaded by dotenv
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)

    // 1. Seed Roles
    const customerRole = await Role.create({ role: 'customer' })
    const adminRole = await Role.create({ role: 'admin' })

    // 2. Seed Users with tokenVersion initialized
    customerUser = await User.create({
        userName: 'Test Customer',
        email: 'customer@example.com',
        password: 'Password123!',
        role: customerRole._id,
        phone: '9876543210',
        address: '12 Salt Lake Sector V',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        pincode: '700091',
        tokenVersion: 0,
    })

    adminUser = await User.create({
        userName: 'Test Admin',
        email: 'admin@example.com',
        password: 'Password123!',
        role: adminRole._id,
        phone: '9876543211',
        address: 'Ballygunge Circular Road',
        city: 'Kolkata',
        state: 'West Bengal',
        country: 'India',
        pincode: '700019',
        tokenVersion: 0,
    })

    // Generate valid session cookies
    customerCookie = createAuthCookie(customerUser, 'customer')
    adminCookie = createAuthCookie(adminUser, 'admin')

    // 3. Mock Relational ObjectIds for Event Invariants
    const dummyCategoryId = new mongoose.Types.ObjectId()
    const dummyVenueId = new mongoose.Types.ObjectId()
    const dummyAuditoriumId = new mongoose.Types.ObjectId()
    const dummyScreenId = new mongoose.Types.ObjectId()

    // 4. Seed Published Event
    sampleEvent = await Event.create({
        title: 'Rock Symphony Kolkata',
        description: 'Annual Classic Rock Concert',
        status: 'published',
        organizerId: adminUser._id,
        categoryId: dummyCategoryId,
        venueId: dummyVenueId,
        auditoriumId: dummyAuditoriumId,
        screenId: dummyScreenId,
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 90000000),
        commissionRate: 10,
        platformGSTRate: 18,
        ticketGSTRate: 18,
        ticketTiers: [
            {
                name: 'VIP Front Row',
                price: 1500,
                totalQuantity: 50,
                soldQuantity: 0,
            },
        ],
    })

    targetTier = sampleEvent.ticketTiers[0]
})

afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})

describe('Comprehensive Booking & Gate Entry Pipeline Integration Tests', () => {
    let createdBookingId
    let passToken

    // ----------------------------------------------------
    // TEST 1: INVENTORY RESERVATION & BOOKING CREATION
    // ----------------------------------------------------
    it('POST /api/bookings - Should create booking and decrement available inventory', async () => {
        const payload = {
            eventId: sampleEvent._id.toString(),
            ticketTierId: targetTier._id.toString(),
            bookedQty: 2,
        }

        const res = await request(app)
            .post('/api/bookings')
            .set('Cookie', [customerCookie])
            .send(payload)

        expect(res.statusCode).toBe(201)
        expect(res.body.success).toBe(true)
        expect(res.body.data.bookedQty).toBe(2)
        expect(res.body.data.totalAmount).toBe(3000)
        expect(res.body.data.bookingStatus).toBe('request_sent')
        expect(res.body.data.paymentStatus).toBe('not_paid')
        expect(res.body.data.entryPassToken).toBeNull()

        createdBookingId = res.body.data._id

        // Verify Database Inventory Lock
        const updatedEvent = await Event.findById(sampleEvent._id)
        const updatedTier = updatedEvent.ticketTiers.id(targetTier._id)
        expect(updatedTier.soldQuantity).toBe(2)
    })

    // ----------------------------------------------------
    // TEST 2: PAYMENT, CONFIRMATION & TOKEN CREATION
    // ----------------------------------------------------
    it('PUT /api/bookings/:id/pay - Should record payment and generate 32-byte pass token', async () => {
        const paymentPayload = {
            paymentAmount: 3000,
            paymentDetails: {
                mode: 'upi',
                trxnId: 'UPI-IND-TEST-9988',
            },
        }

        const res = await request(app)
            .put(`/api/bookings/${createdBookingId}/pay`)
            .set('Cookie', [customerCookie])
            .send(paymentPayload)

        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.paymentStatus).toBe('paid')
        expect(res.body.data.bookingStatus).toBe('confirmed')
        expect(res.body.data.entryPassToken).toBeDefined()
        expect(res.body.data.entryPassToken).toHaveLength(64) // 32 bytes hex = 64 characters

        passToken = res.body.data.entryPassToken
    })

    // ----------------------------------------------------
    // TEST 3: PASS RETRIEVAL & QR DATA URI RENDERING
    // ----------------------------------------------------
    it('GET /api/bookings/:id/entry-pass - Should deliver event meta and base64 QR Data URI', async () => {
        const res = await request(app)
            .get(`/api/bookings/${createdBookingId}/entry-pass`)
            .set('Cookie', [customerCookie])

        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.qrCode).toMatch(/^data:image\/png;base64,/)
        expect(res.body.data.entryPassToken).toBe(passToken)
        expect(res.body.data.isCheckedIn).toBe(false)
        expect(res.body.data.attendee.bookedQty).toBe(2)
    })

    // ----------------------------------------------------
    // TEST 4: GATE SCANNER ADMISSION (FIRST SCAN)
    // ----------------------------------------------------
    it('POST /api/bookings/verify-entry - Should admit attendee and record check-in audit timestamp', async () => {
        const res = await request(app)
            .post('/api/bookings/verify-entry')
            .set('Cookie', [adminCookie])
            .send({ passToken })

        expect(res.statusCode).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.message).toMatch(/Entry Approved/i)
        expect(res.body.data.admittedQuantity).toBe(2)
        expect(res.body.data.checkInTimestamp).toBeDefined()

        // Verify Database Persistence
        const dbBooking = await Booking.findById(createdBookingId)
        expect(dbBooking.isCheckedIn).toBe(true)
        expect(dbBooking.checkedInBy.toString()).toBe(adminUser._id.toString())
    })

    // ----------------------------------------------------
    // TEST 5: ANTI-PASSBACK BARRIER (DOUBLE SCAN ATTEMPT)
    // ----------------------------------------------------
    it('POST /api/bookings/verify-entry - Should reject re-entry on previously scanned pass', async () => {
        const res = await request(app)
            .post('/api/bookings/verify-entry')
            .set('Cookie', [adminCookie])
            .send({ passToken })

        expect(res.statusCode).toBe(400)
        expect(res.body.message).toMatch(/Pass has ALREADY been scanned/i)
    })

    // ----------------------------------------------------
    // TEST 6: CANCELLATION & ATOMIC INVENTORY ROLLBACK
    // ----------------------------------------------------
    it('PUT /api/bookings/:id/cancel - Should restore tier soldQuantity and nullify entryPassToken', async () => {
        // Create a secondary booking to cancel
        const bookingRes = await request(app)
            .post('/api/bookings')
            .set('Cookie', [customerCookie])
            .send({
                eventId: sampleEvent._id.toString(),
                ticketTierId: targetTier._id.toString(),
                bookedQty: 3,
            })

        expect(bookingRes.statusCode).toBe(201)
        const cancelBookingId = bookingRes.body.data._id

        // Verify inventory incremented to 5 (2 from test 1 + 3 here)
        let tierSnap = (await Event.findById(sampleEvent._id)).ticketTiers.id(
            targetTier._id,
        )
        expect(tierSnap.soldQuantity).toBe(5)

        // Cancel the 3 tickets
        const cancelRes = await request(app)
            .put(`/api/bookings/${cancelBookingId}/cancel`)
            .set('Cookie', [customerCookie])
            .send({
                cancelledQty: 3,
                cancellationReason: 'Travel schedule conflict',
            })

        expect(cancelRes.statusCode).toBe(200)
        expect(cancelRes.body.success).toBe(true)
        expect(cancelRes.body.data.bookingStatus).toBe('cancelled')
        expect(cancelRes.body.data.entryPassToken).toBeNull()

        // Verify Inventory Was Rolled Back: 5 - 3 = 2
        tierSnap = (await Event.findById(sampleEvent._id)).ticketTiers.id(
            targetTier._id,
        )
        expect(tierSnap.soldQuantity).toBe(2)
    })
})
