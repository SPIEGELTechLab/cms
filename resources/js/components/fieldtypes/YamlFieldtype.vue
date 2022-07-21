<template>
    <div class="yaml-fieldtype-container relative">
        <div v-text="'yaml'" class="code-mode"></div>
        <div ref="codemirror"></div>
    </div>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/mode/yaml/yaml';
import { CodemirrorBinding } from 'y-codemirror';

export default {

    mixins: [Fieldtype],

    inject: ['storeName'],

    data() {
        return {
            codemirror: null
        }
    },

    computed: {
        readOnlyOption() {
            return this.isReadOnly ? 'nocursor' : false;
        }
    },

    mounted() {
        this.codemirror = CodeMirror(this.$refs.codemirror, {
            value: this.value || '',
            mode: 'yaml',
            direction: document.querySelector('html').getAttribute('dir') ?? 'ltr',
            tabSize: 2,
            indentUnit: 2,
            autoRefresh: true,
            indentWithTabs: false,
            lineNumbers: true,
            lineWrapping: true,
            readOnly: this.readOnlyOption,
            theme: this.config.theme || 'material',
            inputStyle: 'contenteditable',
        });

        this.codemirror.on('change', (cm) => {
            this.updateDebounced(cm.doc.getValue());
        });

        if (!Statamic.$config.get('collaboration.enabled')) return;
        
        this.$events.$on('collaboration-provider-synced', () => {
            const ytext = Statamic.$collaboration.workspaces[this.storeName].document.getText(this.handle);
            const awareness = Statamic.$collaboration.workspaces[this.storeName].providerManager.provider.awareness;
            const codemirrorBinding = new CodemirrorBinding(ytext, this.codemirror, awareness)
        });
    },

    watch: {
        readOnlyOption(val) {
            this.codemirror.setOption('readOnly', val);
        }
    },

    methods: {
        focus() {
            this.codemirror.focus();
        }
    }

};
</script>
