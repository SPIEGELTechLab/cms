<script>
import InlinePublishForm from '../inputs/relationship/InlinePublishForm.vue';

export default {

    mixins: [InlinePublishForm],

    props: {
        indexUrl: String,
        revision: Object
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
        /* Polygon TLP-1923: Show history within an open stack */
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
