<template>
    <div class="home">
        <!-- Left: selector (signal-flow / matrix tabs) -->
        <div class="left">
            <div class="tabs">
                <button
                    type="button"
                    class="tab"
                    :class="{ active: leftTab === 'flow' }"
                    @click="leftTab = 'flow'">
                    <span class="material-icons">account_tree</span> Signal Flow
                </button>
                <button
                    v-if="model.meta.hasMatrix"
                    type="button"
                    class="tab"
                    :class="{ active: leftTab === 'matrix' }"
                    @click="leftTab = 'matrix'">
                    <span class="material-icons">grid_on</span> Matrix Mixer
                </button>
                <button
                    type="button"
                    class="tab device-tab"
                    :class="{ active: isDeviceSelected }"
                    @click="selectElement('device')"
                    title="Device-wide (global) commands">
                    <span class="material-icons">settings</span> Device
                </button>
            </div>

            <div class="left-body">
                <SignalFlow
                    v-show="leftTab === 'flow'"
                    :model="model"
                    :selected-id="selectedElementId"
                    @select="selectElement"
                    @open-matrix="leftTab = 'matrix'" />
                <MatrixGrid
                    v-if="model.meta.hasMatrix"
                    v-show="leftTab === 'matrix'"
                    :model="model"
                    :selected-input="selectedInputCh"
                    :selected-output="selectedOutputCh"
                    @select="selectCrosspoint" />
            </div>
        </div>

        <!-- Right: command panel -->
        <div class="right">
            <CommandPanel :model="model" :selection="selection" />
        </div>
    </div>
</template>

<script>
import SignalFlow from '@/components/SignalFlow.vue';
import MatrixGrid from '@/components/MatrixGrid.vue';
import CommandPanel from '@/components/CommandPanel.vue';

const LS_PREFIX = 'p300finder.state.';

export default {
    name: 'HomeView',
    components: { SignalFlow, MatrixGrid, CommandPanel },
    props: {
        model: { type: Object, required: true },
    },
    data() {
        return {
            leftTab: 'flow',
            selection: this.defaultSelection(),
        };
    },
    computed: {
        selectedElementId() {
            return this.selection && this.selection.type === 'element' ? this.selection.element.id : null;
        },
        isDeviceSelected() {
            return this.selectedElementId === 'device';
        },
        selectedInputCh() {
            return this.selection && this.selection.type === 'crosspoint' ? this.selection.input.channel : null;
        },
        selectedOutputCh() {
            return this.selection && this.selection.type === 'crosspoint' ? this.selection.output.channel : null;
        },
        lsKey() {
            return LS_PREFIX + this.model.meta.id;
        },
    },
    created() {
        this.restore();
    },
    watch: {
        model() {
            // Switching device: load that model's saved state or its default.
            this.selection = this.defaultSelection();
            this.leftTab = 'flow';
            this.restore();
        },
        leftTab() {
            this.persist();
        },
        selection() {
            this.persist();
        },
    },
    methods: {
        defaultSelection() {
            const el = this.model.byId[this.model.defaultElementId()];
            return { type: 'element', element: el };
        },
        selectElement(id) {
            const el = this.model.byId[id];
            if (el) this.selection = { type: 'element', element: el };
        },
        selectCrosspoint({ input, output }) {
            this.selection = { type: 'crosspoint', input, output };
        },
        persist() {
            try {
                const s = this.selection;
                const payload = { leftTab: this.leftTab };
                if (s.type === 'element') payload.sel = { type: 'element', id: s.element.id };
                else payload.sel = { type: 'crosspoint', in: s.input.id, out: s.output.id };
                localStorage.setItem(this.lsKey, JSON.stringify(payload));
            } catch {
                /* ignore */
            }
        },
        restore() {
            try {
                const raw = localStorage.getItem(this.lsKey);
                if (!raw) return;
                const p = JSON.parse(raw);
                const byId = this.model.byId;
                if (p.leftTab === 'matrix' && this.model.meta.hasMatrix) this.leftTab = 'matrix';
                else if (p.leftTab === 'flow') this.leftTab = 'flow';
                if (p.sel && p.sel.type === 'element' && byId[p.sel.id]) {
                    this.selection = { type: 'element', element: byId[p.sel.id] };
                } else if (p.sel && p.sel.type === 'crosspoint' && byId[p.sel.in] && byId[p.sel.out]) {
                    this.selection = { type: 'crosspoint', input: byId[p.sel.in], output: byId[p.sel.out] };
                }
            } catch {
                /* ignore */
            }
        },
    },
};
</script>

<style scoped lang="scss">
@use '@/styles/colors' as c;

.home {
    display: flex;
    height: 100%;
    gap: 8px;
}

.left {
    flex: 1 1 58%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: c.$surface;
    border: 1px solid c.$border;
    border-radius: 10px;
    overflow: hidden;
}

.right {
    flex: 1 1 42%;
    min-width: 0;
    border: 1px solid c.$border;
    border-radius: 10px;
    overflow: hidden;
}

.tabs {
    display: flex;
    gap: 2px;
    padding: 6px 6px 0;
    border-bottom: 1px solid c.$border;
    background: c.$background;
}

.tab {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: none;
    background: transparent;
    font-family: 'Lato', sans-serif;
    font-size: 0.86rem;
    font-weight: 600;
    color: c.$text-muted;
    cursor: pointer;
    padding: 7px 12px;
    border-radius: 8px 8px 0 0;

    .material-icons { font-size: 18px; }

    &.active {
        background: c.$surface;
        color: c.$accent;
        box-shadow: inset 0 -2px 0 c.$accent;
    }

    &.device-tab { margin-left: auto; }
}

.left-body {
    flex: 1 1 auto;
    min-height: 0;
    padding: 8px;
}

.left-body > * { height: 100%; }
</style>
