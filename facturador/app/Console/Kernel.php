<?php

namespace App\Console;

use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Console\Scheduling\Schedule;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        //
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('summary:send')->dailyAt('00:00');
        $schedule->command('validate:documents')->dailyAt('00:10');
        $schedule->command('online:send-all')->dailyAt('00:20');

        // [DESACTIVADO] Se ejecutaba por hora guardando estado de cpu y memoria
        // $schedule->command('status:server')->hourly();
        // Llena las tablas para libro mayor - Se desactiva CMAR - buscar opcion de url
        // $schedule->command('account_ledger:fill')->hourly();
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }
}
