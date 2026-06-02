// Shared command-definition library for Shure DSP models.
//
// The Shure third-party command API is highly consistent across models: the command
// keyword, GET/SET/REP syntax, and value encoding are the same; only WHICH channels a
// command applies to (and which commands a model has) changes. So each command is defined
// ONCE here, and every model composes the ones it supports with a model-specific
// `appliesTo` predicate via cmd()/xcmd()/dcmd().
//
// Template placeholders filled in by CommandCard:
//   {xx} = the element's API channel (2-digit)   {yy} = second token (PEQ filter / matrix out)
//   {v}  = parameter value (encoded ASCII or enum keyword)

// ---- channel predicate helpers (exported for model files) ----
export const range = (a, b) => (ch) => ch >= a && ch <= b;
export const oneOf = (...list) => (ch) => list.includes(ch);
export const any = (...preds) => (ch) => preds.some((p) => p(ch));
export const all = () => true;

const ON_OFF_TOGGLE = { kind: 'enum', label: 'State', options: ['ON', 'OFF', 'TOGGLE'], rep: ['ON', 'OFF'] };
const ON_OFF = { kind: 'enum', label: 'State', options: ['ON', 'OFF'], rep: ['ON', 'OFF'] };
const NONE = { kind: 'none' };

// keyword commands take a TOKEN so one definition serves AUDIO_MUTE, AEC, etc.
function enableCmd(name, group, token, { toggle = true, ...extra } = {}) {
    return {
        name,
        group,
        templates: {
            get: `< GET {xx} ${token} >`,
            set: `< SET {xx} ${token} {v} >`,
            rep: [`< REP {xx} ${token} ON >`, `< REP {xx} ${token} OFF >`],
        },
        param: toggle ? ON_OFF_TOGGLE : ON_OFF,
        ...extra,
    };
}

function valueCmd(name, group, token, encoding, { inc, notes } = {}) {
    const templates = {
        get: `< GET {xx} ${token} >`,
        set: `< SET {xx} ${token} {v} >`,
        rep: [`< REP {xx} ${token} {v} >`],
    };
    if (inc) templates.extras = [`< SET {xx} ${token} ${inc} nn >`, `< SET {xx} ${token} ${inc === 'INC' ? 'DEC' : 'dec'} nn >`];
    return { name, group, templates, param: { kind: 'value', label: name, encoding }, notes };
}

function enumCmd(name, group, token, options, label = 'Value') {
    return {
        name,
        group,
        templates: {
            get: `< GET {xx} ${token} >`,
            set: `< SET {xx} ${token} {v} >`,
            rep: options.map((o) => `< REP {xx} ${token} ${o} >`),
        },
        param: { kind: 'enum', label, options, rep: options },
    };
}

