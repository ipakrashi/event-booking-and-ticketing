import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
    {
        userName: {
            type: String,
            required: [true, 'User name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'User email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email address',
            ],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            select: false,
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Role',
            required: [true, 'User Role is required'],
        },
        // --- Physical Dispatch & Contact Attributes ---
        phone: {
            type: String,
            trim: true,
            default: null,
            validate: {
                validator: function (v) {
                    // Accepts optional null or 10-digit standard Indian mobile format
                    return !v || /^[6-9]\d{9}$/.test(v)
                },
                message: (props) =>
                    `${props.value} is not a valid 10-digit mobile number`,
            },
        },
        address: {
            type: String,
            trim: true,
            default: null,
        },
        city: {
            type: String,
            trim: true,
            default: null,
        },
        state: {
            type: String,
            trim: true,
            default: null,
        },
        country: {
            type: String,
            trim: true,
            default: 'India',
        },
        pincode: {
            type: String,
            trim: true,
            default: null,
            validate: {
                validator: function (v) {
                    // Accepts optional null or 6-digit Indian PIN code
                    return !v || /^\d{6}$/.test(v)
                },
                message: (props) =>
                    `${props.value} is not a valid 6-digit PIN code`,
            },
        },
        image: {
            type: String,
            trim: true,
            default: null,
        },
        // --- System & Security State ---
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
        tokenVersion: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    },
)

const User = mongoose.model('User', userSchema)
export default User
