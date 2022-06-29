export default class DirtyStateManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.state = null;
    }
    
    initialize() {
        this.state = this.workspace.document.getArray('_dirtyState');

        // The length will be zero if no state has been set.
        // TODO: Get in sync with initializing the blueprint.
        // Right now, there are more values then needed saved.
        if (this.state.length === 0) {
            this.isLocalStateDirty() ? this.dirty() : this.clear();
        }

        this.observe();
    }

    observe() {
        this.state.observe(event => {
            // Don't update if the Yjs and local states are equals.
            if (this.isLocalAndYjsStateEqual()) return;

            if (this.isYjsStateDirty()) {
                this.setLocalStateDirty();
            } else if (this.isLocalStateDirty()) {
                this.clearLocalState();
            }
        })
    }

    dirty() {
        if (this.isYjsStateDirty()) return;

        this.workspace.document.transact(() => {
            if (this.isYjsStateDirty()) {
                this.state.delete(0, this.state.length)
            }
            this.state.insert(0, [true]);
        })
    }

    clear() {
        if (! this.isYjsStateDirty()) return;

        this.workspace.document.transact(() => {
            if (this.isYjsStateDirty()) {
                this.state.delete(0, this.state.length)
            }
            this.state.insert(0, [false]);
        })
    }

    isLocalAndYjsStateEqual() {
        return this.isYjsStateDirty() === this.isLocalStateDirty();
    }

    isLocalStateDirty() {
        return Statamic.$dirty.has(this.workspace.container.name);
    }

    isYjsStateDirty() {
        return this.state.get(0) === true;
    }

    getYjsState() {
        return this.state.get(0);
    }

    setLocalStateDirty() {
        Statamic.$dirty.add(this.workspace.container.name) 
    }

    clearLocalState() {
        Statamic.$dirty.remove(this.workspace.container.name);
    }
}