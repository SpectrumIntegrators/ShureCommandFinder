<template>
    <div class="matrix-grid">
        <div class="grid-hint">
            Rows = matrix inputs, columns = matrix outputs. Click a crosspoint to see its
            route &amp; gain commands. Numbers shown are <strong>API channels</strong>;
            <span class="ui-key">#</span> is the Shure Designer label.
        </div>
        <div class="scroll">
            <table>
                <thead>
                    <tr>
                        <th class="corner">in \ out</th>
                        <th
                            v-for="o in outputs"
                            :key="o.id"
                            class="col-head"
                            :class="{ hot: o.channel === selectedOutput }">
                            <span class="col-name">{{ o.short }}</span>
                            <span class="col-nums">
                                <span class="ui">#{{ o.uiNumber }}</span>
                                <span class="ch">ch {{ pad2(o.channel) }}</span>
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="i in inputs" :key="i.id">
                        <th
                            class="row-head"
                            :class="[i.kind, { hot: i.channel === selectedInput }]">
                            <span class="row-name">{{ i.name }}</span>
                            <span class="ch">ch {{ pad2(i.channel) }}</span>
                        </th>
                        <td v-for="o in outputs" :key="o.id" class="cell">
                            <button
                                type="button"
                                class="xpoint"
                                :class="{ sel: i.channel === selectedInput && o.channel === selectedOutput }"
                                :title="`${i.short} → ${o.short}  (SET ${pad2(i.channel)} MATRIX_MXR_ROUTE ${pad2(o.channel)} ON)`"
                                @click="$emit('select', { input: i, output: o })">
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script>
export default {
    name: 'MatrixGrid',
    props: {
        model: { type: Object, required: true },
        selectedInput: { type: Number, default: null },
        selectedOutput: { type: Number, default: null },
    },
    emits: ['select'],
    computed: {
        inputs() {
            return this.model.matrixInputs;
        },
        outputs() {
            return this.model.matrixOutputs;
        },
    },
    methods: {
        pad2(n) {
            return String(n).padStart(this.model.meta.channelPad || 2, '0');
        },
    },
};
</script>

<style scoped lang="scss">
@use '@/styles/colors' as c;

.matrix-grid {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.grid-hint {
    font-size: 0.78rem;
    color: c.$text-muted;
    padding: 2px 4px 8px;

    .ui-key {
        font-weight: 700;
        color: c.$text-dark;
    }
}

.scroll {
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    border: 1px solid c.$border;
    border-radius: 8px;
    background: c.$surface;
}

table {
    border-collapse: separate;
    border-spacing: 0;
}

th,
td {
    border-right: 1px solid c.$border;
    border-bottom: 1px solid c.$border;
}

.corner {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 3;
    background: c.$surface;
    font-size: 0.72rem;
    color: c.$text-muted;
    padding: 4px 8px;
}

.col-head {
    position: sticky;
    top: 0;
    z-index: 2;
    background: c.$flow-output;
    color: c.$text-dark;
    padding: 5px 6px;
    min-width: 64px;
    vertical-align: bottom;

    &.hot {
        background: #d99e0b;
    }

    .col-name {
        display: block;
        font-size: 0.74rem;
        font-weight: 700;
        white-space: nowrap;
    }

    .col-nums {
        display: flex;
        justify-content: center;
        gap: 4px;
        margin-top: 2px;
    }

    .ui {
        font-size: 0.64rem;
        font-weight: 700;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 4px;
        padding: 0 4px;
    }

    .ch {
        font-size: 0.64rem;
        font-family: ui-monospace, Consolas, monospace;
        background: rgba(0, 0, 0, 0.25);
        color: #fff;
        border-radius: 4px;
        padding: 0 4px;
    }
}

.row-head {
    position: sticky;
    left: 0;
    z-index: 1;
    background: c.$flow-input;
    color: #fff;
    text-align: left;
    padding: 4px 8px;
    min-width: 160px;

    &.processing { background: c.$flow-automix; }

    &.hot {
        outline: 2px solid c.$accent;
        outline-offset: -2px;
    }

    .row-name {
        display: block;
        font-size: 0.78rem;
        font-weight: 600;
        white-space: nowrap;
    }

    .ch {
        font-size: 0.64rem;
        font-family: ui-monospace, Consolas, monospace;
        opacity: 0.85;
    }
}

.cell {
    padding: 0;
    text-align: center;
    background: c.$surface;
}

.xpoint {
    width: 100%;
    height: 100%;
    min-width: 56px;
    min-height: 30px;
    border: none;
    background: transparent;
    cursor: pointer;
    position: relative;

    &::after {
        content: '';
        width: 14px;
        height: 14px;
        border: 2px solid c.$border-strong;
        border-radius: 3px;
        display: inline-block;
        vertical-align: middle;
    }

    &:hover {
        background: #eef4fb;
    }

    &.sel {
        background: #d9ecff;

        &::after {
            background: c.$accent;
            border-color: c.$accent;
        }
    }
}
</style>
