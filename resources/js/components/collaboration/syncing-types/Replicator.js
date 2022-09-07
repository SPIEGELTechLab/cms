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
                        workspace.syncManager.fetchInitialFromYjs(workspace, fieldPathPlaceholder, set.syncingType)
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
            if (! Statamic.$collaboration.workspaces[workspace.container.name]) return;

            let oldValues = workspace.container.values[handle];
            let newValues = workspace.document.getArray(handle).toArray();

            event.delta.forEach(delta => {

                /**
                 * If an insert event has been defined, check if that ID is present in old values.
                 * If it is, copy those values to the new field.
                 */ 
                if (delta.insert !== undefined) {
                    let id = delta.insert[0]._id
                    let type = delta.insert[0].type
                    let fieldValues = oldValues.find(field => field._id === id)

                    /**
                     * If the set already exists, copy existing values so we won't loose them locally.
                     */
                    if (fieldValues) {
                        for (const [key, value] of Object.entries(fieldValues)) {
                            if (['_id', 'type', 'enabled'].includes(key)) continue;

                            let index = newValues.findIndex(field => field._id === id)

                            newValues[index][key] = value;
                        }
                    }

                    /**
                     * If the set does not exist, push new fields to YJS and the sync manager.
                     */
                    let defaultSets = workspace.syncManager.fieldtypes.find(field => handle === field.handle).sets
                    let belongingSet = defaultSets.find(set => set.handle === type)

                    belongingSet.fields.forEach(field => {
                        let fieldPathPlaceholder = `${handle}.{replicator:${id}}.${field.handle}`;

                        // Do nothing if the field is already syncing, as it does exist inside the fieldtypes array.
                        if (workspace.syncManager.fieldtypes.findIndex(field => field.handle === fieldPathPlaceholder) !== -1) return;

                        workspace.syncManager.fieldtypes.push({
                            handle: fieldPathPlaceholder,
                            syncingType: field.syncingType,
                            type: field.type,
                        })

                        workspace.syncManager.pushInitialToYjs(workspace, fieldPathPlaceholder, field.syncingType);                        
                        workspace.syncManager.observeRemoteYjsChanges(workspace, fieldPathPlaceholder, field.syncingType);
                    })
                }
            });
            
            Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
                handle: handle,
                user: Statamic.user.id,
                value: newValues,
            });

            /**
             * DELETING the first FIELD
             */
            if (event.delta.length === 1 && event.delta[0].delete !== undefined) {
                let id = oldValues[0]._id;
                let type = oldValues[0].type;
                let defaultSets = workspace.syncManager.fieldtypes.find(field => handle === field.handle).sets
                let belongingSet = defaultSets.find(set => set.handle === type)

                belongingSet.fields.forEach(field => {
                    let fieldPathPlaceholder = `${handle}.{replicator:${id}}.${field.handle}`;

                    // Do nothing if the field is already syncing, as it does exist inside the fieldtypes array.
                    let index = workspace.syncManager.fieldtypes.findIndex(field => field.handle === fieldPathPlaceholder)

                    // Delete set from fieldtypes array.
                    workspace.syncManager.fieldtypes.splice(index, 1)
                })
            }

            /**
             * DELETING any FIELD (not the first one)
             */
            if (event.delta.length === 2 && event.delta[0].retain !== undefined && event.delta[1].delete !== undefined) {                

                let setToRemove;

                // Fetch ids that do not exist anymore as a set
                workspace.syncManager.fieldtypes.every((set, index) => {
                    if (!set.handle.includes(`${handle}.{replicator:`)) return true; // continue

                    let matched = false;
                    let fieldPathPlaceholder;

                    oldValues.forEach(value => {
                        fieldPathPlaceholder = `${handle}.{replicator:${value._id}}.`;

                        if (set.handle.includes(fieldPathPlaceholder)) {
                            matched = true;
                        }
                    });

                    if (! matched) {
                        setToRemove = index;

                        return false; // Replicator set found. Stop loop.
                    }

                    return true; // continue looping
                });

                // Remove sets from fieldtypes array.
                workspace.syncManager.fieldtypes.splice(setToRemove, 1);
            }
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
}

export default Replicator;
