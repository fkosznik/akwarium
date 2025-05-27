<?php
// --- CORS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

header('Content-Type: application/json');
$db = new PDO('sqlite:aquarium.db');
session_start();

// PROSTA AUTORYZACJA (token = nazwa użytkownika) – wersja demo
function getUser() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $token = str_replace('Bearer ', '', $headers['Authorization']);
        $stmt = $GLOBALS['db']->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$token]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    return null;
}

// --- ROUTING
$method = $_SERVER['REQUEST_METHOD'];
$uri = explode('?', $_SERVER['REQUEST_URI'])[0];

function body() {
    return json_decode(file_get_contents('php://input'), true) ?: [];
}

if ($uri === '/api/login' && $method === 'POST') {
    $data = body();
    $stmt = $db->prepare("SELECT * FROM users WHERE username = ? AND password = ?");
    $stmt->execute([$data['username'] ?? '', $data['password'] ?? '']);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo json_encode(['token' => $user['username']]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Błędne dane logowania']);
    }
    exit;
}

// ENDPOINTY wymagające autoryzacji:
$user = getUser();
if (!$user && $uri !== '/api/gallery' && $uri !== '/api/login') {
    http_response_code(401); echo json_encode(['error'=>'Brak autoryzacji']); exit;
}


// Galeria ryb (dostępna bez logowania)
if ($uri === '/api/gallery' && $method === 'GET') {
    $q = $db->query("SELECT * FROM gallery");
    echo json_encode($q->fetchAll(PDO::FETCH_ASSOC));
    exit;
}

// Pobierz stan akwarium i ryby
if ($uri === '/api/aquarium' && $method === 'GET') {
    $aq = $db->prepare("SELECT * FROM aquarium WHERE user_id = ?");
    $aq->execute([$user['id']]);
    $aqua = $aq->fetch(PDO::FETCH_ASSOC);

    $fishes = $db->prepare("SELECT f.*, g.name, g.img FROM fishes f
        JOIN gallery g ON f.gallery_id = g.id WHERE f.user_id = ?");
    $fishes->execute([$user['id']]);
    $fishes = $fishes->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'is_clean' => (bool)$aqua['is_clean'],
        'light' => (bool)$aqua['light'],
        'water' => [
            'ph' => $aqua['ph'],
            'temp' => $aqua['temp'],
            'hard' => $aqua['hard']
        ],
        'fishes' => $fishes
    ]);
    exit;
}

// Dodaj rybę
if ($uri === '/api/fish' && $method === 'POST') {
    $aq = $db->prepare("SELECT is_clean FROM aquarium WHERE user_id = ?");
    $aq->execute([$user['id']]);
    if (!$aq->fetchColumn()) {
        http_response_code(400); echo json_encode(['error'=>'Akwarium brudne!']); exit;
    }
    $data = body();
    $gallery_id = (int)($data['fish_id'] ?? 0);
    $size = (int)($data['size'] ?? 0);

    // pobierz max_size
    $stmt = $db->prepare("SELECT max_size FROM gallery WHERE id = ?");
    $stmt->execute([$gallery_id]);
    $max_size = $stmt->fetchColumn();
    if (!$max_size || $size < 1 || $size > $max_size) {
        http_response_code(400); echo json_encode(['error'=>'Błędna wielkość']); exit;
    }
    $db->prepare("INSERT INTO fishes (user_id, gallery_id, size) VALUES (?, ?, ?)")
       ->execute([$user['id'], $gallery_id, $size]);
    echo json_encode(['ok'=>1]);
    exit;
}

// Usuń rybę
if (preg_match('#^/api/fish/(\d+)$#', $uri, $m) && $method === 'DELETE') {
    $id = (int)$m[1];
    $db->prepare("DELETE FROM fishes WHERE id = ? AND user_id = ?")->execute([$id, $user['id']]);
    echo json_encode(['ok'=>1]);
    exit;
}

// Edytuj wielkość ryby
if (preg_match('#^/api/fish/(\d+)$#', $uri, $m) && $method === 'PUT') {
    $id = (int)$m[1];
    $data = body();
    $size = (int)($data['size'] ?? 0);
    $db->prepare("UPDATE fishes SET size = ? WHERE id = ? AND user_id = ?")
        ->execute([$size, $id, $user['id']]);
    echo json_encode(['ok'=>1]);
    exit;
}

// Nakarm rybę (losową powiększ)
if ($uri === '/api/fish/feed' && $method === 'POST') {
    $q = $db->prepare("SELECT id, size FROM fishes WHERE user_id = ? ORDER BY RANDOM() LIMIT 1");
    $q->execute([$user['id']]);
    $fish = $q->fetch(PDO::FETCH_ASSOC);
    if ($fish) {
        $newsize = min($fish['size'] + 2, 40);
        $db->prepare("UPDATE fishes SET size = ? WHERE id = ?")->execute([$newsize, $fish['id']]);
    }
    echo json_encode(['ok'=>1]);
    exit;
}

// Czyszczenie akwarium
if ($uri === '/api/aquarium/clean' && $method === 'POST') {
    $db->prepare("UPDATE aquarium SET is_clean = 1 WHERE user_id = ?")->execute([$user['id']]);
    echo json_encode(['ok'=>1]);
    exit;
}

// Włącz/wyłącz światło
if ($uri === '/api/aquarium/light' && $method === 'POST') {
    $data = body();
    $val = $data['state'] ? 1 : 0;
    $db->prepare("UPDATE aquarium SET light = ? WHERE user_id = ?")->execute([$val, $user['id']]);
    echo json_encode(['ok'=>1]);
    exit;
}

// 404
http_response_code(404); echo json_encode(['error'=>'404']);
