// backend/controller/venueController.js
import Venue from '../model/venue.js'

// ==========================================
// 1. VENUE LEVEL CONTROLLERS (Top Level)
// ==========================================

// ----------------------------------------------
// @desc:    Add a Venue for the Admin
// @route:   POST api/admin/venue
// @access:  Private, admin
// ----------------------------------------------
export const createVenue = async (req, res) => {
    try {
        const venue = await Venue.create(req.body)
        res.status(201).json({ success: true, data: venue })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// ----------------------------------------------
// @desc:    Get All Venue Details for the Admin
// @route:   GET api/admin/venue
// @access:  Private, admin
// ----------------------------------------------
export const getAllVenues = async (req, res) => {
    try {
        const venues = await Venue.find({ isActive: true })
        res.status(200).json({
            success: true,
            count: venues.length,
            data: venues,
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// ==========================================
// 2. AUDITORIUM LEVEL CONTROLLERS (Middle Level)
// ==========================================

// ----------------------------------------------
// @desc:    Add an Auditorium for the Venue
// @route:   POST api/admin/:venueId/auditoriums
// @access:  Private, admin
// ----------------------------------------------
export const addAuditorium = async (req, res) => {
    try {
        const { venueId } = req.params
        const { name, screens } = req.body

        // Prevent duplicate auditorium names within the same venue (case-insensitive)
        const existingVenue = await Venue.findOne({
            _id: venueId,
            'auditoriums.name': { $regex: new RegExp(`^${name}$`, 'i') },
        })

        if (existingVenue) {
            return res.status(400).json({
                success: false,
                message:
                    'An auditorium with this name already exists in the venue',
            })
        }

        const venue = await Venue.findByIdAndUpdate(
            venueId,
            { $push: { auditoriums: { name, screens: screens || [] } } },
            { new: true, runValidators: true },
        )

        if (!venue) {
            return res
                .status(404)
                .json({ success: false, message: 'Venue not found' })
        }

        res.status(201).json({ success: true, data: venue })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// ----------------------------------------------
// @desc:    Delete an Auditorium from the Venue
// @route:   DELETE api/admin/:venueId/auditoriums/:audiId
// @access:  Private, admin
// ----------------------------------------------
export const deleteAuditorium = async (req, res) => {
    try {
        const { venueId, audiId } = req.params

        const venue = await Venue.findByIdAndUpdate(
            venueId,
            { $pull: { auditoriums: { _id: audiId } } },
            { new: true },
        )

        if (!venue) {
            return res
                .status(404)
                .json({ success: false, message: 'Venue not found' })
        }

        res.status(200).json({ success: true, data: venue })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// ==========================================
// 3. SCREEN LEVEL CONTROLLERS (Innermost Level)
// ==========================================

// ----------------------------------------------
// @desc:    Add a Screen to the Auditorium
// @route:   POST api/admin/:venueId/auditoriums/:audiId/screens
// @access:  Private, admin
// ----------------------------------------------
export const addScreenToAuditorium = async (req, res) => {
    try {
        const { venueId, audiId } = req.params
        const { screenNumber, seatingCapacity, screenType } = req.body

        // Prevent duplicate screen numbers STRICTLY within this specific auditorium using $elemMatch
        const duplicateScreen = await Venue.findOne({
            _id: venueId,
            auditoriums: {
                $elemMatch: {
                    _id: audiId,
                    'screens.screenNumber': {
                        $regex: new RegExp(`^${screenNumber}$`, 'i'),
                    },
                },
            },
        })

        if (duplicateScreen) {
            return res.status(400).json({
                success: false,
                message:
                    'A screen with this number already exists in this auditorium',
            })
        }

        const venue = await Venue.findOneAndUpdate(
            { _id: venueId, 'auditoriums._id': audiId },
            {
                $push: {
                    'auditoriums.$.screens': {
                        screenNumber,
                        seatingCapacity,
                        screenType,
                    },
                },
            },
            { new: true, runValidators: true },
        )

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue or Auditorium not found',
            })
        }

        res.status(201).json({ success: true, data: venue })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// ----------------------------------------------
// @desc:    Update Screen Details of the Auditorium
// @route:   PUT api/admin/:venueId/auditoriums/:audiId/screens/:screenId
// @access:  Private, admin
// ----------------------------------------------
export const updateScreenDetails = async (req, res) => {
    try {
        const { venueId, audiId, screenId } = req.params
        const { screenNumber, seatingCapacity, screenType } = req.body

        // If screenNumber is being updated, verify it doesn't collide with another screen in the same auditorium
        if (screenNumber !== undefined) {
            const duplicateScreen = await Venue.findOne({
                _id: venueId,
                auditoriums: {
                    $elemMatch: {
                        _id: audiId,
                        screens: {
                            $elemMatch: {
                                _id: { $ne: screenId }, // Exclude current screen
                                screenNumber: {
                                    $regex: new RegExp(
                                        `^${screenNumber}$`,
                                        'i',
                                    ),
                                },
                            },
                        },
                    },
                },
            })

            if (duplicateScreen) {
                return res.status(400).json({
                    success: false,
                    message:
                        'Another screen with this number already exists in this auditorium',
                })
            }
        }

        const updateFields = {}
        if (screenNumber !== undefined)
            updateFields['auditoriums.$[audi].screens.$[screen].screenNumber'] =
                screenNumber
        if (seatingCapacity !== undefined)
            updateFields[
                'auditoriums.$[audi].screens.$[screen].seatingCapacity'
            ] = seatingCapacity
        if (screenType !== undefined)
            updateFields['auditoriums.$[audi].screens.$[screen].screenType'] =
                screenType

        const venue = await Venue.findOneAndUpdate(
            { _id: venueId },
            { $set: updateFields },
            {
                arrayFilters: [
                    { 'audi._id': audiId },
                    { 'screen._id': screenId },
                ],
                new: true,
                runValidators: true,
            },
        )

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue, Auditorium, or Screen not found',
            })
        }

        res.status(200).json({ success: true, data: venue })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}

// ----------------------------------------------
// @desc:    Delete a Screen From the Auditorium
// @route:   DELETE api/admin/:venueId/auditoriums/:audiId/screens/:screenId
// @access:  Private, admin
// ----------------------------------------------
export const deleteScreen = async (req, res) => {
    try {
        const { venueId, audiId, screenId } = req.params

        const venue = await Venue.findOneAndUpdate(
            { _id: venueId, 'auditoriums._id': audiId },
            {
                $pull: {
                    'auditoriums.$.screens': { _id: screenId },
                },
            },
            { new: true },
        )

        if (!venue) {
            return res.status(404).json({
                success: false,
                message: 'Venue or Auditorium not found',
            })
        }

        res.status(200).json({ success: true, data: venue })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}
// ----------------------------------------------
// @desc:    Update Venue Details (Top Level)
// @route:   PUT api/admin/venues/:venueId
// @access:  Private, admin
// ----------------------------------------------
export const updateVenue = async (req, res) => {
    try {
        const { venueId } = req.params
        const { name, address, city, pincode, isActive } = req.body

        const venue = await Venue.findById(venueId)

        if (!venue) {
            return res
                .status(404)
                .json({ success: false, message: 'Venue not found' })
        }

        // Update fields if provided
        if (name !== undefined) venue.name = name.trim()
        if (address !== undefined) venue.address = address.trim()
        if (city !== undefined) venue.city = city.trim()
        if (pincode !== undefined) venue.pincode = pincode.trim()
        if (isActive !== undefined) venue.isActive = isActive // Boolean safety check

        const updatedVenue = await venue.save()

        res.status(200).json({ success: true, data: updatedVenue })
    } catch (error) {
        res.status(400).json({ success: false, message: error.message })
    }
}
