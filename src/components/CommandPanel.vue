<template>
    <section class="command-panel">
        <header class="panel-head">
            <div class="title-row">
                <h2 class="sel-name">{{ headerName }}</h2>
                <span v-for="badge in badges" :key="badge.label" class="ch-badge" :class="badge.cls">
                    {{ badge.label }}
                </span>
            </div>
            <p class="sel-sub">{{ headerSub }}</p>
        </header>

        <div class="panel-tools">
            <span class="material-icons search-icon">search</span>
            <input
                class="cmd-search"
                type="text"
                placeholder="Filter commands…"
                v-model="search" />
            <div class="layout-toggle" title="Group commands by function or by verb">
                <button
                    type="button"
                    :class="{ active: layout === 'function' }"
                    @click="setLayout('function')">
                    By function
                </button>
                <button
                    type="button"
                    :class="{ active: layout === 'verb' }"
                    @click="setLayout('verb')">
                    By verb
                </button>
            </div>
            <span class="count">{{ filteredCount }}</span>
        </div>

        <div class="panel-body">
            <p v-if="!filteredCount" class="empty">No commands match.</p>

            <!-- By function: one card per command, listing its GET/SET/REP -->
            <template v-if="layout === 'function'">
                <div v-for="grp in groups" :key="grp.name" class="block">
                    <h3 class="grp-title">{{ grp.name }}</h3>
                    <CommandCard
                        v-for="cmd in grp.commands"
                        :key="cmd.id + ':' + selKey"
                        :command="cmd"
                        :model="model"
                        :channel="channel"
                        :output-channel="outputChannel"
                        :context-fw="contextFw"
                        :value="values[cmd.id]"
                        :slot-value="slots[cmd.id]"
                        @update:value="setValue(cmd.id, $event)"
                        @update:slot="setSlot(cmd.id, $event)" />
                </div>
            </template>

            <!-- By verb: all GETs together, then SETs, then REPs -->
            <template v-else>
                <div v-for="sec in verbSections" :key="sec.verb" class="block">
                    <h3 class="grp-title">{{ sec.title }}</h3>
                    <div
                        v-for="(row, i) in sec.rows"
                        :key="i"
                        class="verb-row"
                        :class="{ 'has-ctl': sec.verb === 'set' && hasControl(row.cmd) }">
                        <CommandLine :line="row.line" :show-fn="true" :fn-name="row.cmd.name" :fw="row.cmd.fw || contextFw" />
                        <ParamControl
                            v-if="sec.verb === 'set' && hasControl(row.cmd)"
                            class="verb-ctl"
                            :command="row.cmd"
                            :model="model"
                            :channel="channel"
                            :value="values[row.cmd.id]"
                            :slot-value="slots[row.cmd.id]"
                            @update:value="setValue(row.cmd.id, $event)"
                            @update:slot="setSlot(row.cmd.id, $event)" />
                    </div>
                </div>
            </template>

            <p class="rep-note">
                <span class="material-icons">info</span>
                REP strings are sent both as the reply to a GET/SET <em>and</em> unsolicited
                whenever the parameter changes on the device.
            </p>

            <p class="rep-note">
                <span class="material-icons">info</span>
                <span>
                    Italic, boxed tokens like <span class="ph">name</span> or
                    <span class="ph">nn</span> are placeholders — substitute the real value.
                    The curly brackets around text fields such as names, IDs and IP addresses
                    (e.g. <span class="lit">{</span><span class="ph">name</span><span class="lit">}</span>)
                    are <em>part of the device's reply</em> — it sends the literal
                    <span class="lit">{ }</span> characters — not a marker that the value is a variable.
                </span>
            </p>
        </div>
    </section>
</template>

<script>
import CommandCard from '@/components/CommandCard.vue';
import CommandLine from '@/components/CommandLine.vue';
import ParamControl from '@/components/ParamControl.vue';
import { linesFor, defaultValue, VERB_ORDER } from '@/utils/renderCommand.js';

const LS_LAYOUT = 'p300finder.layout';

