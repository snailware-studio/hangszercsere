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
      from: '"Hangszercsere.hu Support" <support@hangszercsere.hu>',
      to: toEmail,
      subject: 'Üdv a Hangszercserénél!',
      html: `<h2>Szia ${name}!</h2><p>Köszönjük, hogy regisztrált az oldalunkon.</p><p>Az email megerősítéséhez kattintson a következő linkre: </p><a href="${process.env.ORIGIN}/api/confirm/${token}">Email megerősítése</a>`
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
        subject: 'Fiók törlés megerősítése',
        html: `<h2>Szia ${name}!</h2><p>Sajnáljuk, hogy így döntött. Ha valóban így gondolja, hogy törli a fiókját, akkor kattintson a következő linkre: </p><a href="${process.env.ORIGIN}/api/confirm/${token}">Fiók törlése</a>`
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
        from: '"Hangszercsere.hu Support" <support@hangszercsere.hu>',
        to: toEmail,
        subject: 'A hírdetésed elkelt!',
        html: `<h2>Szia ${name}!</h2><p>A hírdetésedet elkelt! Megtekintheted itt: <a href="${process.env.ORIGIN}/listing/${listing_id}">Hírdetés megtekintése</a></p>`
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
        from: '"Hangszercsere.hu Support" <support@hangszercsere.hu>',
        to: toEmail,
        subject: 'Kosárban lévő hírdetés elkelt!',
        html: `<h2>Szia ${name}!</h2><p>A hírdetés, amit kosárba tettél elkelt! Megtekintheted itt: <a href="${process.env.ORIGIN}/listing/${listing_id}">Hírdetés megtekintése</a></p>`
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
        from: '"Hangszercsere.hu Support" <support@hangszercsere.hu>',
        to: toEmail,
        subject: 'Sikeres vásárlás!',
        html: `<h2>Szia ${name}!</h2><p>Köszönjük, hogy nálunk vásárolt! Megtekintheted itt: <a href="${process.env.ORIGIN}/listing/${listing_id}">Hírdetés megtekintése</a></p>`
      });
      console.log('Email sent:', info.messageId);
    } catch (err) {
      console.error('Error sending email:', err);
    }
}