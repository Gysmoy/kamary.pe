<?php

namespace App\Http\Controllers\Admin;

use App\Models\CommercialOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DailySummaryController extends ReportController
{
    public $model = CommercialOrder::class;
    public $reactView = 'Admin/DailySummary';
    public $ignoreStatusFilter = true;

    public function setReactViewProperties(Request $request)
    {
        return ['requiredPermission' => 'daily-summary'];
    }

    public function setPaginationInstance(string $model)
    {
        $commercial = DB::table('commercial_orders')
            ->whereNotNull('status')
            ->groupBy(DB::raw('DATE(issue_date)'), 'business_id', 'business_branch_id')
            ->selectRaw("
                DATE(issue_date) as operation_date,
                business_id,
                business_branch_id,
                COUNT(*) as commercial_orders_count,
                SUM(total) as commercial_orders_total,
                0 as service_orders_count,
                0 as service_orders_total,
                0 as billed_documents_count,
                0 as billed_total,
                0 as receivable_payments_total,
                0 as payable_payments_total,
                SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_operations_count
            ");

        $services = DB::table('service_orders')
            ->whereNotNull('status')
            ->groupBy(DB::raw('DATE(issue_date)'), 'business_id', 'business_branch_id')
            ->selectRaw("
                DATE(issue_date) as operation_date,
                business_id,
                business_branch_id,
                0 as commercial_orders_count,
                0 as commercial_orders_total,
                COUNT(*) as service_orders_count,
                SUM(total) as service_orders_total,
                0 as billed_documents_count,
                0 as billed_total,
                0 as receivable_payments_total,
                0 as payable_payments_total,
                SUM(CASE WHEN order_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_operations_count
            ");

        $billing = DB::table('billing_documents')
            ->where('status', 1)
            ->groupBy(DB::raw('DATE(issue_date)'), 'business_id', 'business_branch_id')
            ->selectRaw("
                DATE(issue_date) as operation_date,
                business_id,
                business_branch_id,
                0 as commercial_orders_count,
                0 as commercial_orders_total,
                0 as service_orders_count,
                0 as service_orders_total,
                SUM(CASE WHEN local_status = 'accepted' THEN 1 ELSE 0 END) as billed_documents_count,
                SUM(CASE WHEN local_status = 'accepted' THEN total ELSE 0 END) as billed_total,
                0 as receivable_payments_total,
                0 as payable_payments_total,
                SUM(CASE WHEN local_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_operations_count
            ");

        $receivablePayments = DB::table('receivable_payments as payment')
            ->join('accounts_receivable as receivable', 'receivable.id', '=', 'payment.accounts_receivable_id')
            ->where('payment.status', 1)
            ->groupBy(DB::raw('DATE(payment.payment_date)'), 'receivable.business_id', 'receivable.business_branch_id')
            ->selectRaw("
                DATE(payment.payment_date) as operation_date,
                receivable.business_id as business_id,
                receivable.business_branch_id as business_branch_id,
                0 as commercial_orders_count,
                0 as commercial_orders_total,
                0 as service_orders_count,
                0 as service_orders_total,
                0 as billed_documents_count,
                0 as billed_total,
                SUM(payment.amount) as receivable_payments_total,
                0 as payable_payments_total,
                0 as cancelled_operations_count
            ");

        $payablePayments = DB::table('accounts_payable_payments as payment')
            ->join('accounts_payable as payable', 'payable.id', '=', 'payment.accounts_payable_id')
            ->where('payment.status', 1)
            ->groupBy(DB::raw('DATE(payment.payment_date)'), 'payable.business_id', 'payable.business_branch_id')
            ->selectRaw("
                DATE(payment.payment_date) as operation_date,
                payable.business_id as business_id,
                payable.business_branch_id as business_branch_id,
                0 as commercial_orders_count,
                0 as commercial_orders_total,
                0 as service_orders_count,
                0 as service_orders_total,
                0 as billed_documents_count,
                0 as billed_total,
                0 as receivable_payments_total,
                SUM(payment.amount) as payable_payments_total,
                0 as cancelled_operations_count
            ");

        $summary = DB::query()
            ->fromSub(
                $commercial
                    ->unionAll($services)
                    ->unionAll($billing)
                    ->unionAll($receivablePayments)
                    ->unionAll($payablePayments),
                'daily_summary'
            )
            ->leftJoin('businesses as business', 'business.id', '=', 'daily_summary.business_id')
            ->leftJoin('business_branches as branch', 'branch.id', '=', 'daily_summary.business_branch_id')
            ->selectRaw("
                CONCAT(daily_summary.operation_date, '-', daily_summary.business_id, '-', COALESCE(daily_summary.business_branch_id, 0)) as id,
                daily_summary.operation_date,
                daily_summary.business_id,
                daily_summary.business_branch_id,
                COALESCE(business.name, '') as business_name,
                COALESCE(branch.name, '') as branch_name,
                SUM(daily_summary.commercial_orders_count) as commercial_orders_count,
                SUM(daily_summary.service_orders_count) as service_orders_count,
                SUM(daily_summary.commercial_orders_count + daily_summary.service_orders_count) as registered_orders_count,
                ROUND(SUM(daily_summary.commercial_orders_total), 2) as commercial_orders_total,
                ROUND(SUM(daily_summary.service_orders_total), 2) as service_orders_total,
                ROUND(SUM(daily_summary.commercial_orders_total + daily_summary.service_orders_total), 2) as registered_total,
                SUM(daily_summary.billed_documents_count) as billed_documents_count,
                ROUND(SUM(daily_summary.billed_total), 2) as billed_total,
                ROUND(SUM(daily_summary.receivable_payments_total), 2) as receivable_payments_total,
                ROUND(SUM(daily_summary.payable_payments_total), 2) as payable_payments_total,
                SUM(daily_summary.cancelled_operations_count) as cancelled_operations_count,
                ROUND(SUM(daily_summary.receivable_payments_total) - SUM(daily_summary.payable_payments_total), 2) as net_cash,
                ROUND(SUM(daily_summary.billed_total) - SUM(daily_summary.payable_payments_total), 2) as basic_margin
            ")
            ->groupBy([
                'daily_summary.operation_date',
                'daily_summary.business_id',
                'daily_summary.business_branch_id',
                'business.name',
                'branch.name',
            ]);

        $businessId = trim((string) request('business_id', ''));
        $branchId = trim((string) request('business_branch_id', ''));
        $dateFrom = trim((string) request('date_from', ''));
        $dateTo = trim((string) request('date_to', ''));

        if ($businessId !== '') $summary->where('daily_summary.business_id', $businessId);
        if ($branchId !== '') $summary->where('daily_summary.business_branch_id', $branchId);
        if ($dateFrom !== '') $summary->whereDate('daily_summary.operation_date', '>=', $dateFrom);
        if ($dateTo !== '') $summary->whereDate('daily_summary.operation_date', '<=', $dateTo);

        return $summary;
    }
}
