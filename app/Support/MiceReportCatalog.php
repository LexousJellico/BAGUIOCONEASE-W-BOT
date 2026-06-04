<?php

namespace App\Support;

final class MiceReportCatalog
{
    public const EVENT_SCOPE_PUBLIC = 'public';
    public const EVENT_SCOPE_PRIVATE = 'private';
    public const EVENT_CENTER_NAME = 'BAGUIO CONVENTION AND CULTURAL CENTER';
    public const FUNCTION_HALLS_COUNT = 1;
    public const FUNCTION_HALL_CAPACITY = 2000;

    public static function eventScopes(): array
    {
        return [
            self::EVENT_SCOPE_PUBLIC => 'Public Event',
            self::EVENT_SCOPE_PRIVATE => 'Private / Personal Event',
        ];
    }

    public static function eventCenters(): array
    {
        return [self::EVENT_CENTER_NAME];
    }

    public static function coveredMonths(): array
    {
        return [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
        ];
    }

    public static function classifications(): array
    {
        return [
            'INTERNATIONAL' => 'INTERNATIONAL',
            'REGIONAL ASIA PACIFIC' => 'REGIONAL ASIA PACIFIC',
            'REGIONAL OFFSHORE' => 'REGIONAL OFFSHORE',
            'REGIONAL PHILIPPINES' => 'REGIONAL PHILIPPINES',
            'NATIONAL' => 'NATIONAL',
        ];
    }

    public static function classificationInstructions(): array
    {
        return [
            'INTERNATIONAL' => 'Guests/participants are from two different continents.',
            'REGIONAL ASIA PACIFIC' => 'Guests/participants are from two or more countries from the same continent.',
            'REGIONAL OFFSHORE' => 'Guests/participants are from one country excluding the Philippines.',
            'REGIONAL PHILIPPINES' => 'Participants are from within a region of the Philippines.',
            'NATIONAL' => 'Participants are from two or more regions of the Philippines.',
        ];
    }

    public static function eventTypes(): array
    {
        return [
            'MEETINGS' => 'MEETINGS',
            'INCENTIVE TRAVEL' => 'INCENTIVE TRAVEL',
            'CONVENTIONS' => 'CONVENTIONS',
            'EXHIBITS' => 'EXHIBITS',
            'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS' => 'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS',
        ];
    }

    public static function eventTypeInstructions(): array
    {
        return [
            'MEETINGS' => 'Management meetings, board meetings, shareholders meetings, strategic planning sessions, and similar business gatherings.',
            'INCENTIVE TRAVEL' => 'A reward and motivation tool where qualified workers, representatives, customers, dealers, or distributors are sent on incentive trips.',
            'CONVENTIONS' => 'Gatherings of people with common objectives, usually organized by associations or groups to exchange ideas, views, and information.',
            'EXHIBITS' => 'Exhibitions or trade fairs organized to show products, services, and information to potential customers, buyers, or the public.',
            'SEMINAR/WORKSHOP/SYMPOSIUM/OTHERS' => 'Seminars, workshops, symposiums, training events, lectures, or other event formats not classified above.',
        ];
    }

