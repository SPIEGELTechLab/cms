import diff from "fast-diff";

class Text {

    static fetchFromYjs(workspace, field) {
        Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
            handle: field.handle,
            user: Statamic.user.id,
            value: workspace.document.getText(field.handle).toString() ?? ''
        });
    }

    static pushToYjs(workspace, field) {
        workspace.document.transact(() => {
            // Delete websocket data in case some data does exist.
            if (workspace.document.getText(field.handle).length > 0) {
                workspace.document.getText(field.handle).delete(0, workspace.document.getText(field.handle).length)
            }
            // Initialize the websocket
            workspace.document.getText(field.handle).insert(0, workspace.container.values[field.handle]);
        })
    }

    static pushLocalChange(handle, YText, newValue, initPosition) {
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
                    position += substring.length;
                    break;
                case diff.DELETE:
                    YText.delete(position, substring.length);
                    break;
                case diff.INSERT:
                    YText.insert(position, substring);
                    position += substring.length;
                    break;
            }
        }
    }

    static observeRemoteChanges(workspace, field) {
        workspace.document.getText(field.handle).observe(event => {
            console.debug('EVENT', event)

            let toUpdate = [];
            let from = 0;
            let length = 0; // Fallback

            event.delta.forEach((delta) => {

                if (delta.retain) {
                    from = delta.retain;
                } else if (delta.insert) {
                    length += delta.insert.length; // Get length as its a string
                } else if (delta.delete) {
                    length -= delta.delete; // Will return the deleted characters as int
                }

                // Sometimes multiple deltas will be fired at once. 
                // To avoid workload, we'll remeber those so we can make a single update after fetching alle changes.
                if (toUpdate.includes(field.handle)) return;

                toUpdate.push(field.handle)
            })

            if (Statamic.user.cursor) {
                Statamic.user.cursor.move = {
                    from: from,
                    length: length,
                }
            }

            // Working through each field only once.

            // If it's a local change, we don't need to fire the collaboration field value command. 
            // This does prevent a race condition as well.
            if (!event.transaction.local) {

                toUpdate.forEach(handle => {
                    Statamic.$store.dispatch(`publish/${workspace.container.name}/setCollaborationFieldValue`, {
                        handle: handle,
                        user: Statamic.user.id,
                        value: workspace.document.getText(handle).toString()
                    });
                })

            }

            // Reset fields we did update
            toUpdate = []

        })
    }
}

export default Text;
