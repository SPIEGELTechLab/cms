<template>
    <textarea-input
        :name="name"
        :isReadOnly="isReadOnly"
        :limit="config.character_limit || null"
        :placeholder="config.placeholder"
        :value="value"
        :id="fieldId"
        @blur="blurEvent"
        @focus="$emit('focus')"
        @input="updateDebounced"
        @click="updateCursorPosition"
        @keyup.up.down="updateCursorPosition"
        @keyup.left.right="updateCursorPosition" />
</template>

<script>
import Fieldtype from './Fieldtype.vue';

export default {

    mixins: [Fieldtype]

}
</script>
