@extends('tenant.layouts.auth')

@section('content')
{{-- Datos de Laravel disponibles para React --}}
<script>
    window.__LOGIN_DATA__ = {
        csrfToken:   "{{ csrf_token() }}",
        loginRoute:  "{{ route('login') }}",
        forgotRoute: "{{ url('password/reset') }}",
        companyName: "{{ addslashes($company->trade_name ?? config('app.name')) }}",
        companyLogo: @if(!empty($company->logo)) "{{ asset('storage/uploads/logos/' . $company->logo) }}" @else null @endif,
        oldEmail:    "{{ old('email') }}",
        errors: {
            @if($errors->has('email'))
            email: @json($errors->get('email')),
            @endif
            @if($errors->has('password'))
            password: @json($errors->get('password')),
            @endif
        }
    };
</script>

{{-- React mount point --}}
<div id="login-root"></div>
@endsection
