// backend/controller/userController.js

import asyncHandler from 'express-async-handler'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../model/user.js'

// ==========================================
// @desc    Register / Add a new user
// @route   POST /api/users
// @access  Private/Admin
// ==========================================
const addUser = asyncHandler(async (req, res) => {
    const { userName, email, password, role } = req.body || {}

    // 1. Validate required schema invariants
    if (!userName || !email || !password || !role) {
        res.status(400)
        throw new Error('User name, email, password, and role are required')
    }

    // 2. Prevent duplicate user registrations
    const userExists = await User.findOne({ email })
    if (userExists) {
        res.status(400)
        throw new Error('User already exists with this email')
    }

    // 3. Cryptographic hash before storage
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 4. Persistence
    const user = await User.create({
        userName,
        email,
        password: hashedPassword,
        role,
    })

    // 5. RESTful 201 Created response (password omitted via schema toJSON transform)
    res.status(201).json({
        success: true,
        data: user,
    })
})

// ==========================================
// @desc    Get all users with populated roles
// @route   GET /api/users
// @access  Private/Admin
// ==========================================
const getUsers = asyncHandler(async (req, res) => {
    // Return empty array with 200 OK if no records exist (standard REST practice)
    const users = await User.find({}).populate('role')

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

    // Explicitly demand the password hash (hidden by select: false in schema)
    const user = await User.findOne({ email })
        .select('+password')
        .populate('role')

    if (user && (await bcrypt.compare(password, user.password))) {
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
    const token = req.cookies.jwt

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            const targetId = decoded.userId || decoded.id

            // Invalidate session immediately:
            // 1. Reset lastLogin to epoch (frees concurrency lock)
            // 2. Increment tokenVersion (revokes copied token server-side)
            await User.findByIdAndUpdate(targetId, {
                $set: { lastLogin: new Date(0) },
                $inc: { tokenVersion: 1 },
            })
        } catch {
            // If token expired or is malformed, proceed to clear client cookie
        }
    }

    // Flags MUST mirror loginUser for the browser to match and purge the cookie
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
    const currentRoleName = req.user?.role?.name?.toLowerCase()
    const isSelf = req.user?._id?.toString() === req.params.id

    // Authorization: User can update own profile, only admin can update others
    if (currentRoleName !== 'admin' && !isSelf) {
        res.status(403)
        throw new Error('Not authorized to edit this profile')
    }

    const user = await User.findById(req.params.id)
    if (!user) {
        res.status(404)
        throw new Error('User not found')
    }

    // Editable basic fields
    user.firstName = req.body.firstName || user.firstName
    user.lastName = req.body.lastName || user.lastName
    user.email = req.body.email || user.email
    user.image = req.body.image || user.image
    user.address = req.body.address || user.address
    user.city = req.body.city || user.city
    user.pincode = req.body.pincode || user.pincode
    user.phone = req.body.phone || user.phone

    // Privileged fields: Only Admin can change roles or toggle active status
    if (currentRoleName === 'admin') {
        if (req.body.role) user.role = req.body.role
        if (req.body.isActive !== undefined) user.isActive = req.body.isActive
    }

    // Password reset update
    if (req.body.password) {
        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(req.body.password, salt)
    }

    const updatedUser = await user.save()

    res.status(200).json({
        success: true,
        data: updatedUser,
    })
})

// ==========================================
// @desc    Delete user record
// @route   DELETE /api/users/:id
// @access  Private/Admin
// ==========================================
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)

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

// ==========================================
// @desc    Get all distinct role assignments
// @route   GET /api/users/roles
// @access  Private/Admin
// ==========================================
// const getRoles = asyncHandler(async (req, res) => {
//     // Populate the distinct role references so frontend receives full role details
//     const roleIds = await User.distinct('role')
//     const usersWithRoles = await User.find({ role: { $in: roleIds } })
//         .populate('role')
//         .select('role')

//     // Extract deduplicated role objects
//     const uniqueRolesMap = new Map()
//     usersWithRoles.forEach((u) => {
//         if (u.role && !uniqueRolesMap.has(u.role._id.toString())) {
//             uniqueRolesMap.set(u.role._id.toString(), u.role)
//         }
//     })

//     res.status(200).json({
//         success: true,
//         data: Array.from(uniqueRolesMap.values()),
//     })
// })

export { addUser, getUsers, loginUser, logoutUser, editUser, deleteUser }
