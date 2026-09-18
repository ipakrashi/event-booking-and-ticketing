// backend/model/user.js
import mongoose from 'mongoose'
const userSchema = mongoose.Schema(
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
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
        tokenVersion: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    },
)
const User = mongoose.model('User', userSchema)
export default User
