<?php
// backend/index.php

require_once './db/connection.php';
header('Content-Type: application/json');

$requestMethod = $_SERVER['REQUEST_METHOD'];
$uri = explode('/', trim($_SERVER['REQUEST_URI'], '/'));

if ($uri[0] === 'fish') {
    if ($requestMethod === 'GET') {
        $stmt = $pdo->query("SELECT * FROM fish ORDER BY RAND() LIMIT 1");
        echo json_encode($stmt->fetch());
    }

    if ($requestMethod === 'DELETE') {
        $stmt = $pdo->query("SELECT id FROM fish ORDER BY RAND() LIMIT 1");
        $row = $stmt->fetch();
        if ($row) {
            $id = $row['id'];
            $del = $pdo->prepare("DELETE FROM fish WHERE id = ?");
            $del->execute([$id]);
            echo json_encode(['success' => true, 'deleted_id' => $id]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Brak ryb do usunięcia']);
        }
    }
}

if ($uri[0] === 'measurements' && $requestMethod === 'GET') {
    // Zakładamy 1 akwarium - uproszczenie
    $stmt = $pdo->query("SELECT ph, temperature, hardness FROM measurements ORDER BY measured_at DESC LIMIT 1");
    echo json_encode($stmt->fetch());
}
