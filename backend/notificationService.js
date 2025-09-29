// notificationService.js
const nodemailer = require('nodemailer')

// Mail transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.FROM_EMAIL, // your Gmail address
    pass: process.env.SMTP_PASS // your Gmail app password
  }
})


async function sendMail(to, subject, html) {
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      html
    })
    console.log(`Mail sent: ${info.messageId}`)
  } catch (err) {
    console.error('Mail error:', err)
  }
}

async function run() {
  const recipient = 'theromeirofernandes@gmail.com'

  // First mail: driver 10 minutes away
  await sendMail(
    recipient,
    '🚖 Driver Update: 10 Minutes Away',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Driver Notification</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px;">
        <p>Your driver is approximately <strong>10 minutes away</strong>.</p>
        <p>Get ready to meet them at your pickup location.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          This is an automated notification.
        </p>
      </div>
    </div>
    `
  )

  // Second mail: driver arrived
  await sendMail(
    recipient,
    '🚖 Driver Update: Driver Has Arrived',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #16a34a; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Driver Notification</h2>
      </div>
      <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px;">
        <p>Your driver has <strong>arrived</strong> at your location.</p>
        <p>Please head outside to meet them.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          This is an automated notification.
        </p>
      </div>
    </div>
    `
  )
}

run()
