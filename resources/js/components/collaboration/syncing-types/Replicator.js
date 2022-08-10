const diff = require("fast-array-diff");

class Replicator {

    /**
     * This is one of two methods to sync the workspace / document.
     * This method does write the actual Yjs value into the Vuex store.
     * 
     * Yjs Provider -> Local
     */
    static fetchInitialFromYjs(workspace, handle) {
        this.registerChildFields(workspace, handle, 'fetchInitialFromYjs');

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
        // Delete websocket data in case some data does exist.
        if (workspace.document.getArray(handle).length > 0) {
            workspace.document.getArray(handle).delete(0, workspace.document.getArray(handle).length)
        }

        // Push the initial value to the Yjs provider.
        if (workspace.container.values[handle]) {
            workspace.document.getArray(handle).insert(0, workspace.container.values[handle]);
        }
        
        this.registerChildFields(workspace, handle, 'pushInitialToYjs');
    }

    static registerChildFields(workspace, handle, type) {
        let createdSets = workspace.container.values[handle]
        let defaultSets = workspace.syncManager.fieldtypes.find(field => handle === field.handle).sets

        workspace.document.transact(() => {
            createdSets.forEach(set => {
                let setFields = defaultSets.find(defaultSet => set.type === defaultSet.handle).fields;

                setFields.forEach(field => {
                    let fieldPathPlaceholder = `${handle}.{replicator:${set._id}}.${field.handle}`;

                    workspace.syncManager.fieldtypes.push({
                        handle: fieldPathPlaceholder,
                        syncingType: field.syncingType,
                        type: set.type,
                    })

                    if (type === 'pushInitialToYjs') {
                        workspace.syncManager.pushInitialToYjs(workspace, fieldPathPlaceholder, field.syncingType);
                    } else if (type === 'fetchInitialFromYjs') {
                        workspace.syncManager.fetchInitialFromYjs(workspace, set.handle, set.syncingType)
                    }
                    
                    workspace.syncManager.observeRemoteYjsChanges(workspace, fieldPathPlaceholder, field.syncingType);
                })
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
            return one._id === two._id
                && one.type === two.type
                && one.enabled === two.enabled;
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

            let oldValues = workspace.container.values[handle];
            let newValues = workspace.document.getArray(handle).toArray();

            event.delta.forEach(delta => {
                if (delta.insert !== undefined) {
                    let id = delta.insert[0]._id
                    let fieldValues = oldValues.find(field => field._id === id)

                    if (!fieldValues) return; 

                    for (const [key, value] of Object.entries(fieldValues)) {
                        if (['_id', 'type', 'enabled'].includes(key)) continue;

                        let index = newValues.findIndex(field => field._id === id)

                        newValues[index][key] = value;                      
                    }
                }
            });
            
            Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
                handle: handle,
                user: Statamic.user.id,
                value: newValues,
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
            changes.forEach(change => {
                if (change.type === 'add') {
                    YArray.insert(change.newPos, change.items)
                } else if (change.type === 'remove') {
                    YArray.delete(change.newPos, change.items.length)
                }
            })
        })
    }

    static setHasBeenMoved(changes) {
        return changes.length === 2
            && changes[0]._id === changes[1]._id;
    }
}

export default Replicator;
