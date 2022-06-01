import Workspace from "./collaboration/Workspace";

class Collaboration {
    constructor() {
        this.workspaces = {};
    }

    boot() {
        Object.values(this.workspaces).forEach(workspace => {
            workspace.start();
        });
    }

    start(container) {
        if (!container.reference) return;

        console.log('START COLLABORATION');
        const workspace = new Workspace(container);
        this.workspaces[container.name] = workspace;

        this.boot();
    }

    destroy(container) {
        if (!this.workspaces[container.name]) return;

        console.log('DESTROY COLLABORATION');
        this.workspaces[container.name].destroy();
        delete this.workspaces[container.name];
    }

}



export default Collaboration;
