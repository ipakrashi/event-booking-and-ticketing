import asyncHandler from 'express-async-handler'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../model/user.js'

// ==========================================
// @desc    Register / Add a new user
// @route   POST /api/users
// @access  Public (Self-registration) / Private (Admin)
// ==========================================
const addUser = asyncHandler(async (req, res) => {
    const {
        userName,
        email,
        password,
        role,
        phone,
        address,
        city,
        state,
        country,
        pincode,
        image,
    } = req.body || {}

    // 1. Validate required schema invariants
    if (!userName || !email || !password || !role) {
        res.status(400)
        throw new Error('User name, email, password, and role are required')
    }

    // 2. Prevent duplicate user registrations
    const userExists = await User.findOne({ email: email.toLowerCase().trim() })
    if (userExists) {
        res.status(400)
        throw new Error('User already exists with this email')
    }

    // 3. Cryptographic hash before storage
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 4. Persistence with physical dispatch attributes
    const user = await User.create({
        userName: userName.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || 'India',
        pincode: pincode?.trim() || null,
        image: image?.trim() || null,
    })

    // Fetch user without password hash for clean return
    const createdUser = await User.findById(user._id).populate('role', 'role')

    res.status(201).json({
        success: true,
        data: createdUser,
    })
})

// ==========================================
// @desc    Get all users with populated roles
// @route   GET /api/users
// @access  Private/Admin
// ==========================================
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({})
        .populate('role', 'role')
        .sort({ createdAt: -1 })

    res.status(200).json({
        success: true,
        count: users.length,
        data: users,
    })
})

// ==========================================
// @desc    Authenticate user, issue JWT & cookie
// @route   POST /api/users/login
// @access  Public
// ==========================================
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        res.status(400)
        throw new Error('Please provide email and password')
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
        .select('+password')
        .populate('role')

    if (user && (await bcrypt.compare(password, user.password))) {
        if (!user.isActive) {
            res.status(403)
            throw new Error(
                'Your account has been deactivated. Please contact support.',
            )
        }

        // --- STRICT CONCURRENCY BLOCKER ---
        const SESSION_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes
        if (
            user.lastLogin &&
            Date.now() - user.lastLogin.getTime() < SESSION_TIMEOUT_MS
        ) {
            res.status(403)
            throw new Error(
                'An active session exists on another device. Please log out there, or wait 15 minutes for it to expire.',
            )
        }

        // Increment version to revoke prior active tokens & update heartbeat
        user.tokenVersion = (user.tokenVersion || 0) + 1
        user.lastLogin = new Date()
        await user.save()

        // Generate JWT payload
        const roleName = user.role?.role || 'user'
        const token = jwt.sign(
            {
                userId: user._id,
                role: roleName,
                tokenVersion: user.tokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
        )

        // Set hardened HTTP-Only Cookie
        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
        })

        res.status(200).json({
            _id: user._id,
            userName: user.userName,
            email: user.email,
            role: roleName,
            phone: user.phone,
            address: user.address,
            city: user.city,
            state: user.state,
            country: user.country,
            pincode: user.pincode,
        })
    } else {
        res.status(401)
        throw new Error('Invalid email or password')
    }
})

// ==========================================
// @desc    Log out user, clear cookie & revoke token
// @route   POST /api/users/logout
// @access  Public / Authenticated
// ==========================================
const logoutUser = asyncHandler(async (req, res) => {
    const token = req.cookies?.jwt

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            const targetId = decoded.userId || decoded.id

            await User.findByIdAndUpdate(targetId, {
                $set: { lastLogin: new Date(0) },
                $inc: { tokenVersion: 1 },
            })
        } catch {
            // Expired or malformed token
        }
    }

    res.cookie('jwt', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
    })

    res.status(200).json({
        success: true,
        message: 'User logged out successfully',
    })
})

// ==========================================
// @desc    Update user profile or permissions
// @route   PUT /api/users/:id
// @access  Private (Self or Admin)
// ==========================================
const editUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid user ID format')
    }

    const currentRoleName = (
        req.user?.role?.role ||
        req.user?.role ||
        ''
    ).toLowerCase()
    const isSelf = req.user?._id?.toString() === id
    const isAdmin = currentRoleName === 'admin'

    if (!isAdmin && !isSelf) {
        res.status(403)
        throw new Error('Not authorized to edit this profile')
    }

    const user = await User.findById(id)
    if (!user) {
        res.status(404)
        throw new Error('User not found')
    }

    // Editable basic & physical dispatch fields
    if (req.body.userName !== undefined)
        user.userName = req.body.userName.trim()
    if (req.body.email !== undefined)
        user.email = req.body.email.toLowerCase().trim()
    if (req.body.phone !== undefined)
        user.phone = req.body.phone ? req.body.phone.trim() : null
    if (req.body.address !== undefined)
        user.address = req.body.address ? req.body.address.trim() : null
    if (req.body.city !== undefined)
        user.city = req.body.city ? req.body.city.trim() : null
    if (req.body.state !== undefined)
        user.state = req.body.state ? req.body.state.trim() : null
    if (req.body.country !== undefined)
        user.country = req.body.country ? req.body.country.trim() : 'India'
    if (req.body.pincode !== undefined)
        user.pincode = req.body.pincode ? req.body.pincode.trim() : null
    if (req.body.image !== undefined)
        user.image = req.body.image ? req.body.image.trim() : null

    // Privileged fields: strictly Admin only
    if (isAdmin) {
        if (req.body.role !== undefined) user.role = req.body.role
        if (req.body.isActive !== undefined)
            user.isActive = Boolean(req.body.isActive)
    }

    // Password update handler
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(req.body.password, salt)
    }

    const updatedUser = await user.save()

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
            _id: updatedUser._id,
            userName: updatedUser.userName,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            address: updatedUser.address,
            city: updatedUser.city,
            state: updatedUser.state,
            country: updatedUser.country,
            pincode: updatedUser.pincode,
            image: updatedUser.image,
            isActive: updatedUser.isActive,
        },
    })
})

// ==========================================
// @desc    Delete user record
// @route   DELETE /api/users/:id
// @access  Private/Admin
// ==========================================
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400)
        throw new Error('Invalid user ID format')
    }

    const user = await User.findById(id)
    if (!user) {
        res.status(404)
        throw new Error('User not found')
    }

    await user.deleteOne()

    res.status(200).json({
        success: true,
        message: 'User removed successfully',
    })
})

export { addUser, getUsers, loginUser, logoutUser, editUser, deleteUser }
