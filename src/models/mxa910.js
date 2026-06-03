// MXA910 — Microflex Advance ceiling array microphone.
// Channel map (PDF v6.2): 0 all, 1-8 individual (beam) channels, 9 automix output,
// 10 AEC reference. Single-digit channel numbers. No matrix.
// Curated to the audio/automix/echo/LED features; advanced camera commands omitted.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, range,
    chanCmd, deviceEnableCmd, deviceRawCmd, deviceValueCmd, deviceRoCmd,
} from '@/models/commandLib.js';

// Per-lobe beam steering (channels 1-8) and read-only autofocus counterparts. X/Y/Z are
// 4-digit cm positions (0000-3048); width is an enum. All 'all'-level; _AF needs fw 4.5+.
const beamCmds = [
    ['beam_x', 'Beam X Position', 'BEAM_X'],
    ['beam_y', 'Beam Y Position', 'BEAM_Y'],
    ['beam_z', 'Beam Z Position', 'BEAM_Z'],
].map(([id, name, token]) => ({
    ...chanCmd(id, name, 'Beamforming', token, { kind: 'raw', label: name, hint: '0000-3048 cm', default: '0000' }, range(1, 8), { repVal: 'nnnn' }),
}));
beamCmds.push({ ...chanCmd('beam_w', 'Beam Width', 'Beamforming', 'BEAM_W', { kind: 'enum', label: 'Width', options: ['NARROW', 'MEDIUM', 'WIDE'], rep: ['NARROW', 'MEDIUM', 'WIDE'] }, range(1, 8)) });
const beamAfCmds = [
    ['beam_x_af', 'Beam X (Autofocus)', 'BEAM_X_AF'],
    ['beam_y_af', 'Beam Y (Autofocus)', 'BEAM_Y_AF'],
    ['beam_z_af', 'Beam Z (Autofocus)', 'BEAM_Z_AF'],
].map(([id, name, token]) => ({
    ...chanCmd(id, name, 'Beamforming', token, { kind: 'none' }, range(1, 8), { repVals: ['position'], notes: 'Read-only autofocus position.' }),
    fw: '4.5',
}));

const elements = [
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        id: `chan-${n}`, name: `Dante Output ${n} (Lobe)`, short: `Out ${n}`, group: 'Lobe Outputs',
        kind: KIND.OUTPUT, channel: n, uiNumber: null, chain: ['PEQ', 'Beam'], matrixRole: null,
    })),
    { id: 'automixer', name: 'Automix Output', short: 'Automix', group: 'Automixer', kind: KIND.OUTPUT, channel: 9, uiNumber: null, chain: ['PEQ'], matrixRole: null },
    // AEC reference is the device's Dante input (channel 10). It has no per-channel control
    // commands (only device-wide metering), so selecting it shows no commands.
    { id: 'aec-ref', name: 'AEC Reference', short: 'AEC Ref', group: 'Reference', kind: KIND.INPUT, channel: 10, uiNumber: null, chain: [], matrixRole: null },
];

