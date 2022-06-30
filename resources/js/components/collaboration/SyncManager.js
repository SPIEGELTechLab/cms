import Text  from "./syncing-types/Text.js"

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

            if (this.workspace.awarenessManager.users.length > 1) {
                /**
                 * In case more than two users are present, 
                 * fetch the Yjs data and sync it locally. 
                 * 
                 * Yjs Provider -> Local
                 */
                switch (field.syncingType) {
                    case 'text':
                        Text.fetchInitialFromYjs(this.workspace, field);
                        break;
                }
            } else {
                /**
                 * If only one user is present, we want to reset the websocket.
                 * Fetch the local data and push it to the Yjs provider. 
                 * 
                 * Yjs Provider <- Local
                 */
                switch (field.syncingType) {
                    case 'text':
                        Text.pushInitialToYjs(this.workspace, field);
                        break;
                }
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

            switch (this.getSyncingType(mutation.payload.handle)) {
                case 'text':
                    Text.pushLocalChange(
                        mutation.payload.handle,
                        this.workspace.document.getText(mutation.payload.handle),
                        mutation.payload.value,
                        mutation.payload.position,
                    )
                    break;
            }
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

            switch (field.syncingType) {
                case 'text':
                    Text.observeRemoteChanges(this.workspace, field);
                    break;
            }
        })

    }

    /**
    * Get the syncing type from the field handle.
    */
    getSyncingType(handle) {
        return this.fieldtypes.find(fieldset => fieldset.handle === handle).syncingType;
    }
}