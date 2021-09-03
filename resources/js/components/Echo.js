import LaravelEcho from 'laravel-echo';
window.Pusher = require('pusher-js');

class Echo {

    constructor() {
        this.bootedCallbacks = [];
    }

    booted(callback) {
        this.bootedCallbacks.push(callback);
    }

    start() {
        const config = {
            broadcaster: 'pusher',
            key: Statamic.$config.get('broadcasting.pusher.key'),
            cluster: Statamic.$config.get('broadcasting.pusher.cluster'),
            encrypted: Statamic.$config.get('broadcasting.pusher.encrypted'),
            csrfToken: Statamic.$config.get('csrfToken'),
            authEndpoint: Statamic.$config.get('broadcasting.endpoint'),
            // the following config lines define the activityTimeout and pongTimeout (pusher default values serve as fallback)
            activityTimeout: Statamic.$config.get('broadcasting.pusher.activityTimeout')
                ? Statamic.$config.get('broadcasting.pusher.activityTimeout')
                : 120000, // default activityTimeout: 120000
            pongTimeout: Statamic.$config.get('broadcasting.pusher.pongTimeout')
                ? Statamic.$config.get('broadcasting.pusher.pongTimeout')
                : 30000, // default pongTimeout: 30000
        };

        this.echo = new LaravelEcho(config);
        window.addEventListener('unload', () => this.echo.disconnect());

        this.bootedCallbacks.forEach(callback => callback(this));
        this.bootedCallbacks = [];

        window.addEventListener('beforeunload', () => this.echo.disconnect());
    }
}

[
    'channel',
    'connect',
    'disconnect',
    'join',
    'leave',
    'leaveChannel',
    'listen',
    'private',
    'socketId',
    'registerInterceptors',
    'registerVueRequestInterceptor',
    'registerAxiosRequestInterceptor',
    'registerjQueryAjaxSetup',
].forEach(method => {
    Echo.prototype[method] = function (...args) {
        return this.echo[method](...args);
    };
});

export default Echo;
