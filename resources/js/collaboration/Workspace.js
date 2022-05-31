import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

export default class Workspace {

    constructor(container) {
        this.container = container;
        this.started = false;
        this.user = Statamic.user;
        this.fieldsets = [];
        this.document = null;
        // window.awareness = null;
        this.providers = [];
        this.storeSubscriber = null;
    }

    start(providers) {
        if (this.started) return;

        this.providers = providers

        this.initializeSyncedStore();
        return;

        // this.initializeAwareness();
        // this.initializeBlueprint();
        // this.subscribeToVuexMutations();
        // // this.initializeStatusBar();
        // this.observeStoreFields();
        // this.initializeFocus();
        // this.initialObserveStoreFocus();
        // this.started = true;
    }


    destroy() {
        this.storeSubscriber.apply();
    }

    initializeSyncedStore() {
        this.document = new Y.Doc()

        if (this.provider) return;

        if (this.providers.length === 0) { // Return if no provider have been provided
            this.provider = new WebsocketProvider(
                'wss://demos.yjs.dev', this.container.reference, this.document
            );

            // TODO: add offline support
            // const provider = new IndexeddbPersistence(this.container.reference, this.document);

            return;
        }

        this.providers.forEach((providerCallback) => {
            providerCallback({container: this.container.reference, document: this.document});
        })
    }

    initializeAwareness() {
      //
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