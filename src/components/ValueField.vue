<template>
    <span class="value-field">
        <label class="vf-real">
            {{ label }}
            <input
                type="number"
                :min="encoder.min"
                :max="encoder.max"
                :step="encoder.step"
                v-model.number="real"
                @input="onReal" />
            <span class="vf-unit">{{ encoder.unit }}</span>
        </label>
        <span class="vf-arrow">&rarr;</span>
        <label class="vf-api" title="ASCII value the device expects / reports">
            API
            <input
                type="text"
                :value="api"
                @input="onApi" />
        </label>
        <span class="vf-range">({{ encoder.format(encoder.min) }} &hellip; {{ encoder.format(encoder.max) }})</span>
    </span>
</template>

<script>
import { encode, decode } from '@/models/encoders.js';

export default {
    name: 'ValueField',
    props: {
        encoder: { type: Object, required: true },
        label: { type: String, default: 'Value' },
        // Optional API token to seed from (lets the value persist across layout toggles).
        initial: { type: String, default: null },
    },
    emits: ['change'],
    data() {
        let real = Math.min(this.encoder.max, Math.max(this.encoder.min, 0));
        if (this.initial != null && this.initial !== '') {
            const r = decode(this.encoder, this.initial);
            if (!Number.isNaN(r)) real = Math.min(this.encoder.max, Math.max(this.encoder.min, r));
        }
        return { real };
    },
    computed: {
        api() {
            return encode(this.encoder, this.real);
        },
    },
    mounted() {
        this.$emit('change', this.api);
    },
    methods: {
        onReal() {
            this.$emit('change', this.api);
        },
        onApi(e) {
            const real = decode(this.encoder, e.target.value);
            if (!Number.isNaN(real)) {
                this.real = Math.min(this.encoder.max, Math.max(this.encoder.min, real));
                this.$emit('change', this.api);
            }
        },
    },
};
</script>

<style scoped lang="scss">
@use '@/styles/colors' as c;

.value-field {
    display: inline-flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: c.$text-muted;
}

label {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-weight: 600;
    color: c.$text-dark;
}

input {
    font-family: 'Lato', sans-serif;
    font-size: 0.85rem;
    border: 1px solid c.$border;
    border-radius: 4px;
    padding: 2px 6px;

    &:focus {
        outline: none;
        border-color: c.$accent;
    }
}

.vf-real input {
    width: 70px;
}

.vf-api input {
    width: 64px;
    font-family: ui-monospace, 'Cascadia Code', Consolas, monospace;
    background: #f3f5fa;
}

.vf-unit {
    font-weight: 400;
}

.vf-arrow {
    opacity: 0.5;
}

.vf-range {
    font-size: 0.74rem;
    opacity: 0.7;
}
</style>
