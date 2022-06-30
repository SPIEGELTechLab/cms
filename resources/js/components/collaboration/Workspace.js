import * as Y from 'yjs';
import * as yProsemirror from 'y-prosemirror';
import AwarenessManager from "./AwarenessManager";
import ProviderManager from "./ProviderManager";
import DirtyStateManager from './DirtyStateManager';
import SyncManager from './SyncManager';

// Todo: Add information what a Workspace is, why needed etc.
export default class Workspace {
    constructor(container) {
        this.yProsemirror = yProsemirror;
        this.container = container;
        this.awarenessManager = {};
        this.providerManager = {};
        this.dirtyState = null;
        this.syncManager = {};
        this.document = null;
        this.started = false;
        this.synced = false;
        this.Y = Y;
    }

    start() {
        if (this.started) return;
        this.started = true;

        this.document = new Y.Doc();

        this.providerManager = new ProviderManager();
        this.providerManager.start(this.container.reference, this.document);

        this.awarenessManager = new AwarenessManager();

        if (Statamic.$config.get('collaboration').provider.type === 'websocket') {
            this.initializeWebsocketProvider();
        } else {
            this.initializeWebrtcProvider();
        }
    }

    beforeDestroy() {
        window.removeEventListener('online');
        window.removeEventListener('offline');
    }

    initializeWebsocketProvider() {
        this.providerManager.provider.on('status', event => {
            if (event.status === 'connected' && !this.synced) {
                this.initializeDirtyStateManager();
                this.startAwareness();
            }
        });

        this.providerManager.provider.on('synced', event => {
            if (!event || this.synced) return;

            this.synced = true;
            this.initializeSyncManager();
        });
    }

    initializeWebrtcProvider() {
        if (!this.synced) {
            this.initializeDirtyStateManager();
            this.startAwareness();
        }

        let counter = 0;
        // y-webrtc does not throw a 'synced' event, so the part has to be implemented via an interval first
        // if syncing takes place before, the values are written twice into the fields
        const connectingInterval = setInterval(() => {
            // Cancel interval after 3 attempts
            if (counter > 3) {
                clearInterval(connectingInterval);
                return;
            }

            // Update counter if provider cannot connect
            if (!this.providerManager.provider.connected) {
                counter++;
                return;
            }

            // Provider is connected and values has been synchronized
            if (this.providerManager.provider.connected && this.synced) {
                clearInterval(connectingInterval);
                return;
            }

            this.synced = true;
            this.initializeSyncManager();

        }, 250);
    }

    initializeDirtyStateManager() {
        this.dirtyState = new DirtyStateManager(this);
        this.dirtyState.initialize();
    }

    initializeSyncManager() {
        this.syncManager = new SyncManager(this);
        this.syncManager.defineFieldsets();
        this.syncManager.syncWebsocket();
        this.syncManager.pushLocalChanges();
        this.syncManager.observeRemoteChanges();
    }

    startAwareness() {
        this.awarenessManager.start(
            this.container,
            this.providerManager.provider?.awareness
        );
    }

    dirty() {
        if (!this.dirtyState) return;

        this.dirtyState.dirty();
    }

    clearDirtyState() {
        if (!this.dirtyState) return;

        this.dirtyState.clear();
    }
}
