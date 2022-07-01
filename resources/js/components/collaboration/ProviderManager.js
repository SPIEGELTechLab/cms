import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';

class ProviderManager {
    constructor(workspace) {
        this.providerType = Statamic.$config.get('collaboration.provider.type');
        this.url = Statamic.$config.get('collaboration.provider.url');
        this.connectedKeyword = Statamic.$config.get('collaboration.provider.connected_keyword');
        this.syncedKeyword = Statamic.$config.get('collaboration.provider.synced_keyword');
        this.roomName = workspace.container.reference;
        this.document = workspace.document;
        this.container = workspace.container;
        this.provider = null;
    }

    boot() {
        return new Promise((resolve, reject) => {
            try {
                switch (this.providerType) {
                    case 'peer_to_peer':
                        this.provider = new WebrtcProvider(
                            this.roomName, this.document, { signaling: [this.url] }
                        )
                        break;
                    case 'websocket':
                        this.provider = new WebsocketProvider(
                            this.url, this.roomName, this.document
                        );
                        break;
                    default:
                        console.error(`The Collaboration provider could not be booted, as the provider "${this.providerType}" is not supported.`)
                }

                // Store the Y document in the browser for offline support
                new IndexeddbPersistence(this.roomName, this.document);

            } catch (error) {
                reject();
            }

            resolve();
        })
    }

    connect() {
        return new Promise((resolve, reject) => {
            let maxTries = 15;

            const connectingInterval = setInterval(() => {
                if (this.provider[this.connectedKeyword]) {
                    this.container.$events.$emit('collaboration-provider-connected');
                    clearInterval(connectingInterval);
                    resolve();
                }

                if (maxTries <= 0) {
                    clearInterval(connectingInterval);
                    reject();
                }

                maxTries--;
            }, 333)
        }).catch((error) => {
            console.error('Connection Error: ', error)
        })
    }

    sync() {
        // ConnectedSynced will be null if the provider does not have a synced status.
        if (!this.provider[this.syncedKeyword]) {
            this.container.$events.$emit('collaboration-provider-synced');
            return Promise.resolve();
        }

        // Wait until the provider is synced.
        return new Promise((resolve, reject) => {
            let maxTries = 20;

            const syncingInterval = setInterval(() => {
                if (this.provider[this.syncedKeyword]) {
                    this.container.$events.$emit('collaboration-provider-synced');
                    clearInterval(syncingInterval);
                    resolve();
                }

                if (maxTries <= 0) {
                    clearInterval(syncingInterval);
                    reject();
                }

                maxTries--;
            }, 500)
        }).catch(() => {
            console.error('A connection could not be established to the collaboration provider');
        })
    }
}

export default ProviderManager;