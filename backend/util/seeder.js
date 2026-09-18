// backend/util/seeder.js

import mongoose from 'mongoose'
import dotenv from 'dotenv/config'
import Role from './model/role.js'
import connectDB from './connectDb.js'

const seedRoles = async () => {
    try {
        await connectDB()
        await Role.deleteMany() // Reset roles
        await Role.insertMany([{ role: 'admin' }])
        console.log('Roles seeded successfully!')
        process.exit()
    } catch (error) {
        console.error(`Seeding failed: ${error.message}`)
        process.exit(1)
    }
}

seedRoles()
