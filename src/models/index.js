// Model registry. Each entry is a fully-assembled model object (see makeModel).
import p300 from '@/models/p300/index.js';
import aniusb from '@/models/aniusb.js';
import ani22 from '@/models/ani22.js';
import ani4in from '@/models/ani4in.js';
import ani4out from '@/models/ani4out.js';
import mxa910 from '@/models/mxa910.js';
import mxa920 from '@/models/mxa920.js';
import mxa710 from '@/models/mxa710.js';
import mxa320 from '@/models/mxa320.js';
import mxa310 from '@/models/mxa310.js';
import mxa901 from '@/models/mxa901.js';
import mxa902 from '@/models/mxa902.js';
import mxamute from '@/models/mxamute.js';

export const MODELS = [
    p300, aniusb, ani22, ani4in, ani4out,
    mxa910, mxa920, mxa710, mxa320, mxa310, mxa901, mxa902,
    mxamute,
];

export const modelsById = Object.fromEntries(MODELS.map((m) => [m.meta.id, m]));

export function getModel(id) {
    return modelsById[id] || MODELS[0];
}

export const DEFAULT_MODEL_ID = 'p300';

// ---- Model-picker grouping ----
// Category per model id, and the order categories appear in the dropdown. Add new devices
// (e.g. the MXW wireless systems) here under the right category — unlisted ids fall under
// "Other" so nothing silently disappears.
const CATEGORY_BY_ID = {
    mxa310: 'mics', mxa320: 'mics', mxa710: 'mics', mxa901: 'mics', mxa902: 'mics', mxa910: 'mics', mxa920: 'mics',
    p300: 'dsp', aniusb: 'dsp', ani22: 'dsp', ani4in: 'dsp', ani4out: 'dsp',
    mxamute: 'accessory',
};
const CATEGORY_LABELS = {
    mics: 'Array Microphones',
    dsp: 'DSPs & Interfaces',
    wireless: 'Wireless Systems',
    accessory: 'Accessories',
    other: 'Other',
};
const CATEGORY_ORDER = ['mics', 'dsp', 'wireless', 'accessory', 'other'];

// Models grouped for the picker: categories in CATEGORY_ORDER, models sorted by display
// name within each. Empty categories are omitted.
export const MODEL_GROUPS = CATEGORY_ORDER
    .map((cat) => ({
        label: CATEGORY_LABELS[cat],
        models: MODELS
            .filter((m) => (CATEGORY_BY_ID[m.meta.id] || 'other') === cat)
            .sort((a, b) => (a.meta.fullName || a.meta.name).localeCompare(b.meta.fullName || b.meta.name)),
    }))
    .filter((g) => g.models.length);
