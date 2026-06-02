<template>
    <div class="signal-flow">
        <!-- Inputs -->
        <div v-if="inputs.length" class="col col-inputs">
            <div class="col-label">Inputs</div>
            <button
                v-for="el in inputs"
                :key="el.id"
                type="button"
                class="row input-row"
                :class="[isMic(el) ? 'mic' : 'line', { active: el.id === selectedId }]"
                @click="$emit('select', el.id)">
                <span class="ch-num" title="API channel number">{{ pad2(el.channel) }}</span>
                <span class="row-name">{{ el.name }}</span>
                <span class="chips">
                    <span v-for="chip in el.chain" :key="chip" class="chip" :class="chipClass(chip)">{{ chip }}</span>
                </span>
            </button>
        </div>

        <!-- Processing -->
        <div v-if="processing.length" class="col col-mid">
            <div class="col-label">Processing</div>
            <button
                v-for="el in processing"
                :key="el.id"
                type="button"
                class="block proc-block"
                :class="{ active: el.id === selectedId }"
                @click="$emit('select', el.id)">
                <span class="block-title">{{ el.short }}</span>
                <span class="ch-num light">ch {{ pad2(el.channel) }}</span>
                <span v-if="el.chain.length" class="chips center">
                    <span v-for="chip in el.chain" :key="chip" class="chip dark">{{ chip }}</span>
                </span>
            </button>
        </div>

        <!-- Matrix -->
        <div v-if="model.meta.hasMatrix" class="col col-matrix">
            <div class="col-label">&nbsp;</div>
            <button type="button" class="block matrix-block" @click="$emit('open-matrix')">
                <span class="matrix-text">Matrix&nbsp;Mixer</span>
                <span class="matrix-hint">click to open<br />crosspoint grid</span>
            </button>
        </div>

        <!-- Outputs -->
        <div v-if="outputs.length" class="col col-outputs">
            <div class="col-label">Outputs</div>
            <button
                v-for="el in outputs"
                :key="el.id"
                type="button"
                class="row output-row"
                :class="{ active: el.id === selectedId }"
                @click="$emit('select', el.id)">
                <span class="chips">
                    <span v-for="chip in el.chain" :key="chip" class="chip" :class="chipClass(chip)">{{ chip }}</span>
                </span>
                <span class="row-name">{{ el.name }}</span>
                <span v-if="el.uiNumber != null && el.uiNumber !== el.channel" class="ui-num" title="Shure Designer label">#{{ el.uiNumber }}</span>
                <span class="ch-num" title="API channel number">{{ pad2(el.channel) }}</span>
            </button>
        </div>
    </div>
</template>

<script>
import { KIND } from '@/models/kinds.js';

export default {
    name: 'SignalFlow',
    props: {
        model: { type: Object, required: true },
        selectedId: { type: String, default: null },
    },
    emits: ['select', 'open-matrix'],
    computed: {
        inputs() {
            return this.model.elements
                .filter((e) => e.kind === KIND.INPUT)
                .sort((a, b) => a.channel - b.channel);
        },
        processing() {
            return this.model.elements.filter((e) => e.kind === KIND.PROCESSING);
        },
        outputs() {
            return this.model.elements
                .filter((e) => e.kind === KIND.OUTPUT)
                .sort((a, b) => (a.uiNumber ?? a.channel) - (b.uiNumber ?? b.channel));
        },
    },
    methods: {
        pad2(n) {
            return String(n).padStart(this.model.meta.channelPad || 2, '0');
        },
        isMic(el) {
            return el.chain.some((c) => ['AEC', 'NR', 'AGC'].includes(c));
        },
        chipClass(chip) {
            if (['AEC', 'NR', 'AGC', 'Comp'].includes(chip)) return 'proc';
            return 'eq';
        },
    },
};
</script>

<style scoped lang="scss">
@use '@/styles/colors' as c;

.signal-flow {
    display: flex;
    align-items: stretch;
    gap: 10px;
    height: 100%;
    overflow: auto;
    padding: 4px;
}

.col {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.col-inputs,
.col-outputs {
    flex: 1 1 0;
    min-width: 230px;
}

.col-mid {
    flex: 0 0 150px;
    justify-content: center;
}

.col-matrix {
    flex: 0 0 70px;
    justify-content: center;
}

.col-label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: c.$text-muted;
    font-weight: 700;
    height: 16px;
}

.row {
    display: flex;
    align-items: center;
    gap: 6px;
    border: none;
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    color: #fff;
    text-align: left;
    font-family: 'Lato', sans-serif;
    min-height: 38px;

    &.active {
        outline: 3px solid c.$accent;
        outline-offset: 1px;
    }
}

.input-row.mic { background: c.$flow-input-mic; }
.input-row.line { background: c.$flow-input; }
.output-row {
    background: c.$flow-output;
    color: c.$text-dark;
    justify-content: flex-end;
}

.row-name {
    flex: 1 1 auto;
    font-size: 0.86rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.ch-num {
    flex: 0 0 auto;
    font-family: ui-monospace, Consolas, monospace;
    font-weight: 700;
    font-size: 0.8rem;
    background: rgba(0, 0, 0, 0.28);
    color: #fff;
    border-radius: 5px;
    padding: 1px 6px;

    &.light { background: rgba(255, 255, 255, 0.25); }
}

.output-row .ch-num { background: rgba(0, 0, 0, 0.32); }

.ui-num {
    flex: 0 0 auto;
    font-size: 0.72rem;
    font-weight: 700;
    color: c.$text-dark;
    background: rgba(255, 255, 255, 0.55);
    border-radius: 5px;
    padding: 1px 5px;
}

.chips {
    display: inline-flex;
    gap: 3px;
    flex: 0 0 auto;

    &.center {
        justify-content: center;
        margin-top: 4px;
    }
}

.chip {
    font-size: 0.62rem;
    font-weight: 700;
    border-radius: 3px;
    padding: 1px 4px;

    &.eq { background: c.$flow-eq; color: c.$text-dark; }
    &.proc { background: c.$flow-aec; color: #fff; }
    &.dark { background: rgba(255, 255, 255, 0.22); color: #fff; }
}

.block {
    border: none;
    border-radius: 10px;
    cursor: pointer;
    color: #fff;
    font-family: 'Lato', sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 12px 8px;

    &.active {
        outline: 3px solid c.$accent;
        outline-offset: 1px;
    }
}

.proc-block {
    background: c.$flow-automix;
    flex: 1 1 auto;
    min-height: 60px;
}

.block-title {
    font-weight: 700;
    font-size: 0.9rem;
}

.matrix-block {
    background: c.$flow-matrix;
    flex: 1 1 auto;
    min-height: 200px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    text-align: center;

    .matrix-text { font-weight: 700; font-size: 1rem; }
    .matrix-hint { font-size: 0.68rem; opacity: 0.85; font-weight: 400; }
}
</style>
