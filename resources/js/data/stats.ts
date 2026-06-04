export type StatItem = {
    value: string;
    suffix?: string;
    label: string;
};

export const stats: StatItem[] = [
    { value: '2000', suffix: '+', label: 'Seating Capacity' },
    { value: '50', suffix: '+', label: 'Parking Support' },
    { value: '8', suffix: '', label: 'Public Venue Zones' },
    { value: '48', suffix: '', label: 'Years of Venue Legacy' },
];
