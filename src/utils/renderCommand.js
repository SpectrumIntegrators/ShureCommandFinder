// Shared command-string rendering: substitutes channel / filter / value tokens into a
// command template. Used by both the by-function and by-verb command layouts.

export function padN(n, width) {
    return String(n).padStart(width, '0');
}
export function pad2(n) {
    return String(n).padStart(2, '0');
}

export function buildTokens(command, { channel, outputChannel, value, slotValue, padWidth }) {
    return {
        '{xx}': channel != null ? padN(channel, padWidth || 2) : '',
        // PEQ filter / matrix output channels are always 2-digit in the docs.
        '{yy}': command.slot ? pad2(slotValue) : outputChannel != null ? pad2(outputChannel) : '',
        '{v}': value != null ? String(value) : '',
    };
}

export function renderTemplate(tpl, tokens) {
    let s = tpl;
    for (const [k, v] of Object.entries(tokens)) s = s.split(k).join(v);
    return s;
}

const VERB_LABEL = { get: 'GET', set: 'SET', rep: 'REP', extra: '+' };

/** Returns [{ verb, label, text }] for a single command given the current context. */
export function linesFor(command, ctx) {
    const tokens = buildTokens(command, ctx);
    const t = command.templates;
    const out = [];
    if (t.get) out.push({ verb: 'get', label: VERB_LABEL.get, text: renderTemplate(t.get, tokens) });
    if (t.set) out.push({ verb: 'set', label: VERB_LABEL.set, text: renderTemplate(t.set, tokens) });
    (t.rep || []).forEach((r) => out.push({ verb: 'rep', label: VERB_LABEL.rep, text: renderTemplate(r, tokens) }));
    (t.extras || []).forEach((x) => out.push({ verb: 'extra', label: VERB_LABEL.extra, text: renderTemplate(x, tokens) }));
    return out;
}

/** The display order of verbs in the by-verb layout. */
export const VERB_ORDER = [
    { verb: 'get', title: 'GET — query a parameter' },
    { verb: 'set', title: 'SET — change a parameter' },
    { verb: 'rep', title: 'REP — device report (reply / unsolicited)' },
    { verb: 'extra', title: 'Increment / Decrement' },
];

/** Initial param value token for a command (used to seed shared value state). */
export function defaultValue(command, encoders) {
    const p = command.param || { kind: 'none' };
    if (p.kind === 'enum') return p.options[0];
    if (p.kind === 'select') return p.options[0].value;
    if (p.kind === 'raw') return p.default != null ? p.default : '0';
    if (p.kind === 'value') {
        const enc = encoders[p.encoding];
        if (!enc) return '0';
        const real = Math.min(enc.max, Math.max(enc.min, 0));
        return padN(Math.round(enc.toApi(real)), enc.digits);
    }
    return null;
}
