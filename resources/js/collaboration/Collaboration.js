import Manager from "./Manager";
// import StatusBar from './StatusBar.vue';

const manager = new Manager;

Statamic.$sharedEditing = manager;

Statamic.booting(() => {
    // Statamic.component('CollaborationStatusBar', StatusBar);
});

Statamic.booted(() => {
    manager.boot();
});

Statamic.$events.$on('publish-container-created', container => {
    if (!container.reference) return;

    manager.addWorkspace(container);
    window.addEventListener('unload', () => manager.destroyWorkspace(container));
});

Statamic.$events.$on('publish-container-destroyed', container => {
    if (!manager.workspaces[container.name]) return;

    manager.destroyWorkspace(container);
});