<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\AboutusController as AdminAboutusController;
use App\Http\Controllers\Admin\IndicatorController as AdminIndicatorController;
use App\Http\Controllers\Admin\MessageController as AdminMessageController;
use App\Http\Controllers\Admin\SliderController as AdminSliderController;
use App\Http\Controllers\Admin\TestimonyController as AdminTestimonyController;
use App\Http\Controllers\Admin\SubscriptionController as AdminSubscriptionController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\PostController as AdminPostController;
use App\Http\Controllers\Admin\SocialController as AdminSocialController;
use App\Http\Controllers\Admin\StrengthController as AdminStrengthController;
use App\Http\Controllers\Admin\GeneralController as AdminGeneralController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\AdController as AdminAdController;
use App\Http\Controllers\Admin\BundleController as AdminBundleController;
use App\Http\Controllers\Admin\CardController as AdminCardController;
use App\Http\Controllers\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Admin\DeliveryPointController as AdminDeliveryPointController;
use App\Http\Controllers\Admin\ExpansionController as AdminExpansionController;
use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\HistoryDetailController as AdminHistoryDetailController;
use App\Http\Controllers\Admin\HomeController as AdminHomeController;
use App\Http\Controllers\Admin\ItemController as AdminItemController;
use App\Http\Controllers\Admin\LanguageController as AdminLanguageController;
use App\Http\Controllers\Admin\MailingTemplateController as AdminMailingTemplateController;
use App\Http\Controllers\Admin\PaymentMethodController as AdminPaymentMethodController;
use App\Http\Controllers\Admin\PokemonController as AdminPokemonController;
use App\Http\Controllers\Admin\RegionController as AdminRegionController;
use App\Http\Controllers\Admin\RepositoryController as AdminRepositoryController;
use App\Http\Controllers\Admin\SaleController as AdminSaleController;
use App\Http\Controllers\Admin\SaleOriginController as AdminSaleOriginController;
use App\Http\Controllers\Admin\SaleStatusController as AdminSaleStatusController;
use App\Http\Controllers\Admin\SendingHistoryController as AdminSendingHistoryController;
use App\Http\Controllers\Admin\SerieController as AdminSerieController;
use App\Http\Controllers\Admin\StatusController as AdminStatusController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\TransactionCategoryController as AdminTransactionCategoryController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\WhatsAppController as AdminWhatsAppController;
// Customer
use App\Http\Controllers\Customer\UserFormulaController as CustomerUserFormulaController;
use App\Http\Controllers\Customer\ProfileController as CustomerProfileController;
use App\Http\Controllers\Customer\SaleController as CustomerSaleController;

// Public
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BreakdownController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\ColorController;
use App\Http\Controllers\CoverController;
use App\Http\Controllers\ExpansionController;
use App\Http\Controllers\FragranceController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MailingController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\Seller\CardController as SellerCardController;
use App\Http\Controllers\Seller\SaleController as SellerSaleController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SupplyController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::post('/login', [LoginController::class, 'login']);
Route::post('/login/send', [LoginController::class, 'send']);

Route::post('/register', [RegisterController::class, 'register']);
Route::post('/register/send', [RegisterController::class, 'send']);
Route::post('/register/verify', [RegisterController::class, 'verify']);

Route::get('/search', [HomeController::class, 'search']);
Route::post('/expansions/paginate', [ExpansionController::class, 'paginate']);
Route::post('/catalog/paginate', [CatalogController::class, 'paginate']);
Route::post('/items/paginate', [ItemController::class, 'paginate']);

Route::post('/cart/verify', [CartController::class, 'verify']);

