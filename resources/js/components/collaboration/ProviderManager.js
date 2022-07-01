import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';

/**
 * The provider manager is responsible to boot the correct Yjs providers, 
 * check if they are connected and synced before proceeding.
 */
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

    /**
     * As our first step, depending on the selected provider type, the provider gets booted.
     * To enable offline support, the `IndexdbPersistence` provider will be booted as well.
     */
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

                new IndexeddbPersistence(this.roomName, this.document);

            } catch (error) {
                reject();
            }

            resolve();
        })
    }

    /**
     * The Workspace will first boot the providers. Before continuing, we need to make sure that the 
     * Yjs Provider is connected. In case the connection is not established, we wait and try again.
     * 
     * Providers do use a different wording to check if they are connected. To keep it general, 
     * the `connectedKeyword` will be read from the config to check against that keyword.
     */
    connect() {
        return new Promise((resolve, reject) => {
            let maxTries = 15;
            const interval = 333;

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
            }, interval)
        }).catch((error) => {
            console.error('Connection Error: ', error)
        })
    }

    /**
     * We need to make sure that the Providers did sync, which is especially important for the Websocket
     * provider. In case the provider has not synced, we wait and try again after a few milliseconds.
     * This is important, as we first can pull the latest values from the websocket after the sync.
     * 
     * Providers do use a different wording to check if they are synchronized. To keep it general, 
     * the `syncedKeyword` will be read from the config to check against that keyword. If a
     * provider does not offer to check against synchronization like the WebRTC provider,
     * this step will be skipped. In that case, the `syncedKeyword` will return `null`.
     */
    sync() {
        if (!this.provider[this.syncedKeyword]) {
            this.container.$events.$emit('collaboration-provider-synced');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            let maxTries = 20;
            const interval = 500;

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
            }, interval)
        }).catch(() => {
            console.error('A connection could not be established to the collaboration provider');
        })
    }
}

export default ProviderManager;