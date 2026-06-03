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

// Fixed-width text placeholder for REP responses: a run of 'x' the exact length the device
// pads the field to, so the output can be copied and its columns counted.
const xs = (n) => 'x'.repeat(n);

// ---- Command category, keyed by command id ----
// Drives the command-panel tabs, which are built dynamically: a tab appears only when the
// current selection has commands in it, plus an "All" tab. Cross-cutting categories:
//   basic   — what an interactive control system reaches for constantly: level, mute,
//             crosspoint routing, preset recall, state sync.
//   tuning  — signal-path / DSP configuration you set once at commissioning or bake into a
//             preset/system mode: EQ, dynamics, AEC, NR, AGC, automixer, level switches, delay.
//   details — identity, network, metering, status/diagnostics, LED appearance, maintenance.
// Feature-specific categories surface as their own tab only on models that have them:
//   beamforming — per-lobe steering / autofocus.   coverage — Automatic Coverage areas,
//   array setup, talker positioning (MXA920).
//   (unlisted) — falls into the catch-all "Other" tab (deprecated / firmware-locked / odd).
// Categories are intrinsic to a command, so they live here once and are injected by the
// composition helpers (cmd/dcmd/xcmd and the device/channel builders) rather than per model.
export const CATEGORY = {
    // --- basic ---
    audio_gain: 'basic', audio_gain_postgate: 'basic', audio_mute: 'basic', audio_mute_postgate: 'basic',
    automxr_mute: 'basic', device_audio_mute: 'basic', logic_mute: 'basic',
    matrix_route: 'basic', matrix_gain: 'basic', preset: 'basic', preset_audio_route: 'basic',
    ca_gain: 'basic', ca_mute: 'basic', get_all: 'basic',

    // --- tuning ---
    audio_in_lvl: 'tuning', audio_out_lvl: 'tuning', audio_summing_mode: 'tuning',
    peq: 'tuning', bypass_all_eq: 'tuning', eq_contour: 'tuning', bypass_imx: 'tuning',
    aec: 'tuning', aec_nlp: 'tuning', aec_ref: 'tuning',
    noise_red: 'tuning', noise_red_lvl: 'tuning', noise_filter: 'tuning',
    agc: 'tuning', agc_max_cut: 'tuning', agc_max_boost: 'tuning', agc_target: 'tuning',
    compressor: 'tuning', comp_threshold: 'tuning', comp_ratio: 'tuning',
    automxr_mode: 'tuning', automxr_always_on: 'tuning', automxr_priority: 'tuning',
    automxr_off_att: 'tuning', automxr_gate_sen: 'tuning', automxr_max_nom: 'tuning',
    automxr_lmlo: 'tuning', automxr_holdtime: 'tuning', speech_gating: 'tuning',
    chan_automix_solo_en: 'tuning', directout_point: 'tuning', delay: 'tuning',
    phantom_pwr: 'tuning', hw_gating_logic: 'tuning', polar_pattern: 'tuning',
    mute_control_func: 'tuning', mute_control_mode: 'tuning', default_toggle_state: 'tuning',
    device_installation: 'tuning', speaker: 'basic', low_cut_filter: 'tuning',
    sig_gen: 'tuning', sig_gen_type: 'tuning', sig_gen_freq: 'tuning', sig_gen_gain: 'tuning',

    // --- beamforming (MXA per-lobe steering / focus) ---
    beam_x: 'beamforming', beam_y: 'beamforming', beam_z: 'beamforming', beam_w: 'beamforming',
    beam_x_af: 'beamforming', beam_y_af: 'beamforming', beam_z_af: 'beamforming',
    autofocus: 'beamforming', clear_af: 'beamforming',
    lobe_angle: 'beamforming', beam_angle: 'beamforming',

    // --- coverage (MXA920 Automatic Coverage / array / talker positioning) ---
    auto_coverage: 'coverage', ca_dedicated: 'coverage', ca_dynamic: 'coverage',
    array_height: 'coverage', vab: 'coverage', array_group: 'coverage', array_group_status: 'coverage',
    talker_position_rate: 'coverage', talker_position_sensitivity: 'coverage', talker_positions: 'coverage',

    // --- details ---
    chan_name: 'details', na_chan_name: 'details', na_device_name: 'details',
    model: 'details', serial: 'details', fw_ver: 'details', device_id: 'details',
    preset_names: 'details', preset_name: 'details', last_error_event: 'details',
    flash: 'details', reboot: 'details', default_settings: 'details',
    led_brightness: 'details', led_brightness_basic: 'details', dev_led_in_state: 'details', dev_mute_status_led_state: 'details',
    led_color_muted: 'details', led_color_unmuted: 'details', led_state_muted: 'details', led_state_unmuted: 'details',
    led_color_sig_clip: 'details', led_state_sig_clip: 'details', chan_led_in_state: 'details',
    encryption: 'details', encryption_ch: 'details', usb_connect: 'details',
    ip_addr: 'details', control_mac: 'details',
    input_meter_mode: 'details', output_meter_mode: 'details', meter_rate: 'details',
    meter_rate_in: 'details', meter_rate_out: 'details', meter_rate_proc: 'details',
    meter_rate_erle: 'details', meter_rate_agc: 'details', meter_rate_postgate: 'details',
    meter_rate_mxr_gain: 'details', meter_rate_precomp: 'details', meter_rate_aecref: 'details',
    ca_meter_rate: 'details',
    onhook_enable: 'details', onhook_state: 'details',
    automxr_gate: 'details', automix_gate_ext: 'details', automix_gate_out_ca: 'details',
    audio_out_clip: 'details', limiter_engaged: 'details', noise_lvl: 'details',
    audio_in_peak: 'details', audio_in_rms: 'details', num_active_mics: 'details',
    device_state: 'details', ext_switch_out_state: 'details', mute_button_status: 'details',
    chan_mute_status_led_state: 'details', mute_button_led_state: 'details',
};

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
        templates: { get: '< GET {xx} CHAN_NAME >', rep: [`< REP {xx} CHAN_NAME {${xs(31)}} >`] },
        param: NONE,
        notes: 'Read-only channel name (space-padded).',
    },
    na_chan_name: {
        name: 'Network Audio Channel Name',
        group: 'Identity',
        templates: { get: '< GET {xx} NA_CHAN_NAME >', rep: [`< REP {xx} NA_CHAN_NAME {${xs(31)}} >`] },
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
    polar_pattern: {
        name: 'Polar Pattern',
        group: 'Beam',
        templates: { get: '< GET {xx} POLAR_PATTERN >', set: '< SET {xx} POLAR_PATTERN {v} >', rep: ['< REP {xx} POLAR_PATTERN {v} >'] },
        param: {
            kind: 'select',
            label: 'Pattern',
            options: [
                { value: 'TOROID', label: 'TOROID' },
                { value: 'OMNI', label: 'OMNI (Omnidirectional)' },
                { value: 'CARDIOID', label: 'CARDIOID' },
                { value: 'SUPER', label: 'SUPER (Supercardioid)' },
                { value: 'HYPER', label: 'HYPER (Hypercardioid)' },
                { value: 'BIDIRECTION', label: 'BIDIRECTION (Bidirectional)' },
            ],
        },
    },

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
    gate_inhibit: {
        ...enableCmd('Automixer Gate Inhibit', 'Automixer', 'GATE_INHIBIT'),
        notes: 'Holds the automixer gates closed. Only works on firmware older than 4.1.x.',
    },
    noise_lvl: {
        name: 'Noise Level Estimate',
        group: 'Noise Reduction',
        templates: { get: '< GET {xx} NOISE_LVL >', rep: ['< REP {xx} NOISE_LVL LOW >', '< REP {xx} NOISE_LVL MEDIUM >', '< REP {xx} NOISE_LVL HIGH >'] },
        param: NONE,
        notes: 'Read-only estimate of the channel noise level.',
    },

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
        templates: { get: '< GET {xx} ALL >' },
        param: NONE,
        notes: 'Requests the status of every parameter on this channel.',
    },
};

