import logo from '@/components/logo/logo.png'; // adjust alias if needed

interface LogoProps {
    className?: string;
    alt?: string;
}

export default function AppLogoIcon({
    className,
    alt = 'App Logo',
}: LogoProps) {
    return <img src={logo} alt={alt} className={className} />;
}
