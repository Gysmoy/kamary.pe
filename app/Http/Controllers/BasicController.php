<?php

namespace App\Http\Controllers;

use App\Http\Classes\dxResponse;
use App\Models\Aboutus;
use App\Models\dxDataGrid;
use App\Models\ExchangeRate;
use App\Models\General;
use App\Models\Renewal;
use App\Models\Sale;
use App\Models\Social;
use App\Models\User;
use App\Support\BusinessScope;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Routing\ResponseFactory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use SoDe\Extend\Crypto;
use SoDe\Extend\Response;
use SoDe\Extend\Text;
use Illuminate\Support\Facades\Schema;
use Intervention\Image\Facades\Image;
use SoDe\Extend\File;

class BasicController extends Controller
{
  private static ?string $publicRsaKey = null;
  private static ?string $privateRsaKey = null;

  public $model = Model::class;
  public $softDeletion = true;
  public $reactView = 'Home';
  public $reactRootView = 'admin';
  public $imageFields = [];
  public $prefix4filter = null;
  public $throwMediaError = false;
  public $ignorePrefix = [];
  public $with4get = [];
  public $ignoreStatusFilter = false;
  public $useIntervention = true;
  public $identifier = 'id';

  public function __construct()
  {
    self::$publicRsaKey  = env('RSA_PUBLIC_KEY');
    self::$privateRsaKey = env('RSA_PRIVATE_KEY');
  }

  static function encode($string): string
  {
    $encrypted = '';
    if (!self::$publicRsaKey) {
      throw new \RuntimeException('Clave pública RSA no configurada');
    }
    if (!openssl_public_encrypt($string, $encrypted, self::$publicRsaKey)) {
      throw new \RuntimeException('Error al encriptar con clave pública');
    }
    return base64_encode($encrypted);
  }

  static function decode($string): string
  {
    $decrypted = '';
    if (!self::$privateRsaKey) {
      throw new \RuntimeException('Clave privada RSA no configurada');
    }
    if (!openssl_private_decrypt(base64_decode($string), $decrypted, self::$privateRsaKey)) {
      throw new \RuntimeException('Error al desencriptar con clave privada');
    }
    return $decrypted;
  }

  public function get(Request $request, string $id)
  {
    $response = Response::simpleTryCatch(function () use ($id) {
      $jpa  = $this->model::with($this->with4get)->find($id);
      if (!$jpa) throw new Exception('El registro que buscas no existe');
      return $jpa;
    });
    return \response($response->toArray(), $response->status);
  }

