<template>
    <div class="sets">
        <template v-if="items.length">
            <a
                class="set"
                :class="{ 'is-selected': index === selectedIndex }"
                v-for="(item, index) in items"
                :key="index"
                @click="selectItem(index)"
            >
                {{ item.display }}
            </a>
        </template>
    </div>
</template>

<script>
export default {
    props: {
        items: {
            type: Array,
            required: true,
        },
    },

    data() {
        return {
            selectedIndex: 0,
        };
    },

    watch: {
        items() {
            this.selectedIndex = 0;
        },
    },

    methods: {
        onKeyDown({ event }) {
            if (event.key === 'ArrowUp') {
                this.upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                this.downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                // TODO: Doesn't work
                this.enterHandler();
                return true;
            }

            return false;
        },

        upHandler() {
            this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length;
        },

        downHandler() {
            this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
        },

        enterHandler() {
            this.selectItem(this.selectedIndex);
        },

        selectItem(index) {
            const item = this.items[index];

            if (item) {
                this.$events.$emit('add-set', item.handle);
            }
        },
    },
};
</script>

<style lang="scss" scoped>
// TODO: use tailwind
.sets {
    padding: 8px;
    position: relative;
    border-radius: 4px;
    overflow: hidden;
    font-size: 13px;
    background-color: #fff;
    box-shadow: 0 0 0 1px rgb(40 45 50 / 5%), 0 0 0 1px rgb(40 45 50 / 5%), 0 2px 7px 1px rgb(40 45 50 / 16%);

    a {
        display: block;
        margin: 0;
        width: 100%;
        text-align: left;
        background: transparent;
        border-radius: 2px;
        border-width: 0px !important;
        padding: 4px 8px;

        &.is-selected {
            background-color: hsl(200, 80%, 50%);
            color: #fff;
        }
    }
}
</style>