const channelCommands = [
    cmd('chan_name', range(1, 9)),
    cmd('na_chan_name', range(1, 9)),
    cmd('audio_gain', range(1, 9)),
    cmd('audio_gain_postgate', range(1, 8), { fw: '3.0' }),
    cmd('audio_mute', range(1, 9)),
    cmd('chan_automix_solo_en', range(1, 8)),
    chanCmd('automix_gate_ext', 'Automix Gate Out (External Signal)', 'Automixer', 'AUTOMIX_GATE_OUT_EXT_SIG', { kind: 'none' }, range(1, 8), { repVals: ['ON', 'OFF'], notes: 'Read-only gate status.' }),
    cmd('audio_in_peak', range(1, 9)),
    cmd('audio_in_rms', range(1, 9)),
    cmd('get_all', range(1, 9)),

    // ---- Beyond Basic (tab category set centrally in CATEGORY) ----
    cmd('peq', range(1, 9), { fw: '2.0' }),
    cmd('audio_out_clip', range(1, 9)),

    // ---- All: per-lobe beam steering / autofocus ----
    ...beamCmds,
    ...beamAfCmds,
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness', { notes: 'Base firmware uses 0-2 (Disabled/Dim/Default); the 0-5 percentage steps require firmware > v3.0.' }),
    dcmd('led_color_muted', { notes: 'Base firmware supports only RED, GREEN, BLUE, PINK, PURPLE, YELLOW, ORANGE, WHITE; the rest require firmware > v3.0.' }),
    dcmd('led_color_unmuted', { notes: 'Base firmware supports only RED, GREEN, BLUE, PINK, PURPLE, YELLOW, ORANGE, WHITE; the rest require firmware > v3.0.' }),
    dcmd('led_state_muted'),
    dcmd('led_state_unmuted'),
    dcmd('flash'), dcmd('reboot', { fw: '2.0' }), dcmd('default_settings', { fw: '2.0' }),
    dcmd('encryption', { fw: '2.0' }), dcmd('control_mac'), dcmd('ip_addr'),
    dcmd('meter_rate'),

    // ---- Device-wide EQ / DSP ----
    { ...deviceEnableCmd('bypass_all_eq', 'Bypass All EQ', 'EQ', 'BYPASS_ALL_EQ'), fw: '3.0' },
    { ...deviceEnableCmd('eq_contour', 'EQ Contour (Low-Cut)', 'EQ', 'EQ_CONTOUR'), fw: '3.0' },
    { ...deviceEnableCmd('bypass_imx', 'Bypass IntelliMix DSP', 'Processing', 'BYPASS_IMX'), fw: '4.0' },

    // ---- All: echo reduction (fw 3.x), low shelf (fw 2.x), metering streams, diagnostics ----
    { ...deviceEnableCmd('echo_red', 'Echo Reduction', 'Echo Reduction', 'ECHO_RED'), notes: 'Firmware v3.0 only (replaced by AEC in v4.x).' },
    { ...deviceRawCmd('audio_gain_echo_red', 'Echo Reduction Reference Gain', 'Echo Reduction', 'AUDIO_GAIN_ECHO_RED', { hint: 'level yyyy' }), notes: 'Firmware v3.0 only. Also accepts INC/DEC yyyy.' },
    { ...deviceEnableCmd('low_shelf_filter', 'Low Shelf Filter', 'EQ', 'LOW_SHELF_FILTER'), notes: 'Firmware v2.0 only.' },
    { ...deviceRoCmd('num_active_mics', 'Number of Active Mics', 'Status', 'NUM_ACTIVE_MICS', ['x']) },
    { ...deviceEnableCmd('dev_mute_status_led_state', 'Mute-Status LED State', 'LED', 'DEV_MUTE_STATUS_LED_STATE') },
    { id: 'clear_af', name: 'Clear Autofocus Positions', group: 'Beamforming', cat: 'beamforming', fw: '4.5', templates: { set: '< SET CLEAR_AF >', rep: ['< REP CLEAR_AF status >'] }, param: { kind: 'none' }, notes: 'Clears all autofocus lobe positions.' },
    { ...deviceValueCmd('meter_rate_postgate', 'Metering Rate - Post-Gate', 'Metering', 'METER_RATE_POSTGATE', 'meterRate'), fw: '3.0' },
    { ...deviceValueCmd('meter_rate_mxr_gain', 'Metering Rate - Automixer Gain', 'Metering', 'METER_RATE_MXR_GAIN', 'meterRate'), fw: '3.0' },
    { ...deviceValueCmd('meter_rate_precomp', 'Metering Rate - Pre-Compressor', 'Metering', 'METER_RATE_PRECOMP', 'meterRate'), fw: '4.0' },
    { ...deviceValueCmd('meter_rate_aecref', 'Metering Rate - AEC Reference', 'Metering', 'METER_RATE_AECREF', 'meterRate'), fw: '4.0' },
    dcmd('last_error_event', { fw: '2.0' }),
    dcmd('preset_names'),
];

export default makeModel({
    meta: {
        id: 'mxa910',
        name: 'MXA910',
        fullName: 'MXA910 Ceiling Array',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/microphones/mxa910',
        docVersion: '6.2',
        docDate: 'October 2021',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 1,
        blurb: '8-channel ceiling array with IntelliMix (automixer, echo reduction). Channels 1-8, automix 9, AEC ref 10. Single-digit channel numbers. Curated command set (core audio/automix/LED).',
    },
    elements,
    channelCommands,
    deviceCommands,
});
