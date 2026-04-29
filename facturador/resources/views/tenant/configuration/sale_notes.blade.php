@extends('tenant.layouts.app')

@section('content')

    <tenant-configurations-sale-notes
        :url="'{{$migrationConfiguration['url']}}'"
        :api-key="'{{$migrationConfiguration['api_key']}}'"
        :type-user="{{json_encode(Auth::user()->type)}}"
        :configuration='@json(json_decode(\App\Models\Billing\Configuration::getPublicConfig(), true))'
    ></tenant-configurations-sale-notes>

@endsection
