<?php

use Illuminate\Support\Facades\Route;

// Admin
use App\Http\Controllers\Admin\AboutusController as AdminAboutusController;
use App\Http\Controllers\Admin\HomeController as AdminHomeController;
use App\Http\Controllers\Admin\IndicatorController as AdminIndicatorController;
use App\Http\Controllers\Admin\SliderController as AdminSliderController;
use App\Http\Controllers\Admin\TestimonyController as AdminTestimonyController;
use App\Http\Controllers\Admin\SubscriptionController as AdminSubscriptionController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\SocialController as AdminSocialController;
use App\Http\Controllers\Admin\StrengthController as AdminStrengthController;
use App\Http\Controllers\Admin\GeneralController as AdminGeneralController;
use App\Http\Controllers\Admin\ProfileController as AdminProfileController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\ItemController as AdminItemController;
use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\TagController as AdminTagController;
use App\Http\Controllers\Admin\AdController as AdminAdController;
use App\Http\Controllers\Admin\RenewalController as AdminRenewalController;
use App\Http\Controllers\Admin\BundleController as AdminBundleController;
use App\Http\Controllers\Admin\CouponController as AdminCouponController;
use App\Http\Controllers\Admin\SaleController as AdminSaleController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\TransactionController as AdminTransactionController;
use App\Http\Controllers\Admin\MailingTemplateController as AdminMailingTemplateController;
use App\Http\Controllers\Admin\SendingHistoryController as AdminSendingHistoryController;
use App\Http\Controllers\Admin\TransactionCategoryController as AdminTransactionCategoryController;
use App\Http\Controllers\Admin\RepositoryController as AdminRepositoryController;
use App\Http\Controllers\Admin\SaleOriginController as AdminSaleOriginController;

// Seller
use App\Http\Controllers\Seller\HomeController as SellerHomeController;
use App\Http\Controllers\Seller\CardController as SellerCardController;

// Public 
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Admin\CardController as AdminCardController;
use App\Http\Controllers\Admin\DeliveryPointController as AdminDeliveryPointController;
use App\Http\Controllers\Admin\ExpansionController as AdminExpansionController;
use App\Http\Controllers\Admin\LanguageController as AdminLanguageController;
use App\Http\Controllers\Admin\PaymentMethodController as AdminPaymentMethodController;
use App\Http\Controllers\Admin\PokemonController as AdminPokemonController;
use App\Http\Controllers\Admin\RegionController as AdminRegionController;
use App\Http\Controllers\Admin\SerieController as AdminSerieController;
use App\Http\Controllers\Admin\StatusController as AdminStatusController;
use App\Http\Controllers\CardController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\Customer\SaleController as CustomerSaleController;
use App\Http\Controllers\ExpansionController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\MailingController;
use App\Http\Controllers\MyAccountController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\PokemonController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\Seller\SaleController as SellerSaleController;
use App\Http\Controllers\ThankController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Public routes
Route::get('/', fn () => redirect('/login'));
Route::get('/pokedex', [PokemonController::class, 'reactView']);
Route::get('/expansions', [ExpansionController::class, 'reactView']);
Route::get('/catalog', [CatalogController::class, 'reactView']);
Route::get('/card/{cardId}', [CardController::class, 'reactView']);
Route::get('/item/{itemId}', [ItemController::class, 'reactView']);
Route::get('/cart', [CartController::class, 'reactView']);

// Authentication Routes
Route::get('/login', [LoginController::class, 'reactView'])->name('login');
Route::get('/register', [RegisterController::class, 'reactView']);

Route::get('/confirm-email/{token}', [AuthController::class, 'confirmEmailView'])->name('ConfirmEmail.jsx');
Route::get('/confirmation/{token}', [AuthController::class, 'loginView'])->name('confirmation');

Route::get('/unsubscribe', [MailingController::class, 'reactView'])->name('Unsubscribe.jsx');

