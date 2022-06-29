<template>
    <div class="flex items-center">
        <div class="input-group">
            <div class="input-group-prepend" v-if="prepend" v-text="prepend" />
            <input
                ref="input"
                class="input-text"
                :class="classes"
                :id="id"
                :name="name"
                :value="textValue(value)"
                :type="type"
                :step="step"
                :disabled="disabled"
                :readonly="isReadOnly"
                :placeholder="placeholder"
                :autofocus="focus"
                :min="min"
                @input="$emit('input', $event)"
                @click="$emit('click', $event)"
                @keydown="$emit('keydown', $event)"
                @keyup="$emit('keyup', $event)"
                @focus="$emit('focus')"
                @blur="$emit('blur')"
            >
            <div class="input-group-append" v-if="append" v-text="append" />
        </div>
        <div class="text-xs ml-1" :class="limitIndicatorColor" v-if="limit">
            <span v-text="currentLength"></span>/<span v-text="limit"></span>
        </div>
    </div>
</template>

<script>
import LengthLimiter from '../LengthLimiter.vue'

export default {
    mixins: [LengthLimiter],
    props: {
        name: {},
        disabled: { default: false },
        classes: { default: null },
        id: { default: null },
        isReadOnly: { type: Boolean, default: false },
        placeholder: { required: false },
        type: { default: "text" },
        step: {},
        value: { required: true },
        prepend: { default: null },
        append: { default: null },
        focus: { type: Boolean },
        autoselect: { type: Boolean },
        min: { type: Number, default: undefined }
    },
    mounted() {
        if (this.autoselect) {
            this.$refs.input.select();
        }
        if (this.focus) {
            this.$refs.input.focus();
        }
    },

    methods: {
        textValue(value) {

            console.debug('Update value and set cursor position. Value: ', value)

            let cursor = Statamic.user.cursor ?? null;

            // Only update the cursor position a cursor has been set (the actual user is inside any field)
            // and if the cursor handle does match with the current field handle.
            if (cursor && cursor.handle === this.name) {
                let start = cursor.position.start
                let end = cursor.position.end

                if (cursor.move && start >= cursor.move.from) {
                    start += cursor.move.length
                    end += cursor.move.length
                }

                // TODO: What's the best way to remove our move information?

                // Update cursor position
                this.$nextTick(() => this.$refs.input.setSelectionRange(start, end));

                Statamic.user.cursor.position = {
                    start: start,
                    end: end,
                }
            }

            return value
        }
    }
}
</script>
