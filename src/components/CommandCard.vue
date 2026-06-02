<template>
    <div class="cmd-card">
        <div class="cmd-head">
            <span class="cmd-name">{{ command.name }}</span>
            <span class="cmd-group">{{ command.group }}</span>
            <span v-if="fwReq" class="cmd-fw" title="Requires this firmware version or newer">fw {{ fwReq }}+</span>
        </div>

        <div v-if="hasControls" class="cmd-controls">
            <ParamControl
                :command="command"
                :model="model"
                :channel="channel"
                :value="value"
                :slot-value="slotValue"
                @update:value="$emit('update:value', $event)"
                @update:slot="$emit('update:slot', $event)" />
        </div>

        <div class="cmd-lines">
            <CommandLine v-for="(line, i) in lines" :key="i" :line="line" />
        </div>

        <p v-if="command.notes" class="cmd-notes">{{ command.notes }}</p>
    </div>
</template>

<script>
import ParamControl from '@/components/ParamControl.vue';
import CommandLine from '@/components/CommandLine.vue';
import { linesFor } from '@/utils/renderCommand.js';

export default {
    name: 'CommandCard',
    components: { ParamControl, CommandLine },
    props: {
        command: { type: Object, required: true },
        model: { type: Object, required: true },
        channel: { type: Number, default: null },
        outputChannel: { type: Number, default: null },
        value: { type: [String, Number], default: null },
        slotValue: { type: Number, default: null },
        // Firmware requirement implied by the current selection (e.g. a channel that only
        // exists on newer firmware). The command's own `fw` takes precedence when set.
        contextFw: { type: String, default: null },
    },
    emits: ['update:value', 'update:slot'],
    computed: {
        fwReq() {
            return this.command.fw || this.contextFw;
        },
        hasControls() {
            const p = this.command.param || { kind: 'none' };
            return p.kind !== 'none' || !!this.command.slot;
        },
        lines() {
            return linesFor(this.command, {
                channel: this.channel,
                outputChannel: this.outputChannel,
                value: this.value,
                slotValue: this.slotValue,
                padWidth: this.model.meta.channelPad,
            });
        },
    },
};
</script>

<style scoped lang="scss">
@use '@/styles/colors' as c;

.cmd-card {
    background: c.$surface;
    border: 1px solid c.$border;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 10px;
}

.cmd-head {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 6px;
}

.cmd-name {
    font-weight: 700;
    font-size: 0.98rem;
}

.cmd-group {
    font-size: 0.72rem;
    color: c.$text-muted;
    background: #eef1f7;
    border-radius: 10px;
    padding: 1px 8px;
}

.cmd-fw {
    font-size: 0.7rem;
    color: #8a5a00;
    background: #fdf3df;
    border-radius: 10px;
    padding: 1px 8px;
}

.cmd-controls {
    margin: 4px 0 10px;
    padding: 6px 8px;
    background: #f7f9fc;
    border-radius: 6px;
}

.cmd-lines {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.cmd-notes {
    margin-top: 8px;
    font-size: 0.78rem;
    color: c.$text-muted;
    line-height: 1.4;
}
</style>
