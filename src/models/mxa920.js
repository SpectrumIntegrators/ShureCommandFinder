// MXA920 — Microflex Advance ceiling array with Automatic Coverage.
// Channel map (PDF v1.4): coverage areas / channels 01-08, automixer output 09,
// AEC reference 10 (two-digit). No matrix. Curated to audio/coverage/automix/LED
// features; deep camera (autofocus, talker tracking) commands omitted.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, range, chanCmd,
    deviceEnableCmd, deviceRawCmd, deviceValueCmd, deviceRoCmd, P_ON_OFF_TOGGLE,
} from '@/models/commandLib.js';

// Per-lobe beam steering (channels 1-8). X/Y/Z are positions in cm and width is an enum;
// per the doc these only work with Automatic Coverage OFF (manual lobe mode). The _AF
// commands are the read-only autofocus counterpart.
const BEAM_OFF_NOTE = 'Only works with Automatic Coverage off (manual lobe mode).';
const beamCmds = [
    { ...chanCmd('beam_x', 'Lobe X Position', 'Beamforming', 'BEAM_X', { kind: 'raw', label: 'X', hint: '0000-3048 cm', default: '0000' }, range(1, 8), { notes: BEAM_OFF_NOTE, repVal: 'nnnn' }) },
    { ...chanCmd('beam_y', 'Lobe Y Position', 'Beamforming', 'BEAM_Y', { kind: 'raw', label: 'Y', hint: '0000-3048 cm', default: '0000' }, range(1, 8), { notes: BEAM_OFF_NOTE, repVal: 'nnnn' }) },
    { ...chanCmd('beam_z', 'Lobe Z Position', 'Beamforming', 'BEAM_Z', { kind: 'raw', label: 'Z', hint: '0000-3048 cm', default: '0000' }, range(1, 8), { notes: BEAM_OFF_NOTE, repVal: 'nnnn' }) },
    { ...chanCmd('beam_w', 'Lobe Width', 'Beamforming', 'BEAM_W', { kind: 'enum', label: 'Width', options: ['NARROW', 'MEDIUM', 'WIDE'], rep: ['NARROW', 'MEDIUM', 'WIDE'] }, range(1, 8), { notes: BEAM_OFF_NOTE }) },
];
const beamAfCmds = [
    ['beam_x_af', 'Lobe X (Autofocus)', 'BEAM_X_AF'],
    ['beam_y_af', 'Lobe Y (Autofocus)', 'BEAM_Y_AF'],
    ['beam_z_af', 'Lobe Z (Autofocus)', 'BEAM_Z_AF'],
].map(([id, name, token]) => ({
    ...chanCmd(id, name, 'Beamforming', token, { kind: 'none' }, range(1, 8), { repVals: ['position'], notes: 'Read-only autofocus lobe position.' }),
}));

const elements = [
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        id: `ca-${n}`, name: `Coverage Area ${n} (Output)`, short: `CA ${n}`, group: 'Coverage Area Outputs',
        kind: KIND.OUTPUT, channel: n, uiNumber: null, chain: ['PEQ', 'Beam'], matrixRole: null,
    })),
    { id: 'automixer', name: 'Automix Output', short: 'Automix', group: 'Automixer', kind: KIND.OUTPUT, channel: 9, uiNumber: null, chain: ['PEQ'], matrixRole: null },
    // AEC reference is the device's Dante input (channel 10). No per-channel commands.
    { id: 'aec-ref', name: 'AEC Reference', short: 'AEC Ref', group: 'Reference', kind: KIND.INPUT, channel: 10, uiNumber: null, chain: [], matrixRole: null },
];

