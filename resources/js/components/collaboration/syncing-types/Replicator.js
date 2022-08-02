const diff = require("fast-array-diff");

class Replicator {

    /**
     * This is one of two methods to sync the workspace / document.
     * This method does write the actual Yjs value into the Vuex store.
     * 
     * Yjs Provider -> Local
     */
    static fetchInitialFromYjs(workspace, handle) {                    
        // // Workaround for: sync manager destroy()
        // if (!Statamic.$collaboration.workspaces[workspace.container.name]) return;

        // Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
        //     handle: field.handle,
        //     user: Statamic.user.id,
        //     value: workspace.document.getArray(field.handle).toArray() ?? []
        // });
    }

    /**
     * This is one of two methods to sync the workspace / document.
     * This method does reset the Yjs provider and will send the server
     * state to the Yjs afterwards so the Yjs server does get a fresh document.
     * 
     * Yjs Provider <- Local
     */
    static pushInitialToYjs(workspace, handle) {
        // workspace.document.transact(() => {
        //     // Delete websocket data in case some data does exist.
        //     if (workspace.document.getArray(field.handle).length > 0) {
        //         workspace.document.getArray(field.handle).delete(0, workspace.document.getArray(field.handle).length)
        //     }

        //     // Push the initial value to the Yjs provider.
        //     if (workspace.container.values[field.handle]) {
        //         workspace.document.getArray(field.handle).insert(0, workspace.container.values[field.handle]);
        //     }
        // })
    }

    /**
     * Push local text changes to the Yjs provider, so those can be synced to all collaborators.
     * With Yjs we won't send the complete text, only the diff and belonging start position.
     */
    static pushLocalChange(workspace, handle, YArray, newValue, initPosition) {
       //
    }

     /**
     * Observe remote text changes from Yjs the Yjs provider, so those can be merged with the local state.
     * Yjs will only send the text diff with the belonging position. Such changes are called delta in Yjs.
     */
    static observeRemoteChanges(workspace, handle) {
        // workspace.document.getArray(field.handle).observe(event => {
        //     if (event.transaction.local || !Statamic.$collaboration.workspaces[workspace.container.name]) return;

        //     if (Statamic.user.cursor) {
        //         Statamic.user.cursor = null;
        //     }
            
        //     Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
        //         handle: field.handle,
        //         user: Statamic.user.id,
        //         value: workspace.document.getArray(field.handle).toArray()
        //     });
        // })
    }

    compareSets(a, b) {
        return true
    }
}

export default Replicator;
