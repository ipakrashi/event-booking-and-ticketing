// backend/model/role.js
import mongoose from 'mongoose'
const roleSchema = mongoose.Schema(
    {
        role: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
    },
    {
        timestamps: true,
    },
)
const Role = mongoose.model('Role', roleSchema)
export default Role
