<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Mass insert users
        $users = [
            ['username' => 'master', 'name' => 'Tania', 'lastname' => 'Vidalon', 'fullname' => 'Tania Vidalon', 'email' => 'tvidalon@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('MASTER'), 'document_type' => 'DNI', 'document_number' => '032', 'phone_prefix' => '51', 'phone' => '99999999', 'status' => true],
            ['username' => 'aprobador', 'name' => 'Karim', 'lastname' => 'Vargas', 'fullname' => 'Karim Vargas', 'email' => 'fcenturionz@softys.com', 'email_verified_at' => now(), 'password' => bcrypt('APROBADOR'), 'document_type' => 'DNI', 'document_number' => '031', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'supervisor', 'name' => 'Gisela', 'lastname' => 'Carrion', 'fullname' => 'Gisela Carrion', 'email' => 'administracion@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('SUPERVISOR'), 'document_type' => 'DNI', 'document_number' => '030', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'macuna', 'name' => 'Miguel', 'lastname' => 'Acuña', 'fullname' => 'Miguel Acuña', 'email' => 'miguel.acuna@l105.com', 'email_verified_at' => now(), 'password' => bcrypt('macuna'), 'document_type' => 'DNI', 'document_number' => '029', 'phone_prefix' => '51', 'phone' => '945074454', 'status' => true],
            ['username' => 'magistral', 'name' => 'Maria', 'lastname' => 'Llactahuaman', 'fullname' => 'Maria Llactahuaman', 'email' => 'preparacion.magistrales@kamarymedical.com', 'email_verified_at' => now(), 'password' => bcrypt('MAGISTRAL'), 'document_type' => 'DNI', 'document_number' => '028', 'phone_prefix' => '51', 'phone' => '993383919', 'status' => true],
            ['username' => 'bquispe', 'name' => 'Betty', 'lastname' => 'Quispe', 'fullname' => 'Betty Quispe', 'email' => 'operaciones@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('BQUISPE'), 'document_type' => 'DNI', 'document_number' => '027', 'phone_prefix' => '51', 'phone' => '946520933', 'status' => true],
            ['username' => 'lfiestas', 'name' => 'Luis', 'lastname' => 'Fiestas', 'fullname' => 'Luis Fiestas', 'email' => 'logistica2@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('LFIESTAS'), 'document_type' => 'DNI', 'document_number' => '024', 'phone_prefix' => '51', 'phone' => '941197599', 'status' => true],
            ['username' => 'mmontero', 'name' => 'Milagros', 'lastname' => 'Montero', 'fullname' => 'Milagros Montero', 'email' => 'logistica2@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('MMONTERO'), 'document_type' => 'DNI', 'document_number' => '023', 'phone_prefix' => '51', 'phone' => '932572498', 'status' => true],
            ['username' => 'kmenord', 'name' => 'Kelly', 'lastname' => 'Menor', 'fullname' => 'Kelly Menor', 'email' => 'logistica@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('KMENORD'), 'document_type' => 'DNI', 'document_number' => '022', 'phone_prefix' => '51', 'phone' => '908937518', 'status' => true],
            ['username' => 'eprofesional', 'name' => 'Gloria', 'lastname' => 'Porras', 'fullname' => 'Gloria Porras', 'email' => 'gporras@softys.com', 'email_verified_at' => now(), 'password' => bcrypt('EPROFESIONAL'), 'document_type' => 'DNI', 'document_number' => '021', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'vrisco', 'name' => 'Viviam', 'lastname' => 'Risco', 'fullname' => 'Viviam Risco', 'email' => 'direcciontecnica@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('VRISCO'), 'document_type' => 'DNI', 'document_number' => '020', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'gsosa', 'name' => 'Gina Milagros', 'lastname' => 'Sosa', 'fullname' => 'Gina Milagros Sosa', 'email' => 'logistica@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('GSOSA'), 'document_type' => 'DNI', 'document_number' => '019', 'phone_prefix' => '51', 'phone' => '908937536', 'status' => true],
            ['username' => 'alison', 'name' => 'Alison', 'lastname' => 'Marcos', 'fullname' => 'Alison Marcos', 'email' => 'jose.carrillo@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('ALISON'), 'document_type' => 'DNI', 'document_number' => '018', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'apozu', 'name' => 'Alicia Jossibel', 'lastname' => 'Pozu', 'fullname' => 'Alicia Jossibel Pozu', 'email' => 'aliciapozu19@gmail.com', 'email_verified_at' => now(), 'password' => bcrypt('APOZU'), 'document_type' => 'DNI', 'document_number' => '017', 'phone_prefix' => '51', 'phone' => '964287881', 'status' => false],
            ['username' => 'tgomez', 'name' => 'Tessy Natalí', 'lastname' => 'Gomez', 'fullname' => 'Tessy Natalí Gomez', 'email' => 'tessy.gomez.eliteprofessional@gmail.com', 'email_verified_at' => now(), 'password' => bcrypt('TGOMEZ'), 'document_type' => 'DNI', 'document_number' => '016', 'phone_prefix' => '51', 'phone' => '920229497', 'status' => false],
            ['username' => 'jsaavedra', 'name' => 'Joseline', 'lastname' => 'Saavedra', 'fullname' => 'Joseline Saavedra', 'email' => 'joseline.eliteprofessional@gmail.com', 'email_verified_at' => now(), 'password' => bcrypt('JSAAVEDRA'), 'document_type' => 'DNI', 'document_number' => '015', 'phone_prefix' => '51', 'phone' => '964287881', 'status' => false],
            ['username' => 'lhuaman', 'name' => 'Luz', 'lastname' => 'Huaman', 'fullname' => 'Luz Huaman', 'email' => 'logistica01@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('LHUAMAN'), 'document_type' => 'DNI', 'document_number' => '014', 'phone_prefix' => '51', 'phone' => '940588829', 'status' => true],
            ['username' => 'ventas', 'name' => 'Alicia', 'lastname' => 'Asto', 'fullname' => 'Alicia Asto', 'email' => 'aasto@softys.com.pe', 'email_verified_at' => now(), 'password' => bcrypt('VENTAS'), 'document_type' => 'DNI', 'document_number' => '012', 'phone_prefix' => '51', 'phone' => '924424410', 'status' => true],
            ['username' => 'gcarrion', 'name' => 'Gisela', 'lastname' => 'Carrion', 'fullname' => 'Gisela Carrion', 'email' => 'administracion@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('GCARRION'), 'document_type' => 'DNI', 'document_number' => '011', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'tvidalon', 'name' => 'Tania', 'lastname' => 'Vidalon', 'fullname' => 'Tania Vidalon', 'email' => 'tvidalon@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('TVIDALON'), 'document_type' => 'DNI', 'document_number' => '010', 'phone_prefix' => '51', 'phone' => '945459786', 'status' => true],
            ['username' => 'pvidalon', 'name' => 'Paul', 'lastname' => 'Vidalon', 'fullname' => 'Paul Vidalon', 'email' => 'administracion@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('pvidalon'), 'document_type' => 'DNI', 'document_number' => '009', 'phone_prefix' => '51', 'phone' => '999460000', 'status' => true],
            ['username' => 'cescate', 'name' => 'Carlos', 'lastname' => 'Escate', 'fullname' => 'Carlos Escate', 'email' => 'logistica2@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('cescate'), 'document_type' => 'DNI', 'document_number' => '008', 'phone_prefix' => '51', 'phone' => '924394262', 'status' => true],
            ['username' => 'mparra', 'name' => 'Michell Paola', 'lastname' => 'Parra', 'fullname' => 'Michell Paola Parra', 'email' => 'ventas@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('mparra'), 'document_type' => 'DNI', 'document_number' => '007', 'phone_prefix' => '51', 'phone' => '946856834', 'status' => true],
            ['username' => 'kespinoza', 'name' => 'Katia', 'lastname' => 'Espinoza', 'fullname' => 'Katia Espinoza', 'email' => 'asistentedirecciontecnica@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('KESPINOZA'), 'document_type' => 'DNI', 'document_number' => '006', 'phone_prefix' => '51', 'phone' => '992814273', 'status' => true],
            ['username' => 'jponce', 'name' => 'Jacqueline', 'lastname' => 'Ponce', 'fullname' => 'Jacqueline Ponce', 'email' => 'jponce@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('JPONCE'), 'document_type' => 'DNI', 'document_number' => '005', 'phone_prefix' => '51', 'phone' => '993649354', 'status' => false],
            ['username' => 'rrojas', 'name' => 'Ricardo', 'lastname' => 'Rojas', 'fullname' => 'Ricardo Rojas', 'email' => 'contabilidad@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('RROJAS'), 'document_type' => 'DNI', 'document_number' => '004', 'phone_prefix' => '51', 'phone' => '958557167', 'status' => true],
            ['username' => 'kvargas', 'name' => 'Karim Magaly', 'lastname' => 'Vargas', 'fullname' => 'Karim Magaly Vargas', 'email' => 'kvargas@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('kvargas'), 'document_type' => 'DNI', 'document_number' => '003', 'phone_prefix' => '51', 'phone' => '956487388', 'status' => true],
            ['username' => 'jcarrillo', 'name' => 'José', 'lastname' => 'Carrillo', 'fullname' => 'José Carrillo', 'email' => 'jose.carrillo@kamarymedicals.com', 'email_verified_at' => now(), 'password' => bcrypt('jcarrillo'), 'document_type' => 'DNI', 'document_number' => '002', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
        ];

        User::insert($users);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kamary', function (Blueprint $table) {
            //
        });
    }
};

