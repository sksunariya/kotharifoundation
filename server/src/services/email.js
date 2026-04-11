const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Skipping email.');
    return;
  }
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"${process.env.PLATFORM_NAME || 'Kothari Foundation'}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
    text,
  });
};

const sendOtpEmail = async ({ email, name, otp }) => {
  await sendEmail({
    to: email,
    subject: 'Verify Your Email - Kothari Foundation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email</h2>
        <p>Dear ${name},</p>
        <p>Thank you for registering with Kothari Foundation. Use the OTP below to verify your email address:</p>
        <div style="text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background: #f1f5f9; border: 2px dashed #2563eb; border-radius: 12px; padding: 20px 40px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
          </div>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <p>If you did not create an account, you can safely ignore this email.</p>
        <p>Best regards,<br>Kothari Foundation Team</p>
      </div>
    `,
  });
};

const sendBookingConfirmation = async ({ studentEmail, studentName, bookingRef, slotTitle, startTime, meetLink }) => {
  const formattedDate = new Date(startTime).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  await sendEmail({
    to: studentEmail,
    subject: `Booking Confirmed - ${bookingRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Booking Confirmed!</h2>
        <p>Dear ${studentName},</p>
        <p>Your booking has been confirmed. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; font-weight: bold;">Booking Ref:</td><td style="padding: 8px;">${bookingRef}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Session:</td><td style="padding: 8px;">${slotTitle}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Date & Time:</td><td style="padding: 8px;">${formattedDate} IST</td></tr>
          ${meetLink ? `<tr><td style="padding: 8px; font-weight: bold;">Meet Link:</td><td style="padding: 8px;"><a href="${meetLink}">${meetLink}</a></td></tr>` : ''}
        </table>
        <p>Please join the session on time. The Google Meet link will be active 5 minutes before the session.</p>
        <p>Best regards,<br>Kothari Foundation Team</p>
      </div>
    `,
  });
};

const sendPaymentRejection = async ({ studentEmail, studentName, bookingRef, reason }) => {
  await sendEmail({
    to: studentEmail,
    subject: `Payment Verification Failed - ${bookingRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment Verification Failed</h2>
        <p>Dear ${studentName},</p>
        <p>Unfortunately, we could not verify your payment for booking <strong>${bookingRef}</strong>.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>Please log in to your account and resubmit your payment details with a clear screenshot.</p>
        <p>Best regards,<br>Kothari Foundation Team</p>
      </div>
    `,
  });
};

const sendBookingCancellation = async ({ studentEmail, studentName, bookingRef, slotTitle }) => {
  await sendEmail({
    to: studentEmail,
    subject: `Booking Cancelled - ${bookingRef}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Booking Cancelled</h2>
        <p>Dear ${studentName},</p>
        <p>Your booking <strong>${bookingRef}</strong> for <strong>${slotTitle}</strong> has been cancelled.</p>
        <p>If you believe this is a mistake, please contact us at ${process.env.SUPPORT_EMAIL || 'support@kotharifoundation.com'}.</p>
        <p>Best regards,<br>Kothari Foundation Team</p>
      </div>
    `,
  });
};

const sendPasswordReset = async ({ email, name, resetUrl }) => {
  await sendEmail({
    to: email,
    subject: 'Reset Your Password - Kothari Foundation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>Dear ${name},</p>
        <p>We received a request to reset the password for your account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This link expires in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
        <p style="color: #6b7280; font-size: 12px;">Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
        <p>Best regards,<br>Kothari Foundation Team</p>
      </div>
    `,
  });
};

const sendQueryNotification = async ({ adminEmail, queryName, queryEmail, subject, message }) => {
  await sendEmail({
    to: adminEmail,
    subject: `New Query Received: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Query Received</h2>
        <p>A new query has been submitted on the Kothari Foundation portal.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; font-weight: bold; background:#f8fafc;">Name:</td><td style="padding: 8px;">${queryName}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; background:#f8fafc;">Email:</td><td style="padding: 8px;">${queryEmail}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; background:#f8fafc;">Subject:</td><td style="padding: 8px;">${subject}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; background:#f8fafc; vertical-align:top;">Message:</td><td style="padding: 8px;">${message}</td></tr>
        </table>
        <p>Please log in to the admin portal to view and respond to this query.</p>
        <p>Best regards,<br>Kothari Foundation System</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendBookingConfirmation,
  sendPaymentRejection,
  sendBookingCancellation,
  sendPasswordReset,
  sendQueryNotification,
};
