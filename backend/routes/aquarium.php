<?php
// backend/routes/aquarium.php

if ($uri[1] === 'aquariums') {
    if ($requestMethod === 'GET') {
        // Pobierz wszystkie akwaria
        $stmt = $pdo->query("SELECT * FROM aquariums");
        echo json_encode($stmt->fetchAll());
    }

    if ($requestMethod === 'POST') {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!isset($data['name'], $data['type'], $data['volume'], $data['user_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Brakuje wymaganych danych']);
            exit;
        }

        $stmt = $pdo->prepare("INSERT INTO aquariums (name, type, volume, user_id) VALUES (?, ?, ?, ?)");
        $stmt->execute([$data['name'], $data['type'], $data['volume'], $data['user_id']]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    }
}
