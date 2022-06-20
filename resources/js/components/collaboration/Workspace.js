import * as Y from 'yjs';
import * as yProsemirror from 'y-prosemirror';
import StatusBar from './StatusBar.vue';
import { WebrtcProvider } from 'y-webrtc'
import { WebsocketProvider } from 'y-websocket'
import { IndexeddbPersistence } from 'y-indexeddb';
import Statamic from '../Statamic';


export default class Workspace {
    constructor(container) {
        this.awareness = null;
        this.container = container;
        this.started = false;
        this.document = null;
        this.providers = [];
        this.mainProvider = null;
        this.roomName = this.container.reference;
        this.dirtyState = null;
        this.users;
        this.Y = Y;
        this.yProsemirror = yProsemirror;
    }

    start() {
        console.log('start workspace');
        if (this.started) return;

        this.initializeSharedDocument();
        this.initializeDirtyState();
        this.initializeAwareness();
        this.initializeStatusBar();
        this.workspaceStarted();
    }

    destroy() {
        console.log('destroy workspace');
    }

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

        if (! this.providers || this.providers.length === 0) throw "Collaboration needs at least one provider to sync changes and to work properly."

        this.mainProvider = this.providers[0]
    }

    initializeDirtyState() {
        this.dirtyState = this.document.getArray('_dirtyState');
        this.clearDirtyState(); // initialize the dirty state.

        // Listen to any changes of the dirty state
        this.dirtyState.observe(event => {
            // Sync the observed dirty state back to the actual document.
            let SyncedDirtyState = this.dirtyState.get(0)

            // If the Yjs and local state are the same. Do nothing.
            if (SyncedDirtyState === Statamic.$dirty.has(this.container.name)) return;

            if (SyncedDirtyState === true) {

                Statamic.$dirty.add(this.container.name) // Add the dirty state locally.

            } else if (Statamic.$dirty.has(this.container.name)) {

                Statamic.$dirty.remove(this.container.name); // Only remove the dirty state if it has been set.

            }
        })
    }

    initializeAwareness() {
        this.awareness = this.mainProvider.awareness;

        this.awareness.setLocalStateField('user', this.loggedInUser());

        this.users = this.awarenessStatesToArray(this.awareness.states);

        this.awareness.on('update', () => {
            this.users = this.awarenessStatesToArray(this.awareness.states);
            Statamic.$events.$emit('users-updated', this.users);
        });
    }

    loggedInUser() {
        return {
            id: Statamic.user.id,
            name: Statamic.user.name,
            initials: Statamic.user.initials,
            avatar: Statamic.user.avatar?.permalink,
            color: this.generateRandomLightColorHex(),
        }
    }

    generateRandomLightColorHex() {
        let color = "#";
        for (let i = 0; i < 3; i++)
            color += ("0" + Math.floor(((1 + Math.random()) * Math.pow(16, 2)) / 2).toString(16)).slice(-2);
        return color;
    }

    awarenessStatesToArray(states) {
        return Array.from(states.entries()).map(([key, value]) => {
            return {
                clientId: key,
                user: {
                    ...value.user,
                    current: this.awareness.clientID === key,
                    online: navigator && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
                },
            }
        });
    }

    initializeBlueprint() {
        this.container.blueprint.sections.forEach(section => {
            section.fields.forEach(field => {
                // We wanna save all existing fieldsets into an array.
                this.fieldsets.push({
                    handle: field.handle,
                    type: field.type,
                });
                // We wanna add syncedStores object so fields can be synced.
                this.addSyncValue(field)
            })
        });
    }

    addSyncValue(field) {
        //
    }

    subscribeToVuexMutations() {
        //
    }

    observeStoreFields() {
        //
    }

    initialObserveStoreFields(fields) {
        //
    }

    setVuexFieldValue(handle, value) {
        //
    }

    getFieldsetType(handle) {
        return this.fieldsets.find(fieldset => fieldset.handle === handle).type;
    }

    initializeStatusBar() {
        Statamic.component('CollaborationStatusBar', StatusBar);

        this.container.pushComponent('CollaborationStatusBar', { });
    }

    initializeFocus() {
        // this.container.$on('focus', handle => {
        //     const user = window.awareness.getStates()?.get(window.awareness.clientID).user
        //     this.store.focus[handle] = user
        // });
        // this.container.$on('blur', handle => {
        //     if (this.store.focus[handle]) {
        //         delete this.store.focus[handle];
        //     }
        // });
    }

    initialObserveStoreFocus() {
        //
    }

    workspaceStarted() {
        this.started = true
    }

    dirty() {
        if (this.dirtyState.get(0) === true) return;

        this.document.transact(() => {
            // if (this.dirtyState.length > 0) {
            //     this.dirtyState.forEach((value, index) => {
            //         this.dirtyState.delete(index)
            //     })
            // }
            if (this.dirtyState.get(0)) {
                this.dirtyState.delete(0)
            }
            this.dirtyState.insert(0, [true]);
        })
    }

    clearDirtyState() {
        if (this.dirtyState.get(0) === false) return;

        this.document.transact(() => {
            if (this.dirtyState.get(0)) {
                this.dirtyState.delete(0)
            }
            this.dirtyState.insert(0, [false]);
        })
    }
}
