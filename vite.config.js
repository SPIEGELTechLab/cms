import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue2';
import inject from '@rollup/plugin-inject';
import svgLoader from './vite-svg-loader';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // Patch: TLP-4046-04
        // Change the base so it fits our setup
        base: '/services/statamic/static/local/vendor/statamic/cp/build',
        // base: '/vendor/statamic/cp/build', original from Statamic
        plugins: [
            laravel({
                valetTls: env.VALET_TLS,
                input: [
                    'resources/css/tailwind.css',
                    'resources/js/app.js'
                ],
                refresh: true,
                publicDirectory: 'resources/dist',
                hotFile: 'resources/dist/hot',
            }),
            vue(),
            svgLoader(),
            inject({
                Vue: 'vue',
                _: 'underscore',
                include: 'resources/js/**'
            })
        ],
        resolve: {
            alias: {
                vue: 'vue/dist/vue.esm.js',
            }
        }
    }
});