export const LIB = {
    // ===== Identity =====
    chan_name: {
        name: 'Channel Name',
        group: 'Identity',
        templates: { get: '< GET {xx} CHAN_NAME >', rep: ['< REP {xx} CHAN_NAME {name} >'] },
        param: NONE,
        notes: 'Read-only channel name (space-padded).',
    },
    na_chan_name: {
        name: 'Network Audio Channel Name',
        group: 'Identity',
        templates: { get: '< GET {xx} NA_CHAN_NAME >', rep: ['< REP {xx} NA_CHAN_NAME {name} >'] },
        param: NONE,
    },

    // ===== Level =====
    audio_gain: {
        name: 'Audio Gain (Fader)',
        group: 'Level',
        templates: {
            get: '< GET {xx} AUDIO_GAIN_HI_RES >',
            set: '< SET {xx} AUDIO_GAIN_HI_RES {v} >',
            rep: ['< REP {xx} AUDIO_GAIN_HI_RES {v} >'],
            extras: ['< SET {xx} AUDIO_GAIN_HI_RES INC nn >', '< SET {xx} AUDIO_GAIN_HI_RES DEC nn >'],
        },
        param: { kind: 'value', label: 'Gain', encoding: 'gainHiRes' },
        notes: 'ASCII 0000-1400, 0.1 dB steps. INC/DEC nn in 0.1 dB.',
    },
    audio_gain_postgate: {
        name: 'Audio Gain (Post-Gate)',
        group: 'Level',
        templates: {
            get: '< GET {xx} AUDIO_GAIN_POSTGATE >',
            set: '< SET {xx} AUDIO_GAIN_POSTGATE {v} >',
            rep: ['< REP {xx} AUDIO_GAIN_POSTGATE {v} >'],
            extras: ['< SET {xx} AUDIO_GAIN_POSTGATE INC nn >', '< SET {xx} AUDIO_GAIN_POSTGATE DEC nn >'],
        },
        param: { kind: 'value', label: 'Gain', encoding: 'gainHiRes' },
        notes: 'Post-gate (post-automix) channel gain.',
    },
    audio_mute: {
        ...enableCmd('Channel Audio Mute', 'Level', 'AUDIO_MUTE'),
    },
    audio_mute_postgate: {
        ...enableCmd('Channel Audio Mute (Post-Gate)', 'Level', 'AUDIO_MUTE_POSTGATE'),
    },
    chan_led_in_state: {
        name: 'Mic Logic LED In',
        group: 'Mute / Feedback',
        templates: {
            get: '< GET {xx} CHAN_LED_IN_STATE >',
            set: '< SET {xx} CHAN_LED_IN_STATE {v} >',
            rep: ['< REP {xx} CHAN_LED_IN_STATE ON >', '< REP {xx} CHAN_LED_IN_STATE OFF >'],
        },
        param: ON_OFF,
        notes: 'Drives the connected mic’s logic LED. Lets you show mute feedback on the mic while keeping the channel active (e.g. for AEC convergence).',
    },
    audio_in_lvl: enumCmd('Analog Input Level Switch', 'Level', 'AUDIO_IN_LVL_SWITCH', ['LINE_LVL', 'AUX_LVL'], 'Level'),
    audio_out_lvl: enumCmd('Analog Output Level Switch', 'Level', 'AUDIO_OUT_LVL_SWITCH', ['LINE_LVL', 'AUX_LVL', 'MIC_LVL'], 'Level'),
    audio_summing_mode: enumCmd('Audio Summing Mode', 'Level', 'AUDIO_SUMMING_MODE', ['MONO', 'STEREO'], 'Mode'),

    // ===== EQ =====
    peq: {
        name: 'PEQ / EQ Filter Enable',
        group: 'EQ',
        slot: { label: 'Filter', min: 1, max: (ch) => 4 },
        templates: {
            get: '< GET {xx} PEQ {yy} >',
            set: '< SET {xx} PEQ {yy} {v} >',
            rep: ['< REP {xx} PEQ {yy} ON >', '< REP {xx} PEQ {yy} OFF >'],
        },
        param: ON_OFF,
        notes: 'Filter number selects the band; 00 = all bands.',
    },
    bypass_all_eq: enableCmd('Bypass All EQ', 'EQ', 'BYPASS_ALL_EQ', { toggle: false }),
    eq_contour: enableCmd('EQ Contour (Low-Cut)', 'EQ', 'EQ_CONTOUR', { toggle: false }),

    // ===== AEC / Noise / AGC (P300 mic channels) =====
    aec: enableCmd('Acoustic Echo Cancellation', 'AEC', 'AEC'),
    aec_nlp: enumCmd('AEC Non-Linear Processing', 'AEC', 'AEC_NLP', ['LOW', 'MEDIUM', 'HIGH'], 'Level'),
    noise_red: enableCmd('Noise Reduction', 'Noise Reduction', 'NOISE_RED', { toggle: false }),
    noise_red_lvl: enumCmd('Noise Reduction Level', 'Noise Reduction', 'NOISE_RED_LVL', ['LOW', 'MEDIUM', 'HIGH'], 'Level'),
    noise_filter: enableCmd('Noise Reduction Filter', 'Noise Reduction', 'NOISE_FILTER', { toggle: false }),
    agc: enableCmd('Automatic Gain Control', 'AGC', 'AGC'),
    agc_max_cut: valueCmd('AGC Max Cut', 'AGC', 'AGC_MAX_CUT', 'agcMaxCut', { inc: 'inc' }),
    agc_max_boost: valueCmd('AGC Max Boost', 'AGC', 'AGC_MAX_BOOST', 'agcMaxBoost', { inc: 'inc' }),
    agc_target: valueCmd('AGC Target Level', 'AGC', 'AGC_TARGET', 'agcTarget', { inc: 'inc' }),
    directout_point: {
        name: 'Direct Out Tap Point',
        group: 'AGC',
        fw: '4.1',
        templates: {
            get: '< GET {xx} DIRECTOUT_POINT >',
            set: '< SET {xx} DIRECTOUT_POINT {v} >',
            rep: ['< REP {xx} DIRECTOUT_POINT {v} >'],
        },
        param: {
            kind: 'select',
            label: 'Tap Point',
            options: [
                { value: '0', label: '0 - Pre-gate / Pre-processing' },
                { value: '1', label: '1 - Pre-gate / Post-processing' },
                { value: '2', label: '2 - Post-gate / Pre-processing' },
                { value: '3', label: '3 - Post-gate / Post-processing' },
            ],
        },
    },

    // ===== Automixer =====
    automxr_always_on: enableCmd('Automixer Channel Always On', 'Automixer (per channel)', 'AUTOMXR_ALWAYS_ON'),
    automxr_priority: enableCmd('Automixer Channel Priority', 'Automixer (per channel)', 'AUTOMXR_PRIORITY'),
    chan_automix_solo_en: enableCmd('Automix Solo Enable', 'Automixer (per channel)', 'CHAN_AUTOMIX_SOLO_EN', { toggle: false }),
    automxr_gate: {
        name: 'Automixer Gate Status',
        group: 'Automixer (per channel)',
        templates: { get: '< GET {xx} AUTOMXR_GATE >', rep: ['< REP {xx} AUTOMXR_GATE ON >', '< REP {xx} AUTOMXR_GATE OFF >'] },
        param: NONE,
        notes: 'Read-only gate open/closed status.',
    },
    automxr_mode: enumCmd('Automixer Mode', 'Automixer', 'AUTOMXR_MODE', ['MANUAL', 'GAINSHARE', 'GATING'], 'Mode'),
    automxr_off_att: valueCmd('Automixer Off Attenuation', 'Automixer', 'AUTOMXR_OFF_ATT', 'offAtt'),
    automxr_gate_sen: valueCmd('Automixer Gating Sensitivity', 'Automixer', 'AUTOMXR_GATE_SEN', 'gateSen', { inc: 'inc' }),
    automxr_max_nom: valueCmd('Automixer Maximum Number of Mics', 'Automixer', 'AUTOMXR_MAX_NOM', 'maxNom'),
    automxr_lmlo: enableCmd('Automixer Last Mic Lock On', 'Automixer', 'AUTOMXR_LMLO'),
    automxr_holdtime: valueCmd('Automixer Hold Time', 'Automixer', 'AUTOMXR_HOLDTIME', 'holdTime'),
    automxr_mute: {
        ...enableCmd('Automixer Output Mute (System Mute)', 'Automixer', 'AUTOMXR_MUTE'),
        notes: 'Preferred command for system mute (ON = muted). Keeps AEC/automix processing running.',
    },
    speech_gating: enableCmd('Speech Gating', 'Automixer', 'SPEECH_GATING', { toggle: false }),

    // ===== Compressor =====
    compressor: enableCmd('Compressor Enable', 'Compressor', 'COMPRESSOR'),
    comp_threshold: valueCmd('Compressor Threshold', 'Compressor', 'COMP_THRESHOLD', 'compThreshold'),
    comp_ratio: valueCmd('Compressor Ratio', 'Compressor', 'COMP_RATIO', 'compRatio'),

    // ===== AEC reference =====
    aec_ref: {
        name: 'AEC Reference Signal',
        group: 'AEC Reference',
        templates: { get: '< GET {xx} AEC_REF >', set: '< SET {xx} AEC_REF {v} >', rep: ['< REP {xx} AEC_REF {v} >'] },
        param: { kind: 'select', label: 'Reference', options: [] }, // model supplies options
    },

    // ===== Delay =====
    delay: { ...valueCmd('Output Delay', 'Delay', 'DELAY', 'delay'), notes: '0 ms disables the delay unit.' },

    // ===== Phantom power / logic (ANI) =====
    phantom_pwr: enableCmd('Phantom Power (48V)', 'Input', 'PHANTOM_PWR_ENABLE', { toggle: false }),
    hw_gating_logic: enableCmd('Hardware Gating Logic Out', 'Logic', 'HW_GATING_LOGIC', { toggle: false }),

    // ===== Matrix crosspoint (xx input x yy output) =====
    matrix_route: {
        name: 'Matrix Crosspoint Route',
        group: 'Matrix',
        templates: {
            get: '< GET {xx} MATRIX_MXR_ROUTE {yy} >',
            set: '< SET {xx} MATRIX_MXR_ROUTE {yy} {v} >',
            rep: ['< REP {xx} MATRIX_MXR_ROUTE {yy} ON >', '< REP {xx} MATRIX_MXR_ROUTE {yy} OFF >'],
        },
        param: ON_OFF,
    },
    matrix_gain: {
        name: 'Matrix Crosspoint Gain',
        group: 'Matrix',
        templates: {
            get: '< GET {xx} MATRIX_MXR_GAIN {yy} >',
            set: '< SET {xx} MATRIX_MXR_GAIN {yy} {v} >',
            rep: ['< REP {xx} MATRIX_MXR_GAIN {yy} {v} >'],
            extras: ['< SET {xx} MATRIX_MXR_GAIN {yy} INC nn >', '< SET {xx} MATRIX_MXR_GAIN {yy} DEC nn >'],
        },
        param: { kind: 'value', label: 'Gain', encoding: 'gainHiRes' },
    },

    // ===== Per-channel status (read-only) =====
    audio_out_clip: {
        name: 'Audio Clip Indicator',
        group: 'Status',
        templates: { get: '< GET {xx} AUDIO_OUT_CLIP_INDICATOR >', rep: ['< REP {xx} AUDIO_OUT_CLIP_INDICATOR ON >', '< REP {xx} AUDIO_OUT_CLIP_INDICATOR OFF >'] },
        param: NONE,
        notes: 'Read-only clip indicator.',
    },
    limiter_engaged: {
        name: 'Limiter Engaged',
        group: 'Status',
        templates: { get: '< GET {xx} LIMITER_ENGAGED >', rep: ['< REP {xx} LIMITER_ENGAGED ON >', '< REP {xx} LIMITER_ENGAGED OFF >'] },
        param: NONE,
        notes: 'Read-only. Indicates the limiter is reducing the signal level.',
    },
    encryption_ch: {
        name: 'Audio Encryption Status',
        group: 'Status',
        templates: { get: '< GET {xx} ENCRYPTION_CH >', rep: ['< REP {xx} ENCRYPTION_CH ON >', '< REP {xx} ENCRYPTION_CH OFF >'] },
        param: NONE,
        notes: 'Read-only.',
    },
    audio_in_peak: {
        name: 'Input Peak Level',
        group: 'Status',
        templates: { get: '< GET {xx} AUDIO_IN_PEAK_LVL >', rep: ['< REP {xx} AUDIO_IN_PEAK_LVL {v} >'] },
        param: NONE,
        notes: 'Read-only peak meter value.',
    },
    audio_in_rms: {
        name: 'Input RMS Level',
        group: 'Status',
        templates: { get: '< GET {xx} AUDIO_IN_RMS_LVL >', rep: ['< REP {xx} AUDIO_IN_RMS_LVL {v} >'] },
        param: NONE,
        notes: 'Read-only RMS meter value.',
    },

    // ===== Utility =====
    get_all: {
        name: 'Get All Parameters',
        group: 'Utility',
        templates: { get: '< GET {xx} ALL >', rep: ['< REP ... >  (one report per parameter)'] },
        param: NONE,
        notes: 'Requests the status of every parameter on this channel.',
    },
};

