import Array  from "./syncing-types/Array.js"
import Object  from "./syncing-types/Object.js"
import Replicator from "./syncing-types/Replicator.js";
import Text  from "./syncing-types/Text.js"
import Value from "./syncing-types/Value.js";

export default class SyncManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.fieldtypes = [];

        this.syncTypes = [
            { type: 'array',  class: Array, sharedType: 'Y.Array' },
            { type: 'object', class: Object, sharedType: 'Y.Array' },
            { type: 'replicator', class: Replicator, sharedType: 'Y.Array' },
            { type: 'single-value', class: Value, sharedType: 'Y.Map' },
            { type: 'text', class: Text, sharedType: 'Y.Text' }
        ]
    }
 
   /**
    * Get the Blueprint and fetch those fields, so we know how to sync them.
    */
    defineFieldsets() {
        this.workspace.container.blueprint.sections.forEach(section => {
            section.fields.forEach(field => {
                this.fieldtypes.push({
                    handle: field.handle,
                    syncingType: field.collaboration,
                    type: field.type,
                    sets: this.getSets(field),
                });
            })
        });
    }

    getSets(field) {
        if (field.sets === undefined) {
            return null;
        }

        let sets = [];

        field.sets.forEach((set, index) => {
            set.fields.forEach(childField => {
                sets.push({
                    handle: `${field.handle}.${index}.${childField.handle}`,
                    syncingType: childField.collaboration,
                    type: childField.type,  
                })
            })
        })

        return sets;
    }

   /**
    * Depending if one ore more users are present, different actions 
    * on how to sync to or from the Yjs provider are taken.
    */
    syncWebsocket() {
        this.fieldtypes.forEach(field => {

            if (this.workspace.awarenessManager.getUsers().length > 1) {

                /**
                 * In case more than two users are present, 
                 * fetch the Yjs data and sync it locally. 
                 * 
                 * Yjs Provider -> Local
                 */
                this.fetchInitialFromYjs(this.workspace, field.handle, field.syncingType);

            } else {

                /**
                 * If only one user is present, we want to reset the websocket.
                 * Fetch the local data and push it to the Yjs provider. 
                 * 
                 * Yjs Provider <- Local
                 */
                this.pushInitialToYjs(this.workspace, field.handle, field.syncingType);

            }
        })
    }

   /**
    * By listening to the `setFieldValue` event from the Vuex store, we can listen to all changes.
    * Those made changes will be pushed to the Yjs provider so all collaborators get synced.
    */
    pushLocalChanges() {
        Statamic.$store.subscribe((mutation, state) => {
            // Only listen to setFieldValue events.
            if (mutation.type !== `publish/${this.workspace.container.name}/setFieldValue`) return;

            this.pushLocalChangesToYjs(
                this.workspace,
                mutation.payload.handle,
                mutation.payload.value,
                mutation.payload.position
            );
        });
    }

   /**
    * To receive all made changes from the Yjs provider, we need to observe those changes.
    * Those changes will be synced back to the local Vuex store with the named
    * `setCollaborationFieldValue` event which you could listen to as well,
    * in case you wanna do some crazy manipulative stuff. Just saying.
    */
    observeRemoteChanges() {
        this.fieldtypes.forEach(field => {
            this.observeRemoteYjsChanges(this.workspace, field.handle, field.syncingType)
        })

    }

   /**
    * Yjs Provider -> Local
    */
    fetchInitialFromYjs(workspace, handle, syncingType) {
        const syncingImport = this.getSyncingImport(syncingType);
        if (!syncingImport) return;

        syncingImport.class.fetchInitialFromYjs(workspace, handle);
    }

   /**
    * Yjs Provider <- Local
    */
    // pushInitialToYjs(workspace, handle, value, syncingType) TODO: Should we add value as well, so it's alligned with `pushLocalChangesToYjs`
    pushInitialToYjs(workspace, handle, syncingType) {
        const syncingImport = this.getSyncingImport(syncingType);
        if (!syncingImport) return;

        syncingImport.class.pushInitialToYjs(workspace, handle);
    }

    pushLocalChangesToYjs(workspace, handle, value, position) {
        const syncingType = this.getSyncingType(handle);
        const syncingImport = this.getSyncingImport(syncingType);
        if (!syncingImport) return;

        syncingImport.class.pushLocalChange(
            workspace,
            handle,
            this.getYjsSyncValue(workspace, syncingImport.sharedType, handle),
            value,
            position
        );
    }

    observeRemoteYjsChanges(workspace, handle, syncingType) {
        const syncingImport = this.getSyncingImport(syncingType);
        if (!syncingImport) return;

        syncingImport.class.observeRemoteChanges(workspace, handle);
    }

    /**
    * Get the syncing type from the field handle.
    */
    getSyncingType(handle) {
        let field = this.fieldtypes.find(fieldset => fieldset.handle === handle)
         
        if (!field) {
            console.error(`Collaboration: Syncing Type for field handle '${handle}' not found.`)
             
            return null; // Should we simply use `single-value` as default?
        }

        return field.syncingType;
    }

    getSyncingImport(syncingType) {
        return this.syncTypes.find((syncType) => syncType.type === syncingType);
    }

    getYjsSyncValue(workspace, sharedType, handle) {
        switch (sharedType) {
            case 'Y.Array':
                return workspace.document.getArray(handle);
            case 'Y.Map':
                return workspace.document.getMap(handle);
            case 'Y.Text':
                return workspace.document.getText(handle);
            case 'Y.XmlFragment':
                return workspace.document.getXmlFragment(handle);
        }
    }

}
