import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    href?: string;
    className?: string;
    label?: string;
};

export default function GoogleSignInButton({
    href = '/auth/google/redirect',
    className,
    label = 'Continue with Google',
}: Props) {
    return (
        <Button
            type="button"
            variant="outline"
            className={cn('w-full gap-3 rounded-2xl', className)}
            onClick={() => {
                window.location.href = href;
            }}
        >
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                <path
                    fill="#4285F4"
                    d="M21.805 10.023h-9.18v3.955h5.262c-.227 1.272-.95 2.35-2.033 3.072v2.548h3.287c1.925-1.773 3.039-4.386 3.039-7.51 0-.69-.062-1.351-.175-1.988Z"
                />
                <path
                    fill="#34A853"
                    d="M12.625 22c2.756 0 5.069-.914 6.758-2.47l-3.287-2.548c-.913.611-2.079.973-3.471.973-2.668 0-4.928-1.802-5.737-4.226H3.49v2.63A10.204 10.204 0 0 0 12.625 22Z"
                />
                <path
                    fill="#FBBC05"
                    d="M6.888 13.729A6.13 6.13 0 0 1 6.567 11.8c0-.669.115-1.318.321-1.929V7.241H3.49A10.2 10.2 0 0 0 2.375 11.8c0 1.642.393 3.198 1.115 4.559l3.398-2.63Z"
                />
                <path
                    fill="#EA4335"
                    d="M12.625 5.645c1.499 0 2.846.515 3.906 1.526l2.928-2.928C17.688 2.593 15.376 1.6 12.625 1.6 8.639 1.6 5.195 3.89 3.49 7.241l3.398 2.63c.809-2.424 3.069-4.226 5.737-4.226Z"
                />
            </svg>

            <span>{label}</span>
        </Button>
    );
}
