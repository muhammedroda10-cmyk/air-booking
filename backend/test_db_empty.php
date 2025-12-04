<?php
try {
    $pdo = new PDO("pgsql:host=127.0.0.1;port=5432;dbname=postgres", "postgres", "");
    echo "Connection with empty password successful!";
} catch (PDOException $e) {
    echo "Connection with empty password failed: " . $e->getMessage();
}