export default {
    name: 'CommandPanel',
    components: { CommandCard, CommandLine, ParamControl },
    props: {
        model: { type: Object, required: true },
        selection: { type: Object, default: null },
    },
    data() {
        let layout = 'function';
        try {
            const s = localStorage.getItem(LS_LAYOUT);
            if (s === 'verb' || s === 'function') layout = s;
        } catch {
            /* ignore */
        }
        return { search: '', layout, values: {}, slots: {} };
    },
    computed: {
        isCrosspoint() {
            return this.selection && this.selection.type === 'crosspoint';
        },
        channel() {
            if (!this.selection) return null;
            return this.isCrosspoint ? this.selection.input.channel : this.selection.element.channel;
        },
        outputChannel() {
            return this.isCrosspoint ? this.selection.output.channel : null;
        },
        // Firmware floor implied by the selected node itself: some channels/outputs only
        // exist on newer firmware (e.g. P300 Dante outputs 3-8 need 4.1.x+), so every
        // command on them inherits that requirement unless it declares a higher one.
        contextFw() {
            if (!this.selection) return null;
            if (this.isCrosspoint) {
                return this.selection.output.fw || this.selection.input.fw || null;
            }
            return this.selection.element.fw || null;
        },
        selKey() {
            if (!this.selection) return 'none';
            return this.isCrosspoint
                ? `xp-${this.selection.input.channel}-${this.selection.output.channel}`
                : `el-${this.selection.element.id}`;
        },
        baseCommands() {
            if (!this.selection) return [];
            if (this.isCrosspoint) {
                return this.model.commandsForCrosspoint(this.selection.input.channel, this.selection.output.channel);
            }
            const el = this.selection.element;
            if (el.channel == null) return this.model.deviceCommands;
            return this.model.commandsForChannel(el.channel);
        },
        filtered() {
            const q = this.search.trim().toLowerCase();
            if (!q) return this.baseCommands;
            return this.baseCommands.filter((c) => {
                const hay = `${c.name} ${c.group} ${c.id} ${JSON.stringify(c.templates)}`.toLowerCase();
                return hay.includes(q);
            });
        },
        filteredCount() {
            return this.filtered.length;
        },
        groups() {
            const map = new Map();
            for (const c of this.filtered) {
                if (!map.has(c.group)) map.set(c.group, []);
                map.get(c.group).push(c);
            }
            return [...map.entries()].map(([name, commands]) => ({ name, commands }));
        },
        verbSections() {
            const padWidth = this.model.meta.channelPad;
            const all = this.filtered.map((cmd) => ({
                cmd,
                lines: linesFor(cmd, {
                    channel: this.channel,
                    outputChannel: this.outputChannel,
                    value: this.values[cmd.id],
                    slotValue: this.slots[cmd.id],
                    padWidth,
                }),
            }));
            return VERB_ORDER.map((sec) => ({
                ...sec,
                rows: all.flatMap(({ cmd, lines }) =>
                    lines.filter((l) => l.verb === sec.verb).map((line) => ({ cmd, line })),
                ),
            })).filter((s) => s.rows.length);
        },
        headerName() {
            if (!this.selection) return 'Select an element';
            if (this.isCrosspoint) return `${this.selection.input.short} → ${this.selection.output.short}`;
            return this.selection.element.name;
        },
        headerSub() {
            if (!this.selection) return 'Pick an input, output, processing block, or matrix crosspoint.';
            if (this.isCrosspoint) {
                return `Matrix crosspoint — input ${this.selection.input.name} into output ${this.selection.output.name}.`;
            }
            const el = this.selection.element;
            if (el.channel == null) return 'Device-wide commands (no channel number).';
            return el.group;
        },
        badges() {
            if (!this.selection) return [];
            if (this.isCrosspoint) {
                return [
                    { label: `in ch ${this.padCh(this.selection.input.channel)}`, cls: 'in' },
                    { label: `out ch ${this.padCh(this.selection.output.channel)}`, cls: 'out' },
                ];
            }
            const el = this.selection.element;
            if (el.channel == null) return [];
            const out = [{ label: `ch ${this.padCh(el.channel)}`, cls: el.kind }];
            if (el.uiNumber != null && el.uiNumber !== el.channel) {
                out.push({ label: `Designer #${el.uiNumber}`, cls: 'ui' });
            }
            return out;
        },
    },
    created() {
        this.initState();
    },
    watch: {
        selKey() {
            this.initState();
        },
    },
    methods: {
        padCh(n) {
            return String(n).padStart(this.model.meta.channelPad || 2, '0');
        },
        hasControl(cmd) {
            const p = cmd.param || { kind: 'none' };
            return p.kind !== 'none' || !!cmd.slot;
        },
        initState() {
            const values = {};
            const slots = {};
            for (const c of this.baseCommands) {
                const dv = defaultValue(c, this.model.encoders);
                if (dv != null) values[c.id] = dv;
                if (c.slot) slots[c.id] = c.slot.min;
            }
            this.values = values;
            this.slots = slots;
        },
        setValue(id, v) {
            this.values[id] = v;
        },
        setSlot(id, v) {
            this.slots[id] = v;
        },
        setLayout(l) {
            this.layout = l;
            try {
                localStorage.setItem(LS_LAYOUT, l);
            } catch {
                /* ignore */
            }
        },
    },
};
</script>

