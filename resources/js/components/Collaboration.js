import Workspace from "./collaboration/Workspace";

class Collaboration {
    constructor() {
        this.workspaces = {};
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

}

export default Collaboration;
