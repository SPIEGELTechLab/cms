import StatusBar from './StatusBar.vue';

// Propagating awareness information such as presence & cursor locations
class AwarenessManager {
    constructor() {
        this.users = [];
    }

    start(container, awareness) {
        // Propagate relevant user information to awareness "user" field
        awareness.setLocalStateField('user', this.getCurrentUser());

        // Transform awareness user states into a readable array 
        this.users = this.awarenessStatesToArray(awareness);

        // Initialize status bar
        Statamic.component('StatusBar', StatusBar);
        container.pushComponent('StatusBar', { props: { initialUsers: this.users } });

        // Listen to remote and local awareness changes. This event is called even when the awareness state
        // doesn't change but is only updated to notify other users that this client is still online.
        awareness.on('update', () => {
            this.users = this.awarenessStatesToArray(awareness);

            container.$events.$emit('users-updated', this.users);
        });

    }

    getCurrentUser() {
        return {
            id: Statamic.user.id,
            name: Statamic.user.name,
            initials: Statamic.user.initials,
            avatar: Statamic.user.avatar?.permalink,
            color: this.generateRandomLightColorHex(),
        }
    }

    generateRandomLightColorHex() {
        let color = "#";

        for (let i = 0; i < 3; i++)
            color += ("0" + Math.floor(((1 + Math.random()) * Math.pow(16, 2)) / 2).toString(16)).slice(-2);
        return color;
    }

    awarenessStatesToArray(awareness) {
        return Array.from(awareness.states.entries()).map(([key, value]) => ({
            clientId: key,
            user: {
                ...value.user,
                current: awareness.clientID === key,
                online: navigator && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
            },
        }));
    }
}

export default AwarenessManager;