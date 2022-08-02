import diff from "fast-diff";

class Text {

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
            value: workspace.document.getText(handle).toString() ?? ''
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
            // Delete websocket data in case some data does exist.
            if (workspace.document.getText(handle).length > 0) {
                workspace.document.getText(handle).delete(0, workspace.document.getText(handle).length)
            }

            // Push the initial value to the Yjs provider.
            if (workspace.container.values[handle]) {
                workspace.document.getText(handle).insert(0, workspace.container.values[handle]);
            }
        })
    }

    /**
     * Push local text changes to the Yjs provider, so those can be synced to all collaborators.
     * With Yjs we won't send the complete text, only the diff and belonging start position.
     */
    static pushLocalChange(workspace, handle, YText, newValue, initPosition) {
        const oldValue = YText.toString();

        const selections = {
            oldRange: {
                index: initPosition - Math.max(0, newValue.length - oldValue.length),
                length: Math.max(0, oldValue.length - newValue.length),
            },
            newRange: { index: initPosition, length: 0 },
        };

        const changes = diff(oldValue, newValue, selections);

        let position = 0;

        for (const [type, substring] of changes) {
            switch (type) {
                case diff.EQUAL:
                    /**
                     * No change, the diff is eual. Do nothing.
                     */
                    position += substring.length;
                    break;
                case diff.DELETE:
                    /**
                     * Send a delete update to Yjs.
                     */
                    YText.delete(position, substring.length);
                    break;
                case diff.INSERT:
                    /**
                     * Send a insert update to Yjs.
                     */
                    YText.insert(position, substring);
                    break;
            }
        }
    }

     /**
     * Observe remote text changes from Yjs the Yjs provider, so those can be merged with the local state.
     * Yjs will only send the text diff with the belonging position. Such changes are called delta in Yjs.
     */
    static observeRemoteChanges(workspace, handle) {
        workspace.document.getText(handle).observe(event => {

            let toUpdate = [];
            let from = 0;
            let length = 0; // If inserting on position 0, no retain delta will be sent, so we need to set 0 as a default value.

            event.delta.forEach((delta) => {

                if (delta.retain) {
                   /**
                    * Retain does define which chracters to keep and does not come alone
                    * and does define the start position of the change.
                    */
                    from = delta.retain;
                } else if (delta.insert) {
                   /**
                    * A insert delta will send the characters as a string to update.
                    */
                    length += delta.insert.length;
                } else if (delta.delete) {
                    /**
                    * A delete delta will send an int, defining how many characters to delete.
                    */
                    length -= delta.delete;
                }

               /**
                * It may happen, that multiple deltas will be received at once.
                * To avoid workload, we'll make a single update after fetching alle changes.
                */
                if (!toUpdate.includes(handle)) {
                    toUpdate.push(handle)
                }
            })

            /**
             * This is a funny one :-)
             * If updating a textfield via javascript, the cursor position inside that field will be reset.
             * To make we can reset the last cursor position correctly, we do save the actual position
             * before applying any changes to the store. The cursor position itself will get reset
             * inside the Text.vue component, as we can't change the cursor position from here.
             */
            if (Statamic.user.cursor) {
                Statamic.user.cursor.move = {
                    from: from,
                    length: length,
                }
            }

            /**
             * If it's a local change, we don't need to fire the collaboration field value command.
             * A local change will be written into the Vuex via the `setFieldValue` event already.
             */
            if (!event.transaction.local) {

                toUpdate.forEach(toUpdateHandle => {
                    // Workaround for: sync manager destroy()
                    if (!Statamic.$collaboration.workspaces[workspace.container.name]) return;

                    Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
                        handle: toUpdateHandle,
                        user: Statamic.user.id,
                        value: workspace.document.getText(toUpdateHandle).toString()
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

export default Text;
