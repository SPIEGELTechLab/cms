import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { WebsocketProvider } from 'y-websocket'

export default class Workspace {
    constructor(container) {
        this.container = container;
        this.started = false;
        this.document = null;
        this.provider = null;
        this.users;
    }

    start() {
        ray('start workspace').red()
        if (this.started) return;

        this.initializeSharedDocument();
        this.started = true;
    }

    destroy() {
        ray('destroy workspace').red()
    }

    initializeSharedDocument() {
        // add yjs shared document
        this.document = new Y.Doc()
        this.roomName =  this.container.reference;

        if (!this.provider) { // Return if no provider have been provided
            // this.provider = new WebsocketProvider(
            //     'wss://demos.yjs.dev', this.roomName, this.document
            // );

            this.provider = new WebrtcProvider(this.roomName, this.document)

            // TODO: add offline support
            // const provider = new IndexeddbPersistence(this.container.reference, this.document);

            return;
        }

        // TODO: make provider setting customizable
        this.providers.forEach((providerCallback) => {
            providerCallback({ container: this.roomName, document: this.document });
        });

        this.initializeAwareness();
    }

    initializeAwareness() {
        this.provider.awareness.setLocalStateField('user', Statamic.user);

        this.users = this.awarenessStatesToArray(this.provider.awareness.states);
        this.provider.awareness.on('update', () => {
            this.users = this.awarenessStatesToArray(this.provider.awareness.states);
        });

        ray('awareness', this.users).red();

    }

    awarenessStatesToArray(states) {
        return Array.from(states.entries()).map(([key, value]) => {
            return {
                clientId: key,
                user: value.user,
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
        // const component = this.container.pushComponent('CollaborationStatusBar', {
        //     props: { awareness: window.awareness}
        // });
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
}
