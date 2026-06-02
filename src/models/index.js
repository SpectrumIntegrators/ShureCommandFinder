// Model registry. Each entry is a fully-assembled model object (see makeModel).
import p300 from '@/models/p300/index.js';
import aniusb from '@/models/aniusb.js';
import ani22 from '@/models/ani22.js';
import ani4in from '@/models/ani4in.js';
import ani4out from '@/models/ani4out.js';
import mxa910 from '@/models/mxa910.js';
import mxa920 from '@/models/mxa920.js';

export const MODELS = [p300, aniusb, ani22, ani4in, ani4out, mxa910, mxa920];

export const modelsById = Object.fromEntries(MODELS.map((m) => [m.meta.id, m]));

export function getModel(id) {
    return modelsById[id] || MODELS[0];
}

export const DEFAULT_MODEL_ID = 'p300';
