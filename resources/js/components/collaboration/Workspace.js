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

        this.providerManager.provider.on('status', event => {
            if (event.status === 'connected' && !this.synced) {
                this.dirtyState = new DirtyStateManager(this);
                this.dirtyState.initialize();

                this.awarenessManager.start(
                    this.container,
                    this.providerManager.provider?.awareness
                );
            }
        });

        this.providerManager.provider.on('synced', event => {
            if (!event || this.synced) return;
            this.synced = true;

            this.syncManager = new SyncManager(this);
            this.syncManager.defineFieldsets();
            this.syncManager.syncWebsocket();
            this.syncManager.pushLocalChanges();
            this.syncManager.observeRemoteChanges();
        });
    }

    beforeDestroy() {
        window.removeEventListener('online');
        window.removeEventListener('offline');
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