Route::get('/sliders/media/{uuid}', [AdminSliderController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/testimonies/media/{uuid}', [AdminTestimonyController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/posts/media/{uuid}', [AdminPostController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/items/media/{uuid}', [ItemController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/bundles/media/{uuid}', [AdminBundleController::class, 'media'])->withoutMiddleware('throttle:api');
Route::get('/supplies/media/{uuid}', [SupplyController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/colors/media/{uuid}', [ColorController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/fragrances/media/{uuid}', [FragranceController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/ads/media/{uuid}', [AdminAdController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/mailing/media/{uuid}', [MailingController::class, 'media'])->withoutMiddleware('throttle');

Route::post('/breakdowns', [BreakdownController::class, 'save']);

Route::post('/posts/paginate', [PostController::class, 'paginate']);
Route::post('/items/paginate', [ItemController::class, 'paginate']);
Route::post('/supplies/paginate', [SupplyController::class, 'paginate']);

Route::post('/messages', [MessageController::class, 'save']);
Route::post('/subscriptions', [SubscriptionController::class, 'save']);

Route::get('/cover/{uuid}', [CoverController::class, 'full']);
Route::get('/cover/thumbnail/{uuid}', [CoverController::class, 'thumbnail']);

Route::get('/sales/notify/{code}', [SaleController::class, 'notify']);

Route::middleware('auth')->group(function () {
    Route::delete('logout', [AuthController::class, 'destroy'])->name('logout');
    Route::post('/onboarding', [OnboardingController::class, 'save']);

    Route::post('/profile', [ProfileController::class, 'save']);
    Route::patch('/profile/{field}', [ProfileController::class, 'boolean']);
    
    Route::post('/sales', [SaleController::class, 'save']);

    Route::middleware('can:Admin')->group(function () {

        Route::get('/graph/sales/{type}/{filter}', [AdminHomeController::class, 'getSales']);

        Route::get('/whatsapp', [AdminWhatsAppController::class, 'verify']);
        Route::get('/whatsapp/verify', [AdminWhatsAppController::class, 'stream']);
        Route::delete('/whatsapp', [AdminWhatsAppController::class, 'close']);

        Route::prefix('admin')->group(function () {
            Route::get('/sales/{id}', [AdminSaleController::class, 'get']);
            Route::get('/sales/search/{search}', [AdminSaleController::class, 'search']);
            Route::post('/sales', [AdminSaleController::class, 'save']);
            Route::post('/sales/pos', [AdminSaleController::class, 'pos']);
            Route::post('/sales/upsell', [AdminSaleController::class, 'upsell']);
            Route::post('/sales/paginate', [AdminSaleController::class, 'paginate']);
            Route::patch('/sales/status', [AdminSaleController::class, 'status']);
            Route::patch('/sales/{field}', [AdminSaleController::class, 'boolean']);
            Route::delete('/sales/{id}', [AdminSaleController::class, 'delete']);
            Route::delete('/sales/{id}/hard', [AdminSaleController::class, 'hardDelete']);

            Route::get('/sale-statuses/by-sale/{id}', [AdminSaleStatusController::class, 'bySale']);

            Route::post('/posts', [AdminPostController::class, 'save']);
            Route::post('/posts/paginate', [AdminPostController::class, 'paginate']);
            Route::patch('/posts/status', [AdminPostController::class, 'status']);
            Route::patch('/posts/{field}', [AdminPostController::class, 'boolean']);
            Route::delete('/posts/{id}', [AdminPostController::class, 'delete']);

            Route::post('/cards', [AdminCardController::class, 'save']);
            Route::post('/cards/paginate', [AdminCardController::class, 'paginate']);
            Route::patch('/cards/status', [AdminCardController::class, 'status']);
            Route::patch('/cards/{field}', [AdminCardController::class, 'boolean']);
            Route::delete('/cards/{id}', [AdminCardController::class, 'delete']);

            Route::post('/delivery-points', [AdminDeliveryPointController::class, 'save']);
            Route::post('/delivery-points/paginate', [AdminDeliveryPointController::class, 'paginate']);
            Route::patch('/delivery-points/status', [AdminDeliveryPointController::class, 'status']);
            Route::patch('/delivery-points/{field}', [AdminDeliveryPointController::class, 'boolean']);
            Route::delete('/delivery-points/{id}', [AdminDeliveryPointController::class, 'delete']);

            Route::post('/regions', [AdminRegionController::class, 'save']);
            Route::post('/regions/paginate', [AdminRegionController::class, 'paginate']);
            Route::patch('/regions/status', [AdminRegionController::class, 'status']);
            Route::patch('/regions/{field}', [AdminRegionController::class, 'boolean']);
            Route::delete('/regions/{id}', [AdminRegionController::class, 'delete']);

            Route::post('/pokemons', [AdminPokemonController::class, 'save']);
            Route::post('/pokemons/paginate', [AdminPokemonController::class, 'paginate']);
            Route::patch('/pokemons/status', [AdminPokemonController::class, 'status']);
            Route::patch('/pokemons/{field}', [AdminPokemonController::class, 'boolean']);
            Route::delete('/pokemons/{id}', [AdminPokemonController::class, 'delete']);

            Route::post('/series', [AdminSerieController::class, 'save']);
            Route::post('/series/paginate', [AdminSerieController::class, 'paginate']);
            Route::patch('/series/status', [AdminSerieController::class, 'status']);
            Route::patch('/series/{field}', [AdminSerieController::class, 'boolean']);
            Route::delete('/series/{id}', [AdminSerieController::class, 'delete']);

            Route::post('/expansions', [AdminExpansionController::class, 'save']);
            Route::post('/expansions/paginate', [AdminExpansionController::class, 'paginate']);
            Route::patch('/expansions/status', [AdminExpansionController::class, 'status']);
            Route::patch('/expansions/{field}', [AdminExpansionController::class, 'boolean']);
            Route::delete('/expansions/{id}', [AdminExpansionController::class, 'delete']);

            Route::post('/languages', [AdminLanguageController::class, 'save']);
            Route::post('/languages/paginate', [AdminLanguageController::class, 'paginate']);
            Route::patch('/languages/status', [AdminLanguageController::class, 'status']);
            Route::patch('/languages/{field}', [AdminLanguageController::class, 'boolean']);
            Route::delete('/languages/{id}', [AdminLanguageController::class, 'delete']);

            Route::post('/items', [AdminItemController::class, 'save']);
            Route::post('/items/paginate', [AdminItemController::class, 'paginate']);
            Route::patch('/items/status', [AdminItemController::class, 'status']);
            Route::patch('/items/{field}', [AdminItemController::class, 'boolean']);
            Route::delete('/items/{id}', [AdminItemController::class, 'delete']);

            Route::post('/payment-methods', [AdminPaymentMethodController::class, 'save']);
            Route::post('/payment-methods/paginate', [AdminPaymentMethodController::class, 'paginate']);
            Route::patch('/payment-methods/status', [AdminPaymentMethodController::class, 'status']);
            Route::patch('/payment-methods/{field}', [AdminPaymentMethodController::class, 'boolean']);
            Route::delete('/payment-methods/{id}', [AdminPaymentMethodController::class, 'delete']);

            Route::post('/statuses', [AdminStatusController::class, 'save']);
            Route::post('/statuses/paginate', [AdminStatusController::class, 'paginate']);
            Route::patch('/statuses/status', [AdminStatusController::class, 'status']);
            Route::patch('/statuses/{field}', [AdminStatusController::class, 'boolean']);
            Route::delete('/statuses/{id}', [AdminStatusController::class, 'delete']);

            Route::post('/transactions', [AdminTransactionController::class, 'save']);
            Route::post('/transactions/paginate', [AdminTransactionController::class, 'paginate']);
            Route::patch('/transactions/status', [AdminTransactionController::class, 'status']);
            Route::patch('/transactions/{field}', [AdminTransactionController::class, 'boolean']);
            Route::delete('/transactions/{id}', [AdminTransactionController::class, 'delete']);
            Route::get('/transactions/report/{date}', [AdminTransactionController::class, 'report']);

            Route::post('/transactions/categories', [AdminTransactionCategoryController::class, 'save']);
            Route::post('/transactions/categories/paginate', [AdminTransactionCategoryController::class, 'paginate']);
            Route::patch('/transactions/categories/status', [AdminTransactionCategoryController::class, 'status']);
            Route::patch('/transactions/categories/{field}', [AdminTransactionCategoryController::class, 'boolean']);
            Route::delete('/transactions/categories/{id}', [AdminTransactionCategoryController::class, 'delete']);

            Route::post('/ads', [AdminAdController::class, 'save']);
            Route::post('/ads/paginate', [AdminAdController::class, 'paginate']);
            Route::patch('/ads/status', [AdminAdController::class, 'status']);
            Route::patch('/ads/{field}', [AdminAdController::class, 'boolean']);
            Route::delete('/ads/{id}', [AdminAdController::class, 'delete']);

            Route::post('/coupons', [AdminCouponController::class, 'save']);
            Route::post('/coupons/paginate', [AdminCouponController::class, 'paginate']);
            Route::patch('/coupons/status', [AdminCouponController::class, 'status']);
            Route::patch('/coupons/{field}', [AdminCouponController::class, 'boolean']);
            Route::delete('/coupons/{id}', [AdminCouponController::class, 'delete']);

            Route::post('/origins', [AdminSaleOriginController::class, 'save']);
            Route::post('/origins/paginate', [AdminSaleOriginController::class, 'paginate']);
            Route::patch('/origins/status', [AdminSaleOriginController::class, 'status']);
            Route::patch('/origins/{field}', [AdminSaleOriginController::class, 'boolean']);
            Route::delete('/origins/{id}', [AdminSaleOriginController::class, 'delete']);

            Route::post('/messages', [AdminMessageController::class, 'save']);
            Route::post('/messages/paginate', [AdminMessageController::class, 'paginate']);
            Route::patch('/messages/status', [AdminMessageController::class, 'status']);
            Route::patch('/messages/{field}', [AdminMessageController::class, 'boolean']);
            Route::delete('/messages/{id}', [AdminMessageController::class, 'delete']);

            Route::get('/repository/{id}', [AdminRepositoryController::class, 'get']);
            Route::get('/repository/resend/{id}', [AdminRepositoryController::class, 'reSend']);
            Route::post('/repository', [AdminRepositoryController::class, 'save']);
            Route::post('/repository/paginate', [AdminRepositoryController::class, 'paginate']);
            Route::patch('/repository/status', [AdminRepositoryController::class, 'status']);
            Route::delete('/repository/{id}', [AdminRepositoryController::class, 'delete']);

            Route::prefix('mailing')->group(function () {
                Route::get('/templates/{id}', [AdminMailingTemplateController::class, 'get']);
                Route::post('/templates', [AdminMailingTemplateController::class, 'save']);
                Route::post('/templates/paginate', [AdminMailingTemplateController::class, 'paginate']);
                Route::patch('/templates/{field}', [AdminMailingTemplateController::class, 'boolean']);

                Route::post('/history', [AdminSendingHistoryController::class, 'save']);
                Route::post('/history/paginate', [AdminSendingHistoryController::class, 'paginate']);

                Route::post('/history-details/paginate', [AdminHistoryDetailController::class, 'paginate']);
            });

            Route::post('/subscriptions/paginate', [AdminSubscriptionController::class, 'paginate']);
            Route::patch('/subscriptions/status', [AdminSubscriptionController::class, 'status']);
            Route::delete('/subscriptions/{id}', [AdminSubscriptionController::class, 'delete']);

            Route::post('/aboutus', [AdminAboutusController::class, 'save']);
            Route::post('/aboutus/paginate', [AdminAboutusController::class, 'paginate']);
            Route::patch('/aboutus/status', [AdminAboutusController::class, 'status']);
            Route::patch('/aboutus/{field}', [AdminAboutusController::class, 'boolean']);
            Route::delete('/aboutus/{id}', [AdminAboutusController::class, 'delete']);

            Route::post('/indicators', [AdminIndicatorController::class, 'save']);
            Route::post('/indicators/paginate', [AdminIndicatorController::class, 'paginate']);
            Route::patch('/indicators/status', [AdminIndicatorController::class, 'status']);
            Route::patch('/indicators/{field}', [AdminIndicatorController::class, 'boolean']);
            Route::delete('/indicators/{id}', [AdminIndicatorController::class, 'delete']);

            Route::post('/sliders', [AdminSliderController::class, 'save']);
            Route::post('/sliders/paginate', [AdminSliderController::class, 'paginate']);
            Route::patch('/sliders/status', [AdminSliderController::class, 'status']);
            Route::patch('/sliders/{field}', [AdminSliderController::class, 'boolean']);
            Route::delete('/sliders/{id}', [AdminSliderController::class, 'delete']);

            Route::post('/testimonies', [AdminTestimonyController::class, 'save']);
            Route::post('/testimonies/paginate', [AdminTestimonyController::class, 'paginate']);
            Route::patch('/testimonies/status', [AdminTestimonyController::class, 'status']);
            Route::patch('/testimonies/{field}', [AdminTestimonyController::class, 'boolean']);
            Route::delete('/testimonies/{id}', [AdminTestimonyController::class, 'delete']);

            Route::post('/categories', [AdminCategoryController::class, 'save']);
            Route::post('/categories/paginate', [AdminCategoryController::class, 'paginate']);
            Route::patch('/categories/status', [AdminCategoryController::class, 'status']);
            Route::patch('/categories/{field}', [AdminCategoryController::class, 'boolean']);
            Route::delete('/categories/{id}', [AdminCategoryController::class, 'delete']);

            Route::post('/faqs', [AdminFaqController::class, 'save']);
            Route::post('/faqs/paginate', [AdminFaqController::class, 'paginate']);
            Route::patch('/faqs/status', [AdminFaqController::class, 'status']);
            Route::patch('/faqs/{field}', [AdminFaqController::class, 'boolean']);
            Route::delete('/faqs/{id}', [AdminFaqController::class, 'delete']);

            Route::post('/strengths', [AdminStrengthController::class, 'save']);
            Route::post('/strengths/paginate', [AdminStrengthController::class, 'paginate']);
            Route::patch('/strengths/status', [AdminStrengthController::class, 'status']);
            Route::patch('/strengths/{field}', [AdminStrengthController::class, 'boolean']);
            Route::delete('/strengths/{id}', [AdminStrengthController::class, 'delete']);

            Route::post('/socials', [AdminSocialController::class, 'save']);
            Route::post('/socials/paginate', [AdminSocialController::class, 'paginate']);
            Route::patch('/socials/status', [AdminSocialController::class, 'status']);
            Route::patch('/socials/{field}', [AdminSocialController::class, 'boolean']);
            Route::delete('/socials/{id}', [AdminSocialController::class, 'delete']);

            Route::post('/generals', [AdminGeneralController::class, 'save']);
            Route::post('/generals/paginate', [AdminGeneralController::class, 'paginate']);
            Route::patch('/generals/status', [AdminGeneralController::class, 'status']);
            Route::patch('/generals/{field}', [AdminGeneralController::class, 'boolean']);
            Route::delete('/generals/{id}', [AdminGeneralController::class, 'delete']);

            Route::post('/users', [AdminUserController::class, 'save']);
            Route::post('/users/paginate', [AdminUserController::class, 'paginate']);
            Route::patch('/users/status', [AdminUserController::class, 'status']);
            Route::patch('/users/{field}', [AdminUserController::class, 'boolean']);
            Route::delete('/users/{id}', [AdminUserController::class, 'delete']);

            Route::get('/profile/{uuid}', [AdminProfileController::class, 'full']);
            Route::get('/profile/thumbnail/{uuid}', [AdminProfileController::class, 'thumbnail']);
            Route::post('/profile', [AdminProfileController::class, 'saveProfile']);
            Route::patch('/profile', [AdminProfileController::class, 'save']);

            Route::patch('/account/email', [AdminAccountController::class, 'email']);
            Route::patch('/account/password', [AdminAccountController::class, 'password']);
        });
    });

    Route::middleware('can:Seller')->prefix('seller')->group(function () {
        Route::get('/cards/search', [SellerCardController::class, 'search']);
        Route::get('/cards/{language}/{cardId}', [SellerCardController::class, 'find']);
        Route::post('/cards', [SellerCardController::class, 'save']);
        Route::post('/cards/paginate', [SellerCardController::class, 'paginate']);
        Route::patch('/cards/status', [SellerCardController::class, 'status']);
        Route::patch('/cards/{field}', [SellerCardController::class, 'boolean']);
        Route::delete('/cards/{id}', [SellerCardController::class, 'delete']);

        Route::post('/sales', [SellerSaleController::class, 'save']);
        Route::post('/sales/paginate', [SellerSaleController::class, 'paginate']);
    });

    Route::middleware('can:Customer')->prefix('customer')->group(function () {

        Route::get('/sales/{id}', [CustomerSaleController::class, 'get']);
        Route::post('/sales', [CustomerSaleController::class, 'save']);
        Route::post('/sales/paginate', [CustomerSaleController::class, 'paginate']);
        Route::delete('/sales/{id}', [CustomerSaleController::class, 'delete']);

        Route::post('/user-formulas', [CustomerUserFormulaController::class, 'save']);
        Route::patch('/profile', [CustomerProfileController::class, 'save']);
    });
});
