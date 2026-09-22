import asyncHandler from 'express-async-handler'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../model/user.js'
import Role from '../model/role.js'

// ==========================================
// @desc    Register / Add a new user
// @route   POST /api/users
// @access  Public (Self-registration) / Private (Admin)
// ==========================================
// ==========================================
// @desc    Register / Add a new user
// @route   POST /api/users
// @access  Public (Self-registration) / Private (Admin)
// ==========================================
const addUser = asyncHandler(async (req, res) => {
    let {
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

    // 1. Validate required fields
    if (!userName || !email || !password) {
        res.status(400)
        throw new Error('User name, email, and password are required')
    }

    // 2. Default Role Fallback if not supplied by frontend
    if (!role) {
        let defaultRole = await Role.findOne({
            role: { $in: ['user', 'attendee', 'customer'] },
        })

        if (!defaultRole) {
            defaultRole =
                (await Role.findOne({ role: { $ne: 'admin' } })) ||
                (await Role.create({ role: 'user' }))
        }
        role = defaultRole._id
    }

    // 3. Prevent duplicate user registrations
    const userExists = await User.findOne({ email: email.toLowerCase().trim() })
    if (userExists) {
        res.status(400)
        throw new Error('User already exists with this email')
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // 5. Persist with optional chaining (?.) on every single optional string
    const user = await User.create({
        userName: userName?.trim(),
        email: email?.toLowerCase()?.trim(),
        password: hashedPassword,
        role,
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : null,
        state: state ? state.trim() : null,
        country: country ? country.trim() : 'India',
        pincode: pincode ? pincode.trim() : null,
        image: image ? image.trim() : null,
    })

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

    // Explicitly load password hash for identity verification
    const user = await User.findById(id).select('+password')
    if (!user) {
        res.status(404)
        throw new Error('User not found')
    }

    // -------------------------------------------------------------------------
    // 1. HARDENED PASSWORD CHANGE VERIFICATION
    // -------------------------------------------------------------------------
    if (req.body.password) {
        // If a regular user (or self) changes their password, require currentPassword
        if (!isAdmin || isSelf) {
            const { currentPassword } = req.body

            if (!currentPassword) {
                res.status(400)
                throw new Error(
                    'Current password is required to set a new password',
                )
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password)
            if (!isMatch) {
                res.status(401)
                throw new Error(
                    'Invalid current password. Please re-enter your existing password.',
                )
            }
        }

        if (req.body.password.length < 6) {
            res.status(400)
            throw new Error('New password must be at least 6 characters long')
        }

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(req.body.password, salt)
        user.tokenVersion = (user.tokenVersion || 0) + 1
    }

    // -------------------------------------------------------------------------
    // 2. EDITABLE CONTACT & PHYSICAL DISPATCH ATTRIBUTES
    // -------------------------------------------------------------------------
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

    const updatedUser = await user.save()

    // If password was changed for the active logged-in user, refresh their JWT cookie
    if (req.body.password && isSelf) {
        const token = jwt.sign(
            {
                userId: updatedUser._id,
                role: currentRoleName,
                tokenVersion: updatedUser.tokenVersion,
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' },
        )

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1 * 24 * 60 * 60 * 1000,
        })
    }

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

// In backend/controller/userController.js
import crypto from 'crypto'
import sendEmail from '../util/sendEmail.js'

// ==========================================
// @desc    Initiate password reset (Send Email)
// @route   POST /api/users/forgot-password
// @access  Public
// ==========================================
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body

    if (!email) {
        res.status(400)
        throw new Error('Please provide an email address')
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })

    // Security practice: Don't reveal if user does not exist
    if (!user) {
        return res.status(200).json({
            success: true,
            message:
                'If an account exists with that email, a password reset link has been dispatched.',
        })
    }

    // 1. Generate random token
    const resetToken = crypto.randomBytes(24).toString('hex')

    // 2. Hash token and save to database with 15-minute expiration
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000 // 15 mins

    await user.save()

    // 3. Create reset link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`

    // 4. Clean HTML email layout
    const htmlMessage = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 16px;">
            <h2 style="color: #6366f1; margin-bottom: 16px;">EventPass Password Reset</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong>${user.userName}</strong>,
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                You are receiving this email because a password reset request was initiated for your account. Click the button below to choose a new password:
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: bold; font-size: 14px; border-radius: 10px; display: inline-block;">
                    Reset My Password
                </a>
            </div>
            <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
                This link will expire in <strong>15 minutes</strong>. If you did not request this reset, you can safely ignore this email and your password will remain unchanged.
            </p>
            <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;" />
            <p style="font-size: 11px; color: #64748b; font-family: monospace; word-break: break-all;">
                Or copy and paste this link in your browser: ${resetUrl}
            </p>
        </div>
    `

    try {
        await sendEmail({
            to: user.email,
            subject: 'EventPass - Password Reset Request',
            html: htmlMessage,
        })

        res.status(200).json({
            success: true,
            message:
                'If an account exists with that email, a password reset link has been dispatched.',
        })
    } catch (err) {
        // Clear token if dispatch fails
        user.resetPasswordToken = null
        user.resetPasswordExpire = null
        await user.save()

        console.error('Email dispatch failure:', err)
        res.status(500)
        throw new Error('Email service unavailable. Please try again later.')
    }
})

// ==========================================
// @desc    Execute password reset using token
// @route   PUT /api/users/reset-password/:token
// @access  Public
// ==========================================
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    if (!password || password.length < 6) {
        res.status(400)
        throw new Error('Password must be at least 6 characters long')
    }

    // 1. Hash the incoming token to match database SHA-256 hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // 2. Find user with valid and unexpired token
    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
        res.status(400)
        throw new Error('Invalid or expired password reset token')
    }

    // 3. Set new hashed password
    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(password, salt)

    // 4. Invalidate prior reset tokens and increment token version
    user.resetPasswordToken = null
    user.resetPasswordExpire = null
    user.tokenVersion = (user.tokenVersion || 0) + 1

    await user.save()

    res.status(200).json({
        success: true,
        message:
            'Password reset successful! You can now log in with your new credentials.',
    })
})

export { addUser, getUsers, loginUser, logoutUser, editUser, deleteUser }
