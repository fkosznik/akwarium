<?php
$db = new PDO('sqlite:aquarium.db');

// Użytkownicy (login: demo, hasło: demo)
$db->exec("CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, username TEXT UNIQUE, password TEXT
)");
$db->exec("INSERT OR IGNORE INTO users (username, password) VALUES ('demo', 'demo')");

// Galeria dostępnych ryb
$db->exec("CREATE TABLE IF NOT EXISTS gallery (
  id INTEGER PRIMARY KEY, name TEXT, img TEXT, max_size INTEGER, `desc` TEXT
)");
$db->exec("INSERT OR IGNORE INTO gallery (name, img, max_size, `desc`)
           VALUES
           ('Złota rybka', 'assets/fish1.png', 35, 'Mała, towarzyska.'),
           ('Gupik', 'assets/fish2.png', 7, 'Popularna, kolorowa.'),
           ('Skalar', 'assets/fish3.png', 15, 'Imponująca płetwa.')");

// Akwarium użytkownika
$db->exec("CREATE TABLE IF NOT EXISTS aquarium (
  user_id INTEGER PRIMARY KEY,
  is_clean INTEGER DEFAULT 1,
  light INTEGER DEFAULT 1,
  ph REAL DEFAULT 7.0,
  temp INTEGER DEFAULT 24,
  hard TEXT DEFAULT 'średnia'
)");
$db->exec("INSERT OR IGNORE INTO aquarium (user_id) VALUES (1)");

// Ryby w akwarium
$db->exec("CREATE TABLE IF NOT EXISTS fishes (
  id INTEGER PRIMARY KEY, user_id INTEGER, gallery_id INTEGER, size INTEGER, age INTEGER DEFAULT 1, speed INTEGER DEFAULT 7
)");

// Dodaj przykładową rybę
$db->exec("INSERT OR IGNORE INTO fishes (id, user_id, gallery_id, size) VALUES (1, 1, 1, 30)");

echo "Baza utworzona!";
