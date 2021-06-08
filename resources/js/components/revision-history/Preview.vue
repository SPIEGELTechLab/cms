<script>
import InlinePublishForm from '../inputs/relationship/InlinePublishForm.vue';

export default {

    mixins: [InlinePublishForm],

    props: {
        revision: Object,
        indexUrl: String,
    },

    data() {
        return {
            creating: false,
            readOnly: true,
            method: 'patch',
            action: 'update',
            title: this.revision.attributes.data.title,
        }
    },

    computed: {
        itemUrl() {
            return this.indexUrl
                ? `${this.indexUrl}/${this.revision.id}`
                : `${document.location.pathname}/revisions/${this.revision.id}`;
        },
    },

    methods: {

        saved(response) {
            //
        }

    }

}
</script>
