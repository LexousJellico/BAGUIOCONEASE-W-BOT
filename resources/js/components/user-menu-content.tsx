import ConfirmActionDialog from '@/components/confirm-action-dialog';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { edit } from '@/routes/profile';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
    const [logoutProcessing, setLogoutProcessing] = useState(false);

    const handleLogout = () => {
        cleanup();
        setLogoutProcessing(true);
        router.flushAll();

        router.post('/logout', undefined, {
            onFinish: () => {
                setLogoutProcessing(false);
                setConfirmLogoutOpen(false);
            },
        });
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <UserInfo user={user} showEmail />
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href={edit()}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={(event) => {
                        event.preventDefault();
                        setConfirmLogoutOpen(true);
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuGroup>

            <ConfirmActionDialog
                open={confirmLogoutOpen}
                onOpenChange={setConfirmLogoutOpen}
                title="Log out of your account?"
                description="You are about to end your current session."
                confirmLabel="Log out"
                cancelLabel="Stay here"
                onConfirm={handleLogout}
                processing={logoutProcessing}
            />
        </>
    );
}
