<?php

namespace App\Support;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Periodo de los dashboards: por mes, por año o personalizado.
 * Lo comparten el dashboard comercial y el de muestras para que filtren igual.
 */
class DashboardPeriod
{
    public const MODE_MONTH = 'month';
    public const MODE_YEAR = 'year';
    public const MODE_CUSTOM = 'custom';

    private const MONTHS = [
        1 => 'enero', 2 => 'febrero', 3 => 'marzo', 4 => 'abril', 5 => 'mayo', 6 => 'junio',
        7 => 'julio', 8 => 'agosto', 9 => 'setiembre', 10 => 'octubre', 11 => 'noviembre', 12 => 'diciembre',
    ];

    /**
     * Normaliza lo que manda la pantalla a un rango concreto.
     *
     * @return array{mode:string,month:string,year:int,start:string,end:string,label:string}
     */
    public static function resolve(Request $request): array
    {
        $mode = (string) $request->input('mode', self::MODE_MONTH);
        if (!in_array($mode, [self::MODE_MONTH, self::MODE_YEAR, self::MODE_CUSTOM], true)) {
            $mode = self::MODE_MONTH;
        }

        // Se conservan los tres valores aunque solo aplique uno: asi la pantalla no pierde
        // lo que el usuario ya habia elegido al cambiar de modo y volver.
        $month = self::normalizeMonth($request->input('month')) ?? now()->format('Y-m');
        $year = self::normalizeYear($request->input('year')) ?? (int) now()->format('Y');

        if ($mode === self::MODE_YEAR) {
            $start = Carbon::create($year, 1, 1)->startOfDay();
            $end = (clone $start)->endOfYear();
            $label = (string) $year;
        } elseif ($mode === self::MODE_CUSTOM) {
            $start = self::parseDate($request->input('start')) ?? now()->startOfMonth();
            $end = self::parseDate($request->input('end')) ?? now()->endOfMonth();
            if ($start->greaterThan($end)) [$start, $end] = [$end, $start];
            $label = $start->format('d/m/Y') . ' al ' . $end->format('d/m/Y');
        } else {
            $start = Carbon::createFromFormat('Y-m-d', $month . '-01')->startOfMonth();
            $end = (clone $start)->endOfMonth();
            $label = self::MONTHS[(int) $start->format('n')] . ' ' . $start->format('Y');
        }

        return [
            'mode' => $mode,
            'month' => $month,
            'year' => $year,
            'start' => $start->toDateString(),
            'end' => $end->toDateString(),
            'label' => $label,
        ];
    }

    /** Filtros por defecto: mes actual. */
    public static function defaults(): array
    {
        return self::resolve(new Request());
    }

    /**
     * Años que tienen datos, para no ofrecer años vacios en el desplegable.
     *
     * @param array<string,string|array<string>> $sources tabla => columna(s) de fecha
     */
    public static function availableYears(array $sources): array
    {
        $years = [];

        foreach ($sources as $table => $columns) {
            if (!Schema::hasTable($table)) continue;

            foreach ((array) $columns as $column) {
                if (!Schema::hasColumn($table, $column)) continue;

                $rows = DB::table($table)
                    ->whereNotNull($column)
                    ->selectRaw("DISTINCT YEAR({$column}) as year")
                    ->pluck('year');

                foreach ($rows as $year) {
                    $year = (int) $year;
                    if ($year > 1970) $years[$year] = $year;
                }
            }
        }

        // El año en curso siempre esta, aunque todavia no tenga movimiento.
        $current = (int) now()->format('Y');
        $years[$current] = $current;

        rsort($years);

        return array_values($years);
    }

    private static function normalizeMonth($value): ?string
    {
        $text = trim((string) $value);
        if (!preg_match('/^\d{4}-\d{2}$/', $text)) return null;

        [$year, $month] = array_map('intval', explode('-', $text));

        return ($month >= 1 && $month <= 12 && $year > 1970) ? $text : null;
    }

    private static function normalizeYear($value): ?int
    {
        $year = filter_var($value, FILTER_VALIDATE_INT);

        return ($year && $year > 1970 && $year < 3000) ? $year : null;
    }

    private static function parseDate($value): ?Carbon
    {
        if (!$value) return null;

        try {
            return Carbon::parse($value)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }
}
