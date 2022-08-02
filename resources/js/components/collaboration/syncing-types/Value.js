class Value {

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
            value: workspace.document.getMap(handle).get('value')
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
                workspace.document.getMap(handle).clear();
                workspace.document.getMap(handle).set('value', workspace.container.values[handle]);
            }
        })
    }

    /**
     * Push local text changes to the Yjs provider, so those can be synced to all collaborators.
     * With Yjs we won't send the complete text, only the diff and belonging start position.
     */
    static pushLocalChange(workspace, handle, YMap, newValue) {
        YMap.set('value', newValue);
    }

     /**
     * Observe remote text changes from Yjs the Yjs provider, so those can be merged with the local state.
     * Yjs will only send the text diff with the belonging position. Such changes are called delta in Yjs.
     */
    static observeRemoteChanges(workspace, handle) {
        workspace.document.getMap(handle).observe(event => {
            let toUpdate = [];

            /**
             * This is a funny one :-)
             * If updating a textfield via javascript, the cursor position inside that field will be reset.
             * To make we can reset the last cursor position correctly, we do save the actual position
             * before applying any changes to the store. The cursor position itself will get reset
             * inside the Text.vue component, as we can't change the cursor position from here.
             */
            if (Statamic.user.cursor) {
                Statamic.user.cursor = null;
            }

            /**
                * It may happen, that multiple deltas will be received at once.
                * To avoid workload, we'll make a single update after fetching alle changes.
                */
             if (! toUpdate.includes(handle)) {
                toUpdate.push(handle)
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
                        value: workspace.document.getMap(toUpdateHandle).get('value')
                    });
                })

            }

            /**
             * Reset Fields after the update.
             */
             toUpdate = []
        })
    }
}

export default Value;
