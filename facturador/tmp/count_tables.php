<?php
$lines = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$env = [];
foreach ($lines as $line) {
    $line = trim($line);
    if ($line === '' || $line[0] === '#') {
        continue;
    }

    $pos = strpos($line, '=');
    if ($pos === false) {
        continue;
    }

    $key = trim(substr($line, 0, $pos));
    $val = trim(substr($line, $pos + 1));
    $val = trim($val, "\"'");
    $env[$key] = $val;
}

$host = $env['DB_HOST'] ?? null;
$port = $env['DB_PORT'] ?? '3306';
$db = $env['DB_DATABASE'] ?? null;
$user = $env['DB_USERNAME'] ?? null;
$pass = $env['DB_PASSWORD'] ?? '';

if (!$host || !$db || !$user) {
    fwrite(STDERR, "missing_db_env\n");
    exit(1);
}

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->prepare('SELECT table_name FROM information_schema.tables WHERE table_schema = :db ORDER BY table_name');
    $stmt->execute([':db' => $db]);
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo 'table_count=' . count($tables) . PHP_EOL;
    foreach ($tables as $table) {
        echo $table . PHP_EOL;
    }
} catch (Throwable $e) {
    fwrite(STDERR, 'db_error: ' . $e->getMessage() . PHP_EOL);
    exit(1);
}