const channelCommands = [
    cmd('chan_name', range(1, 9)),
    cmd('audio_gain', range(1, 9)),
    cmd('audio_gain_postgate', range(1, 8)),
    cmd('audio_mute', range(1, 9)),
    cmd('audio_mute_postgate', range(1, 8)),
    cmd('chan_automix_solo_en', range(1, 8)),
    chanCmd('ca_gain', 'Coverage Area Gain', 'Coverage', 'CA_GAIN', { kind: 'value', label: 'CA Gain', encoding: 'gainHiRes' }, range(1, 8), { inc: true }),
    chanCmd('ca_mute', 'Coverage Area Mute', 'Coverage', 'CA_MUTE', P_ON_OFF_TOGGLE, range(1, 8)),
    chanCmd('automix_gate_ext', 'Automix Gate Out (External Signal)', 'Automixer', 'AUTOMIX_GATE_OUT_EXT_SIG', { kind: 'none' }, range(1, 8), { repVals: ['ON', 'OFF'], notes: 'Read-only gate status.' }),
    cmd('audio_in_peak', range(1, 9)),
    cmd('audio_in_rms', range(1, 9)),
    cmd('get_all', range(1, 9)),

    // ---- Beyond Basic (tab category set centrally in CATEGORY) ----
    cmd('na_chan_name', range(1, 9)),
    cmd('peq', range(1, 9)),
    cmd('audio_out_clip', range(1, 9)),
    cmd('noise_filter', range(1, 8)),
    cmd('speech_gating', range(1, 8)),

    // ---- All: coverage-area geometry / per-lobe beams / gate status ----
    { ...chanCmd('automix_gate_out_ca', 'Automix Gate Out (Coverage Area)', 'Automixer', 'AUTOMIX_GATE_OUT_CA', { kind: 'none' }, range(1, 8), { repVals: ['ON', 'OFF'], notes: 'Read-only gate status.' }) },
    { ...chanCmd('ca_dedicated', 'Coverage Area (Dedicated)', 'Coverage', 'CA_DEDICATED', { kind: 'raw', label: 'Position', default: '0000 0000 0000 0000', hint: 'Xmin Ymax Xmax Ymin — 4-digit cm, +1524 offset' }, range(1, 8), { repVal: 'aaaa bbbb cccc dddd' }) },
    { ...chanCmd('ca_dynamic', 'Coverage Area (Dynamic)', 'Coverage', 'CA_DYNAMIC', { kind: 'raw', label: 'Position', default: '0000 0000 0000 0000', hint: 'Xmin Ymax Xmax Ymin — 4-digit cm, +1524 offset' }, range(1, 8), { repVal: 'aaaa bbbb cccc dddd' }) },
    ...beamCmds,
    ...beamAfCmds,
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),
    deviceEnableCmd('auto_coverage', 'Automatic Coverage', 'Coverage', 'AUTO_COVERAGE'),
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness'),
    dcmd('led_color_muted'),
    dcmd('led_color_unmuted'),
    dcmd('led_state_muted'),
    dcmd('led_state_unmuted'),
    dcmd('flash'), dcmd('reboot'), dcmd('default_settings'),
    dcmd('encryption'), dcmd('control_mac'), dcmd('ip_addr'),
    dcmd('meter_rate'),

    // ---- Device-wide EQ / DSP ----
    { ...deviceEnableCmd('bypass_all_eq', 'Bypass All EQ', 'EQ', 'BYPASS_ALL_EQ') },
    { ...deviceEnableCmd('eq_contour', 'EQ Contour (Low-Cut)', 'EQ', 'EQ_CONTOUR') },
    { ...deviceEnableCmd('bypass_imx', 'Bypass IntelliMix DSP', 'Processing', 'BYPASS_IMX') },

    // ---- All: coverage / talker positioning / array grouping / metering / diagnostics ----
    { ...deviceRoCmd('num_active_mics', 'Number of Active Mics', 'Status', 'NUM_ACTIVE_MICS', ['active']) },
    { ...deviceEnableCmd('autofocus', 'Automatic Focus', 'Coverage', 'AUTOFOCUS') },
    { ...deviceRawCmd('array_height', 'Array Height', 'Coverage', 'ARRAY_HEIGHT', { hint: 'height (cm)' }) },
    { ...deviceRawCmd('ca_meter_rate', 'Coverage Area Metering Rate', 'Metering', 'CA_METER_RATE', { hint: 'rate (ms)' }) },
    { ...deviceEnableCmd('dev_mute_status_led_state', 'Mute-Status LED State', 'LED', 'DEV_MUTE_STATUS_LED_STATE') },
    { ...deviceRawCmd('vab', 'Voice Activity Boundary', 'Coverage', 'VAB', { hint: 'value' }) },
    { ...deviceRawCmd('talker_position_rate', 'Talker Position Rate', 'Talker Positioning', 'TALKER_POSITION_RATE', { hint: 'rate (ms)' }), fw: '6.6' },
    { ...deviceRawCmd('talker_position_sensitivity', 'Talker Position Sensitivity', 'Talker Positioning', 'TALKER_POSITION_SENSITIVITY', { hint: '0-11' }), fw: '6.6' },
    { id: 'talker_positions', name: 'Talker Positions', group: 'Talker Positioning', cat: 'coverage', fw: '6.6', templates: { get: '< GET TALKER_POSITIONS >', rep: ['< SAMPLE TALKER_POSITIONS lobe ca x y z >'] }, param: { kind: 'none' }, notes: 'Read-only stream: one {lobe, coverage area, X, Y, Z} set per detected talker (1 to n sets, repeated), X/Y/Z in cm. No report when no talker is active.' },
    { ...deviceRawCmd('array_group', 'Array Group', 'Array Group', 'ARRAY_GROUP', { hint: 'devMAC pos … | OFF', default: 'OFF' }), fw: '6.6', notes: 'Groups up to 4 arrays for shared triangulation. Value is OFF or a list of devMAC + X Y Z position per member.' },
    { ...deviceRoCmd('array_group_status', 'Array Group Status', 'Array Group', 'ARRAY_GROUP_STATUS', ['OFF', 'status']), fw: '6.6' },
    { ...deviceValueCmd('meter_rate_postgate', 'Metering Rate - Post-Gate', 'Metering', 'METER_RATE_POSTGATE', 'meterRate') },
    { ...deviceValueCmd('meter_rate_mxr_gain', 'Metering Rate - Automixer Gain', 'Metering', 'METER_RATE_MXR_GAIN', 'meterRate') },
    { ...deviceValueCmd('meter_rate_precomp', 'Metering Rate - Pre-Compressor', 'Metering', 'METER_RATE_PRECOMP', 'meterRate') },
    { ...deviceValueCmd('meter_rate_aecref', 'Metering Rate - AEC Reference', 'Metering', 'METER_RATE_AECREF', 'meterRate') },
    dcmd('preset_name'),
];

export default makeModel({
    meta: {
        id: 'mxa920',
        name: 'MXA920',
        fullName: 'MXA920 Ceiling Array',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/microphones/mxa920',
        docVersion: '1.4',
        docDate: 'October 2025',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 2,
        blurb: '8 coverage areas with Automatic Coverage + IntelliMix. Channels 01-08, automix 09, AEC ref 10. Curated command set (audio/coverage/automix/LED); deep camera commands omitted.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
