<template>
    <popover ref="popover" placement="bottom-end" @closed="popoverClosed" :clickaway="false">
        <template #trigger>
            <button
                class="bard-toolbar-button"
                :class="{ active }"
                v-tooltip="button.text"
                :aria-label="button.text"
                @click="toggleLinkToolbar"
            >
                <svg-icon :name="button.svg" v-if="button.svg"></svg-icon>
            </button>
        </template>
        <template #default>
            <link-toolbar
                class="w-80"
                ref="toolbar"
                v-if="showingToolbar"
                :link-attrs="linkAttrs"
                :config="config"
                :bard="bard"
                @updated="setLink"
                @canceled="close"
            />
        </template>
    </popover>
</template>

<script>
import LinkToolbar from './LinkToolbar.vue';

export default {

    mixins: [BardToolbarButton],

    components: {
        LinkToolbar,
    },

    data() {
        return {
            linkAttrs: null,
            showingToolbar: false,
        }
    },

    methods: {

        toggleLinkToolbar() {
            this.showingToolbar = ! this.showingToolbar;

            if (this.showingToolbar) {
                this.linkAttrs = this.editor.getAttributes('link');
            } else {
                // TLP-3679: core update fix scroll into view after change
                this.editor.view.focus(null, { scrollIntoView: false });
            }
        },

        close() {
            this.showingToolbar = false;
            this.$refs.popover.close();
        },

        popoverClosed() {
            this.showingToolbar = false;
        },

        setLink(attributes) {
            this.editor.commands.setLink(attributes);
            this.linkAttrs = null;
            this.close();
            // TLP-3679: core update fix scroll into view after change
            this.editor.view.focus(null, { scrollIntoView: false });
        }

    }

}
</script>
