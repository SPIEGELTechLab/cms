import Workspace from './Workspace';

export default class Manager {

    constructor() {
        this.workspaces = {};
        this.providers = [];
    }

    boot() {
        Object.values(this.workspaces).forEach(workspace => {
            workspace.start(this.providers);
        });
    }

    addWorkspace(container) {
        const workspace = new Workspace(container);
        this.workspaces[container.name] = workspace;
    }

    destroyWorkspace(container) {
        this.workspaces[container.name].destroy();
        delete this.workspaces[container.name];
    }

    addProvider(callback) {
        this.providers.push(callback)
    }
}