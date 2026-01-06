const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Could not connect to database", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

db.exec(`

  CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires DATETIME NOT NULL
);


CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    pass_hash TEXT NOT NULL,
    location TEXT,
    rating REAL CHECK (rating >= 0 AND rating <= 5),
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    email TEXT,
    email_verified BOOLEAN DEFAULT 0,
    profile_url TEXT DEFAULT 'default_avatar.png',
    bio TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    phone TEXT
);

CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY,
    cart_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE(cart_id, listing_id)
);

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    status TEXT CHECK (status IN ('inactive','active','sold')) DEFAULT 'inactive',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    condition TEXT CHECK(condition IN ('New','Very Good','Good','Satisfactory')),
    brand TEXT,
    model TEXT,
    ai_rating REAL CHECK (ai_rating >= 0 AND ai_rating <= 5),
    ai_reviewed BOOLEAN DEFAULT 0,
    ai_feedback TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY,
    listing_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    type TEXT CHECK(type IN ('image','video')) NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    sent_from INTEGER,
    sent_to INTEGER,
    listing_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sent_from) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY,
    sent_from INTEGER,
    sent_to INTEGER,
    price REAL NOT NULL,
    status TEXT CHECK (status IN ('pending','completed','cancelled')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (sent_from) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY,
    listing_id INTEGER,
    transaction_id INTEGER,
    sent_from INTEGER,
    sent_to INTEGER,
    rating REAL CHECK (rating >= 0 AND rating <= 5),
    comment TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    anonymous BOOLEAN DEFAULT 0,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_from) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (sent_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    total_listings INTEGER DEFAULT 0,
    total_sold INTEGER DEFAULT 0,
    total_spent REAL DEFAULT 0,
    total_earned REAL DEFAULT 0,
    last_login DATETIME,
    active_listings INTEGER DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_queue (
    id INTEGER PRIMARY KEY,
    listing_id INTEGER NOT NULL UNIQUE,
    eligible_at DATETIME NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);


`);

module.exports = db;
