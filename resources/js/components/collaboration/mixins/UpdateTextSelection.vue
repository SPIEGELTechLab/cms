<script>
export default {

     watch: {

        /**
         * Watching the value is important, so the cursor position can be kept or manipulated.
         * In case that more then one user is editing the same text field, we need to fetch
         * the last cursor position and determine if this position needs to be updated.
         * The manipulated positioin will be set to the input after each update.
         *
         * The last position will be fetched on every text update.
         * @see /components/collaboration/mixins/Text.vue
         */
        value(value) {
            /**
             * Return early in case collaboration is disabled.
             */
            if (! Statamic.$config.get('collaboration.enabled')) return value;

            let cursor = Statamic.user.cursor ?? null;

            /**
             * Only update the cursor position if a cursor has been set and if
             * the cursor handle does match with the current field handle.
             */
            if (cursor && cursor.handle === this.name) {
                let start = cursor.position.start
                let end = cursor.position.end

                if (cursor.move && start >= cursor.move.from) {
                    start += cursor.move.length
                    end += cursor.move.length
                }

                /**
                 * Set cursor position in the input field, so it won't get lost.
                 */
                this.$nextTick(() => this.$refs.input.setSelectionRange(start, end));

                /**
                 * Update the old cursor position.
                 */
                Statamic.user.cursor.position = {
                    start: start,
                    end: end,
                }
            }

            return value
        }

    },

}
</script>