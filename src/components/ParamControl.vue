<template>
    <span class="param-control">
        <label v-if="command.slot" class="slot-ctl">
            {{ command.slot.label }}
            <input
                type="number"
                :min="command.slot.min"
                :max="slotMax"
                :value="slotValue"
                @input="$emit('update:slot', Number($event.target.value))" />
            <span class="slot-hint">(1&ndash;{{ slotMax }}, or 00 = all)</span>
        </label>

        <ValueField
            v-if="param.kind === 'value' && encoder"
            :encoder="encoder"
            :label="param.label"
            :initial="value"
            @change="$emit('update:value', $event)" />

        <span v-else-if="param.kind === 'enum'" class="enum-ctl">
            {{ param.label }}:
            <button
                v-for="opt in param.options"
                :key="opt"
                type="button"
                class="enum-opt"
                :class="{ active: value === opt }"
                @click="$emit('update:value', opt)">
                {{ opt }}
            </button>
        </span>

        <label v-else-if="param.kind === 'select'" class="select-ctl">
            {{ param.label }}
            <select :value="value" @change="$emit('update:value', $event.target.value)">
                <option v-for="opt in param.options" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                </option>
            </select>
        </label>

        <label v-else-if="param.kind === 'raw'" class="select-ctl">
            {{ param.label }}
            <input
                type="text"
                :value="value"
                :placeholder="param.placeholder || ''"
                @input="$emit('update:value', $event.target.value)" />
            <span v-if="param.hint" class="slot-hint">{{ param.hint }}</span>
        </label>
    </span>
</template>

<script>
import ValueField from '@/components/ValueField.vue';

export default {
    name: 'ParamControl',
    components: { ValueField },
    props: {
        command: { type: Object, required: true },
        model: { type: Object, required: true },
        channel: { type: Number, default: null },
        value: { type: [String, Number], default: null },
        slotValue: { type: Number, default: null },
    },
    emits: ['update:value', 'update:slot'],
    computed: {
        param() {
            return this.command.param || { kind: 'none' };
        },
        encoder() {
            return this.param.kind === 'value' ? this.model.encoders[this.param.encoding] : null;
        },
        slotMax() {
            const m = this.command.slot && this.command.slot.max;
            return typeof m === 'function' ? m(this.channel) : m;
        },
    },
};
</script>

<style scoped lang="scss">
@use '@/styles/colors' as c;

.param-control {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem 1rem;
}

.slot-ctl,
.select-ctl {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 600;
    font-size: 0.82rem;

    input,
    select {
        font-family: 'Lato', sans-serif;
        font-size: 0.85rem;
        border: 1px solid c.$border;
        border-radius: 4px;
        padding: 2px 6px;
    }

    input {
        width: 90px;
    }

    .slot-ctl input {
        width: 54px;
    }
}

.slot-hint {
    font-weight: 400;
    font-size: 0.74rem;
    opacity: 0.7;
}

.enum-ctl {
    font-size: 0.82rem;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    flex-wrap: wrap;
}

.enum-opt {
    border: 1px solid c.$border;
    background: #fff;
    border-radius: 4px;
    padding: 2px 10px;
    font-size: 0.8rem;
    cursor: pointer;

    &.active {
        background: c.$accent;
        border-color: c.$accent;
        color: #fff;
    }
}
</style>