// ===== Device-level (no channel) command definitions =====
export const DEVICE_LIB = {
    model: { name: 'Model Number', group: 'Identity', templates: { get: '< GET MODEL >', rep: ['< REP MODEL {32-char model} >'] }, param: NONE },
    serial: { name: 'Serial Number', group: 'Identity', templates: { get: '< GET SERIAL_NUM >', rep: ['< REP SERIAL_NUM {32-char serial} >'] }, param: NONE },
    fw_ver: { name: 'Firmware Version', group: 'Identity', templates: { get: '< GET FW_VER >', rep: ['< REP FW_VER {version} >'] }, param: NONE },
    device_id: { name: 'Device ID', group: 'Identity', templates: { get: '< GET DEVICE_ID >', rep: ['< REP DEVICE_ID {31-char id} >'] }, param: NONE },
    na_device_name: { name: 'Network Audio Device Name', group: 'Identity', templates: { get: '< GET NA_DEVICE_NAME >', rep: ['< REP NA_DEVICE_NAME {31-char name} >'] }, param: NONE },
    preset: {
        name: 'Preset Recall',
        group: 'Presets',
        templates: { get: '< GET PRESET >', set: '< SET PRESET {v} >', rep: ['< REP PRESET {v} >'] },
        param: { kind: 'select', label: 'Preset', options: Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: `Preset ${i + 1}` })) },
        notes: 'Leading zero optional on SET. GET PRESET1..PRESET10 returns preset names.',
    },
    device_audio_mute: { ...enableCmd('Device Audio Mute', 'Mute', 'DEVICE_AUDIO_MUTE'), templates: { get: '< GET DEVICE_AUDIO_MUTE >', set: '< SET DEVICE_AUDIO_MUTE {v} >', rep: ['< REP DEVICE_AUDIO_MUTE ON >', '< REP DEVICE_AUDIO_MUTE OFF >'] } },
    flash: { name: 'Flash Lights (Identify)', group: 'Device', templates: { get: '< GET FLASH >', set: '< SET FLASH {v} >', rep: ['< REP FLASH ON >', '< REP FLASH OFF >'] }, param: ON_OFF, notes: 'Flash auto-stops after 30 seconds.' },
    led_brightness: {
        name: 'LED Brightness',
        group: 'Device',
        templates: { get: '< GET LED_BRIGHTNESS >', set: '< SET LED_BRIGHTNESS {v} >', rep: ['< REP LED_BRIGHTNESS {v} >'] },
        param: { kind: 'select', label: 'Brightness', options: [{ value: '0', label: '0 - Disabled' }, { value: '1', label: '1 - Dim' }, { value: '2', label: '2 - Default' }] },
    },
    reboot: { name: 'Reboot', group: 'Device', templates: { set: '< SET REBOOT >', rep: ['< REP REBOOT >'] }, param: NONE },
    default_settings: { name: 'Restore Default Settings', group: 'Device', templates: { set: '< SET DEFAULT_SETTINGS >', rep: ['< REP PRESET 00 >  (00 = success)'] }, param: NONE },
    encryption: { name: 'Encryption Status', group: 'Network', templates: { get: '< GET ENCRYPTION >', rep: ['< REP ENCRYPTION ON >', '< REP ENCRYPTION OFF >'] }, param: NONE, notes: 'Read-only.' },
    encryption_ch: { name: 'Audio Encryption Status', group: 'Network', templates: { get: '< GET ENCRYPTION_CH >', rep: ['< REP ENCRYPTION_CH ON >', '< REP ENCRYPTION_CH OFF >'] }, param: NONE, notes: 'Read-only.' },
    usb_connect: { name: 'USB Connection Status', group: 'Network', templates: { get: '< GET USB_CONNECT >', rep: ['< REP USB_CONNECT ON >', '< REP USB_CONNECT OFF >'] }, param: NONE, notes: 'Read-only.' },
    ip_addr: {
        name: 'Audio Network IP / Subnet / Gateway',
        group: 'Network',
        templates: { get: '< GET IP_ADDR_NET_AUDIO_PRIMARY >', rep: ['< REP IP_ADDR_NET_AUDIO_PRIMARY {IP} >', '< REP IP_SUBNET_NET_AUDIO_PRIMARY {subnet} >', '< REP IP_GATEWAY_NET_AUDIO_PRIMARY {gateway} >'] },
        param: NONE,
        notes: 'Also: GET IP_SUBNET_NET_AUDIO_PRIMARY, GET IP_GATEWAY_NET_AUDIO_PRIMARY.',
    },
    control_mac: { name: 'Control Network MAC Address', group: 'Network', templates: { get: '< GET CONTROL_MAC_ADDR >', rep: ['< REP CONTROL_MAC_ADDR yy:yy:yy:yy:yy:yy >'] }, param: NONE, notes: 'Read-only.' },
    input_meter_mode: enumDevice('Input Meter Display Mode', 'Metering', 'INPUT_METER_MODE', ['PRE_FADER', 'POST_FADER']),
    output_meter_mode: enumDevice('Output Meter Display Mode', 'Metering', 'OUTPUT_METER_MODE', ['PRE_FADER', 'POST_FADER']),
    meter_rate: { name: 'Metering Rate', group: 'Metering', templates: { get: '< GET METER_RATE >', set: '< SET METER_RATE {v} >', rep: ['< REP METER_RATE {v} >'] }, param: { kind: 'value', label: 'Rate', encoding: 'meterRate' }, notes: '0 = off. Values 1-99 ms invalid.' },
    logic_mute: { name: 'Logic Mute (System Mute)', group: 'Mute', templates: { get: '< GET LOGIC_MUTE >', set: '< SET LOGIC_MUTE {v} >', rep: ['< REP LOGIC_MUTE ON >', '< REP LOGIC_MUTE OFF >'] }, param: ON_OFF, notes: 'Mute-sync: sets the system mute state. ON = muted.' },
    preset_audio_route: { name: 'Preset Audio Route', group: 'Presets', templates: { get: '< GET PRESET_AUDIO_ROUTE >', set: '< SET PRESET_AUDIO_ROUTE {v} >', rep: ['< REP PRESET_AUDIO_ROUTE {v} >'] }, param: { kind: 'select', label: 'Route Preset', options: Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: `Route ${i + 1}` })) }, notes: 'Audio-routing presets (01-10; 0 = none active).' },
    onhook_enable: { name: 'Call Status Enable', group: 'Call Status', templates: { get: '< GET ONHOOK_ENABLE >', set: '< SET ONHOOK_ENABLE {v} >', rep: ['< REP ONHOOK_ENABLE ON >', '< REP ONHOOK_ENABLE OFF >'] }, param: ON_OFF },
    onhook_state: { name: 'Call Status State', group: 'Call Status', templates: { get: '< GET ONHOOK_STATE >', rep: ['< REP ONHOOK_STATE ONHOOK >', '< REP ONHOOK_STATE OFFHOOK >'] }, param: NONE, notes: 'Read-only. ONHOOK = not in a call.' },
};

