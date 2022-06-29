import * as Y from 'yjs';
import * as yProsemirror from 'y-prosemirror';
import { WebrtcProvider } from 'y-webrtc'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb';
import Statamic from '../Statamic';
import AwarenessManager from "./AwarenessManager";
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
        this.providers = [];
        this.fieldsets = [];
        this.mainProvider = null;
        this.roomName = this.container.reference;
        this.dirtyState = null;
        this.users;
        this.Y = Y;
        this.yProsemirror = yProsemirror;
        this.awarenessManager = {};
        this.syncManager = {};
    }

    start() {
        if (this.started) return;
        this.started = true;

        this.initializeSharedDocument();
        this.awarenessManager = new AwarenessManager(this.mainProvider?.awareness);

        this.mainProvider.on('status', event => {
            if (event.status === 'connected' && !this.synced) {
                this.awarenessManager.start(this.container);

                this.syncManager = new SyncManager(this);
                this.syncManager.initialize();

                this.dirtyState = new DirtyStateManager(this);
                this.dirtyState.initialize();
            }
        });

        this.mainProvider.on('synced', event => {
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

    // TODO: Move into ProviderManager
    initializeSharedDocument() {
        this.document = new Y.Doc()

        if (this.providers.length === 0) { // Return if no provider have been provided

            this.providers.push(new WebsocketProvider(
                Statamic.$config.get('collaboration.websocket.url'), this.roomName, this.document
            ));

            this.providers.push(new WebrtcProvider(this.roomName, this.document));
        } else {
            // TODO: make provider setting customizable
            this.providers.forEach((providerCallback) => {
                providerCallback({ container: this.roomName, document: this.document });
            });
        }

        // offline support
        this.providers.push(new IndexeddbPersistence(this.roomName, this.document));

        if (!this.providers || this.providers.length === 0) throw "Collaboration needs at least one provider to sync changes and to work properly."

        this.mainProvider = this.providers[0]
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
