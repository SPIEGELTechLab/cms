export default class Workspace {
    constructor(container) {
        this.container = container;
    }

    start() {
        console.log('START WORKSPACE');
    }

    destroy() {
        console.log('DESTROY WORKSPACE');
    }
}
