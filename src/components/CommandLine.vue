<template>
    <div class="cmd-line">
        <span class="verb" :class="'verb-' + line.verb">{{ line.label }}</span>
        <span v-if="showFn" class="fn-name">{{ fnName }}</span>
        <span v-if="showFn && fw" class="fw-badge" title="Requires this firmware version or newer">fw {{ fw }}+</span>
        <code class="cmd-text"><template v-for="(seg, i) in segments" :key="i"><span v-if="seg.ph" class="ph">{{ seg.v }}</span><template v-else>{{ seg.v }}</template></template></code>
        <button
            type="button"
            class="copy-btn"
            :class="{ copied }"
            title="Copy to clipboard"
            @click="copy">
            <span class="material-icons">{{ copied ? 'check' : 'content_copy' }}</span>
        </button>
    </div>
</template>

<script>
import { toSegments } from '@/utils/renderCommand.js';

export default {
    name: 'CommandLine',
    props: {
        line: { type: Object, required: true }, // { verb, label, text }
        // In the by-verb layout we show which function the line belongs to.
        showFn: { type: Boolean, default: false },
        fnName: { type: String, default: '' },
        // Firmware requirement shown next to the function name in the by-verb layout.
        fw: { type: String, default: '' },
    },
    data() {
        return { copied: false };
    },
    computed: {
        // Literal vs. placeholder segments for styled rendering. The copy button still
        // copies the raw line.text, so what lands on the clipboard is unchanged.
        segments() {
            return toSegments(this.line.text);
        },
    },
    methods: {
        async copy() {
            const text = this.line.text;
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
            }
            this.copied = true;
            setTimeout(() => {
                this.copied = false;
            }, 1200);
        },
    },
};
</script>

<style scoped lang="scss">
@use '@/styles/colors' as c;

.cmd-line {
    display: flex;
    align-items: center;
    gap: 8px;
}

.verb {
    flex: 0 0 34px;
    text-align: center;
    font-size: 0.68rem;
    font-weight: 700;
    border-radius: 4px;
    padding: 1px 0;
    color: #fff;
}

.verb-get { background: c.$cmd-get; }
.verb-set { background: c.$cmd-set; }
.verb-rep { background: c.$cmd-rep; }
.verb-extra { background: c.$secondary; color: c.$text-dark; }

.fn-name {
    flex: 0 0 auto;
    font-size: 0.78rem;
    font-weight: 600;
    color: c.$text-muted;
    min-width: 130px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.fw-badge {
    flex: 0 0 auto;
    font-size: 0.68rem;
    font-weight: 700;
    color: #8a5a00;
    background: #fdf3df;
    border-radius: 10px;
    padding: 1px 7px;
    white-space: nowrap;
}

.cmd-text {
    flex: 1 1 auto;
    min-width: 0;
    font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
    font-size: 0.85rem;
    background: c.$code-bg;
    color: c.$code-text;
    border-radius: 4px;
    padding: 3px 8px;
    // Keep responses on one line so columns stay aligned (for counting/extracting fields).
    // Overflow scrolls horizontally (selecting with the mouse drags it) but no scrollbar shows.
    white-space: nowrap;
    overflow-x: auto;
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // legacy Edge

    &::-webkit-scrollbar {
        display: none; // WebKit / Blink
    }

    // Placeholders (values you substitute): italic, hugged by a thin, tight border.
    .ph {
        font-style: italic;
        border: 1px solid rgba(231, 235, 243, 0.45);
        border-radius: 3px;
        padding: 0 2px;
        margin: 0 1px;
    }
}

.copy-btn {
    flex: 0 0 auto;
    border: none;
    background: transparent;
    cursor: pointer;
    color: c.$text-muted;
    display: inline-flex;
    padding: 2px;

    .material-icons { font-size: 18px; }
    &.copied { color: c.$success; }
    &:hover { color: c.$accent; }
}
</style>
