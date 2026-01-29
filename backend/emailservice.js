const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config({quiet:true});

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
async function sendWelcomeEmail(toEmail, name, token) {
  try {
    const info = await transporter.sendMail({
      from: '"Hangszercsere.hu" <support@hangszercsere.hu>',
      to: toEmail,
      subject: 'Üdv a Hangszercsere.hu-n!',
      html: `<h2>Szia ${name}!</h2><p>Köszönjük, hogy regisztráltál a Hangszercsere.hu-n!</p><p>Kérjük, kattints az alábbi linkre az email címed megerősítéséhez:</p><a href="${process.env.ORIGIN}/api/confirm/${token}">Email megerősítése</a>`
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

// profile delete verify
async function sendProfileDeleteEmail(toEmail, name, token) {
  try {
    const info = await transporter.sendMail({
      from: '"Hangszercsere Support" <support@hangszercsere.hu>',
      to: toEmail,
      subject: 'Fiók törlésének megerősítése',
      html: `<h2>Szia ${name}!</h2><p>Kérjük, kattints az alábbi linkre a fiókod törlésének megerősítéséhez:</p><a href="${process.env.ORIGIN}/api/confirm/${token}">Fiók törlése</a>`
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

// listing sold
async function sendListingSoldEmail(toEmail, name, listing_id) {
  try {
    const info = await transporter.sendMail({
      from: '"Hangszercsere.hu" <support@hangszercsere.hu>',
      to: toEmail,
      subject: 'Elkelt a hirdetésed!',
      html: `<h2>Szia ${name}!</h2><p>A hirdetésed elkelt! Megtekintheted itt: <a href="${process.env.ORIGIN}/listing/${listing_id}">Hirdetés megtekintése</a></p>`
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

// wanted listing sold
async function sendWantedListingSoldEmail(toEmail, name, listing_id) {
  try {
    const info = await transporter.sendMail({
      from: '"Hangszercsere.hu" <support@hangszercsere.hu>',
      to: toEmail,
      subject: 'A kosaradban lévő termék elkelt!',
      html: `<h2>Szia ${name}!</h2><p>Egy kosaradban lévő termék sajnos elkelt! Megtekintheted itt: <a href="${process.env.ORIGIN}/listing/${listing_id}">Hirdetés megtekintése</a></p>`
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}

// listing bought
async function sendListingBoughtEmail(toEmail, name, listing_id) {
  try {
    const info = await transporter.sendMail({
      from: '"Hangszercsere.hu" <support@hangszercsere.hu>',
      to: toEmail,
      subject: 'Sikeres vásárlás!',
      html: `<h2>Szia ${name}!</h2><p>Köszönjük a vásárlást! Megtekintheted itt: <a href="${process.env.ORIGIN}/listing/${listing_id}">Hirdetés megtekintése</a></p>`
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Error sending email:', err);
  }
}


module.exports = {
  sendWelcomeEmail,
  sendProfileDeleteEmail,
  sendListingSoldEmail,
  sendWantedListingSoldEmail,
  sendListingBoughtEmail
};