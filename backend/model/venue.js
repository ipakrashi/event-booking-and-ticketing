// backend/model/venue.js
import mongoose from 'mongoose'

// 1. Innermost Level: Screen / Stage / Zone
const screenSchema = new mongoose.Schema(
    {
        screenNumber: {
            type: String, // e.g., "Screen 1", "Main Stage", "Balcony Tier"
            required: [true, 'Screen/Zone name is required'],
            trim: true,
        },
        seatingCapacity: {
            type: Number,
            required: [true, 'Seating capacity is required'],
            min: [1, 'Capacity must be at least 1'],
        },
        screenType: {
            type: String, // e.g., 'IMAX', 'Standard', 'Open Air Stage', 'Banquet Floor'
            default: 'Standard',
            trim: true,
        },
    },
    { _id: true },
)

// 2. Middle Level: Auditorium / Hall
const auditoriumSchema = new mongoose.Schema(
    {
        name: {
            type: String, // e.g., "Hall A", "Audi 2", "Grand Ballroom"
            required: [true, 'Auditorium name is required'],
            trim: true,
        },
        screens: [screenSchema],
    },
    { _id: true },
)

// 3. Top Level: Venue Master
const venueSchema = new mongoose.Schema(
    {
        name: {
            type: String, // e.g., "PVR INOX South City", "Science City Convention Complex"
            required: [true, 'Venue name is required'],
            trim: true,
            unique: true,
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        city: {
            type: String,
            required: [true, 'City is required'],
            trim: true,
            lowercase: true,
            index: true,
        },
        pincode: {
            type: String,
            trim: true,
        },
        auditoriums: [auditoriumSchema],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
)

const Venue = mongoose.model('Venue', venueSchema)
export default Venue
