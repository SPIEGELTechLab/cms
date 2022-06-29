import * as Y from 'yjs';
import * as yProsemirror from 'y-prosemirror';
import AwarenessManager from "./AwarenessManager";
import ProviderManager from "./ProviderManager";
import DirtyStateManager from './DirtyStateManager';
import SyncManager from './SyncManager';

// Todo: Add information what a Workspace is, why needed etc.
export default class Workspace {
    constructor(container) {
        this.container = container;
        this.dirtyState = null;
        this.started = false;
        this.synced = false;
        this.document = null;
        this.fieldsets = [];
        this.Y = Y;
        this.yProsemirror = yProsemirror;
        this.awarenessManager = {};
        this.syncManager = {};
        this.providerManager = {};
    }

    start() {
        if (this.started) return;
        this.started = true;

        this.document = new Y.Doc();
        this.initializeProviderSetup();
        this.awarenessManager = new AwarenessManager();

        this.providerManager.provider.on('status', event => {
            if (event.status === 'connected' && !this.synced) {
                this.awarenessManager.start(this.container, this.providerManager.provider?.awareness);

                this.syncManager = new SyncManager(this);
                this.syncManager.initialize();

                this.dirtyState = new DirtyStateManager(this);
                this.dirtyState.initialize();
            }
        });

        this.providerManager.provider.on('synced', event => {
            if (!event || this.synced) return;
            this.synced = true;

            this.initializeWebsocket();
            this.syncManager.pushLocalChanges();
            this.syncManager.observeRemoteChanges();
        });
    }

    beforeDestroy() {
        window.removeEventListener('online');
        window.removeEventListener('offline');
    }

    initializeProviderSetup() {
        this.providerManager = new ProviderManager();
        this.providerManager.start(this.container.reference, this.document);
    }

    // TODO: Move into ProviderManager
    initializeWebsocket() {
        this.fieldsets.forEach(field => {

            switch (field.collaborationType) {
                case 'text':
                    if (this.awarenessManager.users.length > 1) {
                        // If there are more than two users in the document, fetch the YJS data and publish it to the form.    
                        Statamic.$store.dispatch(`publish/${this.container.name}/setCollaborationFieldValue`, {
                            handle: field.handle,
                            user: Statamic.user.id,
                            value: this.document.getText(field.handle).toString() ?? ''
                        });
                    } else {
                        // In case only one user has been logged in, we want to reset the websocket.                        
                        this.document.transact(() => {
                            // Delete websocket data in case some data does exist.
                            if (this.document.getText(field.handle).length > 0) {
                                this.document.getText(field.handle).delete(0, this.document.getText(field.handle).length)
                            }
                            // Initialize the websocket
                            this.document.getText(field.handle).insert(0, this.container.values[field.handle]);
                        })
                    }
                    break;
                default:
                    console.debug('The field', field.handle, 'will not be synced via YJS.')
            }
        })
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