function enumDevice(name, group, token, options) {
    return {
        name,
        group,
        templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: options.map((o) => `< REP ${token} ${o} >`) },
        param: { kind: 'enum', label: 'Mode', options, rep: options },
    };
}

// ---- ad-hoc device-command builders for model-specific globals ----
export function deviceEnumCmd(id, name, group, token, options, label = 'Mode') {
    return {
        id, name, group,
        templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: options.map((o) => `< REP ${token} ${o} >`) },
        param: { kind: 'enum', label, options, rep: options },
    };
}
export function deviceEnableCmd(id, name, group, token) {
    return {
        id, name, group,
        templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: [`< REP ${token} ON >`, `< REP ${token} OFF >`] },
        param: { kind: 'enum', label: 'State', options: ['ON', 'OFF'], rep: ['ON', 'OFF'] },
    };
}
export function deviceRoCmd(id, name, group, token, vals) {
    return {
        id, name, group,
        templates: { get: `< GET ${token} >`, rep: vals.map((v) => `< REP ${token} ${v} >`) },
        param: { kind: 'none' },
    };
}

// Flexible per-channel command builder for model-specific tokens not in LIB.
// param: ON_OFF_TOGGLE | ON_OFF | {kind:'enum',options,rep} | {kind:'value',encoding,label}
//        | {kind:'raw',label,hint} | {kind:'none'} (read-only -> opts.repVals)
export function chanCmd(id, name, group, token, param, appliesTo, opts = {}) {
    const templates = { get: `< GET {xx} ${token} >` };
    if (param.kind === 'none') {
        templates.rep = (opts.repVals || ['{v}']).map((v) => `< REP {xx} ${token} ${v} >`);
    } else if (param.kind === 'enum') {
        templates.set = `< SET {xx} ${token} {v} >`;
        templates.rep = param.rep.map((v) => `< REP {xx} ${token} ${v} >`);
    } else {
        templates.set = `< SET {xx} ${token} {v} >`;
        templates.rep = [`< REP {xx} ${token} {v} >`];
        if (opts.inc) templates.extras = [`< SET {xx} ${token} INC nn >`, `< SET {xx} ${token} DEC nn >`];
    }
    return { id, name, group, templates, param, appliesTo, notes: opts.notes, fw: opts.fw, slot: opts.slot };
}

