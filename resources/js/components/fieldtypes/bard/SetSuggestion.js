import { VueRenderer } from '@tiptap/vue-2'
import tippy from 'tippy.js'

import SetList from './SetList.vue';

export default {
    render: () => {
        let component;
        let popup;

        return {
            onStart: props => {
                component = new VueRenderer(SetList, {
                    parent: this,
                    propsData: props,
                    editor: props.editor,
                });

                if (!props.clientRect) return;

                // TODO: popper.js instead of tippy.js
                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-end',
                });
            },

            onUpdate(props) {
                component.updateProps(props);

                if (!props.clientRect) return;

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                })
            },

            onKeyDown(props) {
                if (props.event.key === 'Escape') {
                    popup[0].hide();

                    return true;
                }

                return component.ref?.onKeyDown(props);
            },

            onExit() {
                popup[0].destroy();
                component.destroy();
            },
        }
    },
}
