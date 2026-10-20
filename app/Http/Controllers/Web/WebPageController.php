<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Páginas públicas de la web de Kamary Farma.
 * Productos y categorías son datos planos del frontend; aquí solo se pasan slugs y SEO.
 */
class WebPageController extends Controller
{
  private const SITE = 'Farmacia Kamary Perú';

  private function render(string $component, array $seo, array $props = [])
  {
    $seo = array_merge([
      'title' => self::SITE . ' – Venta y distribución de medicamentos',
      'description' => 'Empresa farmacéutica integral: farmacia, preparados magistrales, ventas corporativas y operador logístico con cadena de frío.',
      'image' => '/web/slider/Imag-home-4.webp',
    ], $seo);

    return Inertia::render($component, array_merge($props, ['seo' => $seo]))
      ->rootView('web')
      ->withViewData(['component' => $component, 'seo' => $seo]);
  }

  public function home()
  {
    return $this->render('Web/Pages/Home', []);
  }

  public function shop(Request $request, ?string $slug = null)
  {
    $seo = [
      'title' => ($slug ? 'Categoría' : 'Tienda') . ' – ' . self::SITE,
      'description' => 'Tienda online de productos farmacéuticos y suplementos. Precios en soles y pedido por WhatsApp.',
    ];
    $categoria = $slug !== null ? $this->catalogItem('categories', $slug) : null;
    // Categoría inexistente: 404 real; la página muestra el contenido "no encontrado" del frontend.
    if ($slug !== null && $categoria === null) {
      return $this->notFound('Web/Pages/Shop', $seo, ['category' => $slug]);
    }
    // SEO propio de la categoría, con los datos de categories.js.
    if ($categoria !== null) {
      $seo['title'] = ($categoria['name'] ?? 'Categoría') . ' – Tienda ' . self::SITE;
      if (!empty($categoria['description'])) {
        $seo['description'] = $categoria['description'];
      }
    }
    return $this->render('Web/Pages/Shop', $seo, ['category' => $slug]);
  }

  public function product(string $slug)
  {
    $seo = ['title' => 'Producto – ' . self::SITE];
    $producto = $this->catalogItem('products', $slug);
    // Producto inexistente: 404 real; la página muestra el contenido "no encontrado" del frontend.
    if ($producto === null) {
      return $this->notFound('Web/Pages/Product', $seo, ['slug' => $slug]);
    }
    // SEO propio del producto: nombre, descripción corta e imagen absoluta.
    $seo['title'] = ($producto['name'] ?? 'Producto') . ' – ' . self::SITE;
    $descripcion = $this->recortar($producto['shortDescription'] ?? $producto['description'] ?? '');
    if ($descripcion !== '') {
      $seo['description'] = $descripcion;
    }
    $seo['image'] = url($producto['image'] ?? '/web/slider/Imag-home-4.webp');
    return $this->render('Web/Pages/Product', $seo, ['slug' => $slug]);
  }

  /** Respuesta HTTP 404 que renderiza la página Inertia correspondiente (evita soft 404). */
  private function notFound(string $component, array $seo, array $props = [])
  {
    $seo['title'] = 'Página no encontrada – ' . self::SITE;
    return $this->render($component, $seo, $props)->toResponse(request())->setStatusCode(404);
  }

  /** Datos de un ítem por slug (products.js / categories.js), o null si el slug no existe. */
  private function catalogItem(string $file, string $slug): ?array
  {
    return $this->catalogItems($file)[$slug] ?? null;
  }