<style scoped lang="scss">
@use '@/styles/colors' as c;

.command-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: c.$background;
}

.panel-head {
    padding: 10px 14px 6px;
    border-bottom: 1px solid c.$border;
    background: c.$surface;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
}

.sel-name {
    font-size: 1.2rem;
    margin: 0;
}

.ch-badge {
    font-size: 0.78rem;
    font-weight: 700;
    color: #fff;
    background: c.$accent;
    border-radius: 12px;
    padding: 2px 10px;

    &.input { background: c.$flow-input; }
    &.output { background: c.$flow-output; color: c.$text-dark; }
    &.processing { background: c.$flow-aec; }
    &.in { background: c.$flow-input; }
    &.out { background: c.$flow-output; color: c.$text-dark; }
    &.ui { background: c.$secondary; color: c.$text-dark; }
}

.sel-sub {
    margin: 4px 0 0;
    font-size: 0.82rem;
    color: c.$text-muted;
}

.panel-tools {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 8px 14px;
    border-bottom: 1px solid c.$border;
    background: c.$surface;

    .search-icon {
        font-size: 20px;
        color: c.$text-muted;
    }

    .cmd-search {
        flex: 1 1 auto;
        min-width: 60px;
        font-family: 'Lato', sans-serif;
        font-size: 0.9rem;
        border: 1px solid c.$border;
        border-radius: 6px;
        padding: 5px 10px;

        &:focus {
            outline: none;
            border-color: c.$accent;
        }
    }

    .count {
        flex: 0 0 auto;
        font-size: 0.78rem;
        color: c.$text-muted;
        min-width: 1.5rem;
        text-align: right;
    }
}

.layout-toggle {
    flex: 0 0 auto;
    display: inline-flex;
    border: 1px solid c.$border;
    border-radius: 6px;
    overflow: hidden;

    button {
        border: none;
        background: #fff;
        font-family: 'Lato', sans-serif;
        font-size: 0.8rem;
        font-weight: 600;
        color: c.$text-muted;
        padding: 5px 10px;
        cursor: pointer;

        & + button {
            border-left: 1px solid c.$border;
        }

        &.active {
            background: c.$accent;
            color: #fff;
        }
    }
}

.panel-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding: 12px 14px;
}

.block {
    margin-bottom: 14px;
}

.grp-title {
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: c.$text-muted;
    margin: 0 0 6px;
    border-bottom: 1px dashed c.$border;
    padding-bottom: 3px;
}

.verb-row {
    padding: 3px 0;

    &.has-ctl {
        background: #f7f9fc;
        border-radius: 6px;
        padding: 6px 8px;
        margin-bottom: 4px;
    }

    .verb-ctl {
        margin-top: 6px;
        margin-left: 42px;
    }
}

.empty {
    color: c.$text-muted;
    font-style: italic;
    padding: 1rem 0;
}

.rep-note {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    font-size: 0.78rem;
    color: c.$text-muted;
    background: #eef4fb;
    border-radius: 6px;
    padding: 8px 10px;
    margin-top: 6px;

    .material-icons {
        font-size: 18px;
        color: c.$accent;
    }

    .ph {
        font-style: italic;
        border: 1px solid rgba(91, 97, 112, 0.5);
        border-radius: 3px;
        padding: 0 3px;
        margin: 0 1px;
    }

    .lit {
        font-family: ui-monospace, Consolas, monospace;
        font-weight: 700;
    }
}
</style>
