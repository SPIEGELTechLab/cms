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

        ray('START COLLABORATION').green()
        const workspace = new Workspace(container);
        this.workspaces[container.name] = workspace;

        this.boot();
    }

    destroy(container) {
        if (!this.workspaces[container.name]) return;

        ray('DESTROY COLLABORATION').green();
        this.workspaces[container.name].destroy();
        delete this.workspaces[container.name];
    }

}

export default Collaboration;
