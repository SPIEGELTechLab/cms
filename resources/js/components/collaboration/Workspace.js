import * as Y from 'yjs';
import AwarenessManager from "./AwarenessManager";
import ProviderManager from "./ProviderManager";
import DirtyStateManager from './DirtyStateManager';
import SyncManager from './SyncManager';

/**
 * It's important to define what a Workspace is to understand how collaboration works.
 * One collaboration workspace does respond to one Yjs document. Simply said: Every
 * workspace get synced via it's dedicated Yjs document via a Yjs provider.
 * 
 * If a single entry will be opened, a new workspace will be created.
 * Everyone in this workspace will receive live document updates.
 * 
 * It's possible to open multiple workspaces at once, in case
 * you open another entry in a Statamic stack. Even if only
 * opened as a stack, this stack will get fully synced
 * if somebody else is editing it in the same time.
 */
export default class Workspace {
    constructor(container) {
        this.container = container;
        this.awarenessManager = {};
        this.providerManager = {};
        this.dirtyState = null;
        this.syncManager = {};
        this.document = null;
        this.started = false;
        this.Y = Y;
    }

    start() {
        if (this.started) return;
        this.started = true;

        this.document = new Y.Doc();

        this.providerManager = new ProviderManager(this);
        this.awarenessManager = new AwarenessManager(this.container, this.providerManager);

        this.providerManager.boot()
            .then(() => this.initializeDirtyStateManager())
            .then(() => this.awarenessManager.start())
            .then(() => this.providerManager.connect())
            .then(() => this.providerManager.sync())
            .then(() => this.initializeSyncManager())
            .catch((error) => {
                console.error(`An error occured starting the collaboration provider: ${error}`);
            })
    }

    destroy() {
        this.awarenessManager.destroy();
        // TODO: destroy sync manager
    }

    beforeDestroy() {
        window.removeEventListener('online');
        window.removeEventListener('offline');
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

    dirty() {
        if (!this.dirtyState) return;

        this.dirtyState.dirty();
    }

    clearDirtyState() {
        if (!this.dirtyState) return;

        this.dirtyState.clear();
    }
}
