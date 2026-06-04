import { RoleDashboardTemplate } from '@/components/role/role-dashboard-template';
import { usePage } from '@inertiajs/react';

type DashboardBooking = {
  id: number | string;
  client_name?: string;
  company_name?: string;
  type_of_event?: string;
  booking_status?: string;
  payment_status?: string;
  booking_date_from?: string;
  booking_date_to?: string;
};

type DashboardScheduleItem = {
  id: number | string;
  title: string;
  status: string;
  time: string;
  venue?: string | null;
};

type PageProps = {
  workspaceStats?: Record<string, number>;
  recentBookings?: DashboardBooking[];
  todaySchedule?: DashboardScheduleItem[];
  workspaceSummary?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
};

export default function ManagerDashboard() {
  const { props } = usePage<PageProps>();

  return (
    <RoleDashboardTemplate
      role="manager"
      workspaceStats={props.workspaceStats}
      recentBookings={props.recentBookings}
      todaySchedule={props.todaySchedule}
      workspaceSummary={props.workspaceSummary}
    />
  );
}
