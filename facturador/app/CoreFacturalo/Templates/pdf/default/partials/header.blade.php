@if(!empty($company))
    <table class="full-width">
        <tr>
            <td class="text-right">
                <strong>{{ $company->name }}</strong> - RUC {{ $company->number }}
            </td>
        </tr>
    </table>
@endif
