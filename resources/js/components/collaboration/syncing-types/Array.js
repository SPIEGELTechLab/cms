const diff = require("fast-array-diff");

class Array {

    /**
     * This is one of two methods to sync the workspace / document.
     * This method does write the actual Yjs value into the Vuex store.
     * 
     * Yjs Provider -> Local
     */
    static fetchInitialFromYjs(workspace, field) {                    
        // Workaround for: sync manager destroy()
        if (!Statamic.$collaboration.workspaces[workspace.container.name]) return;

        Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
            handle: field.handle,
            user: Statamic.user.id,
            value: workspace.document.getArray(field.handle).toArray() ?? []
        });
    }

    /**
     * This is one of two methods to sync the workspace / document.
     * This method does reset the Yjs provider and will send the server
     * state to the Yjs afterwards so the Yjs server does get a fresh document.
     * 
     * Yjs Provider <- Local
     */
    static pushInitialToYjs(workspace, field) {
        workspace.document.transact(() => {
            // Delete websocket data in case some data does exist.
            if (workspace.document.getArray(field.handle).length > 0) {
                workspace.document.getArray(field.handle).delete(0, workspace.document.getArray(field.handle).length)
            }

            // Push the initial value to the Yjs provider.
            if (workspace.container.values[field.handle]) {
                workspace.document.getArray(field.handle).insert(0, workspace.container.values[field.handle]);
            }
        })
    }

    /**
     * Push local text changes to the Yjs provider, so those can be synced to all collaborators.
     * With Yjs we won't send the complete text, only the diff and belonging start position.
     */
    static pushLocalChange(workspace, handle, YArray, newValue, initPosition) {     
        const oldValue = workspace.document.getArray(handle) ? workspace.document.getArray(handle).toArray() : YArray.toArray();
        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
        
        /**
         * Get the array diff between the old and new value.
         * The output may look something like this:
         * [
         *   { type: "remove", oldPos: 0, newPos: 0, items: [1] },
         *   { type: "add", oldPos: 3, newPos: 2, items: [4] },
         * ];
         */
        let changes = diff.getPatch(oldValue, newValue);
        /**
         * Loop through the change and make those as a transaction.
         * The transaction does resolve the problem, that changes
         * for remote listeners might flash on their end.
         */
        workspace.document.transact(() => {
            changes.forEach(change => {
                if (change.type === 'add') {
                    YArray.insert(change.newPos, change.items)
                } else if (change.type === 'remove') {
                    YArray.delete(change.newPos, change.items.length)
                }
            })
        })
    }

     /**
     * Observe remote text changes from Yjs the Yjs provider, so those can be merged with the local state.
     * Yjs will only send the text diff with the belonging position. Such changes are called delta in Yjs.
     */
    static observeRemoteChanges(workspace, field) {
        workspace.document.getArray(field.handle).observe(event => {
            if (event.transaction.local || !Statamic.$collaboration.workspaces[workspace.container.name]) return;

            if (Statamic.user.cursor) {
                Statamic.user.cursor = null;
            }
            
            Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
                handle: field.handle,
                user: Statamic.user.id,
                value: workspace.document.getArray(field.handle).toArray()
            });
        })
    }
}

export default Array;
