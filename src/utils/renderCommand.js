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

// Splits a rendered command string into literal vs. placeholder segments so the UI can
// style the placeholders (the parts you replace with a real value) differently.
// Two flavours of placeholder are recognised:
//   1. The text INSIDE curly braces. The braces themselves are literal — Shure wraps
//      string/value fields (names, IDs, IP addresses, …) in real { } in its responses,
//      so { } are part of the reply, not a "this is a variable" marker.
//   2. All-lowercase letter tokens (nn, yy, position, status, lobe, …). Shure writes value
//      placeholders in lowercase; command keywords are UPPERCASE and real enum values are
//      UPPERCASE or Mixed-case (ON, Muted), so they stay literal. The lowercase command
//      words inc/dec are the exception and are kept literal.
const PLACEHOLDER_DENYLIST = new Set(['inc', 'dec']);
export function toSegments(text) {
    const segs = [];
    const pushLiteral = (str) => {
        if (str) segs.push({ ph: false, v: str });
    };
    // Within a non-brace span, mark lowercase letter-runs (value placeholders) and leave
    // uppercase keywords / mixed-case values as literal text.
    const pushSpan = (str) => {
        const re = /[A-Za-z]+/g;
        let last = 0;
        let m;
        while ((m = re.exec(str))) {
            const tok = m[0];
            if (!/^[a-z]+$/.test(tok) || PLACEHOLDER_DENYLIST.has(tok)) continue;
            pushLiteral(str.slice(last, m.index));
            segs.push({ ph: true, v: tok });
            last = m.index + tok.length;
        }
        pushLiteral(str.slice(last));
    };
    const braceRe = /\{([^}]*)\}/g;
    let i = 0;
    let b;
    while ((b = braceRe.exec(text))) {
        pushSpan(text.slice(i, b.index));
        pushLiteral('{');
        if (b[1]) segs.push({ ph: true, v: b[1] });
        pushLiteral('}');
        i = b.index + b[0].length;
    }
    pushSpan(text.slice(i));
    return segs;
}

const VERB_LABEL = { get: 'GET', set: 'SET', rep: 'REP', extra: '+' };

// A REP must never echo the value you typed into a SET. So the {v} in a REP renders as a
// placeholder, never the live value:
//   - Fixed-width fields → a run of n's (numbers) the exact width the device pads to, so a
//     copied REP can be counted column-by-column.
//   - Variable / enumerated values (e.g. a polar pattern of TOROID … BIDIRECTION) aren't a
//     fixed width, so there's nothing to count — they show the field NAME instead.
// Multi-value reps and fixed enum response sets are spelled out in the template itself
// (aaa bbb…, or one REP line per option).
function repPlaceholder(command, encoders) {
    const p = command.param || {};
    if (p.kind === 'value') {
        const enc = encoders && encoders[p.encoding];
        return enc && enc.digits ? 'n'.repeat(enc.digits) : 'nn';
    }
    if (p.kind === 'select') {
        const opts = p.options || [];
        // Numeric, fixed-width options (preset 01-10, brightness 0-5) → sized n's.
        if (opts.length && opts.every((o) => /^\d+$/.test(o.value))) {
            return 'n'.repeat(Math.max(...opts.map((o) => String(o.value).length)));
        }
        // Keyword options are variable width → name the field.
        return (p.label || 'value').toLowerCase();
    }
    return 'nn';
}

/** Returns [{ verb, label, text }] for a single command given the current context. */
export function linesFor(command, ctx) {
    const tokens = buildTokens(command, ctx);
    // REP lines get an illustrative placeholder for {v}; SET/extras keep the live value.
    const repTokens = { ...tokens, '{v}': repPlaceholder(command, ctx.encoders) };
    const t = command.templates;
    const out = [];
    if (t.get) out.push({ verb: 'get', label: VERB_LABEL.get, text: renderTemplate(t.get, tokens) });
    if (t.set) out.push({ verb: 'set', label: VERB_LABEL.set, text: renderTemplate(t.set, tokens) });
    (t.rep || []).forEach((r) => out.push({ verb: 'rep', label: VERB_LABEL.rep, text: renderTemplate(r, repTokens) }));
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
