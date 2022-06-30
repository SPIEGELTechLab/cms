import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';

class ProviderManager {
    constructor() {
        this.provider = null;
    }

    start(roomName, document) {
        if (Statamic.$config.get('collaboration.provider.type') === 'websocket') {
            // Add websocket provider
            this.provider = new WebsocketProvider(
                Statamic.$config.get('collaboration.provider.url'), roomName, document
            );
        } else {
            // Add default webrtc (peer-to-peer) provider
            this.provider = new WebrtcProvider(roomName, document, { signaling: [Statamic.$config.get('collaboration.provider.url')] });
        }

        // Store the Y document in the browser (offline support)
        new IndexeddbPersistence(roomName, document);
    }

}

export default ProviderManager;