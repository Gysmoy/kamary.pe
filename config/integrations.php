<?php

return [
    'ecomsur' => [
        'provider' => env('ECOMSUR_PROVIDER', 'ecomsur_oms'),
        'external_source' => env('ECOMSUR_EXTERNAL_SOURCE', 'ecomsur_oms'),
        'inbound_token' => env('ECOMSUR_INBOUND_TOKEN'),
        'default_business_id' => env('ECOMSUR_DEFAULT_BUSINESS_ID'),
        'default_branch_id' => env('ECOMSUR_DEFAULT_BRANCH_ID'),
        'default_warehouse_id' => env('ECOMSUR_DEFAULT_WAREHOUSE_ID'),
        'default_client_id' => env('ECOMSUR_DEFAULT_CLIENT_ID'),
        'system_user_id' => env('ECOMSUR_SYSTEM_USER_ID', 1),
        'auto_create_articles' => env('ECOMSUR_AUTO_CREATE_ARTICLES', false),
        'default_laboratory_id' => env('ECOMSUR_DEFAULT_LABORATORY_ID'),
        'default_unit_id' => env('ECOMSUR_DEFAULT_UNIT_ID'),
    ],

    'storage_client_api' => [
        'system_user_id' => env('STORAGE_CLIENT_API_SYSTEM_USER_ID', 1),
    ],

    'multivende' => [
        'base_url' => env('MULTIVENDE_BASE_URL', 'https://app.multivende.com'),
        'client_id' => env('MULTIVENDE_CLIENT_ID'),
        'client_secret' => env('MULTIVENDE_CLIENT_SECRET'),
        'merchant_id' => env('MULTIVENDE_MERCHANT_ID'),
        'access_token' => env('MULTIVENDE_ACCESS_TOKEN'),
        'refresh_token' => env('MULTIVENDE_REFRESH_TOKEN'),
        'webhook_token' => env('MULTIVENDE_WEBHOOK_TOKEN'),
        'timeout' => env('MULTIVENDE_TIMEOUT', 30),
        'verify_ssl' => env('MULTIVENDE_VERIFY_SSL', true),
        'paths' => [
            'checkouts_light' => env('MULTIVENDE_CHECKOUTS_LIGHT_PATH', '/api/m/{merchant_id}/checkouts/light/limit/{limit}'),
            'checkout' => env('MULTIVENDE_CHECKOUT_PATH', '/api/checkouts/{checkout_id}'),
            'delivery_order' => env('MULTIVENDE_DELIVERY_ORDER_PATH', '/api/delivery-orders/{delivery_order_id}'),
            'delivery_status' => env('MULTIVENDE_DELIVERY_STATUS_PATH'),
            'delivery_tracking' => env('MULTIVENDE_DELIVERY_TRACKING_PATH'),
            'bulk_stock' => env('MULTIVENDE_BULK_STOCK_PATH'),
            'checkout_dte' => env('MULTIVENDE_CHECKOUT_DTE_PATH', '/api/checkouts/{checkout_id}/electronic-billing-documents'),
            'delivery_dte' => env('MULTIVENDE_DELIVERY_DTE_PATH', '/api/delivery-orders/{delivery_order_id}/electronic-billing-documents'),
            'auth' => env('MULTIVENDE_AUTH_PATH'),
            'refresh' => env('MULTIVENDE_REFRESH_PATH'),
        ],
    ],
];
