<template>
  <div class="flex -mt-2 mb-2 cursor-default">
    <template v-for="(user, key) of uniqueUsers">
      <div
        v-if="user.name"
        class="relative inline-block mr-1 relative inline-block mr-1 rounded-full h-8 w-8"
        :key="key"
        v-tooltip="user.name"
        :style="`background-color: ${user.color}`"
      >
        <span
          class="absolute"
          style="top: 50%; left: 50%; transform: translate(-50%, -50%)"
        >
          {{ user.initials }}
        </span>
        <span
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
        ...new Map(this.users.map((user) => [user["id"], user])).values(),
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
};
</script>