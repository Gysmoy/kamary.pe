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
            ['username' => 'MASTER', 'name' => 'TANIA', 'lastname' => 'VIDALON', 'fullname' => 'TANIA VIDALON', 'email' => 'tvidalon@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('MASTER'), 'document_type' => 'DNI', 'document_number' => '032', 'phone_prefix' => '51', 'phone' => '99999999', 'status' => true],
            ['username' => 'APROBADOR', 'name' => 'KARIM', 'lastname' => 'VARGAS', 'fullname' => 'KARIM VARGAS', 'email' => 'fcenturionz@softys.com', 'email_verified_at' => now(), 'password' => bcrypt('APROBADOR'), 'document_type' => 'DNI', 'document_number' => '031', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'SUPERVISOR', 'name' => 'GISELA', 'lastname' => 'CARRION', 'fullname' => 'GISELA CARRION', 'email' => 'administracion@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('SUPERVISOR'), 'document_type' => 'DNI', 'document_number' => '030', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'macuna', 'name' => 'Miguel', 'lastname' => 'Acuña', 'fullname' => 'Miguel Acuña', 'email' => 'miguel.acuna@l105.com', 'email_verified_at' => now(), 'password' => bcrypt('macuna'), 'document_type' => 'DNI', 'document_number' => '029', 'phone_prefix' => '51', 'phone' => '945074454', 'status' => true],
            ['username' => 'MAGISTRAL', 'name' => 'MARIA', 'lastname' => 'LLACTAHUAMAN', 'fullname' => 'MARIA LLACTAHUAMAN', 'email' => 'preparacion.magistrales@kamarymedical.com', 'email_verified_at' => now(), 'password' => bcrypt('MAGISTRAL'), 'document_type' => 'DNI', 'document_number' => '028', 'phone_prefix' => '51', 'phone' => '993383919', 'status' => true],
            ['username' => 'BQUISPE', 'name' => 'Betty', 'lastname' => 'Quispe', 'fullname' => 'Betty Quispe', 'email' => 'operaciones@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('BQUISPE'), 'document_type' => 'DNI', 'document_number' => '027', 'phone_prefix' => '51', 'phone' => '946520933', 'status' => true],
            ['username' => 'LFIESTAS', 'name' => 'Luis', 'lastname' => 'Fiestas', 'fullname' => 'Luis Fiestas', 'email' => 'logistica2@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('LFIESTAS'), 'document_type' => 'DNI', 'document_number' => '024', 'phone_prefix' => '51', 'phone' => '941197599', 'status' => true],
            ['username' => 'MMONTERO', 'name' => 'Milagros', 'lastname' => 'Montero', 'fullname' => 'Milagros Montero', 'email' => 'logistica2@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('MMONTERO'), 'document_type' => 'DNI', 'document_number' => '023', 'phone_prefix' => '51', 'phone' => '932572498', 'status' => true],
            ['username' => 'KMENORD', 'name' => 'Kelly', 'lastname' => 'Menor', 'fullname' => 'Kelly Menor', 'email' => 'logistica@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('KMENORD'), 'document_type' => 'DNI', 'document_number' => '022', 'phone_prefix' => '51', 'phone' => '908937518', 'status' => true],
            ['username' => 'EPROFESIONAL', 'name' => 'Gloria', 'lastname' => 'Porras', 'fullname' => 'Gloria Porras', 'email' => 'gporras@softys.com', 'email_verified_at' => now(), 'password' => bcrypt('EPROFESIONAL'), 'document_type' => 'DNI', 'document_number' => '021', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'VRISCO', 'name' => 'VIVIAM', 'lastname' => 'RISCO', 'fullname' => 'VIVIAM RISCO', 'email' => 'direcciontecnica@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('VRISCO'), 'document_type' => 'DNI', 'document_number' => '020', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'GSOSA', 'name' => 'Gina Milagros', 'lastname' => 'Sosa', 'fullname' => 'Gina Milagros Sosa', 'email' => 'logistica@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('GSOSA'), 'document_type' => 'DNI', 'document_number' => '019', 'phone_prefix' => '51', 'phone' => '908937536', 'status' => true],
            ['username' => 'ALISON', 'name' => 'ALISON', 'lastname' => 'MARCOS', 'fullname' => 'ALISON MARCOS', 'email' => 'jose.carrillo@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('ALISON'), 'document_type' => 'DNI', 'document_number' => '018', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'APOZU', 'name' => 'Alicia jossibel', 'lastname' => 'Pozu', 'fullname' => 'Alicia jossibel Pozu', 'email' => 'aliciapozu19@gmail.com', 'email_verified_at' => now(), 'password' => bcrypt('APOZU'), 'document_type' => 'DNI', 'document_number' => '017', 'phone_prefix' => '51', 'phone' => '964287881', 'status' => false],
            ['username' => 'TGOMEZ', 'name' => 'Tessy Natalí', 'lastname' => 'Gomez', 'fullname' => 'Tessy Natalí Gomez', 'email' => 'tessy.gomez.eliteprofessional@gmail.com', 'email_verified_at' => now(), 'password' => bcrypt('TGOMEZ'), 'document_type' => 'DNI', 'document_number' => '016', 'phone_prefix' => '51', 'phone' => '920229497', 'status' => false],
            ['username' => 'JSAAVEDRA', 'name' => 'Joseline', 'lastname' => 'Saavedra', 'fullname' => 'Joseline Saavedra', 'email' => 'joseline.eliteprofessional@gmail.com', 'email_verified_at' => now(), 'password' => bcrypt('JSAAVEDRA'), 'document_type' => 'DNI', 'document_number' => '015', 'phone_prefix' => '51', 'phone' => '964287881', 'status' => false],
            ['username' => 'LHUAMAN', 'name' => 'Luz', 'lastname' => 'Huaman', 'fullname' => 'Luz Huaman', 'email' => 'logistica01@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('LHUAMAN'), 'document_type' => 'DNI', 'document_number' => '014', 'phone_prefix' => '51', 'phone' => '940588829', 'status' => true],
            ['username' => 'VENTAS', 'name' => 'ALICIA', 'lastname' => 'ASTO', 'fullname' => 'ALICIA ASTO', 'email' => 'aasto@softys.com.pe', 'email_verified_at' => now(), 'password' => bcrypt('VENTAS'), 'document_type' => 'DNI', 'document_number' => '012', 'phone_prefix' => '51', 'phone' => '924424410', 'status' => true],
            ['username' => 'GCARRION', 'name' => 'Gisela', 'lastname' => 'Carrion', 'fullname' => 'Gisela Carrion', 'email' => 'administracion@kamatyfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('GCARRION'), 'document_type' => 'DNI', 'document_number' => '011', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
            ['username' => 'TVIDALON', 'name' => 'TANIA', 'lastname' => 'VIDALON', 'fullname' => 'TANIA VIDALON', 'email' => 'tvidalon@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('TVIDALON'), 'document_type' => 'DNI', 'document_number' => '010', 'phone_prefix' => '51', 'phone' => '945459786', 'status' => true],
            ['username' => 'pvidalon', 'name' => 'PAUL', 'lastname' => 'VIDALON', 'fullname' => 'PAUL VIDALON', 'email' => 'administracion@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('pvidalon'), 'document_type' => 'DNI', 'document_number' => '009', 'phone_prefix' => '51', 'phone' => '999460000', 'status' => true],
            ['username' => 'cescate', 'name' => 'CARLOS', 'lastname' => 'ESCATE', 'fullname' => 'CARLOS ESCATE', 'email' => 'logistica2@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('cescate'), 'document_type' => 'DNI', 'document_number' => '008', 'phone_prefix' => '51', 'phone' => '924394262', 'status' => true],
            ['username' => 'mparra', 'name' => 'Michell Paola', 'lastname' => 'Parra', 'fullname' => 'Michell Paola Parra', 'email' => 'ventas@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('mparra'), 'document_type' => 'DNI', 'document_number' => '007', 'phone_prefix' => '51', 'phone' => '946856834', 'status' => true],
            ['username' => 'KESPINOZA', 'name' => 'Katia', 'lastname' => 'Espinoza', 'fullname' => 'Katia Espinoza', 'email' => 'asistentedirecciontecnica@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('KESPINOZA'), 'document_type' => 'DNI', 'document_number' => '006', 'phone_prefix' => '51', 'phone' => '992814273', 'status' => true],
            ['username' => 'JPONCE', 'name' => 'JACQUELINE', 'lastname' => 'PONCE', 'fullname' => 'JACQUELINE PONCE', 'email' => 'jponce@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('JPONCE'), 'document_type' => 'DNI', 'document_number' => '005', 'phone_prefix' => '51', 'phone' => '993649354', 'status' => false],
            ['username' => 'RROJAS', 'name' => 'Ricardo', 'lastname' => 'Rojas', 'fullname' => 'Ricardo Rojas', 'email' => 'contabilidad@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('RROJAS'), 'document_type' => 'DNI', 'document_number' => '004', 'phone_prefix' => '51', 'phone' => '958557167', 'status' => true],
            ['username' => 'kvargas', 'name' => 'Karim Magaly', 'lastname' => 'Vargas', 'fullname' => 'Karim Magaly Vargas', 'email' => 'kvargas@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('kvargas'), 'document_type' => 'DNI', 'document_number' => '003', 'phone_prefix' => '51', 'phone' => '956487388', 'status' => true],
            ['username' => 'jcarrillo', 'name' => 'José', 'lastname' => 'Carrillo', 'fullname' => 'José Carrillo', 'email' => 'jose.carrillo@kamaryfarma.com', 'email_verified_at' => now(), 'password' => bcrypt('jcarrillo'), 'document_type' => 'DNI', 'document_number' => '002', 'phone_prefix' => '51', 'phone' => '996001876', 'status' => true],
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
