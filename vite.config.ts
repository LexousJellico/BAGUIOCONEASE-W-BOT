import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        wayfinder({
            command: 'php artisan wayfinder:generate --with-form',
        }),

        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),

        react(),

        tailwindcss(),
    ],

    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },

    esbuild: {
        jsx: 'automatic',
    },

    build: {
        chunkSizeWarningLimit: 950,

        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
                        return 'vendor-react';
                    }

                    if (id.includes('node_modules/@inertiajs')) {
                        return 'vendor-inertia';
                    }

                    if (id.includes('node_modules/framer-motion')) {
                        return 'vendor-motion';
                    }

                    if (id.includes('node_modules/lucide-react')) {
                        return 'vendor-icons';
                    }

                    if (id.includes('node_modules/@radix-ui')) {
                        return 'vendor-radix';
                    }

                    if (id.includes('node_modules/recharts')) {
                        return 'vendor-charts';
                    }

                    if (id.includes('/resources/js/components/public/')) {
                        return 'public-components';
                    }

                    if (id.includes('/resources/js/components/bookings/')) {
                        return 'booking-components';
                    }

                    if (id.includes('/resources/js/components/admin-resource/')) {
                        return 'admin-resource-components';
                    }

                    if (id.includes('/resources/js/components/ui/')) {
                        return 'ui-components';
                    }
                    
                    return undefined;
                },
            },
        },
    },
});
