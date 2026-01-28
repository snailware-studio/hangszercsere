function sum(a, b) {
  return a + b;
}


// login user
async function login(req, res, { db, bcrypt, crypto }) {
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

      bcrypt.compare(password, user.pass_hash, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result) return res.status(401).json({ error: "Hibás felhasználónév vagy jelszó" });

        if (!user.email_verified) return res.status(401).json({ error: "Email nincs megerősítve!" });

        const sessionId = crypto.randomUUID();
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

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

            db.run(
              "UPDATE user_stats SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?",
              [user.id]
            );
          }
        );
      });
    }
  );
}


//register user
async function register(req, res, { db, bcryptLib, emailService, AddToken, TokenType }) {
  const { name, email, location, password } = req.body;

  if (!name || !email || !location || !password) {
    return res.status(400).json({ error: 'Name, email, location, and password are required!' });
  }

  try {
    const pass_hash = await bcryptLib.hash(password, 10);

    db.run(
      'INSERT INTO users (name, email, location, pass_hash,email_verified) VALUES (?, ?, ?, ?, false)',
      [name, email, location, pass_hash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Felhasználónév vagy email már regisztrálva van!' });
          }
          return res.status(500).json({ error: err.message });
        }

        const userId = this.lastID;

        db.run(
          'INSERT INTO user_stats (user_id, total_listings, active_listings, total_sold, rating_count, total_reviews) VALUES (?, 0, 0, 0, 0, 0)',
          [userId],
          async (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });

            await emailService.sendWelcomeEmail(
              email,
              name,
              AddToken(userId, TokenType.EMAIL_VERIFICATION)
            );

            res.json({ success: true, userId });
          }
        );
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteUser(req, res, { db, emailService, AddToken, TokenType }) {
  const userId = req.body.userId;

  db.get('SELECT email,name FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "User not found" });

    const email = row.email;
    const name = row.name;

    emailService.sendProfileDeleteEmail(email, name, AddToken(userId, TokenType.DELETE_PROFILE));
    res.json({ success: true });
  });
}


module.exports = { login,sum,register,deleteUser};