  public function media(Request $request, string $uuid)
  {
    try {
      $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));
      if (Text::has($uuid, '.')) {
        $route = "images/{$snake_case}/{$uuid}";
      } else {
        $route = "images/{$snake_case}/{$uuid}.img";
      }
      $content = Storage::get($route);
      if (!$content) throw new Exception('Imagen no encontrado');
      return response($content, 200, [
        'Content-Type' => 'application/octet-stream'
      ]);
    } catch (\Throwable $th) {
      $content = Storage::get('utils/cover-404.svg');
      $status = 200;
      if ($this->throwMediaError) return null;
      return response($content, $status, [
        'Content-Type' => 'image/svg+xml'
      ]);
    }
  }

  public function setPaginationInstance(string $model)
  {
    return $model::select();
  }

  public function setPaginationSummary(string $model)
  {
    return [];
  }

  public function setReactViewProperties(Request $request)
  {
    return [];
  }

  public function reactView(Request $request)
  {
    $userJpa = null;
    $usdPrice = null;
    $eurPrice = null;
    if (Auth::check()) {
      $userJpa = User::find(Auth::user()->id);
      $userJpa->getAllPermissions();
      $usdPrice = ExchangeRate::where('currency', 'USD')->pluck('rate')->first() ?? null;
      $eurPrice = ExchangeRate::where('currency', 'EUR')->pluck('rate')->first() ?? null;
    }

    $googleMapsApiKey = env('GMAPS_API_KEY');
    if (Schema::hasTable('generals')) {
      $panelGoogleMapsApiKey = General::query()
        ->where('correlative', 'google_maps_api_key')
        ->value('description');
      if (trim((string)$panelGoogleMapsApiKey) !== '') {
        $googleMapsApiKey = trim((string)$panelGoogleMapsApiKey);
      }
    }

    $properties = [
      'session' => $userJpa,
      'businessScopeKey' => BusinessScope::keyForPath($request->path()),
      'businessScopes' => BusinessScope::labels(),
      'global' => [
        'PUBLIC_RSA_KEY' => self::$publicRsaKey,
        'APP_NAME' => env('APP_NAME', 'Ursa'),
        'APP_BY' => env('APP_BY'),
        'APP_ENV' => env('APP_ENV'),
        'APP_URL' => env('APP_URL'),
        'WA_URL' => env('WA_URL'),
        'APP_CORRELATIVE' => env('APP_CORRELATIVE'),
        'EVOAPI_URL' => env('EVOAPI_URL'),
        'EVOAPI_APIKEY' => env('EVOAPI_APIKEY'),
        'APP_DOMAIN' => env('APP_DOMAIN'),
        'APP_PROTOCOL' => env('APP_PROTOCOL', 'https'),
        'GMAPS_API_KEY' => $googleMapsApiKey,
        'USD_PRICE' => $usdPrice,
        'EUR_PRICE' => $eurPrice,
      ],
    ];
    $reactViewProperties = $this->setReactViewProperties($request);
    if (\is_array($reactViewProperties)) {
      foreach ($reactViewProperties as $key => $value) {
        $properties[$key] = $value;
      }
    } else {
      return $reactViewProperties;
    }
    return Inertia::render($this->reactView, $properties)->rootView($this->reactRootView)->withViewData([
      'component' => $this->reactView,
      // 'seoTitle' => $seoTitle->description ?? '',
      // 'seoDescription' => $seoDescription->description ?? '',
      // 'seoKeywords' => $seoKeywords->description ?? '',
    ]);
  }

  public function paginate(Request $request): HttpResponse|ResponseFactory
  {
    $response = new dxResponse();
    try {
      $instance = $this->setPaginationInstance($this->model);

      if ($request->group != null) {
        [$grouping] = $request->group;
        // $selector = str_replace('.', '__', $grouping['selector']);
        $selector = $grouping['selector'];
        if (!str_contains($selector, '.') && $this->prefix4filter && !Text::startsWith($selector, '!') && !in_array($selector, $this->ignorePrefix)) {
          $selector = "{$this->prefix4filter}.{$selector}";
        }
        $instance = $instance->select(DB::raw("{$selector} AS `key`"))
          ->groupBy(str_replace('!', '', $selector));
      }

      if (!$this->ignoreStatusFilter && Auth::check()) {
        $table = $this->prefix4filter ? $this->prefix4filter : (new $this->model)->getTable();
        if (Schema::hasColumn($table, 'status')) {
          $instance->whereNotNull($this->prefix4filter ? $this->prefix4filter . '.status' : 'status');
        }
      }

      if ($request->filter) {
        $instance->where(function ($query) use ($request) {
          dxDataGrid::filter($query, $request->filter ?? [], false, $this->prefix4filter, $this->ignorePrefix);
        });
      }

      if ($request->group == null) {
        if ($request->sort != null) {
          foreach ($request->sort as $sorting) {
            $selector = $sorting['selector'];
            $instance->orderBy(
              $selector,
              $sorting['desc'] ? 'DESC' : 'ASC'
            );
          }
        } else {
          $instance->orderBy($this->prefix4filter ? $this->prefix4filter . '.id' : 'id', 'DESC');
        }
      }

      $totalCount = 0;
      if ($request->requireTotalCount) {
        $instance4count = clone $instance;
        $instance4count->getQuery()->groups = null;
        if ($request->group != null) {
          // When grouping, count distinct groups
          $totalCount = $instance4count->distinct()->count(DB::raw($selector));
        } else {
          // When not grouping, use the original count logic
          if ($this->prefix4filter) {
            $totalCount = $instance4count->distinct()->count($this->prefix4filter . '.id');
          } else {
            $totalCount = $instance4count->distinct()->count('id');
          }
        }
      }

      $jpas = $request->isLoadingAll
        ? $instance->get()
        : $instance
        ->skip($request->skip ?? 0)
        ->take($request->take ?? 10)
        ->get();

      $response->status = 200;
      $response->message = 'Operación correcta';
      $response->data = $jpas;
      $response->summary = $this->setPaginationSummary($this->model);
      $response->totalCount = $totalCount;
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage() . ' Ln.' . $th->getLine();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  public function beforeSave(Request $request)
  {
    return $request->all();
  }

  public function save(Request $request): HttpResponse|ResponseFactory
  {
    $response = new Response();
    try {

      $body = $this->beforeSave($request);

      $snake_case = Text::camelToSnakeCase(str_replace('App\\Models\\', '', $this->model));

      foreach ($this->imageFields as $field) {
        if (!$request->hasFile($field)) continue;
        $full = $request->file($field);
        $uuid = Crypto::randomUUID();
        $ext = $full->getClientOriginalExtension();
        $path = storage_path("app/images/{$snake_case}");
        $filename = "{$uuid}.{$ext}";

        if (!file_exists($path)) {
          mkdir($path, 0777, true);
        }

        if ($this->useIntervention) {
          $image = Image::make($full);
          if ($image->width() > 1000 || $image->height() > 1000) {
            $image->resize(1000, null, function ($constraint) {
              $constraint->aspectRatio();
              $constraint->upsize();
            });
          }
          $image->save("{$path}/{$filename}"); // Guarda la imagen redimensionada
        } else {
          File::save("{$path}/{$filename}", file_get_contents($full));
        }


        $body[$field] = "{$uuid}.{$ext}";
      }

      $isNew = false;
      if (Text::startsWith($this->model, 'App\\Models\\')) {
        $jpa = $this->model::where($this->identifier, isset($body['id']) ? $body['id'] : null)->first();

        if (!$jpa) {
          $jpa = $this->model::create($body);
          $isNew = true;
        } else {
          $jpa->update($body);
        }
      } else {
        $jpa = json_decode(json_encode($body));
      }

      $data = $this->afterSave($request, $jpa, $isNew);
      if ($data) {
        $response->data = $data;
      }

      $response->status = 200;
      $response->message = 'Operacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  public function afterSave(Request $request, object $jpa, bool $isNew)
  {
    return null;
  }

  public function status(Request $request)
  {
    $response = new Response();
    try {
      $this->model::where($this->identifier, $request->id)
        ->update([
          'status' => $request->status ? 0 : 1
        ]);

      $response->status = 200;
      $response->message = 'Operacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  public function boolean(Request $request)
  {
    $response = new Response();
    try {
      $data = [];
      $data[$request->field] = $request->value;

      $this->model::where($this->identifier, $request->id)
        ->update($data);

      $response->status = 200;
      $response->message = 'Operacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }

  public function delete(Request $request, string $id)
  {
    $response = new Response();
    try {
      $deleted = $this->softDeletion
        ? $this->model::where($this->identifier, $id)
        ->update(['status' => null])
        : $this->model::where($this->identifier, $id)
        ->delete();

      if (!$deleted) throw new Exception('No se ha eliminado ningun registro');

      $response->status = 200;
      $response->message = 'Operacion correcta';
    } catch (\Throwable $th) {
      $response->status = 400;
      $response->message = $th->getMessage();
    } finally {
      return response(
        $response->toArray(),
        $response->status
      );
    }
  }
}
