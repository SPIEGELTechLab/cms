import Vue from 'vue'
import Statamic from './Statamic';

const vm = new Vue({

    data: {
        names: []
    },

    watch: {

        names(names) {
            if (names.length) {
                this.enableWarning();
            }

            if (names.length === 0) {
                this.disableWarning();
            }
        }

    },

    methods: {

        add(name) {
            if (this.names.indexOf(name) == -1) {
                this.names.push(name);

                if (this.isCollaborationDisabled || this.isWorkspaceUnavailable) return;

                /**
                 * If using collaboration, the dirty state will be synchronized between
                 * all active collaboratiors in that workspace. 
                 * 
                 * @see /components/collaboration/DirtyStateManager.js
                 */
                Statamic.$collaboration.workspaces[name].dirty();
            }
        },

        remove(name) {
            const i = this.names.indexOf(name);
            this.names.splice(i, 1);

            if (this.isCollaborationDisabled || this.isWorkspaceUnavailable) return;
            
            /**
             * If using collaboration, the dirty state will be synchronized between
             * all active collaboratiors in that workspace. 
             * 
             * @see /components/collaboration/DirtyStateManager.js
             */
            Statamic.$collaboration.workspaces[name].clearDirtyState();

        },

        enableWarning() {
            if (Statamic.$preferences.get('confirm_dirty_navigation', true)) {
                window.onbeforeunload = () => '';
            }
        },

        disableWarning() {
            window.onbeforeunload = null;
        },

        isCollaborationDisabled() {
            return ! Statamic.$config.get('collaboration.enabled');
        },

        isWorkspaceUnavailable(name) {
            return ! Statamic.$collaboration.workspaces[name];
        },

    }

});

class DirtyState {
    state(name, state) {
        state ? this.add(name) : this.remove(name);
    }
    add(name) {
        vm.add(name);
    }
    remove(name) {
        vm.remove(name);
    }
    names() {
        return vm.names;
    }
    count() {
        return vm.names.length;
    }
    has(name) {
        return vm.names.includes(name);
    }
    disableWarning() {
        vm.disableWarning();
    }
}

Object.defineProperties(Vue.prototype, {
    $dirty: {
        get() {
            return new DirtyState;
        }
    }
});
