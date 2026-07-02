const nodemailer = require('nodemailer');

const sendOtpEmail = async (email, otp) => {
  // DEBUG: Log env values to check if .env is being read
  console.log(`\n🔍 [EMAIL DEBUG]`);
  console.log(`   EMAIL_USER : "${process.env.EMAIL_USER}"`);
  console.log(`   EMAIL_PASS : "${process.env.EMAIL_PASS ? '****' + process.env.EMAIL_PASS.slice(-4) : 'EMPTY'}"`);
  console.log(`   EMAIL_HOST : "${process.env.EMAIL_HOST}"`);
  console.log(`   EMAIL_PORT : "${process.env.EMAIL_PORT}"\n`);

  // Check if SMTP configurations are present in .env
  const isSmtpConfigured = process.env.EMAIL_USER && process.env.EMAIL_PASS;

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: parseInt(process.env.EMAIL_PORT) === 465,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      const mailOptions = {
        from: `"CampusHive Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your CampusHive Email Account',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0f172a; color: #f1f5f9; border-radius: 10px; max-width: 600px; margin: auto;">
            <h2 style="color: #f59e0b; text-align: center;">CampusHive Account Verification</h2>
            <hr style="border-color: #334155; margin-bottom: 20px;"/>
            <p>Hello Student,</p>
            <p>Thank you for registering at CampusHive. To complete your verification, please use the following One-Time Password (OTP):</p>
            <div style="font-size: 24px; font-weight: bold; background-color: #020617; color: #f59e0b; padding: 15px; border-radius: 8px; text-align: center; letter-spacing: 4px; border: 1px solid #e2e8f0; margin: 20px 0;">
              ${otp}
            </div>
            <p>This verification OTP is valid for 10 minutes. Do not share this code with anyone.</p>
            <p>If you did not initiate this registration request, please ignore this email.</p>
            <p style="margin-top: 30px; font-size: 11px; color: #64748b; text-align: center;">
              CampusHive © 2026 • Verified College Networks
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP Email Service] Real verification OTP sent to: ${email}`);
      return { success: true, simulated: false };
    } catch (error) {
      console.error(`\n❌ [SMTP Email Error - FULL DETAILS]:`);
      console.error(`   Message : ${error.message}`);
      console.error(`   Code    : ${error.code}`);
      console.error(`   Response: ${error.response}`);
      console.error(`   Check   : Is Gmail App Password correct? Is 2FA enabled on your Google account?`);
      console.error(`   Email Used: ${process.env.EMAIL_USER}\n`);
      // Re-throw so the caller (authController) properly reports the failure to the user
      throw new Error(`Failed to dispatch verification OTP. Please try again or contact support. (${error.message})`);
    }
  }

  // ── Local dev fallback ──────────────────────────────────────────────────────
  // SMTP credentials are NOT set → print OTP to server console (local dev only)
  console.log(`
============================================================
  [LOCAL DEV - SIMULATED OTP SERVICE]
  Recipient Email : ${email}
  Verification OTP: ${otp}
  (Set EMAIL_USER + EMAIL_PASS in .env to send real emails)
============================================================
  `);
  return { success: true, simulated: true };
};

module.exports = { sendOtpEmail };
