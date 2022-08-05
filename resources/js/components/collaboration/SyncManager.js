import ArraySyncType from "./syncing-types/Array.js"
import ObjectSyncType  from "./syncing-types/Object.js"
import ReplicatorSyncType from "./syncing-types/Replicator.js";
import TextSyncType  from "./syncing-types/Text.js"
import ValueSyncType from "./syncing-types/Value.js";

export default class SyncManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.fieldtypes = [];

       /**
        * Defines the available shared types
        * name: identical to the defined 'collaborationType'
        * sharedType: Matching the yjs shared types https://github.com/yjs/yjs/blob/master/README.md#shared-types
        * class: defines the involved class
        */
        this.syncTypes = [
            { name: 'array', sharedType: 'Y.Array', class: ArraySyncType },
            { name: 'object', sharedType: 'Y.Array', class: ObjectSyncType },
            { name: 'replicator', sharedType: 'Y.Array', class: ReplicatorSyncType },
            { name: 'value', sharedType: 'Y.Map', class: ValueSyncType },
            { name: 'text', sharedType: 'Y.Text', class: TextSyncType }
        ];

       /**
        * Extend sync types
        */
        Statamic.$collaboration.syncTypeCallbacks.forEach((callback) => {
            this.syncTypes = this.syncTypes.concat(
                Array.isArray(callback()) ? callback() : [callback()]
            );
        });

       /**
        * Replace existing sync types
        */
        Statamic.$collaboration.syncTypeReplacementCallbacks.forEach(({ callback, name }) => {
            let index = this.syncTypes.findIndex(type => type.name === name);
            if (index === -1) return;

            let newSyncType = callback();
            this.syncTypes[index] = newSyncType; 
        });
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
            this.getYjsSharedType(syncingImport.sharedType, workspace, handle),
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
        return this.syncTypes.find((syncType) => syncType.name === syncingType);
    }

    getYjsSharedType(sharedType, workspace, handle) {
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
