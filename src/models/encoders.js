// Shared value-encoder library for Shure DSP models.
//
// Many parameters carry an ASCII payload that is NOT the human-readable value. Each
// encoder converts between a REAL value (dB, ms, ratio — what the user thinks in) and the
// API token (zero-padded ASCII the device expects / reports). The UI shows the real value
// as primary and the API token as secondary.
//
// The Shure command API is largely consistent across models, so these encodings are
// shared. `buildEncoders(config)` lets a model override model-specific bits (e.g. the gain
// zero-offset). Mappings are taken verbatim from the Shure command-strings PDFs.

function pad(n, digits) {
    const s = Math.round(n).toString();
    return s.length >= digits ? s : '0'.repeat(digits - s.length) + s;
}

function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}

/**
 * Build the encoder map for a model.
 * @param {object} cfg
 * @param {number} cfg.gainOffsetDb  AUDIO_GAIN_HI_RES / MATRIX_MXR_GAIN zero offset (dB).
 *   ASCII 0000-1400 in 0.1 dB steps; the PDFs do not state the zero point, so a 140 dB
 *   span implies -offset .. (140-offset). Defaults to 110 (-110 .. +30 dB).
 */
export function buildEncoders({ gainOffsetDb = 110 } = {}) {
    return {
        // AUDIO_GAIN_HI_RES, MATRIX_MXR_GAIN : 0000-1400, 0.1 dB steps.
        gainHiRes: {
            unit: 'dB',
            min: -gainOffsetDb,
            max: 1400 / 10 - gainOffsetDb,
            step: 0.1,
            digits: 4,
            toApi: (r) => (r + gainOffsetDb) * 10,
            fromApi: (a) => a / 10 - gainOffsetDb,
            format: (r) => `${r.toFixed(1)} dB`,
        },

        // AGC_MAX_CUT : 000-200 = -20.0 .. 0.0 dB.
        agcMaxCut: {
            unit: 'dB', min: -20, max: 0, step: 0.1, digits: 3,
            toApi: (r) => (r + 20) * 10,
            fromApi: (a) => a / 10 - 20,
            format: (r) => `${r.toFixed(1)} dB`,
        },

        // AGC_MAX_BOOST : 000-200 = 0.0 .. +20.0 dB.
        agcMaxBoost: {
            unit: 'dB', min: 0, max: 20, step: 0.1, digits: 3,
            toApi: (r) => r * 10,
            fromApi: (a) => a / 10,
            format: (r) => `+${r.toFixed(1)} dB`,
        },

        // AGC_TARGET : 000-500 = -50.0 .. 0.0 dBFS.
        agcTarget: {
            unit: 'dBFS', min: -50, max: 0, step: 0.1, digits: 3,
            toApi: (r) => (r + 50) * 10,
            fromApi: (a) => a / 10 - 50,
            format: (r) => `${r.toFixed(1)} dBFS`,
        },

        // AUTOMXR_OFF_ATT : 000-107 = -110 .. -3 dB (1 dB steps).
        offAtt: {
            unit: 'dB', min: -110, max: -3, step: 1, digits: 3,
            toApi: (r) => r + 110,
            fromApi: (a) => a - 110,
            format: (r) => `${r} dB`,
        },

        // COMP_THRESHOLD : 000-600 = -60.0 .. 0.0 dB.
        compThreshold: {
            unit: 'dB', min: -60, max: 0, step: 0.1, digits: 3,
            toApi: (r) => (r + 60) * 10,
            fromApi: (a) => a / 10 - 60,
            format: (r) => `${r.toFixed(1)} dB`,
        },

        // COMP_RATIO : 0010-1000 = 1.0:1 .. 100.0:1.
        compRatio: {
            unit: ':1', min: 1, max: 100, step: 0.1, digits: 4,
            toApi: (r) => r * 10,
            fromApi: (a) => a / 10,
            format: (r) => `${r.toFixed(1)}:1`,
        },

        // AUTOMXR_HOLDTIME : 0100-1500 ms (1 ms steps).
        holdTime: {
            unit: 'ms', min: 100, max: 1500, step: 1, digits: 4,
            toApi: (r) => r, fromApi: (a) => a,
            format: (r) => `${r} ms`,
        },

        // DELAY : 0000-1000 ms (0 disables).
        delay: {
            unit: 'ms', min: 0, max: 1000, step: 1, digits: 4,
            toApi: (r) => r, fromApi: (a) => a,
            format: (r) => `${r} ms`,
        },

        // METER_RATE_* : 00000-99999 ms (0 = off; 1-99 invalid).
        meterRate: {
            unit: 'ms', min: 0, max: 99999, step: 100, digits: 5,
            toApi: (r) => r, fromApi: (a) => a,
            format: (r) => (r === 0 ? 'off' : `${r} ms`),
        },

        // AUTOMXR_GATE_SEN : 1-9.
        gateSen: {
            unit: '', min: 1, max: 9, step: 1, digits: 1,
            toApi: (r) => r, fromApi: (a) => a,
            format: (r) => `${r}`,
        },

        // AUTOMXR_MAX_NOM : 1-8.
        maxNom: {
            unit: 'mics', min: 1, max: 8, step: 1, digits: 1,
            toApi: (r) => r, fromApi: (a) => a,
            format: (r) => `${r}`,
        },
    };
}

/** Encode a real value into the zero-padded ASCII token (clamped to range). */
export function encode(encoder, real) {
    if (!encoder) return String(real);
    const clamped = clamp(real, encoder.min, encoder.max);
    return pad(encoder.toApi(clamped), encoder.digits);
}

/** Decode an ASCII token back to its real value. */
export function decode(encoder, api) {
    if (!encoder) return Number(api);
    return encoder.fromApi(parseInt(api, 10));
}
