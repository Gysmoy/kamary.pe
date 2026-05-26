<?php

namespace App\Support;

use App\Models\Article;
use App\Models\Client;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

class StorageScope
{
    public static function clientQuery(): Builder
    {
        return self::applyClientScope(Client::query());
    }

    public static function applyClientScope(Builder $query, string $table = 'clients'): Builder
    {
        $prefix = $table !== '' ? "{$table}." : '';

        return $query
            ->whereNotNull("{$prefix}status")
            ->where("{$prefix}client_kind", 'regular')
            ->when(Schema::hasColumn('clients', 'module_scope'), function ($query) use ($prefix) {
                $query->where("{$prefix}module_scope", 'storage');
            }, function ($query) use ($prefix) {
                if (Schema::hasColumn('clients', 'has_storage_service')) {
                    $query->where("{$prefix}has_storage_service", true);
                }
            });
    }

    public static function assertClient(int $clientId): Client
    {
        $client = self::clientQuery()->whereKey($clientId)->first();
        if (!$client) {
            throw new \Exception('Cliente de almacenamiento no encontrado');
        }

        return $client;
    }

    public static function articleQuery(): Builder
    {
        return Article::query()
            ->when(Schema::hasColumn('articles', 'module_scope'), function ($query) {
                $query->where('module_scope', 'storage');
            });
    }

    public static function assertArticle(int $articleId): Article
    {
        $article = self::articleQuery()->whereKey($articleId)->first();
        if (!$article) {
            throw new \Exception('Articulo de almacenamiento no encontrado');
        }

        return $article;
    }

    public static function assertArticleBelongsToClient(int $articleId, int $clientId): Article
    {
        $article = self::articleQuery()
            ->whereKey($articleId)
            ->when(Schema::hasColumn('articles', 'client_id'), function ($query) use ($clientId) {
                $query->where('client_id', $clientId);
            })
            ->first();

        if (!$article) {
            throw new \Exception('El articulo seleccionado no pertenece al cliente de almacenamiento');
        }

        return $article;
    }
}
