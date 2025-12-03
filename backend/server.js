const express = require("express");
const app = express();
const ip = process.env.IP || "127.0.0.1";
const port = process.env.PORT || 3000;
const db = require("./db");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require('multer');
const { create } = require("domain");
const fs = require('fs');
const WebSocket = require('ws');


app.use(cors());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use(express.static(path.join(__dirname, "public")));

const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

const users = new Map(); //map of users connected

wss.on('connection',(ws) => {

  ws.on('message',(message) => {
    const {action,userID} = JSON.parse(message);

    if(action === 'register')
    {
      users.set(userID,ws);
      console.log(`User ${userID} connected`);
    }

    if(action === 'message')
    {
     // console.log(JSON.parse(message));
      const {toUserID,message: msgContent,listing} = JSON.parse(message);
      Sendmessage(userID,toUserID,msgContent,listing);
    }

  });

  function Sendmessage(userID,toUserID,message,listing)
  {
    const touser = users.get(toUserID);
    if(touser && touser.readyState === WebSocket.OPEN)
    {
      touser.send(JSON.stringify({action: 'message',from: 'server',user: userID,toUser: toUserID,message: message,listing: listing}));
      //console.log(`Message sent to user ${toUserID}`);
    }
    else
    {
     // console.log(`tried to send message to ${toUserID} but they arent connected.`)
    }

    const user = users.get(userID);
    if(user && user.readyState === WebSocket.OPEN)
    {
      user.send(JSON.stringify({action: 'message',from: 'server',user: userID,toUser: toUserID,message: message,listing: listing}));
    }

      const sql = `
    INSERT INTO messages (sent_from, sent_to, content, listing_id)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [userID, toUserID, message, listing], function(err) {
    if (err) {
      console.error("INSERT ERROR:", err.message);
    }
    else
    {
      
    }

    const messageid = this.lastID;
    //console.log(messageid);

    // update last login/active
    db.run("UPDATE user_stats SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?", [userID]);
  });

  }

  ws.on('close',() => {
    users.forEach((socket,userID) =>{
      if(socket === ws)
      {
        users.delete(userID);
        console.log(`User ${userID} disconnected`);
      }
    });
  });


});




const uploadDir = path.join(__dirname, 'public/uploads'); // Folder with media

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
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB max per file
});

// upload media
app.post('/api/instruments/media', upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'videos', maxCount: 5 }
]), (req, res) => {
  const listingId = req.body.listingId;
  if (!listingId) return res.status(400).json({ error: 'No listing ID provided!' });

  const files = [];
  if (req.files['images']) files.push(...req.files['images'].map(f => ({ ...f, type: 'image' })));
  if (req.files['videos']) files.push(...req.files['videos'].map(f => ({ ...f, type: 'video' })));

  if (files.length === 0) return res.status(400).json({ error: 'No files uploaded!' });

  const placeholders = files.map(() => '(?, ?, ?)').join(', ');
  const values = [];
  files.forEach(f => values.push(listingId, f.filename, f.type));

  const sql = `INSERT INTO media (listing_id, url, type) VALUES ${placeholders}`;

  db.run(sql, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    const filenames = files.map(f => f.filename);
    res.json({ message: 'Upload successful', filenames });
  });
});

// upload avatar
app.post('/api/users/avatar', upload.single('avatar'), (req, res) => {
  const userId = req.body.userId;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filename = req.file.filename;

    // get current profile_url
  db.get('SELECT profile_url FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });

     // delete old file if exists and !empty and !default
    if (row?.profile_url && row.profile_url !== 'default_avatar.png') {
      const oldFilePath = path.join(__dirname, 'public/uploads', row.profile_url);
      fs.unlink(oldFilePath, (err) => {
        if (err) console.warn('Old avatar not deleted:', err.message);
      });
    }

    //new avatar
    db.run(
      'UPDATE users SET profile_url = ? WHERE id = ?',
      [filename, userId],
      function(err) {
        if (err) return res.status(500).json({ error: 'Failed to update profile' });
        res.json({ message: 'Avatar updated', filename });
      }
    );
  });
});
   
// update media
app.post('/api/instruments/media/update', upload.fields([
  { name: 'newImages', maxCount: 5 },
  { name: 'newVideos', maxCount: 5 }
]), (req, res) => {
  const { listingId, userId, existingImages, existingVideos } = req.body;

  if (!listingId || !userId) return res.status(400).json({ error: 'Listing ID and User ID required' });

  // Parse existing arrays
  let existingImagesArr = [];
  let existingVideosArr = [];
  try {
    existingImagesArr = existingImages ? JSON.parse(existingImages) : [];
    existingVideosArr = existingVideos ? JSON.parse(existingVideos) : [];
  } catch (err) {
    return res.status(400).json({ error: 'Invalid existing files data' });
  }

  // Get listing and check ownership
  db.get('SELECT * FROM listings WHERE id = ?', [listingId], (err, listing) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.user_id != userId) return res.status(403).json({ error: 'Not authorized' });

    // Get current media from DB
    db.all('SELECT * FROM media WHERE listing_id = ?', [listingId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Database error fetching media' });

      const currentImages = rows.filter(r => r.type === 'image').map(r => r.url);
      const currentVideos = rows.filter(r => r.type === 'video').map(r => r.url);

      // files to delete
      const imagesToDelete = currentImages.filter(img => !existingImagesArr.includes(img));
      const videosToDelete = currentVideos.filter(vid => !existingVideosArr.includes(vid));

      // Delete files from uploads
      imagesToDelete.forEach(f => {
        const filePath = path.join(uploadDir, f);
        fs.unlink(filePath, err => { if (err) console.warn('Failed to delete image:', f); });
      });
      videosToDelete.forEach(f => {
        const filePath = path.join(uploadDir, f);
        fs.unlink(filePath, err => { if (err) console.warn('Failed to delete video:', f); });
      });

      // Delete from DB
      const allToDelete = [...imagesToDelete, ...videosToDelete];
      if (allToDelete.length > 0) {
        const placeholders = allToDelete.map(() => '?').join(',');
        db.run(`DELETE FROM media WHERE listing_id = ? AND url IN (${placeholders})`, [listingId, ...allToDelete], function(err) {
          if (err) console.warn('Failed to delete media from DB:', err.message);
        });
      }

      // Process new files
      const filesToInsert = [];
      if (req.files['newImages']) {
        filesToInsert.push(...req.files['newImages'].map(f => ({ filename: f.filename, type: 'image' })));
      }
      if (req.files['newVideos']) {
        filesToInsert.push(...req.files['newVideos'].map(f => ({ filename: f.filename, type: 'video' })));
      }

      // Insert new files into DB
      if (filesToInsert.length > 0) {
        const placeholders = filesToInsert.map(() => '(?, ?, ?)').join(',');
        const values = [];
        filesToInsert.forEach(f => values.push(listingId, f.filename, f.type));

        db.run(`INSERT INTO media (listing_id, url, type) VALUES ${placeholders}`, values, function(err) {
          if (err) return res.status(500).json({ error: 'Failed to insert new media' });

          res.json({
            success: true,
            newImages: filesToInsert.filter(f => f.type === 'image').map(f => f.filename),
            newVideos: filesToInsert.filter(f => f.type === 'video').map(f => f.filename)
          });
        });
      } else {
        // Nothing new uploaded, still return success
        res.json({ success: true, newImages: [], newVideos: [] });
      }
    });
  });
});


// send message
app.post("/api/messages/send", (req, res) => {
  
  const { sent_from, sent_to, content, listing_id } = req.body;

  if (!sent_from || !sent_to || !content || !listing_id) {
    return res.status(400).json({
      error: "Missing fields",
      received: { sent_from, sent_to, content, listing_id }
    });
  }

  const sql = `
    INSERT INTO messages (sent_from, sent_to, content, listing_id)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [sent_from, sent_to, content, listing_id], function(err) {
    if (err) {
      console.error("INSERT ERROR:", err.message);
      return res.status(500).json({ error: err.message });
    }

    // update last login/active
    db.run("UPDATE user_stats SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?", [sent_from]);

    res.json({ message_id: this.lastID });
  });
});