// Microflex LED commands share a fixed colour palette and a small state set; modelled as
// dropdowns/toggles so the named options (not raw codes) are shown.
const LED_COLOR_OPTS = [
    'RED', 'ORANGE', 'GOLD', 'YELLOW', 'YELLOWGREEN', 'GREEN', 'TURQUOISE', 'POWDERBLUE',
    'CYAN', 'SKYBLUE', 'BLUE', 'PURPLE', 'LIGHTPURPLE', 'VIOLET', 'ORCHID', 'PINK', 'WHITE',
].map((c) => ({ value: c, label: c }));
const ledColorCmd = (name, token) => ({
    name, group: 'LED',
    templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: [`< REP ${token} {v} >`] },
    param: { kind: 'select', label: 'Color', options: LED_COLOR_OPTS },
});
const ledStateCmd = (name, token) => ({
    name, group: 'LED',
    templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: ['ON', 'FLASHING', 'OFF'].map((s) => `< REP ${token} ${s} >`) },
    param: { kind: 'enum', label: 'State', options: ['ON', 'FLASHING', 'OFF'], rep: ['ON', 'FLASHING', 'OFF'] },
});

// ===== Device-level (no channel) command definitions =====
export const DEVICE_LIB = {
    model: { name: 'Model Number', group: 'Identity', templates: { get: '< GET MODEL >', rep: [`< REP MODEL {${xs(32)}} >`] }, param: NONE },
    serial: { name: 'Serial Number', group: 'Identity', templates: { get: '< GET SERIAL_NUM >', rep: [`< REP SERIAL_NUM {${xs(32)}} >`] }, param: NONE },
    fw_ver: { name: 'Firmware Version', group: 'Identity', templates: { get: '< GET FW_VER >', rep: [`< REP FW_VER {${xs(18)}} >`] }, param: NONE },
    device_id: { name: 'Device ID', group: 'Identity', templates: { get: '< GET DEVICE_ID >', rep: [`< REP DEVICE_ID {${xs(31)}} >`] }, param: NONE },
    na_device_name: { name: 'Network Audio Device Name', group: 'Identity', templates: { get: '< GET NA_DEVICE_NAME >', rep: [`< REP NA_DEVICE_NAME {${xs(31)}} >`] }, param: NONE },
    preset: {
        name: 'Preset Recall',
        group: 'Presets',
        templates: { get: '< GET PRESET >', set: '< SET PRESET {v} >', rep: ['< REP PRESET {v} >'] },
        param: { kind: 'select', label: 'Preset', options: Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: `Preset ${i + 1}` })) },
        notes: 'Leading zero optional on SET. GET PRESET1..PRESET10 returns preset names.',
    },
    device_audio_mute: { ...enableCmd('Device Audio Mute', 'Mute', 'DEVICE_AUDIO_MUTE'), templates: { get: '< GET DEVICE_AUDIO_MUTE >', set: '< SET DEVICE_AUDIO_MUTE {v} >', rep: ['< REP DEVICE_AUDIO_MUTE ON >', '< REP DEVICE_AUDIO_MUTE OFF >'] } },
    flash: { name: 'Flash Lights (Identify)', group: 'Device', templates: { get: '< GET FLASH >', set: '< SET FLASH {v} >', rep: ['< REP FLASH ON >', '< REP FLASH OFF >'] }, param: ON_OFF, notes: 'Flash auto-stops after 30 seconds.' },
    // Newer devices (MXA mics, MXA-MUTE) use 0-5 percentage steps.
    led_brightness: {
        name: 'LED Brightness',
        group: 'Device',
        templates: { get: '< GET LED_BRIGHTNESS >', set: '< SET LED_BRIGHTNESS {v} >', rep: ['< REP LED_BRIGHTNESS {v} >'] },
        param: {
            kind: 'select', label: 'Brightness',
            options: [
                { value: '0', label: '0 - Disabled' }, { value: '1', label: '1 - 20%' }, { value: '2', label: '2 - 40%' },
                { value: '3', label: '3 - 60%' }, { value: '4', label: '4 - 80%' }, { value: '5', label: '5 - 100%' },
            ],
        },
    },
    // Legacy 3-level scheme (P300, ANI family).
    led_brightness_basic: {
        name: 'LED Brightness',
        group: 'Device',
        templates: { get: '< GET LED_BRIGHTNESS >', set: '< SET LED_BRIGHTNESS {v} >', rep: ['< REP LED_BRIGHTNESS {v} >'] },
        param: { kind: 'select', label: 'Brightness', options: [{ value: '0', label: '0 - Disabled' }, { value: '1', label: '1 - Dim' }, { value: '2', label: '2 - Default' }] },
    },
    led_color_muted: ledColorCmd('LED Color (Muted)', 'LED_COLOR_MUTED'),
    led_color_unmuted: ledColorCmd('LED Color (Unmuted)', 'LED_COLOR_UNMUTED'),
    led_state_muted: ledStateCmd('LED State (Muted)', 'LED_STATE_MUTED'),
    led_state_unmuted: ledStateCmd('LED State (Unmuted)', 'LED_STATE_UNMUTED'),
    led_color_sig_clip: ledColorCmd('LED Color (Signal/Clip)', 'LED_COLOR_SIG_CLIP'),
    led_state_sig_clip: ledStateCmd('LED State (Signal/Clip)', 'LED_STATE_SIG_CLIP'),
    reboot: { name: 'Reboot', group: 'Device', templates: { set: '< SET REBOOT >', rep: ['< REP REBOOT >'] }, param: NONE },
    default_settings: { name: 'Restore Default Settings', group: 'Device', templates: { set: '< SET DEFAULT_SETTINGS >', rep: ['< REP PRESET 00 >'] }, param: NONE, notes: 'Replies with PRESET 00 on success.' },
    encryption: { name: 'Encryption Status', group: 'Network', templates: { get: '< GET ENCRYPTION >', rep: ['< REP ENCRYPTION ON >', '< REP ENCRYPTION OFF >'] }, param: NONE, notes: 'Read-only.' },
    encryption_ch: { name: 'Audio Encryption Status', group: 'Network', templates: { get: '< GET ENCRYPTION_CH >', rep: ['< REP ENCRYPTION_CH ON >', '< REP ENCRYPTION_CH OFF >'] }, param: NONE, notes: 'Read-only.' },
    usb_connect: { name: 'USB Connection Status', group: 'Network', templates: { get: '< GET USB_CONNECT >', rep: ['< REP USB_CONNECT ON >', '< REP USB_CONNECT OFF >'] }, param: NONE, notes: 'Read-only.' },
    ip_addr: {
        name: 'Audio Network IP / Subnet / Gateway',
        group: 'Network',
        templates: { get: '< GET IP_ADDR_NET_AUDIO_PRIMARY >', rep: ['< REP IP_ADDR_NET_AUDIO_PRIMARY {nnn.nnn.nnn.nnn} >', '< REP IP_SUBNET_NET_AUDIO_PRIMARY {nnn.nnn.nnn.nnn} >', '< REP IP_GATEWAY_NET_AUDIO_PRIMARY {nnn.nnn.nnn.nnn} >'] },
        param: NONE,
        notes: 'Also: GET IP_SUBNET_NET_AUDIO_PRIMARY, GET IP_GATEWAY_NET_AUDIO_PRIMARY.',
    },
    control_mac: { name: 'Control Network MAC Address', group: 'Network', templates: { get: '< GET CONTROL_MAC_ADDR >', rep: ['< REP CONTROL_MAC_ADDR yy:yy:yy:yy:yy:yy >'] }, param: NONE, notes: 'Read-only.' },
    input_meter_mode: enumDevice('Input Meter Display Mode', 'Metering', 'INPUT_METER_MODE', ['PRE_FADER', 'POST_FADER']),
    output_meter_mode: enumDevice('Output Meter Display Mode', 'Metering', 'OUTPUT_METER_MODE', ['PRE_FADER', 'POST_FADER']),
    meter_rate: { name: 'Metering Rate', group: 'Metering', templates: { get: '< GET METER_RATE >', set: '< SET METER_RATE {v} >', rep: ['< REP METER_RATE {v} >'] }, param: { kind: 'value', label: 'Rate', encoding: 'meterRate' }, notes: '0 = off. Values 1-99 ms invalid.' },
    logic_mute: { name: 'Logic Mute (System Mute)', group: 'Mute', templates: { get: '< GET LOGIC_MUTE >', set: '< SET LOGIC_MUTE {v} >', rep: ['< REP LOGIC_MUTE ON >', '< REP LOGIC_MUTE OFF >'] }, param: ON_OFF, notes: 'Mute-sync: sets the system mute state. ON = muted.' },
    preset_audio_route: { name: 'Preset Audio Route', group: 'Presets', templates: { get: '< GET PRESET_AUDIO_ROUTE >', set: '< SET PRESET_AUDIO_ROUTE {v} >', rep: ['< REP PRESET_AUDIO_ROUTE {v} >'] }, param: { kind: 'select', label: 'Route Preset', options: Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1).padStart(2, '0'), label: `Route ${i + 1}` })) }, notes: 'Audio-routing presets (01-10; 0 = none active).' },
    preset_names: { name: 'Preset Names', group: 'Presets', templates: { get: '< GET PRESETn >', rep: [`< REP PRESETn {${xs(25)}} >`] }, param: NONE, notes: 'n = 1-10. Returns the stored name of each preset.' },
    preset_name: { name: 'Preset Name', group: 'Presets', templates: { get: '< GET PRESET_NAME nn >', rep: [`< REP PRESET_NAME nn {${xs(25)}} >`] }, param: NONE, notes: 'nn = preset number. Returns the stored preset name.' },
    num_active_mics: { name: 'Number of Active Mics', group: 'Status', templates: { get: '< GET NUM_ACTIVE_MICS >', rep: ['< REP NUM_ACTIVE_MICS x >'] }, param: NONE, notes: 'Read-only.' },
    last_error_event: { name: 'Last Error Event', group: 'Diagnostics', templates: { get: '< GET LAST_ERROR_EVENT >', rep: ['< REP LAST_ERROR_EVENT {code} >'] }, param: NONE, notes: 'Read-only diagnostic.' },
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
        id, name, group, cat: CATEGORY[id],
        templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: options.map((o) => `< REP ${token} ${o} >`) },
        param: { kind: 'enum', label, options, rep: options },
    };
}
// Device command whose value is a labeled dropdown (options = [{ value, label }]).
export function deviceSelectCmd(id, name, group, token, options, label = 'Value') {
    return {
        id, name, group, cat: CATEGORY[id],
        templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: [`< REP ${token} {v} >`] },
        param: { kind: 'select', label, options },
    };
}
export function deviceEnableCmd(id, name, group, token) {
    return {
        id, name, group, cat: CATEGORY[id],
        templates: { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: [`< REP ${token} ON >`, `< REP ${token} OFF >`] },
        param: { kind: 'enum', label: 'State', options: ['ON', 'OFF'], rep: ['ON', 'OFF'] },
    };
}
export function deviceRoCmd(id, name, group, token, vals) {
    return {
        id, name, group, cat: CATEGORY[id],
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
        // opts.repVal lets a command show a placeholder in its REP (e.g. "position") instead
        // of echoing the live SET value — used where the reply is illustrative, not a real value.
        templates.rep = [`< REP {xx} ${token} ${opts.repVal || '{v}'} >`];
        if (opts.inc) templates.extras = [`< SET {xx} ${token} INC nn >`, `< SET {xx} ${token} DEC nn >`];
    }
    return { id, name, group, cat: CATEGORY[id], templates, param, appliesTo, notes: opts.notes, fw: opts.fw, slot: opts.slot };
}

export function deviceValueCmd(id, name, group, token, encoding, opts = {}) {
    const templates = { get: `< GET ${token} >`, set: `< SET ${token} {v} >`, rep: [`< REP ${token} {v} >`] };
    if (opts.inc) templates.extras = [`< SET ${token} INC nn >`, `< SET ${token} DEC nn >`];
    return { id, name, group, cat: CATEGORY[id], templates, param: { kind: 'value', label: name, encoding }, notes: opts.notes };
}

export function deviceRawCmd(id, name, group, token, opts = {}) {
    return {
        id, name, group, cat: CATEGORY[id],
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
    return { id, ...base, cat: CATEGORY[id], appliesTo, ...overrides };
}

export function xcmd(id, appliesToCrosspoint, overrides = {}) {
    const base = LIB[id];
    if (!base) throw new Error(`Unknown crosspoint command id: ${id}`);
    return { id, ...base, cat: CATEGORY[id], appliesToCrosspoint, ...overrides };
}

export function dcmd(id, overrides = {}) {
    const base = DEVICE_LIB[id];
    if (!base) throw new Error(`Unknown device command id: ${id}`);
    return { id, ...base, cat: CATEGORY[id], ...overrides };
}
