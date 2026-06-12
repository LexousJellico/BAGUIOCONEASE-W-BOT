<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\MiceRecord;
use App\Services\NotificationService;
use App\Support\MiceReportCatalog;
use App\Support\VenueAreaCatalog;
use App\Support\WorkspaceAccess;
use App\Support\WorkspacePage;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MiceRegistryController extends Controller
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function index(Request $request): InertiaResponse
    {
        return Inertia::render(
            WorkspacePage::resolve($request, 'reports/mice-registry'),
            array_merge($this->buildPayload($request), [
                'workspaceRole' => WorkspaceAccess::role($request),
                'can_manage' => $this->canManage($request),
            ])
        );
    }

    public function create(Request $request): RedirectResponse
    {
        $prefillBookingId = $request->integer('booking_id') ?: null;
        $booking = $prefillBookingId
            ? Booking::query()->find($prefillBookingId)
            : null;

        $redirect = $booking
            ? route(WorkspacePage::routeName($request, 'bookings.edit'), $booking->id)
            : route(WorkspacePage::routeName($request, 'reports.mice-registry'));

        return redirect($redirect)
            ->with('info', 'MICE report details are now completed inside the booking form.');
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);

        $payload = $this->validatedPayload($request);

        if (! empty($payload['booking_id'])) {
            $record = MiceRecord::query()->updateOrCreate(
                ['booking_id' => $payload['booking_id']],
                $payload,
            );
            $created = $record->wasRecentlyCreated;
        } else {
            $record = MiceRecord::query()->create($payload);
            $created = true;
        }

        $this->notifications->miceRecordSaved($record->fresh(), $request->user(), $created);

        $redirect = ! empty($payload['booking_id'])
            ? route(WorkspacePage::routeName($request, 'bookings.show'), $payload['booking_id'])
            : route(WorkspacePage::routeName($request, 'reports.mice-registry'));

        return redirect($redirect)
            ->with('success', 'MICE report details saved successfully.');
    }

    public function edit(Request $request, MiceRecord $miceRecord): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);

        $redirect = $miceRecord->booking_id
            ? route(WorkspacePage::routeName($request, 'bookings.edit'), $miceRecord->booking_id)
            : route(WorkspacePage::routeName($request, 'reports.mice-registry'));

        return redirect($redirect)
            ->with('info', 'MICE report details are now edited inside the linked booking form.');
    }

    public function update(Request $request, MiceRecord $miceRecord): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);

        $payload = $this->validatedPayload($request, $miceRecord);

        $miceRecord->update($payload);

        $this->notifications->miceRecordSaved($miceRecord->fresh(), $request->user(), false);

        $redirect = ! empty($payload['booking_id'])
            ? route(WorkspacePage::routeName($request, 'bookings.show'), $payload['booking_id'])
            : route(WorkspacePage::routeName($request, 'reports.mice-registry'));

        return redirect($redirect)
            ->with('success', 'MICE report details updated successfully.');
    }

    public function destroy(Request $request, MiceRecord $miceRecord): RedirectResponse
    {
        abort_unless($this->canManage($request), 403);

        $this->notifications->miceRecordDeleted($miceRecord, $request->user());

        $miceRecord->delete();

        return redirect()
            ->route(WorkspacePage::routeName($request, 'reports.mice-registry'))
            ->with('success', 'MICE report entry deleted successfully.');
    }

    public function print(Request $request): InertiaResponse
    {
        return Inertia::render(WorkspacePage::resolve($request, 'reports/mice-registry-print'), [
            ...$this->buildPayload($request),
            'workspaceRole' => WorkspaceAccess::role($request),
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $records = $this->filteredRecords($filters)->values();
        $summary = $this->summary($records);
        $categoryBreakdown = $this->categoryBreakdown($records);
        $venueBreakdown = $this->venueBreakdown($records);
        $originBreakdown = $this->originBreakdown($records);

        $filename = 'bccc-mice-report-'.now()->format('Y-m-d-His').'.xls';

        return response()->streamDownload(function () use (
            $records,
            $summary,
            $categoryBreakdown,
            $venueBreakdown,
            $originBreakdown
        ) {
            $escape = static fn (mixed $value): string => htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_XML1, 'UTF-8');
            $sheetStart = static function (string $name, array $widths = []) use ($escape): void {
                echo '<Worksheet ss:Name="'.$escape($name).'"><Table>';
                foreach ($widths as $width) {
                    echo '<Column ss:AutoFitWidth="0" ss:Width="'.(int) $width.'"/>';
                }
            };
            $sheetEnd = static function (): void {
                echo '</Table></Worksheet>';
            };
            $row = static function (array $cells, string $style = 'Data') use ($escape): void {
                echo '<Row>';
                foreach ($cells as $cell) {
                    $type = is_numeric($cell) ? 'Number' : 'String';
                    echo '<Cell ss:StyleID="'.$style.'"><Data ss:Type="'.$type.'">'.$escape($cell).'</Data></Cell>';
                }
                echo '</Row>';
            };

            echo '<?xml version="1.0" encoding="UTF-8"?>';
            echo '<?mso-application progid="Excel.Sheet"?>';
            echo '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">';
            echo '<Styles>';
            echo '<Style ss:ID="Title"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Size="17" ss:Color="#FFFFFF"/><Interior ss:Color="#164734" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#D6B56D"/></Borders></Style>';
            echo '<Style ss:ID="Header"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#226855" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#164734"/></Borders></Style>';
            echo '<Style ss:ID="Data"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:Color="#17201D"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8E1D3"/></Borders></Style>';
            echo '</Styles>';

            $sheetStart('Summary', [240, 160, 160, 160]);
            $row(['BCCC MICE Report Export'], 'Title');
            $row(['Generated At', now()->format('Y-m-d H:i:s')]);
            $row([]);
            foreach ($summary as $key => $value) {
                $row([ucwords(str_replace('_', ' ', (string) $key)), $value]);
            }
            $sheetEnd();

            $sheetStart('Category Breakdown', [220, 90, 120, 120, 140]);
            $row(['Category', 'Records', 'Participants', 'Room Nights', 'Tourism Receipts'], 'Header');
            foreach ($categoryBreakdown as $item) {
                $row([$item['label'], $item['count'], $item['participants'], $item['room_nights'], $item['tourism_receipts']]);
            }
            $sheetEnd();

            $sheetStart('Venue Breakdown', [220, 90, 120, 120, 140]);
            $row(['Venue / Area', 'Records', 'Participants', 'Room Nights', 'Tourism Receipts'], 'Header');
            foreach ($venueBreakdown as $item) {
                $row([$item['label'], $item['count'], $item['participants'], $item['room_nights'], $item['tourism_receipts']]);
            }
            $sheetEnd();

            $sheetStart('Origin Breakdown', [220, 90, 120]);
            $row(['Origin', 'Records', 'Participants'], 'Header');
            foreach ($originBreakdown as $item) {
                $row([$item['label'], $item['count'], $item['participants']]);
            }
            $sheetEnd();

            $sheetStart('Raw Records', [70, 80, 70, 90, 80, 220, 220, 140, 140, 160, 110, 110, 80, 220, 180, 130, 180, 130, 190, 240, 90, 90, 110, 110, 100, 100, 120, 150, 150, 150, 120, 120, 130, 150, 100, 100, 100, 110, 110, 110, 130, 120, 130, 240]);
            $headers = [
                'Record ID',
                'Record No',
                'Year',
                'Status',
                'Booking ID',
                'Booking Summary',
                'Event Name',
                'Event Category',
                'Type of Event',
                'Venue Area',
                'Event Center',
                'Covered Month',
                'Event Started',
                'Event Finished',
                'Number of Hours',
                'Classification',
                'MICE Type',
                'Event Date From',
                'Event Date To',
                'Event Days',
                'Organization',
                'Organizer Organization',
                'Organizer',
                'Organizer Type',
                'Contact Person',
                'Organizer Contact Person',
                'Contact Number',
                'Organizer Contact Number',
                'Email',
                'Address',
                'Organizer Address',
                'Local Male',
                'Local Female',
                'Domestic Male',
                'Domestic Female',
                'Foreign Male',
                'Foreign Female',
                'Domestic Attendees',
                'Foreign Attendees',
                'Total Participants',
                'Countries Count',
                'Countries Breakdown',
                'Has Exhibitions',
                'Exhibitors',
                'Visitors',
                'Main Origin Country',
                'Main Origin Province',
                'Main Origin City',
                'Same-Day Visitors',
                'Overnight Visitors',
                'Estimated Room Nights',
                'Estimated Tourism Receipts',
                'Total Employees',
                'Female Employees',
                'Male Employees',
                'Permit To Engage',
                'DOT Accredited',
                'Active Member',
                'Enterprise Group',
                'BTC Group Code',
                'Submitted At',
                'Remarks',
            ];
            $row($headers, 'Header');

            foreach ($records as $record) {
                $row([
                    $record['id'],
                    $record['record_no'],
                    $record['year_recorded'],
                    $record['status'],
                    $record['booking_id'],
                    $record['booking_summary'],
                    $record['event_name'],
                    $record['event_category'],
                    $record['type_of_event'],
                    $record['venue_area'],
                    $record['event_center_name'],
                    $record['covered_month'],
                    $record['event_started_at'],
                    $record['event_finished_at'],
                    $record['number_of_hours'],
                    $record['classification_of_event'],
                    $record['mice_type_of_event'],
                    $record['event_date_from'],
                    $record['event_date_to'],
                    $record['event_days'],
                    $record['organization_name'],
                    $record['organizer_organization_name'],
                    $record['organizer_name'],
                    $record['organizer_type'],
                    $record['contact_person'],
                    $record['organizer_contact_person'],
                    $record['contact_number'],
                    $record['organizer_contact_number'],
                    $record['email'],
                    $record['address'],
                    $record['organizer_address'],
                    $record['local_male_participants'],
                    $record['local_female_participants'],
                    $record['domestic_male_participants'],
                    $record['domestic_female_participants'],
                    $record['foreign_male_participants'],
                    $record['foreign_female_participants'],
                    $record['domestic_attendees'],
                    $record['foreign_attendees'],
                    $record['total_participants'],
                    $record['total_number_of_countries'],
                    $record['countries_breakdown_text'],
                    $record['has_exhibitions'] ? 'YES' : 'NO',
                    $record['exhibitors_count'],
                    $record['visitors_count'],
                    $record['main_origin_country'],
                    $record['main_origin_province'],
                    $record['main_origin_city'],
                    $record['same_day_visitors'],
                    $record['overnight_visitors'],
                    $record['estimated_room_nights'],
                    $record['estimated_tourism_receipts'],
                    $record['total_employees'],
                    $record['female_employees'],
                    $record['male_employees'],
                    $record['permit_to_engage'] ? 'YES' : 'NO',
                    $record['dot_accredited'] ? 'YES' : 'NO',
                    $record['active_member'] ? 'YES' : 'NO',
                    $record['enterprise_group'],
                    $record['btc_group_code'],
                    $record['submitted_at'],
                    $record['remarks'],
                ]);
            }
            $sheetEnd();

            echo '</Workbook>';
        }, $filename, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
        ]);
    }

    protected function buildPayload(Request $request): array
    {
        $filters = $this->filters($request);
        $records = $this->filteredRecords($filters);
        $rows = $records->values()->all();

        return [
            'filters' => $filters,
            'summary' => $this->summary($records),
            'category_breakdown' => $this->categoryBreakdown($records),
            'venue_breakdown' => $this->venueBreakdown($records),
            'origin_breakdown' => $this->originBreakdown($records),
            'monthly_breakdown' => $this->monthlyBreakdown($records),
            'year_options' => $this->yearOptions(),
            'category_options' => $this->categoryOptions(),
            'venue_options' => $this->venueOptions(),
            'rows' => $rows,
            'records' => $rows,
            'miceRecords' => $rows,
        ];
    }

    protected function validatedPayload(Request $request, ?MiceRecord $miceRecord = null): array
    {
        $data = $request->validate([
            'booking_id' => [
                'nullable',
                'integer',
                Rule::exists('bookings', 'id'),
            ],

            'record_no' => ['nullable', 'integer', 'min:1'],
            'year_recorded' => ['required', 'integer', 'min:2020', 'max:2100'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'submitted', 'approved'])],

            'enterprise_group' => ['nullable', 'string', 'max:50'],
            'btc_group_code' => ['nullable', 'string', 'max:50'],

            'event_name' => ['required', 'string', 'max:255'],
            'event_category' => ['required', 'string', 'max:255'],
            'type_of_event' => ['required', 'string', 'max:255'],
            'venue_area' => ['required', 'string', 'max:255'],

            'event_date_from' => ['required', 'date'],
            'event_date_to' => ['required', 'date', 'after_or_equal:event_date_from'],

            'organization_name' => ['required', 'string', 'max:255'],
            'organizer_name' => ['nullable', 'string', 'max:255'],
            'organizer_type' => ['nullable', 'string', 'max:255'],
            'contact_person' => ['required', 'string', 'max:255'],
            'contact_number' => ['nullable', 'regex:/^\d{11}$/'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],

            'local_male_participants' => ['nullable', 'integer', 'min:0'],
            'local_female_participants' => ['nullable', 'integer', 'min:0'],
            'domestic_male_participants' => ['nullable', 'integer', 'min:0'],
            'domestic_female_participants' => ['nullable', 'integer', 'min:0'],
            'foreign_male_participants' => ['nullable', 'integer', 'min:0'],
            'foreign_female_participants' => ['nullable', 'integer', 'min:0'],

            'main_origin_country' => ['nullable', 'string', 'max:255'],
            'main_origin_province' => ['nullable', 'string', 'max:255'],
            'main_origin_city' => ['nullable', 'string', 'max:255'],

            'same_day_visitors' => ['nullable', 'integer', 'min:0'],
            'overnight_visitors' => ['nullable', 'integer', 'min:0'],
            'estimated_room_nights' => ['nullable', 'integer', 'min:0'],
            'estimated_tourism_receipts' => ['nullable', 'numeric', 'min:0'],

            'total_employees' => ['nullable', 'integer', 'min:0'],
            'female_employees' => ['nullable', 'integer', 'min:0'],
            'male_employees' => ['nullable', 'integer', 'min:0'],

            'permit_to_engage' => ['nullable', 'boolean'],
            'dot_accredited' => ['nullable', 'boolean'],
            'active_member' => ['nullable', 'boolean'],

            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        foreach ([
            'enterprise_group',
            'btc_group_code',
            'event_name',
            'event_category',
            'type_of_event',
            'venue_area',
            'organization_name',
            'organizer_name',
            'organizer_type',
            'contact_person',
            'contact_number',
            'email',
            'address',
            'main_origin_country',
            'main_origin_province',
            'main_origin_city',
            'remarks',
        ] as $field) {
            $data[$field] = trim((string) ($data[$field] ?? ''));
        }

        $data['email'] = $data['email'] !== '' ? strtolower($data['email']) : null;
        $data['enterprise_group'] = strtoupper($data['enterprise_group'] ?: 'UNCLASSIFIED');
        $data['btc_group_code'] = strtoupper($data['btc_group_code'] ?: 'UNASSIGNED');

        foreach ([
            'local_male_participants',
            'local_female_participants',
            'domestic_male_participants',
            'domestic_female_participants',
            'foreign_male_participants',
            'foreign_female_participants',
            'same_day_visitors',
            'overnight_visitors',
            'estimated_room_nights',
            'total_employees',
            'female_employees',
            'male_employees',
        ] as $field) {
            $data[$field] = max(0, (int) ($data[$field] ?? 0));
        }

        $data['total_participants'] =
            $data['local_male_participants']
            + $data['local_female_participants']
            + $data['domestic_male_participants']
            + $data['domestic_female_participants']
            + $data['foreign_male_participants']
            + $data['foreign_female_participants'];

        $from = Carbon::parse($data['event_date_from'])->startOfDay();
        $to = Carbon::parse($data['event_date_to'])->startOfDay();

        $data['event_days'] = max(1, $from->diffInDays($to) + 1);
        $data['event_center_name'] = MiceReportCatalog::EVENT_CENTER_NAME;
        $data['establishment_name'] = MiceReportCatalog::EVENT_CENTER_NAME;
        $data['function_halls_count'] = MiceReportCatalog::FUNCTION_HALLS_COUNT;
        $data['function_hall_capacity'] = MiceReportCatalog::FUNCTION_HALL_CAPACITY;
        $data['covered_month'] = $from->format('F');
        $data['event_started_at'] = $from->toDateString();
        $data['event_finished_at'] = $to->toDateString();
        $data['number_of_hours'] = $data['event_days'] * 10;
        $data['classification_of_event'] = $data['event_category'];
        $data['mice_type_of_event'] = $data['type_of_event'];
        $data['domestic_attendees'] =
            $data['local_male_participants']
            + $data['local_female_participants']
            + $data['domestic_male_participants']
            + $data['domestic_female_participants'];
        $data['foreign_attendees'] =
            $data['foreign_male_participants']
            + $data['foreign_female_participants'];
        $data['total_number_of_countries'] = $data['main_origin_country'] !== '' ? 1 : 0;
        $data['countries_breakdown_text'] = $data['main_origin_country'];
        $data['has_exhibitions'] = false;
        $data['exhibitors_count'] = 0;
        $data['visitors_count'] = $data['same_day_visitors'] + $data['overnight_visitors'];
        $data['organizer_organization_name'] = $data['organization_name'];
        $data['organizer_address'] = $data['address'];
        $data['organizer_contact_person'] = $data['contact_person'];
        $data['organizer_contact_number'] = $data['contact_number'];
        $data['comments_feedback'] = $data['remarks'] ?: 'N/A';
        $data['estimated_tourism_receipts'] = round((float) ($data['estimated_tourism_receipts'] ?? 0), 2);
        $data['permit_to_engage'] = (bool) ($data['permit_to_engage'] ?? false);
        $data['dot_accredited'] = (bool) ($data['dot_accredited'] ?? false);
        $data['active_member'] = (bool) ($data['active_member'] ?? false);

        $data['status'] = $data['status'] ?: 'submitted';
        $data['submitted_at'] = $data['status'] !== 'draft'
            ? ($miceRecord?->submitted_at ?: now())
            : null;

        if (empty($data['record_no'])) {
            $data['record_no'] = $this->nextRecordNo((int) $data['year_recorded'], $miceRecord);
        }

        if (empty($data['booking_id'])) {
            $data['booking_id'] = null;
        }

        return $data;
    }

    protected function nextRecordNo(int $year, ?MiceRecord $ignore = null): int
    {
        $query = MiceRecord::query()->where('year_recorded', $year);

        if ($ignore) {
            $query->whereKeyNot($ignore->getKey());
        }

        return ((int) $query->max('record_no')) + 1;
    }

    protected function filters(Request $request): array
    {
        $year = trim((string) ($request->string('year_recorded')->value('') ?: $request->string('year')->value('')));

        return [
            'q' => trim((string) $request->string('q')->value('')),
            'year_recorded' => $year,
            'status' => trim((string) $request->string('status')->value('')),
            'event_category' => trim((string) $request->string('event_category')->value('')),
            'venue_area' => trim((string) $request->string('venue_area')->value('')),
            'origin' => trim((string) $request->string('origin')->value('')),
            'date_from' => trim((string) $request->string('date_from')->value('')),
            'date_to' => trim((string) $request->string('date_to')->value('')),
            'enterprise_group' => strtoupper(trim((string) $request->string('enterprise_group')->value(''))),
            'booking_linked' => trim((string) $request->string('booking_linked')->value('')),
        ];
    }

    protected function filteredRecords(array $filters): Collection
    {
        return MiceRecord::query()
            ->with([
                'booking:id,client_name,company_name,type_of_event,booking_date_from,booking_date_to,booking_status,payment_status',
            ])
            ->when($filters['q'] !== '', function (Builder $query) use ($filters) {
                $needle = '%'.$filters['q'].'%';

                $query->where(function (Builder $nested) use ($needle) {
                    $nested
                        ->where('event_name', 'like', $needle)
                        ->orWhere('establishment_name', 'like', $needle)
                        ->orWhere('event_center_name', 'like', $needle)
                        ->orWhere('covered_month', 'like', $needle)
                        ->orWhere('event_category', 'like', $needle)
                        ->orWhere('classification_of_event', 'like', $needle)
                        ->orWhere('type_of_event', 'like', $needle)
                        ->orWhere('mice_type_of_event', 'like', $needle)
                        ->orWhere('venue_area', 'like', $needle)
                        ->orWhere('organization_name', 'like', $needle)
                        ->orWhere('organizer_organization_name', 'like', $needle)
                        ->orWhere('organizer_name', 'like', $needle)
                        ->orWhere('contact_person', 'like', $needle)
                        ->orWhere('organizer_contact_person', 'like', $needle)
                        ->orWhere('email', 'like', $needle)
                        ->orWhere('main_origin_country', 'like', $needle)
                        ->orWhere('main_origin_province', 'like', $needle)
                        ->orWhere('main_origin_city', 'like', $needle)
                        ->orWhere('countries_breakdown_text', 'like', $needle)
                        ->orWhere('comments_feedback', 'like', $needle)
                        ->orWhere('remarks', 'like', $needle)
                        ->orWhereHas('booking', function (Builder $booking) use ($needle) {
                            $booking
                                ->where('client_name', 'like', $needle)
                                ->orWhere('company_name', 'like', $needle)
                                ->orWhere('type_of_event', 'like', $needle);
                        });
                });
            })
            ->when($filters['year_recorded'] !== '', fn (Builder $query) => $query->where('year_recorded', (int) $filters['year_recorded']))
            ->when($filters['status'] !== '', fn (Builder $query) => $query->where('status', $filters['status']))
            ->when($filters['event_category'] !== '', fn (Builder $query) => $query->where('event_category', $filters['event_category']))
            ->when($filters['venue_area'] !== '', fn (Builder $query) => $query->where('venue_area', $filters['venue_area']))
            ->when($filters['enterprise_group'] !== '', fn (Builder $query) => $query->where('enterprise_group', $filters['enterprise_group']))
            ->when($filters['origin'] !== '', function (Builder $query) use ($filters) {
                $needle = '%'.$filters['origin'].'%';

                $query->where(function (Builder $nested) use ($needle) {
                    $nested
                        ->where('main_origin_country', 'like', $needle)
                        ->orWhere('main_origin_province', 'like', $needle)
                        ->orWhere('main_origin_city', 'like', $needle);
                });
            })
            ->when($filters['date_from'] !== '', fn (Builder $query) => $query->whereDate('event_date_from', '>=', $filters['date_from']))
            ->when($filters['date_to'] !== '', fn (Builder $query) => $query->whereDate('event_date_to', '<=', $filters['date_to']))
            ->when($filters['booking_linked'] === 'yes', fn (Builder $query) => $query->whereNotNull('booking_id'))
            ->when($filters['booking_linked'] === 'no', fn (Builder $query) => $query->whereNull('booking_id'))
            ->orderByRaw('COALESCE(year_recorded, 0) desc')
            ->orderByRaw('COALESCE(record_no, 999999) asc')
            ->latest('submitted_at')
            ->get()
            ->map(fn (MiceRecord $record) => $this->serializeRecord($record))
            ->values();
    }

    protected function summary(Collection $records): array
    {
        return [
            'total_records' => $records->count(),
            'totalRecords' => $records->count(),
            'submitted_records' => $records->where('status', 'submitted')->count(),
            'draft_records' => $records->where('status', 'draft')->count(),
            'booking_linked_records' => $records->filter(fn (array $row) => ! empty($row['booking_id']))->count(),

            'total_participants' => (int) $records->sum('total_participants'),
            'totalParticipants' => (int) $records->sum('total_participants'),
            'local_participants' => (int) $records->sum('local_participants'),
            'domestic_participants' => (int) $records->sum('domestic_participants'),
            'foreign_participants' => (int) $records->sum('foreign_participants'),
            'domestic_attendees' => (int) $records->sum('domestic_attendees'),
            'foreign_attendees' => (int) $records->sum('foreign_attendees'),

            'same_day_visitors' => (int) $records->sum('same_day_visitors'),
            'overnight_visitors' => (int) $records->sum('overnight_visitors'),
            'visitors_count' => (int) $records->sum('visitors_count'),
            'exhibitors_count' => (int) $records->sum('exhibitors_count'),
            'estimated_room_nights' => (int) $records->sum('estimated_room_nights'),
            'total_room_nights' => (int) $records->sum('estimated_room_nights'),
            'totalRoomNights' => (int) $records->sum('estimated_room_nights'),
            'estimated_tourism_receipts' => round((float) $records->sum('estimated_tourism_receipts'), 2),
            'total_receipts' => round((float) $records->sum('estimated_tourism_receipts'), 2),
            'totalReceipts' => round((float) $records->sum('estimated_tourism_receipts'), 2),

            'total_employees' => (int) $records->sum('total_employees'),
            'female_employees' => (int) $records->sum('female_employees'),
            'male_employees' => (int) $records->sum('male_employees'),

            'permit_to_engage_count' => $records->where('permit_to_engage', true)->count(),
            'dot_accredited_count' => $records->where('dot_accredited', true)->count(),
            'active_member_count' => $records->where('active_member', true)->count(),
        ];
    }

    protected function categoryBreakdown(Collection $records): array
    {
        return $this->breakdownRows($records, 'event_category');
    }

    protected function venueBreakdown(Collection $records): array
    {
        return $this->breakdownRows($records, 'venue_area');
    }

    protected function originBreakdown(Collection $records): array
    {
        return $records
            ->groupBy(function (array $row) {
                return trim(implode(', ', array_filter([
                    $row['main_origin_city'] ?? null,
                    $row['main_origin_province'] ?? null,
                    $row['main_origin_country'] ?? null,
                ]))) ?: 'Unspecified';
            })
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'count' => $group->count(),
                'participants' => (int) $group->sum('total_participants'),
            ])
            ->sortByDesc('participants')
            ->values()
            ->all();
    }

    protected function monthlyBreakdown(Collection $records): array
    {
        return $records
            ->groupBy(fn (array $row) => $row['event_month'] ?: 'Unscheduled')
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'count' => $group->count(),
                'participants' => (int) $group->sum('total_participants'),
                'room_nights' => (int) $group->sum('estimated_room_nights'),
                'tourism_receipts' => round((float) $group->sum('estimated_tourism_receipts'), 2),
            ])
            ->values()
            ->all();
    }

    protected function breakdownRows(Collection $records, string $field): array
    {
        return $records
            ->groupBy(function (array $row) use ($field) {
                $value = trim((string) ($row[$field] ?? ''));

                return $value !== '' ? $value : 'Unspecified';
            })
            ->map(fn (Collection $group, string $label) => [
                'label' => $label,
                'count' => $group->count(),
                'participants' => (int) $group->sum('total_participants'),
                'room_nights' => (int) $group->sum('estimated_room_nights'),
                'tourism_receipts' => round((float) $group->sum('estimated_tourism_receipts'), 2),
            ])
            ->sortByDesc('participants')
            ->values()
            ->all();
    }

    protected function yearOptions(): array
    {
        return MiceRecord::query()
            ->whereNotNull('year_recorded')
            ->distinct()
            ->orderByDesc('year_recorded')
            ->pluck('year_recorded')
            ->map(fn ($year) => (int) $year)
            ->values()
            ->all();
    }

    protected function categoryOptions(): array
    {
        return MiceRecord::query()
            ->whereNotNull('event_category')
            ->where('event_category', '!=', '')
            ->distinct()
            ->orderBy('event_category')
            ->pluck('event_category')
            ->values()
            ->all();
    }

    protected function venueOptions(): array
    {
        return MiceRecord::query()
            ->whereNotNull('venue_area')
            ->where('venue_area', '!=', '')
            ->distinct()
            ->orderBy('venue_area')
            ->pluck('venue_area')
            ->values()
            ->all();
    }

    protected function bookingFormPayload(Booking $booking): array
    {
        $areaLabels = VenueAreaCatalog::displayNames($booking->selected_area_keys ?? []);
        $venueArea = implode(', ', array_filter($areaLabels))
            ?: ($booking->service?->serviceType?->name ?: $booking->service?->name ?: 'Baguio Convention and Cultural Center');

        return [
            'id' => (int) $booking->id,
            'company_name' => (string) ($booking->company_name ?? ''),
            'client_name' => (string) ($booking->client_name ?? ''),
            'client_email' => (string) ($booking->client_email ?? ''),
            'client_contact_number' => (string) ($booking->client_contact_number ?? ''),
            'client_address' => (string) ($booking->client_address ?? ''),
            'client_street_address' => (string) ($booking->client_street_address ?? ''),
            'organization_type' => (string) ($booking->organization_type ?? ''),
            'type_of_event' => (string) ($booking->type_of_event ?? ''),
            'venue_area' => $venueArea,
            'booking_date_from' => optional($booking->booking_date_from)->toDateString(),
            'booking_date_to' => optional($booking->booking_date_to)->toDateString(),
            'number_of_guests' => (int) ($booking->number_of_guests ?? 0),
        ];
    }

    protected function miceDraftFromBooking(Booking $booking): array
    {
        $payload = $this->bookingFormPayload($booking);
        $participants = max(0, (int) ($booking->number_of_guests ?? 0));
        $from = $booking->booking_date_from ? Carbon::parse($booking->booking_date_from)->startOfDay() : now()->startOfDay();
        $to = $booking->booking_date_to ? Carbon::parse($booking->booking_date_to)->startOfDay() : $from->copy();
        $days = max(1, $from->diffInDays($to) + 1);
        $eventScope = strtolower((string) ($booking->private_event_type ?: $booking->organization_type ?: ''));
        $isPrivate = str_contains($eventScope, 'private') || str_contains($eventScope, 'personal') || str_contains($eventScope, 'family');

        return [
            'booking_id' => (int) $booking->id,
            'year_recorded' => (int) $from->format('Y'),
            'status' => 'submitted',
            'event_scope' => $isPrivate ? 'private' : 'public',
            'event_center_name' => 'BAGUIO CONVENTION AND CULTURAL CENTER',
            'covered_month' => $from->format('F Y'),
            'event_started_at' => $from->toDateString(),
            'event_finished_at' => $to->toDateString(),
            'number_of_hours' => max(0, (float) ($booking->scheduleSegments?->sum('additional_hours') ?? 0)),
            'event_name' => $payload['type_of_event'] ?: ('Booking #'.$booking->id),
            'event_category' => $isPrivate ? 'Private Event' : 'Convention',
            'classification_of_event' => $isPrivate ? 'Private / Personal Event' : 'Public Event',
            'type_of_event' => $payload['type_of_event'],
            'mice_type_of_event' => $payload['type_of_event'],
            'venue_area' => $payload['venue_area'],
            'event_date_from' => $from->toDateString(),
            'event_date_to' => $to->toDateString(),
            'event_days' => $days,
            'organization_name' => $payload['company_name'],
            'organizer_organization_name' => $payload['company_name'],
            'organizer_name' => $payload['client_name'],
            'organizer_type' => $payload['organization_type'] ?: ($isPrivate ? 'Private' : 'Government'),
            'contact_person' => $payload['client_name'],
            'organizer_contact_person' => $payload['client_name'],
            'contact_number' => $payload['client_contact_number'],
            'organizer_contact_number' => $payload['client_contact_number'],
            'email' => $payload['client_email'],
            'address' => $payload['client_address'] ?: $payload['client_street_address'],
            'organizer_address' => $payload['client_address'] ?: $payload['client_street_address'],
            'domestic_attendees' => $participants,
            'total_participants' => $participants,
            'main_origin_country' => 'Philippines',
            'main_origin_province' => (string) ($booking->client_province ?? 'Benguet'),
            'main_origin_city' => (string) ($booking->client_city_municipality ?? 'Baguio City'),
            'same_day_visitors' => $participants,
            'overnight_visitors' => 0,
            'estimated_room_nights' => 0,
            'estimated_tourism_receipts' => 0,
            'enterprise_group' => 'UNCLASSIFIED',
            'btc_group_code' => 'UNASSIGNED',
            'remarks' => 'Auto-filled from booking details. Review and complete the remaining MICE reporting fields before saving.',
        ];
    }

    protected function bookingOptions(): array
    {
        return Booking::query()
            ->select(['id', 'client_name', 'company_name', 'type_of_event', 'booking_date_from', 'booking_date_to'])
            ->latest('id')
            ->limit(250)
            ->get()
            ->map(function (Booking $booking) {
                $dateFrom = $booking->booking_date_from
                    ? date('Y-m-d', strtotime((string) $booking->booking_date_from))
                    : null;

                $dateTo = $booking->booking_date_to
                    ? date('Y-m-d', strtotime((string) $booking->booking_date_to))
                    : null;

                return [
                    'id' => (int) $booking->id,
                    'label' => trim(implode(' • ', array_filter([
                        'BKG-'.str_pad((string) $booking->id, 5, '0', STR_PAD_LEFT),
                        $booking->client_name,
                        $booking->company_name,
                        $booking->type_of_event,
                        $dateFrom && $dateTo ? $dateFrom.' to '.$dateTo : null,
                    ]))),
                ];
            })
            ->values()
            ->all();
    }

    protected function formMeta(): array
    {
        return [
            'event_categories' => [
                'Meeting',
                'Incentive',
                'Convention',
                'Exhibition',
                'Government',
                'Cultural',
                'Corporate',
                'Social',
                'Other',
            ],
            'organizer_types' => [
                'Private',
                'Government',
                'NGO',
                'Academe',
                'Religious',
                'Corporate',
                'Association',
                'Other',
            ],
            'enterprise_groups' => [
                'PTE',
                'STE',
                'UNCLASSIFIED',
            ],
            'year_options' => $this->yearOptions(),
        ];
    }

    protected function serializeRecord(MiceRecord $record): array
    {
        $record->loadMissing('booking');

        $localParticipants = (int) ($record->local_male_participants ?? 0)
            + (int) ($record->local_female_participants ?? 0);

        $genderDomesticParticipants = (int) ($record->domestic_male_participants ?? 0)
            + (int) ($record->domestic_female_participants ?? 0);

        $genderForeignParticipants = (int) ($record->foreign_male_participants ?? 0)
            + (int) ($record->foreign_female_participants ?? 0);

        $officialDomesticParticipants = (int) ($record->domestic_attendees ?? 0);
        $officialForeignParticipants = (int) ($record->foreign_attendees ?? 0);
        $domesticParticipants = max($genderDomesticParticipants, $officialDomesticParticipants);
        $foreignParticipants = max($genderForeignParticipants, $officialForeignParticipants);
        $genderParticipantTotal = $localParticipants + $genderDomesticParticipants + $genderForeignParticipants;
        $officialParticipantTotal = $officialDomesticParticipants + $officialForeignParticipants;

        $totalParticipants = max(
            (int) ($record->total_participants ?? 0),
            $genderParticipantTotal,
            $officialParticipantTotal,
        );

        $sameDayVisitors = (int) ($record->same_day_visitors ?? 0);
        $overnightVisitors = (int) ($record->overnight_visitors ?? 0);
        $visitorsCount = max((int) ($record->visitors_count ?? 0), $sameDayVisitors + $overnightVisitors);

        $eventMonth = null;

        if ($record->event_date_from) {
            $eventMonth = Carbon::parse($record->event_date_from)->format('Y-m');
        }

        return [
            'id' => (int) $record->id,
            'booking_id' => $record->booking_id,
            'booking_summary' => $record->booking
                ? trim(implode(' • ', array_filter([
                    'BKG-'.str_pad((string) $record->booking->id, 5, '0', STR_PAD_LEFT),
                    $record->booking->client_name,
                    $record->booking->company_name,
                    $record->booking->type_of_event,
                ])))
                : '',

            'booking_status' => $record->booking?->booking_status,
            'booking_payment_status' => $record->booking?->payment_status,
            'booking' => $record->booking ? [
                'id' => (int) $record->booking->id,
                'client_name' => (string) ($record->booking->client_name ?? ''),
                'company_name' => (string) ($record->booking->company_name ?? ''),
                'type_of_event' => (string) ($record->booking->type_of_event ?? ''),
                'booking_status' => $record->booking->booking_status,
                'payment_status' => $record->booking->payment_status,
            ] : null,

            'record_no' => $record->record_no,
            'year_recorded' => $record->year_recorded,
            'status' => $record->status ?: 'draft',

            'enterprise_group' => strtoupper((string) ($record->enterprise_group ?? 'UNCLASSIFIED')),
            'btc_group_code' => strtoupper((string) ($record->btc_group_code ?? 'UNASSIGNED')),

            'event_name' => (string) ($record->event_name ?? ''),
            'event_category' => (string) ($record->event_category ?? ''),
            'type_of_event' => (string) ($record->type_of_event ?? ''),
            'venue_area' => (string) ($record->venue_area ?? ''),
            'establishment_name' => (string) ($record->establishment_name ?? ''),
            'event_scope' => (string) ($record->event_scope ?? ''),

            'event_center_name' => (string) ($record->event_center_name ?? ''),
            'function_halls_count' => (int) ($record->function_halls_count ?? 0),
            'function_hall_capacity' => (int) ($record->function_hall_capacity ?? 0),
            'covered_month' => (string) ($record->covered_month ?? ''),
            'month_added' => (string) ($record->covered_month ?? ''),
            'event_started_at' => optional($record->event_started_at)->toDateString(),
            'event_finished_at' => optional($record->event_finished_at)->toDateString(),
            'number_of_hours' => (float) ($record->number_of_hours ?? 0),
            'classification_of_event' => (string) ($record->classification_of_event ?? ''),
            'mice_type_of_event' => (string) ($record->mice_type_of_event ?? ''),

            'event_date_from' => optional($record->event_date_from)->toDateString(),
            'event_date_to' => optional($record->event_date_to)->toDateString(),
            'event_days' => (int) ($record->event_days ?? 0),
            'event_month' => $eventMonth,

            'organization_name' => (string) ($record->organization_name ?? ''),
            'organizer_name' => (string) ($record->organizer_name ?? ''),
            'organizer_type' => (string) ($record->organizer_type ?? ''),
            'contact_person' => (string) ($record->contact_person ?? ''),
            'contact_number' => (string) ($record->contact_number ?? ''),
            'email' => (string) ($record->email ?? ''),
            'address' => (string) ($record->address ?? ''),
            'organizer_organization_name' => (string) ($record->organizer_organization_name ?? ''),
            'organizer_address' => (string) ($record->organizer_address ?? ''),
            'organizer_contact_person' => (string) ($record->organizer_contact_person ?? ''),
            'organizer_contact_number' => (string) ($record->organizer_contact_number ?? ''),

            'local_male_participants' => (int) ($record->local_male_participants ?? 0),
            'local_female_participants' => (int) ($record->local_female_participants ?? 0),
            'domestic_male_participants' => (int) ($record->domestic_male_participants ?? 0),
            'domestic_female_participants' => (int) ($record->domestic_female_participants ?? 0),
            'foreign_male_participants' => (int) ($record->foreign_male_participants ?? 0),
            'foreign_female_participants' => (int) ($record->foreign_female_participants ?? 0),

            'local_participants' => $localParticipants,
            'domestic_participants' => $domesticParticipants,
            'foreign_participants' => $foreignParticipants,
            'total_participants' => $totalParticipants,
            'domestic_attendees' => $officialDomesticParticipants,
            'foreign_attendees' => $officialForeignParticipants,
            'total_number_of_countries' => (int) ($record->total_number_of_countries ?? 0),
            'countries_breakdown' => $record->countries_breakdown ?? [],
            'countries_breakdown_text' => (string) ($record->countries_breakdown_text ?? ''),

            'main_origin_country' => (string) ($record->main_origin_country ?? ''),
            'main_origin_province' => (string) ($record->main_origin_province ?? ''),
            'main_origin_city' => (string) ($record->main_origin_city ?? ''),

            'same_day_visitors' => $sameDayVisitors,
            'overnight_visitors' => $overnightVisitors,
            'visitors_count' => $visitorsCount,
            'has_exhibitions' => (bool) $record->has_exhibitions,
            'exhibitors_count' => (int) ($record->exhibitors_count ?? 0),
            'estimated_room_nights' => (int) ($record->estimated_room_nights ?? 0),
            'estimated_tourism_receipts' => (float) ($record->estimated_tourism_receipts ?? 0),

            'total_employees' => (int) ($record->total_employees ?? 0),
            'female_employees' => (int) ($record->female_employees ?? 0),
            'male_employees' => (int) ($record->male_employees ?? 0),

            'permit_to_engage' => (bool) $record->permit_to_engage,
            'dot_accredited' => (bool) $record->dot_accredited,
            'active_member' => (bool) $record->active_member,

            'remarks' => (string) ($record->remarks ?? ''),
            'comments_feedback' => (string) ($record->comments_feedback ?? ''),
            'source' => (string) ($record->source ?? ''),
            'source_response_timestamp' => optional($record->source_response_timestamp)->toIso8601String(),
            'source_username' => (string) ($record->source_username ?? ''),
            'submitted_at' => optional($record->submitted_at)->toIso8601String(),
            'created_at' => optional($record->created_at)->toIso8601String(),
            'updated_at' => optional($record->updated_at)->toIso8601String(),
        ];
    }

    protected function canManage(Request $request): bool
    {
        $user = $request->user();

        if (! $user) {
            return false;
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['admin', 'manager'])) {
            return true;
        }

        if (method_exists($user, 'hasRole')) {
            return $user->hasRole('admin') || $user->hasRole('manager');
        }

        $role = (string) ($user->role_name ?? $user->role ?? '');

        return in_array($role, ['admin', 'manager'], true);
    }
}
