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

        <div v-if="hasCommands" class="panel-tools">
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
            <div
                class="layout-toggle level-toggle"
                title="Command categories for this selection. Basic = frequent control · Tuning = DSP setup · Details = names/metering/status · plus any feature tabs · Other = misc · All = everything. Number = commands in each.">
                <button
                    v-for="t in tabs"
                    :key="t.cat"
                    type="button"
                    :class="{ active: activeTab === t.cat }"
                    @click="setLevel(t.cat)">
                    {{ t.label }} <span class="lvl-n">{{ t.count }}</span>
                </button>
            </div>
        </div>

        <div class="panel-body">
            <p v-if="!hasCommands" class="empty">No control commands for this selection.</p>
            <p v-else-if="!filteredCount" class="empty">No commands match.</p>

            <!-- By function: one card per command, listing its GET/SET/REP -->
            <template v-if="hasCommands && layout === 'function'">
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
            <template v-else-if="hasCommands">
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

            <p v-if="hasCommands" class="rep-note">
                <span class="material-icons">info</span>
                REP strings are sent both as the reply to a GET/SET <em>and</em> unsolicited
                whenever the parameter changes on the device.
            </p>

            <p v-if="hasCommands" class="rep-note">
                <span class="material-icons">info</span>
                <span>
                    Italic, boxed tokens are placeholders — in a GET/SET, substitute the real
                    value. In a REP they show the <em>shape</em> of the device's reply, not a
                    value to send. For <strong>fixed-width</strong> fields the placeholder is a
                    run of letters as long as the field — <span class="ph">nnnn</span> for
                    numbers, <span class="ph">xxxx</span> for text, distinct letters
                    (<span class="ph">aaaa</span> <span class="ph">bbbb</span>) for separate
                    fields — so a copied REP can be lined up and counted column-by-column. For
                    values that vary in length (an enumerated keyword like a polar pattern), the
                    placeholder is the <em>field name</em> (e.g. <span class="ph">pattern</span>)
                    instead, since there's no fixed width to count.
                </span>
            </p>

            <p v-if="hasCommands" class="rep-note">
                <span class="material-icons">info</span>
                <span>
                    The curly brackets around text fields such as names, IDs and IP addresses
                    (e.g. <span class="lit">{</span><span class="ph">xxxx</span><span class="lit">}</span>)
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
const LS_LEVEL = 'p300finder.cmdLevel';

// Tabs are built dynamically per selection. Each command carries a `cat`; a category tab
// appears only when the selection has commands in it (plus an "All" tab when more than one
// category is present). Anything without a known category falls into "Other".
const CAT_ORDER = ['basic', 'tuning', 'details', 'beamforming', 'coverage', 'other'];
const CAT_LABELS = {
    basic: 'Basic', tuning: 'Tuning', details: 'Details',
    beamforming: 'Beamforming', coverage: 'Coverage', other: 'Other', all: 'All',
};
const catOf = (c) => (CAT_ORDER.includes(c.cat) ? c.cat : 'other');

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
        let cmdLevel = 'basic';
        try {
            const s = localStorage.getItem(LS_LEVEL);
            if (s in CAT_LABELS) cmdLevel = s;
        } catch {
            /* ignore */
        }
        return { search: '', layout, cmdLevel, values: {}, slots: {} };
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
        // Commands matching the text search (level not yet applied).
        searched() {
            const q = this.search.trim().toLowerCase();
            if (!q) return this.baseCommands;
            return this.baseCommands.filter((c) => {
                const hay = `${c.name} ${c.group} ${c.id} ${JSON.stringify(c.templates)}`.toLowerCase();
                return hay.includes(q);
            });
        },
        // Does this selection have any commands at all (before search)?
        hasCommands() {
            return this.baseCommands.length > 0;
        },
        // How many commands fall in each category for the current selection (after search).
        catCounts() {
            const counts = {};
            for (const c of this.searched) {
                const cat = catOf(c);
                counts[cat] = (counts[cat] || 0) + 1;
            }
            return counts;
        },
        // The tabs to render: every category the selection HAS (search-independent, so the
        // buttons stay put while filtering), plus an "All" tab when more than one is present.
        // Button numbers reflect the active search.
        tabs() {
            const present = new Set(this.baseCommands.map(catOf));
            const cats = CAT_ORDER.filter((cat) => present.has(cat));
            const list = cats.map((cat) => ({ cat, label: CAT_LABELS[cat], count: this.catCounts[cat] || 0 }));
            if (cats.length > 1) list.push({ cat: 'all', label: 'All', count: this.searched.length });
            return list;
        },
        // The currently-shown tab, falling back gracefully when the saved tab isn't
        // available for this selection (e.g. switching from an MXA920 to an ANI device).
        activeTab() {
            const cats = this.tabs.map((t) => t.cat);
            if (cats.includes(this.cmdLevel)) return this.cmdLevel;
            if (cats.includes('basic')) return 'basic';
            return cats[0] || 'all';
        },
        // All shows everything; any other tab shows only its own category.
        filtered() {
            if (this.activeTab === 'all') return this.searched;
            return this.searched.filter((c) => catOf(c) === this.activeTab);
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
                    encoders: this.model.encoders,
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
        setLevel(l) {
            this.cmdLevel = l;
            try {
                localStorage.setItem(LS_LEVEL, l);
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

}

.layout-toggle,
.level-toggle {
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

.level-toggle .lvl-n {
    font-weight: 700;
    opacity: 0.65;
    margin-left: 0.15rem;
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
