<template>
    <div class="cmd-line">
        <span class="verb" :class="'verb-' + line.verb">{{ line.label }}</span>
        <span v-if="showFn" class="fn-name">{{ fnName }}</span>
        <code class="cmd-text">{{ line.text }}</code>
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
export default {
    name: 'CommandLine',
    props: {
        line: { type: Object, required: true }, // { verb, label, text }
        // In the by-verb layout we show which function the line belongs to.
        showFn: { type: Boolean, default: false },
        fnName: { type: String, default: '' },
    },
    data() {
        return { copied: false };
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

.cmd-text {
    flex: 1 1 auto;
    font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
    font-size: 0.85rem;
    background: c.$code-bg;
    color: c.$code-text;
    border-radius: 4px;
    padding: 3px 8px;
    white-space: pre-wrap;
    word-break: break-word;
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
