import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';

class ProviderManager {
    constructor() {
        this.provider = null;
        // hold an array with all providers
        this.providers = [];
    }

    start(roomName, document) {
        // Add websocket provider
        this.providers.push(new WebsocketProvider(
            Statamic.$config.get('collaboration.websocket.url'), roomName, document
        ));

        // Add webrtc provider
        this.providers.push(new WebrtcProvider(roomName, document));

        // Add offline support
        this.providers.push(new IndexeddbPersistence(roomName, document));

        if (!this.providers || (Array.isArray(this.providers) && !this.providers.length)) {
            console.error('Collaboration needs at least one provider to sync changes and to work properly.');
            return;
        }

        // First provider is used for awareness informations and the yjs document
        this.provider = this.providers[0];
    }

}

export default ProviderManager;