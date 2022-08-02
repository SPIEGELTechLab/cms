const diff = require("fast-array-diff");

class Object {

    /**
     * This is one of two methods to sync the workspace / document.
     * This method does write the actual Yjs value into the Vuex store.
     * 
     * Yjs Provider -> Local
     */
    static fetchInitialFromYjs(workspace, handle) {                    
        // Workaround for: sync manager destroy()
        if (!Statamic.$collaboration.workspaces[workspace.container.name]) return;

        Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
            handle: handle,
            user: Statamic.user.id,
            value: this.arrayToObject(workspace.document.getArray(handle).toArray()),
        });
    }

    /**
     * This is one of two methods to sync the workspace / document.
     * This method does reset the Yjs provider and will send the server
     * state to the Yjs afterwards so the Yjs server does get a fresh document.
     * 
     * Yjs Provider <- Local
     */
    static pushInitialToYjs(workspace, handle) {
        workspace.document.transact(() => {
            if (workspace.container.values[handle]) {
                workspace.document.getArray(handle).delete(0, workspace.document.getArray(handle).length);
                workspace.document.getArray(handle).insert(0, this.objectToArray(workspace.container.values[handle]));
            }
        })
    }

    /**
     * Push local text changes to the Yjs provider, so those can be synced to all collaborators.
     * With Yjs we won't send the complete text, only the diff and belonging start position.
     */
    static pushLocalChange(workspace, handle, YArray, newValue) {
        const oldValue = YArray.toArray();

        /**
         * Format object into Array
         */
        newValue = window.Object.entries(newValue);
        
        
        /**
         * Get the array diff between the old and new value.
         * The output may look something like this:
         * [
         *   { type: "remove", oldPos: 0, newPos: 0, items: [1] },
         *   { type: "add", oldPos: 3, newPos: 2, items: [4] },
         * ];
         */
        let changes = diff.getPatch(oldValue, newValue)

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
    static observeRemoteChanges(workspace, handle) {
        workspace.document.getArray(handle).observe(event => {

            let toUpdate = [];

            event.delta.forEach((delta) => {

               /**
                * It may happen, that multiple deltas will be received at once.
                * To avoid workload, we'll make a single update after fetching alle changes.
                */
                if (!toUpdate.includes(handle)) {
                    toUpdate.push(handle)
                }
            })

            if (Statamic.user.cursor) {
                Statamic.user.cursor = null;
            }

            /**
             * If it's a local change, we don't need to fire the collaboration field value command.
             * A local change will be written into the Vuex via the `setFieldValue` event already.
             */
            if (!event.transaction.local) {                    
                // Workaround for: sync manager destroy()
                if (!Statamic.$collaboration.workspaces[workspace.container.name]) return;
        
                toUpdate.forEach(toUpdateHandle => {
                    Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
                        handle: toUpdateHandle,
                        user: Statamic.user.id,
                        value: this.arrayToObject(workspace.document.getArray(toUpdateHandle).toArray())
                    });
                })

            }

            /**
             * Reset Fields after the update.
             */
            toUpdate = []

        })
    }

    static objectToArray(object) {
        return window.Object.entries(object)
    }

    static arrayToObject(values) {
        let valuesAsObject = {};

        values.forEach((item) => {
            let index = item[0];
            let value = item[1];
            
            if (index === 'null') return;

            valuesAsObject[index] = value;
        })

        return valuesAsObject;
    }
}

export default Object;
