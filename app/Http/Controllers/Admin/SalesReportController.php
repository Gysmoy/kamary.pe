<?php

namespace App\Http\Controllers\Admin;

use App\Models\CommercialOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesReportController extends ReportController
{
    public $model = CommercialOrder::class;
    public $reactView = 'Admin/SalesReport';
    public $ignoreStatusFilter = true;

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'orders'];
    }

    public function setPaginationInstance(string $model)
    {
        $commercialOrders = DB::table('commercial_orders as source')
            ->whereNotNull('source.status')
            ->selectRaw("
                CONCAT('commercial-', source.id) as id,
                'commercial_order' as source_type,
                source.id as source_id,
                source.code as source_code,
                source.business_id,
                source.business_branch_id,
                source.warehouse_id,
                source.client_id,
                source.eventual_client_id,
                source.seller_id,
                source.document_type,
                source.issue_date,
                source.subtotal,
                source.tax_amount,
                source.total,
                source.paid_amount,
                source.balance_amount,
                source.payment_status,
                source.billing_status,
                source.order_status
            ");

        $serviceOrders = DB::table('service_orders as source')
            ->whereNotNull('source.status')
            ->selectRaw("
                CONCAT('service-', source.id) as id,
                'service_order' as source_type,
                source.id as source_id,
                source.code as source_code,
                source.business_id,
                source.business_branch_id,
                NULL as warehouse_id,
                source.client_id,
                NULL as eventual_client_id,
                source.seller_id,
                source.expected_document_type as document_type,
                source.issue_date,
                source.subtotal,
                source.tax_amount,
                source.total,
                source.paid_amount,
                source.balance_amount,
                source.payment_status,
                source.billing_status,
                source.order_status
            ");

        $billingAggregation = DB::table('billing_documents as document')
            ->where('document.status', 1)
            ->groupBy('document.source_type', 'document.source_id')
            ->selectRaw("
                document.source_type,
                document.source_id,
                GROUP_CONCAT(
                    CONCAT(
                        document.document_type,
                        ' ',
                        COALESCE(document.series, ''),
                        CASE
                            WHEN document.sequence IS NULL OR document.sequence = '' THEN ''
                            ELSE CONCAT('-', document.sequence)
                        END,
                        ' [', document.local_status, ']'
                    )
                    ORDER BY document.id DESC
                    SEPARATOR ' | '
                ) as billing_documents
            ");

        $query = DB::query()
            ->fromSub($commercialOrders->unionAll($serviceOrders), 'sales_report')
            ->leftJoin('businesses as business', 'business.id', '=', 'sales_report.business_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'sales_report.business_branch_id')
            ->leftJoin('warehouses as warehouse', 'warehouse.id', '=', 'sales_report.warehouse_id')
            ->leftJoin('clients as client', 'client.id', '=', 'sales_report.client_id')
            ->leftJoin('eventual_clients as eventual_client', 'eventual_client.id', '=', 'sales_report.eventual_client_id')
            ->leftJoin('users as seller', 'seller.id', '=', 'sales_report.seller_id')
            ->leftJoinSub($billingAggregation, 'billing_agg', function ($join) {
                $join->on('billing_agg.source_type', '=', 'sales_report.source_type')
                    ->on('billing_agg.source_id', '=', 'sales_report.source_id');
            })
            ->selectRaw("
                sales_report.*,
                COALESCE(business.name, '') as business_name,
                COALESCE(branch.name, '') as branch_name,
                COALESCE(warehouse.name, '') as warehouse_name,
                COALESCE(client.full_name, eventual_client.business_name, '') as customer_name,
                COALESCE(client.document_number, eventual_client.document_number, '') as customer_document,
                COALESCE(seller.fullname, CONCAT(COALESCE(seller.name, ''), ' ', COALESCE(seller.lastname, '')), seller.username, '') as seller_name,
                COALESCE(billing_agg.billing_documents, '') as billing_documents
            ");

        $businessId = trim((string) request('business_id', ''));
        $branchId = trim((string) request('business_branch_id', ''));
        $warehouseId = trim((string) request('warehouse_id', ''));
        $sourceType = trim((string) request('source_type', ''));
        $orderStatus = trim((string) request('order_status', ''));
        $documentType = trim((string) request('document_type', ''));
        $dateFrom = trim((string) request('date_from', ''));
        $dateTo = trim((string) request('date_to', ''));

        if ($businessId !== '') $query->where('sales_report.business_id', $businessId);
        if ($branchId !== '') $query->where('sales_report.business_branch_id', $branchId);
        if ($warehouseId !== '') $query->where('sales_report.warehouse_id', $warehouseId);
        if ($sourceType !== '') $query->where('sales_report.source_type', $sourceType);
        if ($orderStatus !== '') $query->where('sales_report.order_status', $orderStatus);
        if ($documentType !== '') $query->where('sales_report.document_type', $documentType);
        if ($dateFrom !== '') $query->whereDate('sales_report.issue_date', '>=', $dateFrom);
        if ($dateTo !== '') $query->whereDate('sales_report.issue_date', '<=', $dateTo);

        return $query;
    }
}
