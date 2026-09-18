// backend/controller/roleController.js

import asyncHandler from 'express-async-handler'
import Role from '../model/role.js'

// ----------------------------------------------
//@desc:     Add a Role for the Admin
// @route :  POST api/admin/role
// @access: Private, admin
// ----------------------------------------------

export const addRole = asyncHandler(async (req, res) => {
    const { role } = req.body
    if (!role) {
        res.status(400)
        throw new Error('Role is required')
    }
    const roleExists = await Role.findOne({ role })
    if (roleExists) {
        res.status(400)
        throw new Error('Role already exists in Database')
    }
    const newRole = await Role.create({ role })
    res.status(201).json({
        success: true,
        data: newRole,
    })
})

// ----------------------------------------------
//@desc:     Get Roles for the Admin
// @route :  GET api/admin/role
// @access: Private, admin
// ----------------------------------------------
export const getRoles = asyncHandler(async (req, res) => {
    const roles = await Role.find({})
    if (!roles) {
        res.status(400).json({ message: 'No Records found' })
    } else {
        res.status(200).json({ success: true, data: roles })
    }
})
