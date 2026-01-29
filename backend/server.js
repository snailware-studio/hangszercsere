const express = require("express");
const app = express();
const ip = process.env.IP || "127.0.0.1";
const port = process.env.PORT || 3000;
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require('multer');
const fs = require('fs');
const WebSocket = require('ws');
const emailservice = require("./emailservice.js");
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const db = require("./db");
const dotenv = require('dotenv');
const sharp = require('sharp');
require("./ai");

dotenv.config({quiet:true});

app.use(cors({
  origin: process.env.ORIGIN, //localhost:4200
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.static(path.join(__dirname, "../frontend")));

const ai_queue_time = 10;

const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const users = new Map(); //map of users connected

let tokens = new Map(); // map of valid tokens with id, expiration and Token type

function compress(buffer) {
  return sharp(buffer).
    webp({ quality: 70 }).
    toBuffer();
}

const TokenType = Object.freeze({
  EMAIL_VERIFICATION: 'email_verification',
  DELETE_PROFILE: 'delete_profile',
});

function AddToken(userID, type) {
  const expires_at = Date.now() + (5 * 60 * 1000);
  const token = crypto.randomBytes(4).toString('hex');

  tokens.set(token, { userID, expires_at, type });
  return token;
}

if (tokens.length > 0) {
  setInterval(() => {
    for (const [token, user] of tokens) {
      if (user.expires_at < Date.now()) {
        tokens.delete(token);
        console.log(`Token ${token} expired`);
      }
    }
    console.log(`Tokens: ${tokens.size}`);

  }, 5 * 60 * 1000);
}


wss.on('connection', (ws) => {

  ws.on('message', (message) => {
    const { action, userID } = JSON.parse(message);

    if (action === 'register') {
      users.set(userID, ws);
      //console.log(`User ${userID} connected`);
    }

    if (action === 'message') {
      // console.log(JSON.parse(message));
      const { toUserID, message: msgContent, listing } = JSON.parse(message);
      Sendmessage(userID, toUserID, msgContent, listing);
    }

  });

  function Sendmessage(userID, toUserID, message, listing) {
    const touser = users.get(toUserID);
    if (touser && touser.readyState === WebSocket.OPEN) {
      touser.send(JSON.stringify({ action: 'message', from: 'server', user: userID, toUser: toUserID, message: message, listing: listing }));
      //console.log(`Message sent to user ${toUserID}`);
    }
    else {
      // console.log(`tried to send message to ${toUserID} but they arent connected.`)
    }

    const user = users.get(userID);
    if (user && user.readyState === WebSocket.OPEN) {
      user.send(JSON.stringify({ action: 'message', from: 'server', user: userID, toUser: toUserID, message: message, listing: listing }));
    }

    const sql = `
    INSERT INTO messages (sent_from, sent_to, content, listing_id)
    VALUES (?, ?, ?, ?)
  `;

    db.run(sql, [userID, toUserID, message, listing], function (err) {
      if (err) {
        console.error("INSERT ERROR:", err.message);
      }
      else {

      }

      const messageid = this.lastID;
    });

  }

  ws.on('close', () => {
    users.forEach((socket, userID) => {
      if (socket === ws) {
        users.delete(userID);
        console.log(`User ${userID} disconnected`);
      }
    });
  });


});

app.post("/api/users/logout", auth, (req, res) => {
  db.run("DELETE FROM sessions WHERE session_id = ?", [req.cookies.session]);
  res.clearCookie("session");
  res.json({ message: "Logged out" });
});


app.get("/api/users/me", auth, (req, res) => {
  db.get("SELECT id, name, email, profile_url  FROM users WHERE id = ?", [req.userId], (err, user) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Adatbázis hiba" });
    }
    res.json(user);
  });
});


//middleware
function auth(req, res, next) {
  const sessionId = req.cookies.session;
  if (!sessionId) return res.status(401).json({ error: "Not authenticated" });

  db.get("SELECT * FROM sessions WHERE session_id = ?", [sessionId], (err, session) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!session || new Date(session.expires) < new Date()) {
      return res.status(401).json({ error: "Session expired" });
    }

    const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.run(
      "UPDATE sessions SET expires = ? WHERE session_id = ?",
      [newExpires, sessionId],
      (err) => {
        if (err) console.error("Failed to refresh session:", err.message);
      }
    );

    req.userId = session.user_id;
    next();
  });
}

const uploadDir = path.join(__dirname, 'uploads'); // Folder with media

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + original name
    cb(null, + Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB max per file
});

