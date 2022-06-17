<template>
    <div class="flex space-x-1 mb-2 cursor-default">
        <div
            v-for="(user, key) of users"
            class="relative rounded-full h-8 w-8"
            :key="key"
            v-tooltip="user.name"
            :style="`background-color: ${user.color}`"
        >
            <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="h-7 w-7 rounded-full" />
            <span v-else class="absolute" style="top: 50%; left: 50%; transform: translate(-50%, -50%)">{{
                user.initials
            }}</span>
            <span
                class="absolute flex items-center justify-center -bottom-sm -right-sm w-4 h-4 text-5xs text-white border-2 border-white rounded-full"
                :class="{ 'bg-green': user.online, 'bg-grey-60': !user.online }"
            >
                <template v-if="user.openTabs > 1">{{ user.openTabs }}</template>
            </span>
        </div>
    </div>
</template>

<script>
export default {

    data() {
        return {
            users: [],
        };
    },

    created() {
        this.$events.$on('users-updated', this.updateUser);
        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));
    },

    beforeDestroy() {
        this.$events.$off('users-updated');
        window.removeEventListener('online', () => this.updateConnectionStatus);
        window.removeEventListener('offline', () => this.updateConnectionStatus);
    },

    methods: {
        updateUser(newUsers) {
            this.users = [
                ...new Map(
                    newUsers.map((user) => [
                        user.user['id'],
                        {
                            openTabs: Statamic.user.id === user.user.id ? this.countOpenTabs(newUsers, user.user.id) : null,
                            ...user.user,
                        },
                    ])
                ).values(),
            ];
        },

        countOpenTabs(users, id) {
            return users.filter((user) => user.user.id === id).length;
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
