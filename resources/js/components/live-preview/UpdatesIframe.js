export default {
    data() {
        return {
            scrollX: 0,
            scrollY: 0
        }
    },

    methods: {
        updateIframeContents(url) {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('src', url);
            iframe.setAttribute('id', 'live-preview-iframe');
            this.setIframeAttributes(iframe);

            const container = this.$refs.contents;

            if (! container.firstChild) {
                container.appendChild(iframe);
                return;
            }

            let isSameOrigin = url.startsWith('/') || new URL(url).host === window.location.host;
            /* TLP-3388: With each reload, the last set position of the iFrame is located. 
            However, the reload can be fired several times in a row (a user is typing slowly).
            This means that the scrolling to the previously determined position has not yet taken 
            place and the iFrame starts again at top: 0. */
            this.scrollX = container.firstChild.contentWindow.scrollX > 0 ? container.firstChild.contentWindow.scrollX : this.scrollX;
            this.scrollY = container.firstChild.contentWindow.scrollY > 0 ? container.firstChild.contentWindow.scrollY : this.scrollY;

            let scroll = isSameOrigin ? [
                this.scrollX,
                this.scrollY
            ] : null;

            container.replaceChild(iframe, container.firstChild);

            if (isSameOrigin) {
                let iframeContentWindow = iframe.contentWindow;
                const iframeScrollUpdate = (event) => {
                    iframeContentWindow.scrollTo(...scroll);
                };

                iframeContentWindow.addEventListener('DOMContentLoaded', iframeScrollUpdate, true);
                iframeContentWindow.addEventListener('load', iframeScrollUpdate, true);
                iframeContentWindow.addEventListener('scroll', this.resetScrollPosition, true);
            }
        },

        // TLP-3388: To enable the user to start again at position 0 (line 29 + 30) the position must be reset at this point
        resetScrollPosition() {
            if (this.$refs.contents && this.$refs.contents.firstChild.contentWindow.scrollY === 0) {
                this.scrollY = 0;
            }

            if (this.$refs.contents && this.$refs.contents.firstChild.contentWindow.scrollX === 0) {
                this.scrollX = 0;
            }
        },

        setIframeAttributes(iframe) {
            //
        }
    }
}
