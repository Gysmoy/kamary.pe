<?php

declare(strict_types=1);

function cleanupLog(string $message): void
{
    echo "[db-cleanup] {$message}\n";
}

function envValue(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value === false || $value === null) {
        return $default;
    }

    return trim((string) $value);
}

/**
 * @return array<int,string>
 */
function parseCsv(string $csv): array
{
    if ($csv === '') {
        return [];
    }

    $parts = array_map('trim', explode(',', $csv));
    $parts = array_filter($parts, static function ($value) {
        return $value !== '';
    });

    return array_values(array_unique($parts));
}

/**
 * Format: "table.column,table2.column2"
 *
 * @return array<string,array<int,string>>
 */
function parseColumnPairs(string $value): array
{
    $result = [];
    foreach (parseCsv($value) as $pair) {
        $parts = explode('.', $pair, 2);
        if (count($parts) !== 2) {
            continue;
        }

        $table = trim($parts[0]);
        $column = trim($parts[1]);
        if ($table === '' || $column === '') {
            continue;
        }

        if (!array_key_exists($table, $result)) {
            $result[$table] = [];
        }

        if (!in_array($column, $result[$table], true)) {
            $result[$table][] = $column;
        }
    }

    return $result;
}

function tableExists(PDO $pdo, string $database, string $table): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = :database AND table_name = :table'
    );
    $stmt->execute([
        ':database' => $database,
        ':table' => $table,
    ]);

    return ((int) $stmt->fetchColumn()) > 0;
}

function columnExists(PDO $pdo, string $database, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = :database AND table_name = :table AND column_name = :column'
    );
    $stmt->execute([
        ':database' => $database,
        ':table' => $table,
        ':column' => $column,
    ]);

    return ((int) $stmt->fetchColumn()) > 0;
}

$profile = strtolower(envValue('DB_CLEANUP_PROFILE', 'single_company'));
if ($profile !== 'single_company') {
    cleanupLog("Profile '{$profile}' is not enabled. Skipping cleanup.");
    exit(0);
}

$host = envValue('DB_HOST');
$port = envValue('DB_PORT', '3306');
$database = envValue('DB_DATABASE');
$username = envValue('DB_USERNAME');
$password = envValue('DB_PASSWORD');

if ($host === '' || $database === '' || $username === '') {
    cleanupLog('Missing database environment variables. Skipping cleanup.');
    exit(0);
}

$defaultTablesToDrop = [
    // Old single-address table replaced by person_addresses.
    'person_address',
    // Legacy multi-tenant/system tables.
    'clients',
    'hostnames',
    'websites',
    'plans',
    'plan_module',
    'tenant_migrations',
];

$defaultColumnsToDrop = [
    // Legacy lock flag for removed tenant mode.
    'configurations' => ['locked_tenant'],
];

$extraTables = parseCsv(envValue('DB_CLEANUP_EXTRA_TABLES', ''));
$extraColumns = parseColumnPairs(envValue('DB_CLEANUP_EXTRA_COLUMNS', ''));

$tablesToDrop = array_values(array_unique(array_merge($defaultTablesToDrop, $extraTables)));
$columnsToDrop = $defaultColumnsToDrop;
foreach ($extraColumns as $table => $columns) {
    if (!array_key_exists($table, $columnsToDrop)) {
        $columnsToDrop[$table] = [];
    }
    foreach ($columns as $column) {
        if (!in_array($column, $columnsToDrop[$table], true)) {
            $columnsToDrop[$table][] = $column;
        }
    }
}

try {
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $database);
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (Throwable $e) {
    cleanupLog('Could not connect to database: ' . $e->getMessage());
    exit(1);
}

$pdo->exec('SET FOREIGN_KEY_CHECKS=0');

foreach ($tablesToDrop as $table) {
    try {
        if (!tableExists($pdo, $database, $table)) {
            continue;
        }
        $pdo->exec(sprintf('DROP TABLE `%s`', str_replace('`', '``', $table)));
        cleanupLog("Dropped table {$table}");
    } catch (Throwable $e) {
        cleanupLog("Could not drop table {$table}: " . $e->getMessage());
    }
}

foreach ($columnsToDrop as $table => $columns) {
    if (!tableExists($pdo, $database, $table)) {
        continue;
    }

    foreach ($columns as $column) {
        try {
            if (!columnExists($pdo, $database, $table, $column)) {
                continue;
            }

            $pdo->exec(sprintf(
                'ALTER TABLE `%s` DROP COLUMN `%s`',
                str_replace('`', '``', $table),
                str_replace('`', '``', $column)
            ));
            cleanupLog("Dropped column {$table}.{$column}");
        } catch (Throwable $e) {
            cleanupLog("Could not drop column {$table}.{$column}: " . $e->getMessage());
        }
    }
}

$pdo->exec('SET FOREIGN_KEY_CHECKS=1');

cleanupLog('Cleanup finished.');

