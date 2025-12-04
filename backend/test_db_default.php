<?php
try {
    $pdo = new PDO("pgsql:host=127.0.0.1;port=5432;dbname=postgres", "postgres", "postgres");
    echo "Connection to 'postgres' DB successful!";
} catch (PDOException $e) {
    echo "Connection to 'postgres' DB failed: " . $e->getMessage();
}