// upload media
app.post(
  '/api/instruments/media', auth,
  upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'videos', maxCount: 5 }
  ]),
  async (req, res) => {
    //console.log('req.body:', req.body);
    //console.log('req.files:', req.files);

    const hasImages = Array.isArray(req.files['images']) && req.files['images'].length > 0;
    const hasVideos = Array.isArray(req.files['videos']) && req.files['videos'].length > 0;

    if (!hasImages && !hasVideos) {
      return res.status(400).json({ error: 'No files uploaded!' });
    }

    try {
      const listingId = req.body.listingId;
      if (!listingId) {
        return res.status(400).json({ error: 'No listing ID provided!' });
      }

      /*
      if (req.body.userId != req.userId) {
        return res.status(403).json({
          error: `Not authorized expected: ${req.body.userId} actual: ${req.userId}`
        });
      }*/

      const files = [];

      // ---------- IMAGES ----------
      if (req.files?.images) {
        for (const file of req.files.images) {
          if (!file.mimetype.startsWith('image/')) continue;

          const webpBuffer = await compress(file.buffer);

          const filename =
            Date.now() +
            '-' +
            path.parse(file.originalname).name +
            '.webp';

          fs.writeFileSync(
            path.join(uploadDir, filename),
            webpBuffer
          );

          files.push({
            filename,
            type: 'image'
          });
        }
      }

      // ---------- VIDEOS ----------
      if (req.files?.videos) {
        for (const file of req.files.videos) {
          const filename =
            Date.now() +
            '-' +
            file.originalname;

          fs.writeFileSync(
            path.join(uploadDir, filename),
            file.buffer
          );

          files.push({
            filename,
            type: 'video'
          });
        }
      }

      if (files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded!' });
      }

      // ---------- DB INSERT ----------
      const placeholders = files.map(() => '(?, ?, ?)').join(', ');
      const values = [];

      files.forEach(f => {
        values.push(listingId, f.filename, f.type);
      });

      const sql = `
        INSERT INTO media (listing_id, url, type)
        VALUES ${placeholders}
      `;

      db.run(sql, values, function (err) {
        if (err) {
          return res.status(500).json({ error: "db error" + err.message });
        }

        res.json({
          message: 'Upload successful',
          filenames: files.map(f => f.filename)
        });
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

app.post('/api/users/avatar', auth, upload.single('avatar'), async (req, res) => {
  const userId = req.body.userId;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!(userId == req.userId)) return res.status(403).json({ error: "Not authorized" });

  try {
    // Convert avatar to WebP
    const webpBuffer = await compress(req.file.buffer);

    const filename =
      Date.now() + '-' + path.parse(req.file.originalname).name + '.webp';

    fs.writeFileSync(path.join(uploadDir, filename), webpBuffer);

    // get current profile_url
    db.get('SELECT profile_url FROM users WHERE id = ?', [userId], (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });

      // delete old file if exists and !empty and !default
      if (row?.profile_url && row.profile_url !== 'default_avatar.png') {
        const oldFilePath = path.join(uploadDir, row.profile_url);
        fs.unlink(oldFilePath, (err) => {
          if (err) console.warn('Old avatar not deleted:', err.message);
        });
      }

      // update DB with new avatar
      db.run(
        'UPDATE users SET profile_url = ? WHERE id = ?',
        [filename, userId],
        function (err) {
          if (err) return res.status(500).json({ error: 'Failed to update profile' });
          res.json({ message: 'Avatar updated', filename });
        }
      );
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Image processing failed' });
  }
});




// update media
app.post('/api/instruments/media/update', auth, upload.fields([
  { name: 'newImages', maxCount: 5 },
  { name: 'newVideos', maxCount: 5 }
]), (req, res) => {
  const { listingId, userId, existingImages, existingVideos } = req.body;
  if (!listingId || !userId) return res.status(400).json({ error: 'Listing ID and User ID required' });
  if (!(userId == req.userId)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  let existingImagesArr = [];
  let existingVideosArr = [];
  try {
    existingImagesArr = existingImages ? JSON.parse(existingImages) : [];
    existingVideosArr = existingVideos ? JSON.parse(existingVideos) : [];
  } catch (err) {
    return res.status(400).json({ error: 'Invalid existing files data' });
  }

  // Get listing and ownership
  db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.user_id != userId) return res.status(403).json({ error: 'Not authorized' });

    // Get current media
    db.all('SELECT * FROM media WHERE listing_id = ?', [listingId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error fetching media' });

      const currentImages = rows.filter(r => r.type === 'image').map(r => r.url);
      const currentVideos = rows.filter(r => r.type === 'video').map(r => r.url);

      // files to delete
      const imagesToDelete = currentImages.filter(img => !existingImagesArr.includes(img));
      const videosToDelete = currentVideos.filter(vid => !existingVideosArr.includes(vid));

      // dlete files from uploads
      imagesToDelete.forEach(f => {
        const filePath = path.join(uploadDir, f);
        fs.unlink(filePath, err => { if (err) console.warn('Failed to delete image:', f); });
      });
      videosToDelete.forEach(f => {
        const filePath = path.join(uploadDir, f);
        fs.unlink(filePath, err => { if (err) console.warn('Failed to delete video:', f); });
      });

      // delete from db
      const allToDelete = [...imagesToDelete, ...videosToDelete];
      if (allToDelete.length > 0) {
        const placeholders = allToDelete.map(() => '?').join(',');
        db.run(`DELETE FROM media WHERE listing_id = ? AND url IN (${placeholders})`, [listingId, ...allToDelete], function (err) {
          if (err) console.warn('Failed to delete media from DB:', err.message);
        });
      }

      // new files
      const filesToInsert = [];
      if (req.files['newImages']) {
        filesToInsert.push(...req.files['newImages'].map(f => ({ filename: f.filename, type: 'image' })));
      }
      if (req.files['newVideos']) {
        filesToInsert.push(...req.files['newVideos'].map(f => ({ filename: f.filename, type: 'video' })));
      }

      // upload new
      if (filesToInsert.length > 0) {
        const placeholders = filesToInsert.map(() => '(?, ?, ?)').join(',');
        const values = [];
        filesToInsert.forEach(f => values.push(listingId, f.filename, f.type));

        db.run(`INSERT INTO media (listing_id, url, type) VALUES ${placeholders}`, values, function (err) {
          if (err) return res.status(500).json({ error: 'Failed to insert new media' });

          res.json({
            success: true,
            newImages: filesToInsert.filter(f => f.type === 'image').map(f => f.filename),
            newVideos: filesToInsert.filter(f => f.type === 'video').map(f => f.filename)
          });
        });
      } else {
        //nothing uploaded : success
        res.json({ success: true, newImages: [], newVideos: [] });
      }
    });
  });
});

// send message
app.post("/api/messages/send", auth, (req, res) => {

  const { sent_from, sent_to, content, listing_id } = req.body;

  if (!sent_from || !sent_to || !content || !listing_id) {
    return res.status(400).json({
      error: "Missing fields",
      received: { sent_from, sent_to, content, listing_id }
    });
  }
  if (!(sent_from == req.userId)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const sql = `
    INSERT INTO messages (sent_from, sent_to, content, listing_id)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [sent_from, sent_to, content, listing_id], function (err) {
    if (err) {
      console.error("INSERT ERROR:", err.message);
      return res.status(500).json({ error: err.message });
    }



    res.json({ message_id: this.lastID });
  });
});

//delete message by id
app.delete("/api/messages/:messageId", auth, (req, res) => {
  const messageId = req.params.messageId;
  if (!messageId) return res.status(400).json({ error: "Message ID required" });

  const sql = `
    DELETE FROM messages
    WHERE id = ? AND (sent_from = ? OR sent_to = ?)
  `;
  db.run(sql, [messageId, req.userId, req.userId], (err, result) => {
    if (err) {
      console.error("DELETE ERROR:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message_id: messageId });
  });
});

//messages of userID
app.get("/api/messages/:userId", auth, (req, res) => {
  const userId = req.params.userId;
  if (!userId) return res.status(400).json({ error: "User ID required" });
  if (!(userId == req.userId)) {
    return res.status(403).json({ error: "Not authorized" });
  }


  const sql = `
    SELECT 
        l.id AS listing_id,
        l.title AS listing_title,
        COUNT(m.id) AS message_count,
        CASE 
            WHEN m.sent_from = ? THEN m.sent_to
            ELSE m.sent_from
        END AS other_user_id,
        u.name AS other_user_name
    FROM messages m
    JOIN listings l ON m.listing_id = l.id
    JOIN users u ON u.id = CASE 
            WHEN m.sent_from = ? THEN m.sent_to
            ELSE m.sent_from
        END
    WHERE m.sent_from = ? OR m.sent_to = ?
    GROUP BY l.id, other_user_id, u.name
    ORDER BY MAX(m.created_at) DESC;
  `;

  db.all(sql, [userId, userId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Messages between 2 users tied to a listing
app.get("/api/messages/:listingId/:userId", auth, (req, res) => {
  const { listingId, userId } = req.params;
  if (!listingId) return res.status(400).json({ error: "Listing ID required" });
  if (!userId) return res.status(400).json({ error: "User ID required" });
  if (!(userId == req.userId)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  const sql = `
    SELECT 
      m.*,
      u.name AS sender_name
    FROM messages m
    JOIN users u ON m.sent_from = u.id
    WHERE m.listing_id = ?
      AND (m.sent_from = ? OR m.sent_to = ?)
    ORDER BY m.created_at ASC;
  `;

  db.all(sql, [listingId, userId, userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(rows);
  });
});

// * of listings
app.get("/api/listings", auth, (req, res) => {
  const sql = `SELECT * FROM listings`;

  if (!(req.userId == 1)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// * of media
app.get("/api/media", auth, (req, res) => {
  const sql = `SELECT * FROM media`;
  console.log("cookie id: " + req.userId);
  if (!(req.userId == 1)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// * of categories
app.get("/api/categories", (req, res) => {
  const sql = `SELECT * FROM categories`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// * of users
app.get("/api/users", auth, (req, res) => {
  const sql = `SELECT * FROM users`;
  if (!(req.userId == 1)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

//GET user by id
app.get("/api/users/:userID", (req, res) => {
  const sql = `
    SELECT 
      u.id,
      u.name,
      u.profile_url,
      u.bio,
      u.location,
      u.rating,
      u.join_date,
      u.status,
      s.total_listings,
      s.active_listings,
      s.total_sold,
      s.rating_count,
      s.total_reviews,
      s.last_login
    FROM users u
    JOIN user_stats s ON u.id = s.user_id
    WHERE u.id = ?;
  `;

  const userID = Number(req.params.userID);

  db.get(sql, [userID], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "User not found" });

    res.json(row);
  });
});

// * of messages
app.get("/api/messages", auth, (req, res) => {
  const sql = `SELECT * FROM messages`;

  if (!(req.userId == 1)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

app.post("/api/buy", auth, (req, res) => {
  const userID = req.userId;

  const fetchCartSQL = `
    SELECT l.id, l.user_id, l.price, l.status
    FROM cart_items
    JOIN listings l ON l.id = cart_items.listing_id
    WHERE cart_items.cart_id = ?
  `;

  db.all(fetchCartSQL, [userID], (err, listings) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!listings.length) return res.status(404).json({ error: "Cart is empty" });

    for (const l of listings) {
      if (l.user_id === userID)
        return res.status(403).json({ error: "Cannot buy your own listing", listingID: l.id });

      if (l.status === "sold")
        return res.status(400).json({ error: "Listing already sold", listingID: l.id });
    }

    const totalPrice = listings.reduce((sum, l) => sum + l.price, 0);
    console.log(`Charged user ${userID} ${totalPrice}FT`);

    const results = [];

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      listings.forEach((listing) => {
        db.run(
          `INSERT INTO transactions (sent_from, sent_to, listing_id, status, price)
           VALUES (?, ?, ?, 'completed', ?)`,
          [userID, listing.user_id, listing.id, listing.price],
          (err) => {
            if (err) {
              results.push({ listingID: listing.id, status: "error", message: "Transaction failed" });
              return db.run("ROLLBACK");
            }

            db.run(
              `UPDATE listings SET status = 'sold' WHERE id = ?`,
              [listing.id],
              (err) => {
                if (err) {
                  results.push({ listingID: listing.id, status: "error", message: "Failed to mark sold" });
                  return db.run("ROLLBACK");
                }

                notifyUsers(listing);
                results.push({ listingID: listing.id, status: "success" });
              }
            );
          }
        );
      });

      db.run(
        `DELETE FROM cart_items WHERE cart_id = ?`,
        [userID],
        (err) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Failed to clear cart" });
          }

          db.run("COMMIT", () => {
            res.json({ message: "Payment completed", totalPrice, results });
          });
        }
      );
    });
  });

  function notifyUsers(listing) {
    db.get(`SELECT email, name FROM users WHERE id = ?`, [listing.user_id], (err, seller) => {
      if (!err && seller)
        emailservice.sendListingSoldEmail(seller.email, seller.name, listing.id);
    });

    db.get(`SELECT email, name FROM users WHERE id = ?`, [userID], (err, buyer) => {
      if (!err && buyer)
        emailservice.sendListingBoughtEmail(buyer.email, buyer.name, listing.id);
    });

    // notify other watchers BEFORE cart delete
    db.all(
      `SELECT DISTINCT cart_id FROM cart_items WHERE listing_id = ? AND cart_id != ?`,
      [listing.id, userID],
      (err, rows) => {
        if (err) return;

        rows.forEach(({ cart_id }) => {
          db.get(`SELECT email, name FROM users WHERE id = ?`, [cart_id], (err, user) => {
            if (!err && user)
              emailservice.sendWantedListingSoldEmail(user.email, user.name, listing.id);
            
          });
        });
      }
    );
  }
});



//get all transactions
app.get("/api/transactions", auth, (req, res) => {
  if (!(req.userId == 1)) {
    return res.status(403).json({ error: "Not authorized" });
  }
  db.get("SELECT * FROM transactions", [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

//get transaction by id
app.get("/api/transactions/id/:id", auth, (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM transactions WHERE id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "Transaction not found" });
    if (!(row.sent_from == req.userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }
    res.json(row);
  });
});

//get all transactions by user
app.get("/api/transactions/user/:userID", auth, (req, res) => {
  const userID = req.params.userID;
  if (!(userID == req.userId)) {
    return res.status(403).json({ error: "Not authorized" });
  }
  db.all("SELECT * FROM transactions WHERE sent_from = ?", [userID], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

//update user
app.post('/api/users/update', auth, async (req, res) => {
  const { id, name, email, bio, location, password } = req.body;
  if (!id) return res.status(400).json({ error: 'User ID is required' });
  if (!(id == req.userId)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  // current user
  db.get('SELECT * FROM users WHERE id = ?', [id], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    try {
      const updatedFields = {
        name: name ?? user.name,
        email: email ?? user.email,
        bio: bio ?? user.bio,
        location: location ?? user.location
      };

      // update password only if its not empty
      if (password && password.trim() !== '') {
        updatedFields.pass_hash = await bcrypt.hash(password, 10);
      }

      const setClause = Object.keys(updatedFields).map(key => `${key} = ? `).join(', ');
      const values = Object.values(updatedFields);
      values.push(id);

      db.run(`UPDATE users SET ${setClause} WHERE id = ? `, values, function (err) {
        if (err) return res.status(500).json({ error: 'Failed to update user' });

        res.json({ success: true, message: 'Profile updated successfully' });
      });
    } catch (hashErr) {
      console.error(hashErr);
      return res.status(500).json({ error: 'Server error' });
    }
  });
});

//update listing
app.put("/api/instrument/update/:id", auth, (req, res) => {
  const listingId = req.params.id;
  if (!listingId) return res.status(400).json({ error: "Listing ID required" });

  if (!(req.body.user_id == req.userId)) {
    return res.status(403).json({ error: "Not authorized" });
  }

  // Fetch current listing
  db.get("SELECT * FROM listings WHERE id = ?", [listingId], (err, listing) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    const updatedFields = {
      title: req.body.title ?? listing.title,
      price: req.body.price ?? listing.price,
      description: req.body.description ?? listing.description,
      status: req.body.status ?? listing.status,
      user_id: req.body.user_id ?? listing.user_id,
      category_id: req.body.category_id ?? listing.category_id,
      brand: req.body.brand ?? listing.brand,
      model: req.body.model ?? listing.model,
      condition: req.body.condition ?? listing.condition,
      ai_rating: req.body.ai_rating ?? listing.ai_rating,
      status: "inactive"
    };

    const setClause = Object.keys(updatedFields).map(key => `${key} = ? `).join(", ");
    const values = Object.values(updatedFields);
    values.push(listingId);

    db.run(`UPDATE listings SET ${setClause} WHERE id = ? `, values, function (err) {
      if (err) {
        console.log(err);
        return res.status(500).json({ error: "Failed to update listing" });
      }

      const eligibleAt = new Date(Date.now() + ai_queue_time * 60 * 1000).toISOString();

      const aiSql = `
        INSERT INTO ai_queue(listing_id, eligible_at)
        VALUES (?, ?)
        ON CONFLICT(listing_id) DO UPDATE SET eligible_at = excluded.eligible_at
      `;

      db.run(aiSql, [listingId, eligibleAt], function (err) {
        if (err) return res.status(500).json({ error: "Failed to update AI queue" });
      });

      res.json({ success: true, message: "Listing updated successfully" });
    });
  });
});


// Get listings/insturments
app.get("/api/instruments", async (req, res) => {
  try {
    const filters = req.query;

    const params = [];
    let sql = `
      SELECT
        l.id,
        l.title,
        l.price,
        l.description,
        l.status,
        l.created_at,
        l.user_id,
        l.condition,
        l.brand,
        l.model,
        l.ai_rating,
        l.ai_feedback,
        u.name AS seller,
        l.category_id,
        c.name AS category,
        (
          SELECT GROUP_CONCAT(m.url)
          FROM media m
          WHERE m.listing_id = l.id AND m.type = 'image'
        ) AS images,
        (
          SELECT GROUP_CONCAT(m.url)
          FROM media m
          WHERE m.listing_id = l.id AND m.type = 'video'
        ) AS videos
      FROM listings l
      JOIN users u ON u.id = l.user_id
      LEFT JOIN categories c ON c.id = l.category_id
      WHERE l.status = 'active'
    `;

    //console.log("ai rating: " + filters.aiRating);

    if (filters.aiRating && Number(filters.aiRating) > 0) {
      sql += ` AND l.ai_rating > ? AND l.ai_rating < ? + 1`;
      params.push(Number(filters.aiRating));
      params.push(Number(filters.aiRating));
    }

    if (filters.brand) {
      sql += ` AND lower(l.brand) LIKE lower(?)`;
      params.push(`%${filters.brand}%`);
    }

    if (filters.category) {
      sql += ` AND c.name = ?`;
      params.push(filters.category);
    }

    if (filters.condition) {
      sql += ` AND l.condition = ?`;
      params.push(filters.condition);
    }

    if (filters.model) {
      sql += ` AND lower(l.model) LIKE lower(?)`;
      params.push(`%${filters.model}%`);
    }

    if (filters.location) {
      sql += ` AND l.location = ?`;
      params.push(filters.location);
    }

    if (filters.dateType && filters.dateValue) {
      if (filters.dateType === "before") {
        sql += ` AND l.created_at <= ?`;
      } else if (filters.dateType === "after") {
        sql += ` AND l.created_at >= ?`;
      }
      params.push(filters.dateValue);
    }

    // Price filter
    if (filters.priceType === "custom") {
      if (filters.priceMin != null) {
        sql += ` AND l.price >= ?`;
        params.push(Number(filters.priceMin));
      }
      if (filters.priceMax != null) {
        sql += ` AND l.price <= ?`;
        params.push(Number(filters.priceMax));
      }
    } else if (filters.priceType === "less" && filters.priceValue != null) {
      sql += ` AND l.price <= ?`;
      params.push(Number(filters.priceValue));
    } else if (filters.priceType === "more" && filters.priceValue != null) {
      sql += ` AND l.price >= ?`;
      params.push(Number(filters.priceValue));
    }

    // Pagination (optional, default 20)
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const offset = (page - 1) * limit;
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // === Execute query ===
    const rows = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const listings = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(",") : [],
      videos: row.videos ? row.videos.split(",") : []
    }));

    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


// get listing by id
app.get("/api/instrument/:id", (req, res) => {
  const id = req.params.id;

  db.get(
    `
SELECT
l.id, l.title, l.price, l.description, l.status, l.created_at, l.user_id, l.brand, l.model, l.condition, l.ai_rating,l.ai_feedback,
  u.name AS seller, l.category_id, c.name AS category,
    (SELECT GROUP_CONCAT(m.url) FROM media m WHERE m.listing_id = l.id AND m.type = 'image') AS images,
      (SELECT GROUP_CONCAT(m.url) FROM media m WHERE m.listing_id = l.id AND m.type = 'video') AS videos
    FROM listings l
    JOIN users u ON u.id = l.user_id
    LEFT JOIN categories c ON c.id = l.category_id
    WHERE l.id = ?;
`,
    [id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(404).json({ error: "Listing not found" });

      res.json({
        ...row,
        images: row.images?.split(",") || [],
        videos: row.videos?.split(",") || []
      });
    }
  );
});

// delete listing
app.delete("/api/instruments/:id", auth, (req, res) => {
  const listingId = req.params.id;



  if (!listingId) {
    return res.status(400).json({ error: "Listing ID is required" });
  }

  // get the user_id first
  db.get("SELECT user_id FROM listings WHERE id = ?", [listingId], (err, row) => {
    if (err) return res.status(500).json({ error: "Failed to get listing: " + err.message });
    if (!row) return res.status(404).json({ error: "Listing not found" });

    const userId = row.user_id;

    if (!(userId == req.userId)) {
      return res.status(403).json({ error: "Not authorized" });
    }


    // get files
    const getMediaSql = `SELECT url FROM media WHERE listing_id = ? `;
    db.all(getMediaSql, [listingId], (err, rows) => {
      if (err) return res.status(500).json({ error: "Failed to get media: " + err.message });

      // delete files
      rows.forEach(row => {
        const filePath = path.join(__dirname, 'public/uploads', row.url);
        fs.unlink(filePath, (err) => {
          if (err) console.error("Failed to delete file:", filePath, err);
        });
      });

      // delete images sql
      const deleteImagesSql = `DELETE FROM media WHERE listing_id = ? `;
      db.run(deleteImagesSql, [listingId], function (err) {
        if (err) return res.status(500).json({ error: "Failed to delete media: " + err.message });

        // delete listing sql
        const deleteListingSql = `DELETE FROM listings WHERE id = ? `;
        db.run(deleteListingSql, [listingId], function (err) {
          if (err) return res.status(500).json({ error: "Failed to delete listing: " + err.message });

          res.json({ success: true, message: "Listing and media deleted successfully" });
        });
      });
    });
  });
});

//confirm token
app.get('/api/confirm/:token', async (req, res) => {
  const token = req.params.token;

  if (!tokens.has(token)) {
    res.redirect(`${process.env.ORIGIN}/confirm/fail/unkown`);
    return res.json({ success: false, error: 'Invalid or expired token' });
  }

  const tokenData = tokens.get(token);
  const { userID, type } = tokenData;

  tokens.delete(token);

  //console.log('Token type:', type);
  //console.log('TokenType.EMAIL_VERIFICATION:', TokenType.EMAIL_VERIFICATION);

  try {
    switch (type.trim()) {
      case TokenType.EMAIL_VERIFICATION:
        db.run('UPDATE users SET email_verified = true WHERE id = ?', [userID], function (err) {
          if (err) {
            console.error('UPDATE ERROR:', err.message);
            res.redirect(`${process.env.ORIGIN}/confirm/fail/email`);
          }
          console.log(`UserID: ${userID} verified`);
          res.redirect(`${process.env.ORIGIN}/confirm/success/email`);
          //res.json({ success: true, message: 'Email verified' });
        });
        break;

      case TokenType.DELETE_PROFILE:
        db.run('DELETE FROM users WHERE id = ?', [userID], function (err) {
          if (err) {
            console.error('DELETE ERROR:', err.message);
            res.redirect(`${process.env.ORIGIN}/confirm/fail/delete`);
            return res.json({ success: false, error: 'Database error' });
          }

          db.run('DELETE FROM user_stats WHERE user_id = ?', [userID], function (err) {
            if (err) {
              console.error('DELETE ERROR:', err.message);
              res.redirect(`${process.env.ORIGIN}/confirm/fail/delete`);
              return res.json({ success: false, error: 'Database error' });
            }
          });

          console.log(`UserID: ${userID} deleted`);
          res.redirect(`${process.env.ORIGIN}/confirm/success/delete`);
          //return res.json({ success: true, message: 'Profile deleted' });
        });
        break;

      default:
        console.log('Unknown token type:', type);
        res.redirect(`${process.env.ORIGIN}/confirm/fail/unkown`);
        res.json({ success: false, error: 'Unknown token type' });
    }
  } catch (err) {
    console.error('ERROR:', err);
    res.json({ success: false, error: 'Server error' });
  }
});


// register user
app.post('/api/users', async (req, res) => {

  const { name, email, location, password } = req.body;

  if (!name || !email || !location || !password) {
    return res.status(400).json({ error: 'Name, email, location, and password are required!' });
  }

  try {
    const pass_hash = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (name, email, location, pass_hash,email_verified) VALUES (?, ?, ?, ?,false)';
    db.run(sql, [name, email, location, pass_hash], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Felhasználónév vagy email már regisztrálva van!' });
        }
        return res.status(500).json({ error: err.message });
      }

      const userId = this.lastID;

      // empty stats
      const statsSql = 'INSERT INTO user_stats (user_id, total_listings, active_listings, total_sold, rating_count, total_reviews) VALUES (?, 0, 0, 0, 0, 0)';
      db.run(statsSql, [userId], async (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }

        await emailservice.sendWelcomeEmail(email, name, AddToken(userId, TokenType.EMAIL_VERIFICATION));

        res.json({ success: true, userId });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


//delete user
app.post('/api/users/delete', auth, (req, res) => {
  const userId = req.body.userId;

  sql = 'SELECT email,name FROM users WHERE id = ?';
  db.get(sql, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "User not found" });

    const email = row.email;
    const name = row.name;

    emailservice.sendProfileDeleteEmail(email, name, AddToken(userId, TokenType.DELETE_PROFILE));
    res.json({ success: true });
  });
});

// Login user
app.post("/api/users/login", (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Felhasználónév és jelszó kötelezőek" });
  }

  db.get(
    "SELECT id, name, pass_hash, email_verified FROM users WHERE name = ? OR email = ?",
    [name, name],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(401).json({ error: "Hibás felhasználónév vagy jelszó" });

      // bcrypt ellenőrzés
      bcrypt.compare(password, user.pass_hash, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(401).json({ error: "Hibás felhasználónév vagy jelszó" });

        if (user.email_verified == false) return res.status(401).json({ error: "Email nincs megerősítve!" });

        // session id generálás
        const sessionId = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 nap

        db.run(
          "INSERT INTO sessions (session_id, user_id, expires) VALUES (?, ?, ?)",
          [sessionId, user.id, expires],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });


            res.cookie("session", sessionId, {
              httpOnly: true,
              secure: true,
              sameSite: "strict",
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });

            res.json({ success: true, name: user.name, id: user.id });

            // update last login
            db.run(
              "UPDATE user_stats SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?",
              [user.id]
            );
          }
        );
      });
    }
  );
});


// add/upload listing
app.post("/api/instruments", auth, (req, res) => {
  var { user_id, title, price, description, status, category_id, brand, model, condition, ai_rating } = req.body;
  if (!(user_id == req.userId)) {
    return res.status(403).json({ error: "Not authorized" + "UsersID" + user_id + "req.userId" + req.userId });
  }

  status = "inactive";
  ai_rating = 0;

  const sql = `
    INSERT INTO listings(title, price, description, status, user_id, category_id, brand, model, condition, ai_rating)
VALUES(?, ?, ?, ?, ?, ?,?,?,?,?)
  `;

  db.run(sql, [title, price, description, status, user_id, category_id, brand, model, condition, ai_rating], function (err) {
    if (err) return res.status(500).json({ error: "could not insert: " + err.message });

    const listing_id = this.lastID;
    const eligible_at = new Date(Date.now() + (ai_queue_time * 60 * 1000)).toISOString();;

    const aisql = `
      INSERT INTO ai_queue(listing_id, eligible_at)
      VALUES (?, ?)
    `
    db.run(aisql, [listing_id, eligible_at], function (err) {
      if (err) return res.status(500).json({ error: "Could not add to AI queue: " + err.message });

      res.json({ success: true, id: listing_id });
    });

  });
});

//my listings
app.get("/api/mylistings", auth, (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

const sql = `
    SELECT 
      l.id,
      l.user_id,
      l.title,
      l.price,
      l.description,
      l.condition,
      l.ai_rating,
      l.brand,
      l.model,
      l.created_at,
      c.name AS category,
      u.name AS seller,
      m.url AS image_url,
      CASE 
        WHEN aq.id IS NOT NULL THEN 'waiting for review'
        ELSE l.status
      END AS status
    FROM listings l
    LEFT JOIN categories c ON c.id = l.category_id
    JOIN users u ON u.id = l.user_id
    LEFT JOIN (
      SELECT listing_id, url
      FROM media 
      WHERE type = 'image' 
        AND id IN (
          SELECT MIN(id)
          FROM media
          WHERE type = 'image'
          GROUP BY listing_id
        )
    ) m ON m.listing_id = l.id
    LEFT JOIN ai_queue aq ON aq.listing_id = l.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `;

  db.all(sql, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });

});

// get cart-items of user as listing
app.get("/api/cart-items", auth, (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  db.all("SELECT listing_id FROM cart_items WHERE cart_id = ?", [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const cartIds = rows.map(row => row.listing_id);
    if (cartIds.length === 0) return res.json([]);

    const listings = [];
    let completed = 0;

    let sql = `SELECT 
     l.id,
      l.user_id,
      u.name AS seller,
      l.title,
      l.price,
      l.description,
      l.status,
      l.created_at,
      l.condition,
      l.brand,
      l.model,
      l.ai_rating,
      m.url AS image_url
   FROM listings l
   LEFT JOIN (
       SELECT listing_id, url
       FROM media
       WHERE type = 'image'
       ORDER BY id ASC
   ) m ON m.listing_id = l.id
  JOIN users u ON u.id = l.user_id
   WHERE l.id = ?
   LIMIT 1`;

    if (cartIds.length === 0) return res.status(204).res.json([{ error: "Cart is empty" }]);

    cartIds.forEach(id => {
      db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: `Listing ${id} not found` });

        listings.push(row);
        completed++;

        if (completed === cartIds.length) {
          res.json(listings);
        }
      });
    });
  });
});


//add to cart
app.post("/api/cart-items", auth, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Listing ID is required" });

  const userId = req.userId;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const sql = `
    INSERT OR IGNORE INTO cart_items (cart_id, listing_id)
    VALUES (?, ?)
  `;

  db.run(sql, [userId, id], function (err) {
    if (err) return res.status(500).json({ error: "Could not add to database: " + err.message });

    if (this.changes === 0) {
      return res.status(409).json({ message: "Item already in cart" });
    }

    return res.status(200).json({ message: "Added to cart" });
  });
});

//remove from cart
app.delete("/api/cart-items/:listing_id", auth, (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(400).json({ error: "User ID is required" });

  const id = req.params.listing_id;
  //clear cart
  if (!id) {
    db.run("DELETE FROM cart_items WHERE cart_id = ?", [userId], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Cart cleared" });
    });
    return;
  }
  //delete listing with id
  db.run("DELETE FROM cart_items WHERE cart_id = ? AND listing_id = ?", [userId, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Removed from cart" });
  });

});



app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

if (process.env.NODE_ENV !== 'test'){
  server.listen(port, ip, () => {
    console.log(`Server running at http://${ip}:${port}`);
  });
}

module.exports = {app};
