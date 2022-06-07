<template>
  <div class="flex space-x-1 mb-2 cursor-default">
    <template v-for="(user, key) of uniqueUsers">
      <div
        v-if="user.name"
        class="relative flex items-center justify-center rounded-full h-8 w-8"
        :key="key"
        v-tooltip="user.name"
        :style="`background-color: ${user.color}`"
      >
        <img v-if="user.avatar" :src="user.avatar" :alt="user.name" class="h-7 w-7 rounded-full">
        <span v-else
          class="absolute"
          style="top: 50%; left: 50%; transform: translate(-50%, -50%)"
        >{{ user.initials }}</span>
        <span v-if="user.openTabs && user.openTabs > 1"
          class="absolute flex items-center justify-center -bottom-1 -right-1 w-5 h-5 text-xs text-white bg-green border-2 border-white rounded-full"
        >{{ user.openTabs }}</span>
        <span v-else
          style="height: 0.5rem !important"
          class="absolute bottom-0 right-0 inline-block w-2 bg-green border-2 border-white rounded-full"
        ></span>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  props: ["awareness"],

  data() {
    return {
      users: [],
    };
  },

  computed: {
    uniqueUsers() {
      return [
        ...new Map(this.users.map((user) => [
          user["id"], {
            ...user,
            openTabs: Statamic.user.id === user.id ? this.countOpenTabs(user.id) : null,
          }
        ])).values(),
      ];
    },
  },

  mounted() {
    this.awareness.on("change", () => {
      this.users = [];
      for (const [key, value] of this.awareness.getStates().entries()) {
        this.users.push({
          ...value.user,
          key: key,
          current: this.awareness.clientID === key,
        });
      }
    });
  },

  methods: {
    countOpenTabs(id) {
      return this.users.filter((user) => user.id === id).length
    }
  }
};
</script>