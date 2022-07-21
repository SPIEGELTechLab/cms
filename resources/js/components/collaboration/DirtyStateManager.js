export default class DirtyStateManager {
    constructor(workspace) {
        this.workspace = workspace;
        this.state = null;
    }
    
    initialize() {
        this.state = this.workspace.document.getMap('_dirtyState');

        if (this.state.has('_dirtyState')) {
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

        this.state.set('_dirtyState', true);
    }

    clear() {
        if (! this.isYjsStateDirty()) return;

        this.state.set('_dirtyState', false);
    }

    isLocalAndYjsStateEqual() {
        return this.isYjsStateDirty() === this.isLocalStateDirty();
    }

    isLocalStateDirty() {
        return Statamic.$dirty.has(this.workspace.container.name);
    }

    isYjsStateDirty() {
        return this.state.get('_dirtyState') === true;
    }

    getYjsState() {
        return this.state.get('_dirtyState');
    }

    setLocalStateDirty() {
        Statamic.$dirty.add(this.workspace.container.name) 
    }

    clearLocalState() {
        Statamic.$dirty.remove(this.workspace.container.name);
    }
}