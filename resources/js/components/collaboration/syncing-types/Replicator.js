const diff = require("fast-array-diff");

class Replicator {

    /**
     * This is one of two methods to sync the workspace / document.
     * This method does write the actual Yjs value into the Vuex store.
     * 
     * Yjs Provider -> Local
     */
    static fetchInitialFromYjs(workspace, handle) {
        let sets = workspace.syncManager.fieldtypes.find(field => handle === field.handle).sets

        workspace.document.transact(() => {
            sets.forEach(set => {
                workspace.syncManager.fieldtypes.push(set) // Push to fieldtypes so the syncing type can be found. TODO: Add a better solution
                workspace.syncManager.fetchInitialFromYjs(workspace, set.handle, set.syncingType)
                workspace.syncManager.observeRemoteYjsChanges(workspace, set.handle, set.syncingType)
            });
        })

        // Workaround for: sync manager destroy()
        if (!Statamic.$collaboration.workspaces[workspace.container.name]) return;

        Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
            handle: handle,
            user: Statamic.user.id,
            value: workspace.document.getArray(handle).toArray() ?? []
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
        let sets = workspace.syncManager.fieldtypes.find(field => handle === field.handle).sets

        // Delete websocket data in case some data does exist.
        if (workspace.document.getArray(handle).length > 0) {
            workspace.document.getArray(handle).delete(0, workspace.document.getArray(handle).length)
        }

        // Push the initial value to the Yjs provider.
        if (workspace.container.values[handle]) {
            workspace.document.getArray(handle).insert(0, workspace.container.values[handle]);
        }
        
        // Sync children fields of Replicator.
        workspace.document.transact(() => {
            sets.forEach(set => {
                workspace.syncManager.fieldtypes.push(set) // Push to fieldtypes so the syncing type can be found. Is there a better solution?
                workspace.syncManager.pushInitialToYjs(workspace, set.handle, set.syncingType)
                workspace.syncManager.observeRemoteYjsChanges(workspace, set.handle, set.syncingType)
            });
        })
    }

    /**
     * Push local text changes to the Yjs provider, so those can be synced to all collaborators.
     * We will only send important replicator set changes. The fields themself will be synced by themself.
     */
    static pushLocalChange(workspace, handle, YArray, newValue, initPosition) {
        let actualValue = YArray.toArray() ?? []

        let setValues = newValue.map(value => {
            return {
                enabled: value.enabled,
                type: value.type,
                _id: value._id,
            }
        });

        function compareSets(one, two) { // TODO: Refactor
            return _.isEqual(one, two);
        }

        /**
         * Get the array diff between the old and new value.
         * The output may look something like this:
         * [
         *   { type: "remove", oldPos: 0, newPos: 0, items: [1] },
         *   { type: "add", oldPos: 3, newPos: 2, items: [4] },
         * ];
         */
        let changes = diff.getPatch(actualValue, setValues, compareSets);
        
        if (changes.length === 0) return; // Replicator has no changes. Do nothing.

        return this.pushReplicatorChanges(workspace, YArray, changes)   
    }

     /**
     * Observe remote text changes from Yjs the Yjs provider, so those can be merged with the local state.
     * Yjs will only send the text diff with the belonging position. Such changes are called delta in Yjs.
     */
    static observeRemoteChanges(workspace, handle) {
        workspace.document.getArray(handle).observe(event => {
            if (event.transaction.local || !Statamic.$collaboration.workspaces[workspace.container.name]) return;

            // TODO: On remote change, we need to add new fields so they will be synced via yjs.
            
            Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
                handle: handle,
                user: Statamic.user.id,
                value: workspace.document.getArray(handle).toArray(),
            });
        })
    }

   /**
    * The transaction does resolve the problem, that changes
    * Loop through the change and make those as a transaction.
    * for remote listeners might flash on their end.
    */
    static pushReplicatorChanges(workspace, YArray, changes) {
        workspace.document.transact(() => {
            console.log('pushReplicatorChanges', changes, YArray.toArray())
            changes.forEach(change => {
                if (change.type === 'add') {
                    YArray.insert(change.newPos, change.items)
                } else if (change.type === 'remove') {
                    YArray.delete(change.newPos, change.items.length)
                }
            })
        })
    }
}

export default Replicator;
