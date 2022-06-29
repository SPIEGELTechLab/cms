import { textUpdate } from "./text.js"

export default class SyncManager {
    constructor(workspace) {
        this.workspace = workspace;
        // this.fieldsets = [];
    }

    initialize() {
        console.log(this.workspace.container.blueprint.sections)
        this.workspace.container.blueprint.sections.forEach(section => {
            section.fields.forEach(field => {
                this.workspace.fieldsets.push({
                    handle: field.handle,
                    collaborationType: field.collaboration,
                    type: field.type,
                });
            })
        });
    }

    pushLocalChanges() {
        Statamic.$store.subscribe((mutation, state) => {
            if (mutation.type !== `publish/${this.workspace.container.name}/setFieldValue`) return;

            // Ignore bard fields for now. We need a better approach
            if (this.getFieldsetType(mutation.payload.handle) === 'bard') return;

            // TODO: Check for collaboration type and sync accordingly

            textUpdate(
                mutation.payload.handle,
                this.workspace.document.getText(mutation.payload.handle),
                mutation.payload.value,
                this.workspace.document.getText(mutation.payload.handle).toString(),
                mutation.payload.position,
            )
        });
    }

    observeRemoteChanges() {
        this.workspace.fieldsets.forEach(field => {

            switch (field.collaborationType) {
                case 'text': // TODO: Create syncingType
                    this.workspace.document.getText(field.handle).observe(event => {
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
                                Statamic.$store.dispatch(`publish/${this.workspace.container.name}/setCollaborationFieldValue`, {
                                    handle: handle,
                                    user: Statamic.user.id,
                                    value: this.workspace.document.getText(handle).toString()
                                });
                            })

                        }

                        // Reset fields we did update
                        toUpdate = []

                    })
                    break;
            }
        })

    }

    getFieldsetType(handle) {
        return this.workspace.fieldsets.find(fieldset => fieldset.handle === handle).type;
    }
}