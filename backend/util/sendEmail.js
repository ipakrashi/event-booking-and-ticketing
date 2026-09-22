// backend/util/sendEmail.js

import nodemailer from 'nodemailer'

const sendEmail = async ({ to, subject, html }) => {
    // 1. Create reusable transporter object
    // Using Gmail SMTP (Requires an App Password from your Google Account)
    // Or you can configure generic SMTP through environment variables
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD, // 16-character App Password
        },
    })

    // 2. Email payload
    const mailOptions = {
        from: `"EventPass Security" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    }

    // 3. Dispatch
    const info = await transporter.sendMail(mailOptions)
    return info
}

export default sendEmail