Route::middleware('auth')->group(function () {

    Route::get('/checkout', [SaleController::class, 'reactView']);
    Route::get('/thanks', [ThankController::class, 'reactView']);

    Route::get('/onboarding/{uuid}', [OnboardingController::class, 'reactView']);
    Route::get('/profile', [ProfileController::class, 'reactView']);

    Route::get('/orders', [CustomerSaleController::class, 'reactView']);

    Route::middleware('can:Seller')->group(function () {
        Route::get('/my-collection', [SellerCardController::class, 'reactView']);
        Route::get('/sales', [SellerSaleController::class, 'reactView']);
    });

    // Admin routes
    Route::middleware('can:Admin')->prefix('admin')->group(function () {
        Route::get('/', fn() => redirect()->to('/admin/home'));
        Route::get('/home', [AdminHomeController::class, 'reactView']);
        Route::get('/sales', [AdminSaleController::class, 'reactView']);

        Route::get('/items', [AdminItemController::class, 'reactView']);
        Route::get('/cards', [AdminCardController::class, 'reactView']);

        Route::get('/users', [AdminUserController::class, 'reactView']);
        Route::get('/delivery-points', [AdminDeliveryPointController::class, 'reactView']);
        Route::get('/payment-methods', [AdminPaymentMethodController::class, 'reactView']);

        Route::get('/pokemons', [AdminPokemonController::class, 'reactView']);
        Route::get('/regions', [AdminRegionController::class, 'reactView']);
        Route::get('/expansions', [AdminExpansionController::class, 'reactView']);
        Route::get('/series', [AdminSerieController::class, 'reactView']);
        Route::get('/languages', [AdminLanguageController::class, 'reactView']);
        Route::get('/statuses', [AdminStatusController::class, 'reactView']);

        Route::get('/transactions', [AdminTransactionController::class, 'reactView'])->name('Admin/Transactions.jsx');
        Route::get('/transactions/categories', [AdminTransactionCategoryController::class, 'reactView'])->name('Admin/TransactionCategories.jsx');

        Route::get('/ads', [AdminAdController::class, 'reactView'])->name('Admin/Ads.jsx');
        Route::get('/renewals', [AdminRenewalController::class, 'reactView'])->name('Admin/Renewals.jsx');
        Route::get('/bundles', [AdminBundleController::class, 'reactView'])->name('Admin/Bundles.jsx');
        Route::get('/coupons', [AdminCouponController::class, 'reactView'])->name('Admin/Coupons.jsx');
        Route::get('/origins', [AdminSaleOriginController::class, 'reactView'])->name('Admin/SaleOrigins.jsx');
        Route::get('/messages', [AdminSubscriptionController::class, 'reactView'])->name('Admin/Messages.jsx');

        Route::prefix('mailing')->group(function () {
            Route::get('/templates', [AdminMailingTemplateController::class, 'reactView'])->name('Admin/MailingTemplates.jsx');
            Route::get('/history', [AdminSendingHistoryController::class, 'reactView'])->name('Admin/SendingHistory.jsx');
        });

        Route::get('/subscriptions', [AdminSubscriptionController::class, 'reactView'])->name('Admin/Subscriptions.jsx');
        Route::get('/about', [AdminAboutusController::class, 'reactView'])->name('Admin/About.jsx');
        Route::get('/indicators', [AdminIndicatorController::class, 'reactView'])->name('Admin/Indicators.jsx');
        Route::get('/sliders', [AdminSliderController::class, 'reactView'])->name('Admin/Sliders.jsx');
        Route::get('/testimonies', [AdminTestimonyController::class, 'reactView'])->name('Admin/Testimonies.jsx');
        Route::get('/categories', [AdminCategoryController::class, 'reactView'])->name('Admin/Categories.jsx');
        Route::get('/tags', [AdminTagController::class, 'reactView'])->name('Admin/Tags.jsx');
        Route::get('/faqs', [AdminFaqController::class, 'reactView'])->name('Admin/Faqs.jsx');
        Route::get('/socials', [AdminSocialController::class, 'reactView'])->name('Admin/Socials.jsx');
        Route::get('/strengths', [AdminStrengthController::class, 'reactView'])->name('Admin/Strengths.jsx');
        Route::get('/generals', [AdminGeneralController::class, 'reactView'])->name('Admin/Generals.jsx');

        Route::get('/profile', [AdminProfileController::class, 'reactView'])->name('Admin/Profile.jsx');
        Route::get('/account', [AdminAccountController::class, 'reactView'])->name('Admin/Account.jsx');
    });

    //Seller routes
    Route::middleware('can:Seller')->prefix('seller')->group(function () {
        Route::get('/', fn() => redirect('/seller/home'));
        Route::get('/home', [SellerHomeController::class, 'reactView']);
        Route::get('/cards', [SellerCardController::class, 'reactView']);
    });

    // Customer routes
    Route::middleware('can:Customer')->group(function () {
        Route::get('/my-account', [MyAccountController::class, 'reactView'])->name('MyAccount.jsx');
    });
});



Route::get('/mailing/new-formula', fn() => view('mailing.new-formula'));
Route::get('/repository/{uuid}', [AdminRepositoryController::class, 'media'])->withoutMiddleware('throttle');
Route::get('/graph/sales/{type}/{filter}', [AdminHomeController::class, 'getSales']);
