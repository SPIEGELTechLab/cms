import Array  from "./syncing-types/Array.js"
import Object  from "./syncing-types/Object.js"
import Replicator from "./syncing-types/Replicator.js";
import Text  from "./syncing-types/Text.js"
import Value from "./syncing-types/Value.js";

export default class SyncManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.fieldtypes = [];
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
                });
            })
        });
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
        switch (syncingType) {
            case 'array':
                Array.fetchInitialFromYjs(workspace, handle);
                break;
            case 'object':
                Object.fetchInitialFromYjs(workspace, handle);
                break;
            case 'text':
                Text.fetchInitialFromYjs(workspace, handle);
                break;
            case 'single-value':
                Value.fetchInitialFromYjs(workspace, handle);
                break;
        }
    }

   /**
    * Yjs Provider <- Local
    */
    // pushInitialToYjs(workspace, handle, value, syncingType) TODO: Should we add value as well, so it's alligned with `pushLocalChangesToYjs`
    pushInitialToYjs(workspace, handle, syncingType) {
        switch (syncingType) {
            case 'array':
                Array.pushInitialToYjs(workspace, handle);
                break;
            case 'object':
                Object.pushInitialToYjs(workspace, handle);
                break;
            case 'text':
                Text.pushInitialToYjs(workspace, handle);
                break;
            case 'single-value':
                Value.pushInitialToYjs(workspace, handle);
                break;
        }
    }

    pushLocalChangesToYjs(workspace, handle, value, position) {
        switch (this.getSyncingType(handle)) {
            case 'array':
                Array.pushLocalChange(
                    workspace,
                    handle,
                    workspace.document.getArray(handle),
                    value,
                    position,
                )
                break;
            case 'object':
                Object.pushLocalChange(
                    workspace,
                    handle,
                    workspace.document.getArray(handle),
                    value,
                    position,
                )
                break;
            case 'replicator':
                Replicator.pushLocalChange(
                    workspace,
                    handle,
                    workspace.document.getArray(handle),
                    value,
                    position,
                )
                break;
            case 'text':
                Text.pushLocalChange(
                    workspace,
                    handle,
                    workspace.document.getText(handle),
                    value,
                    position,
                )
                break;
            case 'single-value':
                Value.pushLocalChange(
                    workspace,
                    handle,
                    workspace.document.getMap(handle),
                    value
                )
        }
    }

    observeRemoteYjsChanges(workspace, handle, syncingType) {
        switch (syncingType) {
            case 'array':
                Array.observeRemoteChanges(workspace, handle);
                break;
            case 'object':
                Object.observeRemoteChanges(workspace, handle);
                break;
            case 'replicator':
                Replicator.observeRemoteChanges(workspace, handle);
                break;
            case 'text':
                Text.observeRemoteChanges(workspace, handle);
                break;
            case 'single-value':
                Value.observeRemoteChanges(workspace, handle);
                break;
        }
    }

    /**
    * Get the syncing type from the field handle.
    */
     getSyncingType(handle) {
        return this.fieldtypes.find(fieldset => fieldset.handle === handle).syncingType;
    }

}