  /**
   * Mapa slug => campos (name, shortDescription, description, image) extraídos de los datos
   * planos del frontend (products.js / categories.js). Cada objeto empieza con "  {" y sus
   * campos van con indentación de 4 espacios. Se cachea con la fecha de modificación en la
   * clave, así se refresca al cambiar los datos.
   */
  private function catalogItems(string $file): array
  {
    $path = resource_path("js/Web/data/{$file}.js");
    if (!is_file($path)) {
      return [];
    }

    $key = 'web.catalog.' . $file . '.' . filemtime($path);
    return cache()->remember($key, now()->addDay(), function () use ($path) {
      $items = [];
      // Partimos el archivo por objetos; el primer trozo es el encabezado (sin slug, se omite).
      foreach (preg_split('/^  \{/m', (string) file_get_contents($path)) as $bloque) {
        $slug = $this->campoJs($bloque, 'slug');
        if ($slug === null) {
          continue;
        }
        $items[$slug] = [
          'name' => $this->campoJs($bloque, 'name'),
          'shortDescription' => $this->campoJs($bloque, 'shortDescription'),
          'description' => $this->campoJs($bloque, 'description'),
          'image' => $this->campoJs($bloque, 'image'),
        ];
      }
      return $items;
    });
  }

  /**
   * Valor de un campo de primer nivel (indentado con 4 espacios) de un objeto JS.
   * Acepta comillas simples o dobles y escapes simples dentro del texto.
   */
  private function campoJs(string $bloque, string $campo): ?string
  {
    $regex = '/^[ ]{4}' . $campo . ':\s*([\'"])((?:\\\\.|(?!\1)[^\\\\])*)\1/m';
    if (!preg_match($regex, $bloque, $m)) {
      return null;
    }
    // Decodifica escapes: \n y \t pasan a espacio (son saltos de línea del texto), el resto se toma literal.
    $valor = preg_replace_callback('/\\\\(.)/s', fn ($e) => in_array($e[1], ['n', 't', 'r'], true) ? ' ' : $e[1], $m[2]);
    return trim($valor) === '' ? null : $valor;
  }

  /** Recorta el texto a $max caracteres (incluido "…") sin cortar palabras. */
  private function recortar(string $texto, int $max = 155): string
  {
    $texto = trim(preg_replace('/\s+/u', ' ', $texto));
    if (mb_strlen($texto) <= $max) {
      return $texto;
    }
    $corte = mb_substr($texto, 0, $max - 1);
    $ultimo = mb_strrpos($corte, ' ');
    if ($ultimo !== false) {
      $corte = mb_substr($corte, 0, $ultimo);
    }
    return rtrim($corte, ' ,;:.-') . '…';
  }

  public function cart()
  {
    return $this->render('Web/Pages/Cart', ['title' => 'Carrito – ' . self::SITE]);
  }

  public function magistrales()
  {
    return $this->render('Web/Pages/Magistrales', [
      'title' => 'Preparados Magistrales – ' . self::SITE,
      'description' => 'Formulaciones personalizadas elaboradas por químicos farmacéuticos con insumos certificados. Envíanos tu receta.',
    ]);
  }

  /** Páginas de servicios: la key identifica el contenido en content.js */
  public function service(string $key)
  {
    $titles = [
      'ventas-corporativas' => 'Ventas Corporativas',
      'operador-logistico' => 'Operador Logístico',
      'distribucion-y-transporte' => 'Distribución y Transporte',
      'importacion-de-medicamentos' => 'Importación de Medicamentos',
      'almacen' => 'Almacén de Medicamentos',
      'asesoria-tecnica-y-comercial' => 'Asesoría Técnica y Comercial',
    ];
    return $this->render('Web/Pages/Service', [
      'title' => ($titles[$key] ?? 'Servicios') . ' – ' . self::SITE,
    ], ['serviceKey' => $key]);
  }

  public function about()
  {
    return $this->render('Web/Pages/About', ['title' => 'Nosotros – ' . self::SITE]);
  }

  public function contact()
  {
    return $this->render('Web/Pages/Contact', ['title' => 'Contacto – ' . self::SITE]);
  }

  public function complaints()
  {
    return $this->render('Web/Pages/Complaints', ['title' => 'Libro de Reclamaciones – ' . self::SITE]);
  }

  public function privacy()
  {
    return $this->render('Web/Pages/Privacy', ['title' => 'Políticas de Privacidad – ' . self::SITE]);
  }
}
