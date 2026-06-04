import SafeImage from '@/components/system/safe-image';
import { PINECONES_SVG } from '@/components/public/official-page-hero';
import { Link, usePage } from '@inertiajs/react';

type SiteSettings = {
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    footerCopyright?: string | null;
    footer_copyright?: string | null;
    city_seal_url?: string | null;
    citySealUrl?: string | null;
    logo_url?: string | null;
    logoUrl?: string | null;
};

type PageProps = {
    siteSettings?: SiteSettings;
};

function setting(settings: SiteSettings | undefined, ...keys: Array<keyof SiteSettings>) {
    for (const key of keys) {
        const value = settings?.[key];
        if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return '';
}

export default function PublicFooter() {
    const { props } = usePage<PageProps>();
    const settings = props.siteSettings;
    const year = new Date().getFullYear();
    const email = setting(settings, 'email') || 'pacd@baguio.gov.ph';
    const phone = setting(settings, 'phone') || '+63 945 823 7040';
    const seal = setting(settings, 'city_seal_url', 'citySealUrl', 'logo_url', 'logoUrl') || '/marketing/images/logo/bccc-seal.png';

    return (
        <footer className="bccc-public-footer relative z-10 bg-[#e9eef0] px-3 pb-4 pt-0 text-white dark:bg-[#08110f] sm:px-5 lg:px-6">
            <div className="mx-auto max-w-[1840px] overflow-hidden rounded-md bg-[#183d45] shadow-[0_22px_70px_rgba(2,26,22,0.18)]">
                <div className="relative grid gap-8 px-7 py-10 sm:px-10 lg:grid-cols-[0.45fr_0.5fr_0.6fr_0.55fr_0.48fr_0.55fr] lg:px-14 lg:py-12">
                    <div className="pointer-events-none absolute bottom-[-3rem] right-4 hidden h-[24rem] w-[33rem] opacity-[0.055] lg:block">
                        <SafeImage
                            src={PINECONES_SVG}
                            fallbackSrc="/marketing/images/logo/baguioseal.png"
                            alt="Baguio pinecones"
                            className="h-full w-full object-contain"
                            wrapperClassName="h-full w-full"
                        />
                    </div>

                    <div className="relative flex items-start lg:block">
                        <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full lg:h-36 lg:w-36">
                            <SafeImage src="/marketing/images/logo/repph.png" fallbackSrc={seal} alt="Republic of the Philippines" className="h-full w-full object-contain" wrapperClassName="h-full w-full" />
                        </div>
                    </div>

                    <div className="relative">
                        <h3 className="text-sm font-extrabold uppercase tracking-[0.02em] text-white">Republic of the Philippines</h3>
                        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/82">All content is in the public domain unless otherwise stated.</p>
                        <p className="mt-7 text-sm font-semibold text-white/62">© {year}. All rights reserved.</p>
                    </div>

                    <div className="relative">
                        <h3 className="text-sm font-extrabold uppercase tracking-[0.02em] text-white">About GOVPH</h3>
                        <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-white/82">Learn more about the Philippine government, its structure, how government works and the people behind it.</p>
                        <div className="mt-5 grid gap-1.5 text-sm font-semibold text-white/86">
                            <a href="https://www.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">GOV.PH</a>
                            <a href="https://data.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">Open Data Portal</a>
                            <a href="https://www.officialgazette.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">Official Gazette</a>
                        </div>
                    </div>

                    <div className="relative">
                        <h3 className="text-sm font-extrabold uppercase tracking-[0.02em] text-white">Government Links</h3>
                        <div className="mt-3 grid gap-1.5 text-sm font-semibold text-white/84">
                            <a href="https://op-proper.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">Office of the President</a>
                            <a href="https://www.ovp.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">Office of the Vice President</a>
                            <a href="https://legacy.senate.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">Senate of the Philippines</a>
                            <a href="https://www.congress.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">House of Representatives</a>
                            <a href="https://sc.judiciary.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">Supreme Court</a>
                            <a href="https://ca.judiciary.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">Court of Appeals</a>
                            <a href="https://sb.judiciary.gov.ph/" target="_blank" rel="noreferrer" className="hover:text-[#9fe8dc]">Sandiganbayan</a>
                        </div>
                    </div>

                    <div className="relative">
                        <h3 className="text-sm font-extrabold uppercase tracking-[0.02em] text-white">Contact Us</h3>
                        <div className="mt-3 grid gap-1.5 text-sm font-semibold leading-6 text-white/84">
                            <a href={`mailto:${email}`} className="hover:text-[#9fe8dc]">Email: {email}</a>
                            <a href={`tel:${phone.replace(/\s+/g, '')}`} className="hover:text-[#9fe8dc]">Viber: {phone}</a>
                            {settings?.address ? <span>{settings.address}</span> : null}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="flex items-center gap-4 lg:justify-end">
                            <div className="grid h-28 w-28 place-items-center rounded-full lg:h-36 lg:w-36">
                                <SafeImage
                                    src={seal}
                                    fallbackSrc="/marketing/images/logo/bccc-seal.png"
                                    alt="City of Baguio seal"
                                    className="h-full w-full object-contain"
                                    wrapperClassName="h-full w-full"
                                />
                            </div>

                            <div className="grid h-32 w-32 place-items-center rounded-full lg:h-[10.5rem] lg:w-[10.5rem]">
                                <SafeImage
                                    src="/marketing/images/logo/baguioseal.png"
                                    fallbackSrc="/marketing/images/logo/baguioseal.png"
                                    alt="Baguio logo"
                                    className="h-full w-full object-contain"
                                    wrapperClassName="h-full w-full"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative border-t border-white/14 px-6 py-5 text-center text-sm font-semibold text-white/88">
                    <span>{settings?.footerCopyright || settings?.footer_copyright || 'Baguio Convention and Cultural Center'}</span>
                    <span className="mx-2 hidden text-white/24 sm:inline">•</span>
                    <Link href="/" className="mt-2 inline-block text-[#9fe8dc] sm:mt-0">BCCC EASE</Link>
                </div>
            </div>
        </footer>
    );
}
