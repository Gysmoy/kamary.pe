import fs from 'fs';
import glob from 'glob';
import laravel from 'laravel-vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const reactEntryPoints = glob
    .sync('resources/js/**/*.jsx')
    .filter(file => fs.readFileSync(file, 'utf8').includes('CreateReactScript('));

export default defineConfig({
    server: {
        watch: {
            ignored: ['!**/node_modules/your-package-name/**'],
        }
    },
    plugins: [
        laravel({
            input: [
                ...reactEntryPoints,
                'resources/css/app.css',
            ],
            refresh: true,
        }),
        react(),
    ],
    // resolve: name => {
    //     const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true })
    //     return pages[`./Pages/${name}.jsx`]
    // },
    resolve: {
        alias: {
            '@Adminto': path.resolve(__dirname, 'resources/js/Components/Adminto'),
            '@Tailwind': path.resolve(__dirname, 'resources/js/Components/Tailwind'),
            '@Utils': path.resolve(__dirname, 'resources/js/Utils'),
            '@Rest': path.resolve(__dirname, 'resources/js/Actions'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                assetFileNames: (assetInfo) => {
                    if (assetInfo.name == 'app-C6GHMxSp.css')
                        return 'app.css';
                    return assetInfo.name;
                },
            },
        },
    },
});
