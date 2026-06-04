<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\BookingPrintablePayloadService;
use App\Support\BcccPrintableDocumentCatalog;
use App\Support\BcccExcelExport;
use App\Support\WorkspaceAccess;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Inertia\Inertia;
use Inertia\Response;

class BookingPrintableController extends Controller
{
    public function __construct(private readonly BookingPrintablePayloadService $printables)
    {
    }

    public function reservation(Request $request, Booking $booking): Response
    {
        return $this->render($request, $booking, BcccPrintableDocumentCatalog::RESERVATION_SUMMARY);
    }

    public function finalBill(Request $request, Booking $booking): Response
    {
        return $this->render($request, $booking, BcccPrintableDocumentCatalog::FINAL_BILL);
    }

    public function cancellation(Request $request, Booking $booking): Response
    {
        return $this->render($request, $booking, BcccPrintableDocumentCatalog::CANCELLATION_ASSESSMENT);
    }

    public function miceSummary(Request $request, Booking $booking): Response
    {
        return $this->render($request, $booking, BcccPrintableDocumentCatalog::MICE_SUMMARY);
    }

    public function export(Request $request, Booking $booking, string $document): StreamedResponse
    {
        abort_unless(WorkspaceAccess::canViewBooking($request, $booking), 403);

        $type = BcccPrintableDocumentCatalog::normalize($document);
        $payload = $this->printables->build($booking, $type, $request);
        $meta = $payload['document'] ?? [];
        $safeReference = preg_replace('/[^A-Za-z0-9_-]+/', '-', (string) ($payload['booking']['reference'] ?? ('booking-'.$booking->id)));
        $safeType = preg_replace('/[^A-Za-z0-9_-]+/', '-', $type);

        $rows = [
            BcccExcelExport::section('Official Document'),
            BcccExcelExport::row(['Document', $meta['title'] ?? 'Booking Document']),
            BcccExcelExport::row(['Generated At', now()->format('F d, Y h:i A')]),
            BcccExcelExport::row(['Reference', $payload['booking']['reference'] ?? ('Booking #' . $booking->id)]),
        ];

        foreach ($payload as $section => $value) {
            $rows[] = BcccExcelExport::section(strtoupper(str_replace('_', ' ', (string) $section)));
            array_push($rows, ...$this->excelExportRows($value));
        }

        return BcccExcelExport::download("{$safeReference}-{$safeType}.xls", [
            [
                'name' => 'Official Export',
                'title' => 'BCCC EASE Official Export',
                'subtitle' => 'Baguio Convention and Cultural Center - printable document workbook',
                'widths' => [260, 440],
                'rows' => $rows,
            ],
        ]);
    }

    private function excelExportRows(mixed $value, string $prefix = ''): array
    {
        if (is_array($value)) {
            $isList = array_keys($value) === range(0, count($value) - 1);
            $rows = [];

            if ($isList) {
                foreach ($value as $index => $row) {
                    if (is_array($row)) {
                        $rows[] = BcccExcelExport::section(trim($prefix.' #'.($index + 1)));
                        array_push($rows, ...$this->excelExportRows($row, $prefix));
                    } else {
                        $rows[] = BcccExcelExport::row([trim($prefix.' #'.($index + 1)), $this->exportValue($row)]);
                    }
                }

                return $rows;
            }

            foreach ($value as $key => $row) {
                $label = trim($prefix ? $prefix.' / '.$key : (string) $key);
                if (is_array($row)) {
                    array_push($rows, ...$this->excelExportRows($row, $label));
                } else {
                    $rows[] = BcccExcelExport::row([str_replace('_', ' ', $label), $this->exportValue($row)]);
                }
            }

            return $rows;
        }

        return [BcccExcelExport::row([$prefix ?: 'Value', $this->exportValue($value)])];
    }

    private function writeExportRows($out, mixed $value, string $prefix = ''): void
    {
        if (is_array($value)) {
            $isList = array_keys($value) === range(0, count($value) - 1);

            if ($isList) {
                foreach ($value as $index => $row) {
                    if (is_array($row)) {
                        fputcsv($out, [trim($prefix.' #'.($index + 1))]);
                        $this->writeExportRows($out, $row, $prefix);
                    } else {
                        fputcsv($out, [trim($prefix.' #'.($index + 1)), $this->exportValue($row)]);
                    }
                }
                return;
            }

            foreach ($value as $key => $row) {
                $label = trim($prefix ? $prefix.' / '.$key : (string) $key);
                if (is_array($row)) {
                    $this->writeExportRows($out, $row, $label);
                } else {
                    fputcsv($out, [str_replace('_', ' ', $label), $this->exportValue($row)]);
                }
            }
            return;
        }

        fputcsv($out, [$prefix ?: 'Value', $this->exportValue($value)]);
    }

    private function exportValue(mixed $value): string
    {
        if ($value === null || $value === '') {
            return '—';
        }

        if (is_bool($value)) {
            return $value ? 'Yes' : 'No';
        }

        if ($value instanceof \DateTimeInterface) {
            return $value->format('F d, Y h:i A');
        }

        return (string) $value;
    }

    private function render(Request $request, Booking $booking, string $documentType): Response
    {
        abort_unless(WorkspaceAccess::canViewBooking($request, $booking), 403);

        $role = WorkspaceAccess::role($request);
        $page = match ($role) {
            'admin' => 'admin/bookings/print',
            'manager' => 'manager/bookings/print',
            'staff' => 'staff/bookings/print',
            default => 'user/bookings/print',
        };

        $payload = $this->printables->build($booking, $documentType, $request);

        return Inertia::render($page, [
            'workspaceRole' => $role,
            'documentType' => $documentType,
            'documentTitle' => $payload['document']['title'] ?? 'Booking Document',
            'generatedAt' => now()->toIso8601String(),
            'printable' => $payload,
        ]);
    }
}
