import * as Y from 'yjs';
import Workspace from "./collaboration/Workspace";

class Collaboration {
    constructor() {
        this.workspaces = {};
        this.syncTypeCallbacks = [];
        this.syncTypeReplacementCallbacks = [];
    }

    boot() {
        // Don't start collaboration if not enabled.
        if (!Statamic.$config.get('collaboration.enabled')) return;

        Object.values(this.workspaces).forEach(workspace => {
            workspace.start();
        });
    }

    start(container) {
        if (!container.reference) return;

        const workspace = new Workspace(container);
        this.workspaces[container.name] = workspace;

        this.boot();
    }

    destroy(container) {
        if (!this.workspaces[container.name]) return;

        this.workspaces[container.name].destroy();
        delete this.workspaces[container.name];
    }

    addSyncType(callback) {
        this.syncTypeCallbacks.push(callback);
    }

    replaceSyncType(name, callback) {
        this.syncTypeReplacementCallbacks.push({ name, callback });
    }

    get yjs() {
        return Y;
    }

}

export default Collaboration;
