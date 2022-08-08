<template>
    <div>
        <textarea
            class="input-text"
            ref="textarea"
            :value="value"
            :id="id"
            :disabled="disabled"
            :readonly="isReadOnly"
            :placeholder="placeholder"
            :autofocus="focus"
            @input="$emit('input', $event)"
            @click="$emit('click', $event)"
            @keydown="$emit('keydown', $event)"
            @keyup="$emit('keyup', $event)"
            @focus="$emit('focus')"
            @blur="$emit('blur')"
        />
        <div class="text-right text-xs" :class="limitIndicatorColor" v-if="limit">
            <span v-text="currentLength"></span>/<span v-text="limit"></span>
        </div>
    </div>

</template>

<script>
import LengthLimiter from '../LengthLimiter.vue'
import autosize from 'autosize';
import CursorPositionForText from '../collaboration/mixins/CursorPositionForText.vue';

export default {
    mixins: [LengthLimiter, CursorPositionForText],

    props: {
        name: {},
        disabled: { default: false },
        isReadOnly: { type: Boolean, default: false },
        placeholder: { required: false },
        value: { required: true },
        id: { default: null },
        focus: { type: Boolean, default: false }

    },
    mounted() {
        autosize(this.$refs.textarea);

        setTimeout(() => {
            this.updateSize();
        }, 1);
        this.$events.$on('tab-switched', this.updateSize);
    },

    methods: {
        updateSize() {
            this.$nextTick(function() {
                autosize.update(this.$refs.textarea)
            })
        }
    }
}
</script>
