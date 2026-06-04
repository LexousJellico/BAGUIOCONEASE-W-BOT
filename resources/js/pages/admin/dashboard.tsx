import AdminCommandCenter from '@/components/backend/admin-command-center';
import { usePage } from '@inertiajs/react';

type PageProps = {
    workspaceStats?: Record<string, number | string | null | undefined>;
    adminCommandCenter?: Parameters<typeof AdminCommandCenter>[0]['adminCommandCenter'];
};

export default function AdminDashboard() {
    const { props } = usePage<PageProps>();

    return (
        <AdminCommandCenter
            workspaceStats={props.workspaceStats}
            adminCommandCenter={props.adminCommandCenter}
        />
    );
}