export function deviceValueCmd(id, name, group, token, encoding, opts = {}) {
    const templates = { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: [`< REP ${token} {v} >`] };
    if (opts.inc) templates.extras = [`< SET ${token} INC nn >`, `< SET ${token} DEC nn >`];
    return { id, name, group, templates, param: { kind: 'value', label: name, encoding }, notes: opts.notes };
}

export function deviceRawCmd(id, name, group, token, opts = {}) {
    return {
        id, name, group,
        templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: [`< REP ${token} {v} >`] },
        param: { kind: 'raw', label: opts.label || name, hint: opts.hint, placeholder: opts.placeholder, default: opts.default },
        notes: opts.notes,
    };
}

// Common param presets re-exported for models.
export const P_ON_OFF = ON_OFF;
export const P_ON_OFF_TOGGLE = ON_OFF_TOGGLE;

// ---- composition helpers used by model files ----
export function cmd(id, appliesTo, overrides = {}) {
    const base = LIB[id];
    if (!base) throw new Error(`Unknown command id: ${id}`);
    return { id, ...base, appliesTo, ...overrides };
}

export function xcmd(id, appliesToCrosspoint, overrides = {}) {
    const base = LIB[id];
    if (!base) throw new Error(`Unknown crosspoint command id: ${id}`);
    return { id, ...base, appliesToCrosspoint, ...overrides };
}

export function dcmd(id, overrides = {}) {
    const base = DEVICE_LIB[id];
    if (!base) throw new Error(`Unknown device command id: ${id}`);
    return { id, ...base, ...overrides };
}
