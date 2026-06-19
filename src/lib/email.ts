import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: Number(process.env.BREVO_SMTP_PORT) === 465,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.BREVO_SMTP_USER || !process.env.BREVO_SMTP_PASS) {
    console.warn("Brevo SMTP credentials missing, skipping email dispatch.");
    return false;
  }
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Salarize System" <no-reply@salarize.com>',
      to,
      subject,
      html,
    });
    console.log("Message sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending email via Brevo:", error);
    
    if (process.env.NODE_ENV !== 'production') {
      console.log("Falling back to Ethereal Email for development testing...");
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        const info = await testTransporter.sendMail({
          from: '"Salarize Test" <test@salarize.com>',
          to,
          subject,
          html,
        });
        
        console.log("========================================");
        console.log("Test email sent! View it in your browser:");
        console.log(nodemailer.getTestMessageUrl(info));
        console.log("========================================");
        return true;
      } catch (testError) {
        console.error("Ethereal fallback failed:", testError);
      }
    }
    
    return false;
  }
}

export async function sendOTP(to: string, otp: string) {
  const subject = "Your Salarize Verification Code";
  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #6d28d9;">Salarize Two-Factor Authentication</h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing: 5px; color: #333;">${otp}</h1>
      <p>This code will expire in 5 minutes. If you did not request this, please ignore this email or contact support.</p>
    </div>
  `;
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV MODE] 2FA OTP for ${to}: ${otp}`);
  }
  return sendEmail(to, subject, html);
}

export async function sendApprovalNotification(to: string, role: string) {
  const subject = "Your Salarize Account has been Approved";
  const html = `
    <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Account Approved</h2>
      <p>Your Salarize account has been approved by a system administrator.</p>
      <p>You have been assigned the following role: <strong>${role}</strong></p>
      <p>You may now log in to the system.</p>
    </div>
  `;
  return sendEmail(to, subject, html);
}
