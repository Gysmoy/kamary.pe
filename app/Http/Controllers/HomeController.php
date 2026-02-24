<?php

namespace App\Http\Controllers;

use App\Models\Card;
use App\Models\Expansion;
use Illuminate\Http\Request;
use SoDe\Extend\Response;

class HomeController extends BasicController
{
    public $reactView = 'Home';
    public $reactRootView = 'public';

    public function search(Request $request)
    {
        $response = Response::simpleTryCatch(function () use ($request) {
            $query = $request->input('query');

            $words = explode(' ', trim($query));
            $cards = Card::with(['language', 'expansion.serie', 'pokemon', 'cheapest'])
                ->withCount(['items'])
                ->has('items')
                ->where(function ($q) use ($words) {
                    foreach ($words as $word) {
                        $q->where('fullname', 'like', "%{$word}%");
                    }
                })
                ->take(5)
                ->get();

            $expansions = Expansion::with(['serie.language'])
                ->whereHas('serie.language', function ($q) {
                    $q->where('code', 'en');
                })
                ->where(function ($q) use ($words) {
                    foreach ($words as $word) {
                        $q->where('name', 'like', "%{$word}%");
                    }
                })
                ->take(5)
                ->get();

            return [
                'cards' => $cards,
                'expansions' => $expansions,
            ];
        });
        return response($response->toArray(), $response->status);
    }
}
