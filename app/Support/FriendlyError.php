<?php

namespace App\Support;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Traduce los errores tecnicos a algo que el usuario pueda entender.
 *
 * Los mensajes que lanzamos nosotros con `throw new \Exception('...')` ya estan redactados
 * para el usuario, asi que pasan tal cual. Lo que se traduce es lo que escupen la base de
 * datos y el framework: el SQL completo con bindings no le sirve a nadie en pantalla.
 */
class FriendlyError
{
    /** Indices unicos cuyo choque conviene explicar con el nombre del negocio. */
    private const DUPLICATE_MESSAGES = [
        'magistral_formulas_article_id_unique' => 'Ya existe una formula magistral para este articulo.',
    ];

    /**
     * @param array $duplicateMessages Mensajes extra por nombre de indice, para casos puntuales.
     */
    public static function message(\Throwable $th, array $duplicateMessages = []): string
    {
        if ($th instanceof ValidationException) {
            return collect($th->errors())->flatten()->first() ?: 'Revisa los datos del formulario.';
        }

        if ($th instanceof ModelNotFoundException) {
            self::log($th);

            return 'No se encontro el registro. Puede que lo hayan eliminado o que ya no este disponible.';
        }

        if ($th instanceof QueryException) {
            self::log($th);

            return self::fromQueryException($th, $duplicateMessages);
        }

        // Errores propios del dominio: ya vienen redactados en español.
        if ($th instanceof \Exception && $th::class === \Exception::class) {
            return $th->getMessage();
        }

        if ($th instanceof \Error || $th instanceof \TypeError) {
            self::log($th);

            return 'Ocurrio un error inesperado al procesar la solicitud. Avisa al area de sistemas.';
        }

        return $th->getMessage();
    }

    private static function fromQueryException(QueryException $th, array $duplicateMessages): string
    {
        $code = (string) ($th->errorInfo[1] ?? '');
        $raw = $th->getMessage();

        switch ($code) {
            case '1062': // Duplicate entry
                $index = self::duplicatedIndex($raw);
                $known = array_merge(self::DUPLICATE_MESSAGES, $duplicateMessages);
                if ($index && isset($known[$index])) return $known[$index];

                $field = self::humanizeIndex($index);

                return $field
                    ? "Ya existe un registro con ese {$field}."
                    : 'Ya existe un registro con esos datos.';

            case '1451': // Cannot delete or update a parent row
                return 'No se puede eliminar porque hay otros registros que dependen de este.';

            case '1452': // Cannot add or update a child row
                return 'El dato relacionado que elegiste ya no existe. Actualiza la pagina y vuelve a intentar.';

            case '1048': // Column cannot be null
                $column = self::humanizeColumn(self::matched("/Column '([^']+)' cannot be null/", $raw));

                return $column
                    ? "El campo {$column} es obligatorio."
                    : 'Falta completar un campo obligatorio.';

            case '1364': // Field doesn't have a default value
                $column = self::humanizeColumn(self::matched("/Field '([^']+)' doesn't have a default value/", $raw));

                return $column
                    ? "El campo {$column} es obligatorio."
                    : 'Falta completar un campo obligatorio.';

            case '1406': // Data too long
                $column = self::humanizeColumn(self::matched("/Data too long for column '([^']+)'/", $raw));

                return $column
                    ? "El valor de {$column} es demasiado largo."
                    : 'Uno de los valores ingresados es demasiado largo.';

            case '1264': // Out of range
                return 'Uno de los valores numericos esta fuera del rango permitido.';

            case '1213': // Deadlock
            case '1205': // Lock wait timeout
                return 'El sistema esta ocupado procesando otra operacion. Vuelve a intentar en unos segundos.';

            default:
                return 'No se pudo completar la operacion por un problema en la base de datos. Avisa al area de sistemas.';
        }
    }

    /** Nombre del indice unico que fallo, tal como lo reporta MySQL. */
    private static function duplicatedIndex(string $raw): ?string
    {
        $index = self::matched("/for key '([^']+)'/", $raw);
        if (!$index) return null;

        // MySQL 8 reporta 'tabla.indice'; nos quedamos con el indice.
        $parts = explode('.', $index);

        return end($parts) ?: null;
    }

    /** Convierte 'magistral_formulas_article_id_unique' en 'articulo'. */
    private static function humanizeIndex(?string $index): ?string
    {
        if (!$index) return null;

        $name = preg_replace('/_(unique|index)$/', '', $index);
        $name = preg_replace('/_id$/', '', (string) $name);
        $parts = array_filter(explode('_', (string) $name));

        return $parts ? self::humanizeColumn(end($parts)) : null;
    }

    /** Traduce el nombre tecnico de una columna a una palabra del negocio. */
    private static function humanizeColumn(?string $column): ?string
    {
        if (!$column) return null;

        $column = last(explode('.', $column));
        $column = preg_replace('/_id$/', '', $column);

        $labels = [
            'article' => 'articulo',
            'client' => 'cliente',
            'supplier' => 'proveedor',
            'business' => 'empresa',
            'warehouse' => 'almacen',
            'code' => 'codigo',
            'name' => 'nombre',
            'description' => 'descripcion',
            'document_number' => 'numero de documento',
            'email' => 'correo',
            'username' => 'usuario',
            'order_number' => 'numero de pedido',
            'plate' => 'placa',
            'ruc' => 'RUC',
        ];

        return $labels[$column] ?? str_replace('_', ' ', $column);
    }

    private static function matched(string $pattern, string $subject): ?string
    {
        return preg_match($pattern, $subject, $matches) ? $matches[1] : null;
    }

    /** El error tecnico completo queda en el log, que es donde sirve. */
    private static function log(\Throwable $th): void
    {
        Log::warning('[FriendlyError] ' . $th->getMessage(), [
            'exception' => $th::class,
            'file' => $th->getFile() . ':' . $th->getLine(),
        ]);
    }
}
