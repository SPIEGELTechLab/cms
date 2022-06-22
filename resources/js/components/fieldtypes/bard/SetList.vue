<template>
    <div class="bard-set-selector">
        <div class="popover-container dropdown-list popover-open">
            <div class="popover">
                <div class="popover-content bg-white shadow-popover rounded-md">
                    <div v-for="(item, index) in items" :key="item.handle">
                        <a
                            :class="{ 'bg-blue text-white': index === selectedIndex }"
                            v-text="item.display || item.handle"
                            @click="selectItem(index)"
                        ></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        items: {
            type: Array,
            required: true,
        }
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
             switch (event.key) {
                case 'ArrowUp':
                    this.selectedIndex = (this.selectedIndex + this.items.length - 1) % this.items.length;
                    return true;
                case 'ArrowDown':
                    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
                    return true;
                case 'Enter':
                    this.selectItem(this.selectedIndex);
                    return true;
                default:
                    return false;
            }
        },

        selectItem(index) {
            const item = this.items[index];
            if (!item) return;

            this.$events.$emit('add-set', item.handle);
        },
    },
};
</script>
