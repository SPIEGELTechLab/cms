import StatusBar from './StatusBar.vue';

// Propagating awareness information such as presence & cursor locations
class AwarenessManager {
    constructor(container, providerManager) {
        this.container = container;
        this.providerManager = providerManager;
    }

    start() {
        // Propagate relevant user information to awareness "user" field
        this.providerManager.provider?.awareness.setLocalStateField('user', this.getCurrentUser());

        // Initialize status bar
        Statamic.component('StatusBar', StatusBar);
        this.container.pushComponent('StatusBar', { });
    }

    destroy() {
        this.providerManager.provider?.awareness.destroy();
    }

    getUsers() {
        const awareness = this.providerManager.provider?.awareness;
        if (!awareness) return [];

        return Array.from(awareness.states.entries()).map(([key, value]) => ({
            clientId: key,
            user: {
                ...value.user,
                current: awareness.clientID === key,
                online: navigator && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
            },
        }));
    }

    getCurrentUser() {
        return {
            id: Statamic.user.id,
            name: Statamic.user.name,
            initials: Statamic.user.initials,
            avatar: Statamic.user.thumbnail,
            color: this.generateRandomLightColorHex(),
        }
    }

    generateRandomLightColorHex() {
        let color = "#";

        for (let i = 0; i < 3; i++)
            color += ("0" + Math.floor(((1 + Math.random()) * Math.pow(16, 2)) / 2).toString(16)).slice(-2);
        return color;
    }
}

export default AwarenessManager;