//messages of userID
app.get("/api/messages/:userId", (req, res) => {
  const userId = req.params.userId;

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
app.get("/api/messages/:listingId/:userId", (req, res) => {
  const { listingId, userId } = req.params;

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

    // update last login/active
    db.run("UPDATE user_stats SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?", [userId]);

    res.json(rows);
  });
});

// * of listings
app.get("/api/listings", (req, res) => {
  const sql = `SELECT * FROM listings`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// * of media
app.get("/api/media", (req, res) => {
  const sql = `SELECT * FROM media`;

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
app.get("/api/users", (req, res) => {
  const sql = `SELECT * FROM users`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

//GET specific user by id
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
      s.total_reviews
    FROM users u
    JOIN user_stats s ON u.id = s.user_id
    WHERE u.id = ?;
  `;

  const userID = Number(req.params.userID);

  db.get(sql, [userID], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "User not found" });

    // update last login/active
    db.run("UPDATE user_stats SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?", [userID]);

    res.json(row);
  });
});

// * of messages
app.get("/api/messages", (req, res) => {
  const sql = `SELECT * FROM messages`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

//update user
app.post('/api/users/update', async (req, res) => {
  const { id, name, email, bio, location, password } = req.body;

  if (!id) return res.status(400).json({ error: 'User ID is required' });

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

      const setClause = Object.keys(updatedFields).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updatedFields);
      values.push(id); 

      db.run(`UPDATE users SET ${setClause} WHERE id = ?`, values, function(err) {
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
app.put("/api/instrument/update/:id", (req, res) => {
  const listingId = req.params.id;

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
      ai_rating: req.body.ai_rating ?? listing.ai_rating
    };

    const setClause = Object.keys(updatedFields).map(key => `${key} = ?`).join(", ");
    const values = Object.values(updatedFields);
    values.push(listingId);

    db.run(`UPDATE listings SET ${setClause} WHERE id = ?`, values, function(err) {
      if (err) 
      {
        console.log(err);
        return res.status(500).json({ error: "Failed to update listing" });
      }


      res.json({ success: true, message: "Listing updated successfully" });
    });
  });
});


// Get all instruments
app.get("/api/instruments", async (req, res) => {
  try {
    const rows = await new Promise((resolve, reject) => {
      db.all(
      `
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
      LEFT JOIN categories c ON c.id = l.category_id;
      `
        ,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    const listings = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',') : [],
      videos: row.videos ? row.videos.split(',') : []
    }));

    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get specific instrument by id
app.get("/api/instrument/:id", (req, res) => {
  const id = req.params.id;

  db.get(
    `
    SELECT 
      l.id, l.title, l.price, l.description, l.status, l.created_at,l.user_id,l.brand,l.model,l.condition,l.ai_rating,
      u.name AS seller, l.category_id, c.name AS category,
      (SELECT GROUP_CONCAT(m.url) FROM media m WHERE m.listing_id = l.id AND m.type='image') AS images,
      (SELECT GROUP_CONCAT(m.url) FROM media m WHERE m.listing_id = l.id AND m.type='video') AS videos
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
app.delete("/api/instruments/:id", (req, res) => {
  const listingId = req.params.id;

  if (!listingId) {
    return res.status(400).json({ error: "Listing ID is required" });
  }

  // get the user_id first
  db.get("SELECT user_id FROM listings WHERE id = ?", [listingId], (err, row) => {
    if (err) return res.status(500).json({ error: "Failed to get listing: " + err.message });
    if (!row) return res.status(404).json({ error: "Listing not found" });

    const userId = row.user_id;

    // get files
    const getMediaSql = `SELECT url FROM media WHERE listing_id = ?`;
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
      const deleteImagesSql = `DELETE FROM media WHERE listing_id = ?`;
      db.run(deleteImagesSql, [listingId], function(err) {
        if (err) return res.status(500).json({ error: "Failed to delete media: " + err.message });

        // delete listing sql
        const deleteListingSql = `DELETE FROM listings WHERE id = ?`;
        db.run(deleteListingSql, [listingId], function(err) {
          if (err) return res.status(500).json({ error: "Failed to delete listing: " + err.message });

          // update stats: decrease active listings
          db.run("UPDATE user_stats SET active_listings = active_listings - 1 WHERE user_id = ?", [userId]);

          res.json({ success: true, message: "Listing and media deleted successfully" });
        });
      });
    });
  });
});

// register user
app.post('/api/users', async (req, res) => {
  const { name, email, location, password } = req.body;

  if (!name || !email || !location || !password) {
    return res.status(400).json({ error: 'Name, email, location, and password are required!' });
  }

  try {
    const pass_hash = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (name, email, location, pass_hash) VALUES (?, ?, ?, ?)';
    db.run(sql, [name, email, location, pass_hash], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'User with that name or email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      const userId = this.lastID;

      // empty stats
      const statsSql = 'INSERT INTO user_stats (user_id, total_listings, active_listings, total_sold, rating_count, total_reviews) VALUES (?, 0, 0, 0, 0, 0)';
      db.run(statsSql, [userId], (err2) => {
        if (err2) {
          return res.status(500).json({ error: err2.message });
        }

        res.json({ success: true, userId });
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//login user
app.post("/api/users/login", (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "name and password required"});
  }

  db.get("SELECT id, name, pass_hash FROM users WHERE name = ?", [name], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!user) {
      return res.status(401).json({ error: "Invalid name or password" });
    }

    bcrypt.compare(password, user.pass_hash, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!result) {
        return res.status(401).json({ error: "Invalid name or password" });
      }

      //send back user ID IMPORTANT!!!!!!!!!
      res.json({ success: true, id: user.id , name: user.name});

      // update last login
      db.run("UPDATE user_stats SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?", [user.id]);
    });
  });
});


// add/upload listing
app.post("/api/instruments", (req, res) => {
  const { user_id, title, price, description, status, category_id,brand,model,condition,ai_rating } = req.body;

  const sql = `
    INSERT INTO listings (title, price, description, status, user_id, category_id,brand,model,condition,ai_rating)
    VALUES (?, ?, ?, ?, ?, ?,?,?,?,?)
  `;

  db.run(sql, [title, price, description, status, user_id, category_id,brand,model,condition,ai_rating], function(err) {
    if (err) return res.status(500).json({ error: err.message });

    // update user stats: increment total_listings and active_listings
    db.run("UPDATE user_stats SET total_listings = total_listings + 1, active_listings = active_listings + 1 WHERE user_id = ?", [user_id]);

    res.json({ success: true, id: this.lastID });
  });
});

// add listing to cart
app.post("/api/cart-items", async (req, res) => {
  const ids = req.body.ids;

  if (!ids || ids.length === 0) {
    return res.json([]);
  }

  try {
    const rows = await new Promise((resolve, reject) => {
      const placeholders = ids.map(() => '?').join(',');
      const sql = `
        SELECT 
          l.id,
          l.title,
          l.price,
          l.description,
          l.status,
          l.created_at,
          l.user_id,
          l.brand,
          l.model,
          l.condition,
          l.ai_rating,
          u.name AS seller,
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
        WHERE l.id IN (${placeholders});
      `;

      db.all(sql, ids, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const listings = rows.map(row => ({
      ...row,
      images: row.images ? row.images.split(',') : [],
      videos: row.videos ? row.videos.split(',') : []
    }));

    res.json(listings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api", (req, res) => {
  res.send("Welcome to Hangszercsere API!");
});


app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});


server.listen(port, ip, () => {
  console.log('Websocket server running...');
});


app.listen(port, ip, () => {
  console.log(`Server running at http://${ip}:${port}`);
});
