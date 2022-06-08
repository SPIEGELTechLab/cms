<template>
    <div class="flex space-x-1 mb-2 cursor-default">
        <template v-for="(user, key) of uniqueUsers">
            <div
                v-if="user.name"
                class="relative rounded-full h-8 w-8"
                :key="key"
                v-tooltip="user.name"
                :style="`background-color: ${user.color}`"
            >
                <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="h-7 w-7 rounded-full" />
                <span v-else class="absolute" style="top: 50%; left: 50%; transform: translate(-50%, -50%)">{{ user.initials }}</span>
                <span
                    class="absolute flex items-center justify-center -bottom-sm -right-sm w-4 h-4 text-5xs text-white border-2 border-white rounded-full"
                    :class="{ 'bg-green': user.online, 'bg-grey-60': !user.online }"
                >
                    <template v-if="user.openTabs > 1">{{ user.openTabs }}</template>
                </span>
            </div>
        </template>
    </div>
</template>

<script>
export default {
    props: ['awareness'],

    data() {
        return {
            users: [],
        };
    },

    computed: {
        uniqueUsers() {
            return [
                ...new Map(
                    this.users.map((user) => [
                        user['id'],
                        {
                            ...user,
                            openTabs: Statamic.user.id === user.id ? this.countOpenTabs(user.id) : null,
                        },
                    ])
                ).values(),
            ];
        },
    },

    created() {
        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));
    },

    mounted() {
        this.awareness.on('change', () => {
            this.users = [];
            for (const [key, value] of this.awareness.getStates().entries()) {
                this.users.push({
                    ...value.user,
                    key: key,
                    current: this.awareness.clientID === key,
                    online: navigator && typeof navigator.onLine === 'boolean' ? navigator.onLine : true,
                });
            }
        });
    },

    beforeDestroy() {
        window.removeEventListener('online', () => this.updateConnectionStatus);
        window.removeEventListener('offline', () => this.updateConnectionStatus);
    },

    methods: {
        countOpenTabs(id) {
            return this.users.filter((user) => user.id === id).length;
        },

        updateConnectionStatus(isOnline) {
            this.users = this.users.map((user) => {
                if (user.id === Statamic.user.id) {
                    return {
                        ...user,
                        online: isOnline,
                    };
                }

                return user;
            });
        },
    },
};
</script>
