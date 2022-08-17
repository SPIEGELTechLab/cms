<script>
export default {

    inject: {
        publishContainer: {
            default: () => null
        },
    },

    props: {
        value: {
            required: true
        },
        config: {
            type: Object,
            default: () => { return {}; }
        },
        handle: {
            type: String,
            required: true
        },
        meta: {
            type: Object,
            default: () => { return {}; }
        },
        readOnly: {
            type: Boolean,
            default: false
        },
        namePrefix: String,
        fieldPathPrefix: String,
        fieldPathPlaceholder: String,
    },

    data() {
        return {
            debouncing: this.$config.get('collaboration.enabled') ? 0 : 150
        }
    },

    methods: {
    
        update(input) {  
            // FIXME: find a better solution
            if (!this.publishContainer && this.config.type === 'replicator') {
                this.publishContainer.setFieldValue(
                    this.fieldPathPlaceholder || this.handle,
                    this.isInputEvent(input) || this.isGeneralEvent(input) ? input.target.value : input
                );
            } else {
                this.$emit("input", this.isInputEvent(input) || this.isGeneralEvent(input) ? input.target.value : input);
            }
       
            this.updateCursorPosition(input);
        },

        updateMeta(value) {
            this.$emit('meta-updated', value);
        },

        blurEvent() {
            Statamic.user.cursor = null;
            this.$emit('blur');
        },

        updateCursorPosition(input) {
            if (! this.isInputEvent(input) && ! this.isPointerEvent(input) && ! this.isKeyboardEvent(input)) return;

            Statamic.user.cursor = {
                handle: this.handle,
                position: {
                    start: input.target.selectionStart,
                    end: input.target.selectionEnd,
                }
            }
        },

        isGeneralEvent(input) {
            return typeof input === "object" && input?.constructor?.name === "Event";
        },

        isInputEvent(input) {
            return typeof input === "object" && input?.constructor?.name === "InputEvent";
        },

        isPointerEvent(input) {
            return typeof input === "object" && input?.constructor?.name === "PointerEvent";
        },

        isKeyboardEvent(input) {
            return typeof input === "object" && input?.constructor?.name === "KeyboardEvent";
        },

    },

    computed: {

        updateDebounced(){
            return _.debounce(this.update, this.debouncing)
        },

        name() {
            if (this.namePrefix) {
                return `${this.namePrefix}[${this.handle}]`;
            }

            return this.handle;
        },

        isReadOnly() {
            return this.readOnly || this.config.visibility === 'read_only' || false;
        },

        replicatorPreview() {
            return this.value;
        },

        fieldId() {
            return 'field_'+this.config.handle;
        }

    },

    watch: {

        replicatorPreview: {
            immediate: true,
            handler(text) {
                this.$emit('replicator-preview-updated', text);
            }
        }

    }

}
</script>
