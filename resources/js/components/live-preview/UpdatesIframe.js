const hasIframeSourceChanged = (existingSrc, newSrc) => {
    existingSrc = new URL(existingSrc);
    newSrc = new URL(newSrc);
    existingSrc.searchParams.delete('live-preview');
    newSrc.searchParams.delete('live-preview');

    return existingSrc.toString() !== newSrc.toString();
}

const postMessageToIframe = (container, url, payload) => {
    // If the target is a relative url, we'll get the origin from the current window.
    const targetOrigin = /^https?:\/\//.test(url) ? (new URL(url))?.origin : window.origin;

    container.firstChild.contentWindow.postMessage({
        name: 'statamic.preview.updated',
        url,
        ...payload
    }, targetOrigin);
}

export default {
    data() {
        return {
            previousUrl: null,
            scrollX: 0,
            scrollY: 0
        }
    },

    methods: {
        updateIframeContents(url, target, payload) {
            const iframe = document.createElement('iframe');
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('src', url);
            iframe.setAttribute('id', 'live-preview-iframe');
            this.setIframeAttributes(iframe);

            const container = this.$refs.contents;
            let iframeUrl = new URL(url);
            let cleanUrl = iframeUrl.host + iframeUrl.pathname;

            // If there's no iframe yet, just append it.
            if (! container.firstChild) {
                container.appendChild(iframe);
                this.previousUrl = cleanUrl;
                return;
            }

            let shouldRefresh = target.refresh;

            if (hasIframeSourceChanged(container.firstChild.src, iframe.src)) {
                shouldRefresh = true;
            }

            if (! shouldRefresh) {
                postMessageToIframe(container, url, payload);
                return;
            }

            let isSameOrigin = url.startsWith('/') || iframeUrl.host === window.location.host;
            let preserveScroll = isSameOrigin && cleanUrl === this.previousUrl;
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

            if (preserveScroll) {
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

            this.previousUrl = cleanUrl;
        },

        setIframeAttributes(iframe) {
            //
        }
    }
}