    public static function countries(): array
    {
        return [
            'Afghanistan',
            'Albania',
            'Algeria',
            'Andorra',
            'Angola',
            'Antigua and Barbuda',
            'Argentina',
            'Armenia',
            'Australia',
            'Austria',
            'Azerbaijan',
            'Bahamas',
            'Bahrain',
            'Bangladesh',
            'Barbados',
            'Belarus',
            'Belgium',
            'Belize',
            'Benin',
            'Bhutan',
            'Bolivia',
            'Bosnia and Herzegovina',
            'Botswana',
            'Brazil',
            'Brunei',
            'Bulgaria',
            'Burkina Faso',
            'Burundi',
            'Cabo Verde',
            'Cambodia',
            'Cameroon',
            'Canada',
            'Central African Republic',
            'Chad',
            'Chile',
            'China',
            'Colombia',
            'Comoros',
            'Congo',
            'Costa Rica',
            'Cote d\'Ivoire',
            'Croatia',
            'Cuba',
            'Cyprus',
            'Czechia',
            'Democratic People\'s Republic of Korea',
            'Democratic Republic of the Congo',
            'Denmark',
            'Djibouti',
            'Dominica',
            'Dominican Republic',
            'Ecuador',
            'Egypt',
            'El Salvador',
            'Equatorial Guinea',
            'Eritrea',
            'Estonia',
            'Eswatini',
            'Ethiopia',
            'Fiji',
            'Finland',
            'France',
            'Gabon',
            'Gambia',
            'Georgia',
            'Germany',
            'Ghana',
            'Greece',
            'Grenada',
            'Guatemala',
            'Guinea',
            'Guinea-Bissau',
            'Guyana',
            'Haiti',
            'Honduras',
            'Hungary',
            'Iceland',
            'India',
            'Indonesia',
            'Iran',
            'Iraq',
            'Ireland',
            'Israel',
            'Italy',
            'Jamaica',
            'Japan',
            'Jordan',
            'Kazakhstan',
            'Kenya',
            'Kiribati',
            'Kuwait',
            'Kyrgyzstan',
            'Lao People\'s Democratic Republic',
            'Latvia',
            'Lebanon',
            'Lesotho',
            'Liberia',
            'Libya',
            'Liechtenstein',
            'Lithuania',
            'Luxembourg',
            'Madagascar',
            'Malawi',
            'Malaysia',
            'Maldives',
            'Mali',
            'Malta',
            'Marshall Islands',
            'Mauritania',
            'Mauritius',
            'Mexico',
            'Micronesia',
            'Monaco',
            'Mongolia',
            'Montenegro',
            'Morocco',
            'Mozambique',
            'Myanmar',
            'Namibia',
            'Nauru',
            'Nepal',
            'Netherlands',
            'New Zealand',
            'Nicaragua',
            'Niger',
            'Nigeria',
            'North Macedonia',
            'Norway',
            'Oman',
            'Pakistan',
            'Palau',
            'Panama',
            'Papua New Guinea',
            'Paraguay',
            'Peru',
            'Philippines',
            'Poland',
            'Portugal',
            'Qatar',
            'Republic of Korea',
            'Republic of Moldova',
            'Romania',
            'Russian Federation',
            'Rwanda',
            'Saint Kitts and Nevis',
            'Saint Lucia',
            'Saint Vincent and the Grenadines',
            'Samoa',
            'San Marino',
            'Sao Tome and Principe',
            'Saudi Arabia',
            'Senegal',
            'Serbia',
            'Seychelles',
            'Sierra Leone',
            'Singapore',
            'Slovakia',
            'Slovenia',
            'Solomon Islands',
            'Somalia',
            'South Africa',
            'South Sudan',
            'Spain',
            'Sri Lanka',
            'Sudan',
            'Suriname',
            'Sweden',
            'Switzerland',
            'Syrian Arab Republic',
            'Tajikistan',
            'Thailand',
            'Timor-Leste',
            'Togo',
            'Tonga',
            'Trinidad and Tobago',
            'Tunisia',
            'Turkey',
            'Turkmenistan',
            'Tuvalu',
            'Uganda',
            'Ukraine',
            'United Arab Emirates',
            'United Kingdom',
            'United Republic of Tanzania',
            'United States of America',
            'Uruguay',
            'Uzbekistan',
            'Vanuatu',
            'Venezuela',
            'Viet Nam',
            'Yemen',
            'Zambia',
            'Zimbabwe',
            'Holy See',
            'State of Palestine',
            'Kosovo',
            'Taiwan',
        ];
    }

    public static function privateSkippedTextValue(): string
    {
        return '-';
    }

    public static function normalizeScope(?string $value): string
    {
        $normalized = strtolower(trim((string) $value));
        $normalized = str_replace(['_', '-'], ' ', $normalized);

        return in_array($normalized, ['private', 'private personal', 'personal', 'private event', 'private/personal event'], true)
            ? self::EVENT_SCOPE_PRIVATE
            : self::EVENT_SCOPE_PUBLIC;
    }

    public static function isPublicScope(?string $value): bool
    {
        return self::normalizeScope($value) === self::EVENT_SCOPE_PUBLIC;
    }

