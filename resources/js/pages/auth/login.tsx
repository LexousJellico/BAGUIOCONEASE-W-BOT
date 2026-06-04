import AuthAccessPage from './auth-access';

type Props = {
    status?: string;
    canResetPassword?: boolean;
};

export default function Login({ status, canResetPassword = true }: Props) {
    return (
        <AuthAccessPage
            defaultMode="login"
            status={status}
            canResetPassword={canResetPassword}
        />
    );
}
