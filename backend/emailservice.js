import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

//Configure transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.rackhost.hu', 
  port: 587,                  
  secure: false,              
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// welcome email
export async function sendWelcomeEmail(toEmail, name,token) {
  try {
    const info = await transporter.sendMail({
      from: '"Hangszercsere.hu" <support@hangszercsere.hu>',
      to: toEmail,
      subject: 'Welcome to Hangszercsere!',
      html: `<h2>Hello ${name}!</h2><p>Thank you for registering at Hangszercsere!.</p><p>Please click the link below to confirm your email address:</p><a href="${process.env.ORIGIN}/api/confirm/${token}">Confirm email</a>`
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

//profile delete verify
export async function sendProfileDeleteEmail(toEmail, name,token)
{
    try {
      const info = await transporter.sendMail({
        from: '"Hangszercsere Support" <support@hangszercsere.hu>',
        to: toEmail,
        subject: 'Confirm account deletion',
        html: `<h2>Hello ${name}!</h2><p>Please click the link below to confirm your account deletion:</p><a href="${process.env.ORIGIN}/api/confirm/${token}">Delete account</a>`
      });
      console.log('Email sent:', info.messageId);
    } catch (err) {
      console.error('Error sending email:', err);
    }
}

//listing sold
export async function sendListingSoldEmail(toEmail, name,listing_id)
{
    try {
      const info = await transporter.sendMail({
        from: '"Hangszercsere.hu" <support@hangszercsere.hu>',
        to: toEmail,
        subject: 'Your listing was sold!',
        html: `<h2>Hello ${name}!</h2><p>Your listing was sold! You can view it here: <a href="${process.env.ORIGIN}/listing/${listing_id}">View listing</a></p>`
      });
      console.log('Email sent:', info.messageId);
    } catch (err) {
      console.error('Error sending email:', err);
    }
}

//wanted listing sold
export async function sendWantedListingSoldEmail(toEmail, name,listing_id)
{
    try {
      const info = await transporter.sendMail({
        from: '"Hangszercsere.hu" <support@hangszercsere.hu>',
        to: toEmail,
        subject: 'A Listing you wanted has been sold to someone else!',
        html: `<h2>Hello ${name}!</h2><p>A listing you wanted has been sold to someone else! You can view it here: <a href="${process.env.ORIGIN}/listing/${listing_id}">View listing</a></p>`
      });
      console.log('Email sent:', info.messageId);
    } catch (err) {
      console.error('Error sending email:', err);
    }
}

//listing bought
export async function sendListingBoughtEmail(toEmail, name,listing_id)
{
    try {
      const info = await transporter.sendMail({
        from: '"Hangszercsere.hu" <support@hangszercsere.hu>',
        to: toEmail,
        subject: 'Listing bought!',
        html: `<h2>Hello ${name}!</h2><p>Thank you for your purchase! You can view it here: <a href="${process.env.ORIGIN}/listing/${listing_id}">View listing</a></p>`
      });
      console.log('Email sent:', info.messageId);
    } catch (err) {
      console.error('Error sending email:', err);
    }
}