    public static function eventScopeOptions(): array
    {
        return collect(self::eventScopes())
            ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
            ->values()
            ->all();
    }


    /**
     * Backward-compatible alias used by StoreBookingRequest/UpdateBookingRequest.
     * Newer code uses normalizeScope(), but older request/controller code calls normalizeEventScope().
     */
    public static function normalizeEventScope(?string $value): string
    {
        return self::normalizeScope($value);
    }

    public static function isPrivateScope(?string $value): bool
    {
        return self::normalizeScope($value) === self::EVENT_SCOPE_PRIVATE;
    }

    /**
     * Private/personal event presets kept for old booking forms and controller props.
     */
    public static function privateEventTypes(): array
    {
        return [
            'PERSONAL_EVENT' => 'Personal Event',
            'PRIVATE_EVENT' => 'Private Event',
            'WEDDING' => 'Wedding',
            'BIRTHDAY' => 'Birthday',
            'DEBUT' => 'Debut',
            'FAMILY_EVENT' => 'Family Event',
            'PRIVATE_SOCIAL_EVENT' => 'Private Social Event',
            'OTHER_PRIVATE_EVENT' => 'Other Private Event',
        ];
    }

    public static function privateEventOptions(): array
    {
        return collect(self::privateEventTypes())
            ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
            ->values()
            ->all();
    }

    /**
     * Determines whether the booking must collect the full public MICE statistical report.
     *
     * Public events require the MICE report. Private/personal events still keep contact/event
     * details, but their tourism/statistical MICE fields are skipped and saved as "-" by the
     * payload normalizer.
     */
    public static function requiresMiceReport(?string $eventType, ?string $privateEventType = null, ?string $eventScope = null): bool
    {
        if ($eventScope !== null && trim((string) $eventScope) !== '') {
            return self::isPublicScope($eventScope);
        }

        $private = strtoupper(trim((string) $privateEventType));

        if ($private !== '' && array_key_exists($private, self::privateEventTypes())) {
            return false;
        }

        $type = strtoupper(trim((string) $eventType));

        if ($type === '') {
            return true;
        }

        $privateWords = [
            'WEDDING',
            'BIRTHDAY',
            'DEBUT',
            'FAMILY',
            'PRIVATE',
            'PERSONAL',
        ];

        foreach ($privateWords as $word) {
            if (str_contains($type, $word)) {
                return false;
            }
        }

        return true;
    }

    public static function eventCenterOptions(): array
    {
        return collect(self::eventCenters())
            ->map(fn (string $value) => ['value' => $value, 'label' => $value])
            ->values()
            ->all();
    }

    public static function coveredMonthOptions(): array
    {
        return collect(self::coveredMonths())
            ->map(fn (string $value) => ['value' => $value, 'label' => $value])
            ->values()
            ->all();
    }

    public static function classificationOptions(): array
    {
        return collect(self::classifications())
            ->map(fn (string $label, string $value) => [
                'value' => $value,
                'label' => $label,
                'description' => self::classificationInstructions()[$value] ?? null,
            ])
            ->values()
            ->all();
    }

    public static function typeOptions(): array
    {
        return collect(self::eventTypes())
            ->map(fn (string $label, string $value) => [
                'value' => $value,
                'label' => $label,
                'description' => self::eventTypeInstructions()[$value] ?? null,
            ])
            ->values()
            ->all();
    }

    public static function countryOptions(): array
    {
        return collect(self::countries())
            ->map(fn (string $value) => ['value' => $value, 'label' => $value])
            ->values()
            ->all();
    }

    public static function options(): array
    {
        return [
            'event_scopes' => self::eventScopes(),
            'private_event_types' => self::privateEventTypes(),
            'event_centers' => self::eventCenters(),
            'covered_months' => self::coveredMonths(),
            'classifications' => self::classifications(),
            'classification_instructions' => self::classificationInstructions(),
            'event_types' => self::eventTypes(),
            'event_type_instructions' => self::eventTypeInstructions(),
            'countries' => self::countries(),
            'exhibitions' => [
                ['value' => true, 'label' => 'Yes'],
                ['value' => false, 'label' => 'No'],
            ],
        ];
    }
}
