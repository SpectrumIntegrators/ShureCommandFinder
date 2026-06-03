// MXA320 — Microflex Advance table array microphone (steerable lobes).
// Channel map (PDF v0.1): mic channels 01-04, automixer output 05. Two-digit channels.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, range, oneOf, chanCmd,
    deviceEnableCmd, deviceEnumCmd, deviceRoCmd, deviceValueCmd,
} from '@/models/commandLib.js';

const elements = [
    ...[1, 2, 3, 4].map((n) => ({
        id: `mic-${n}`, name: `Dante Output ${n} (Lobe)`, short: `Out ${n}`, group: 'Lobe Outputs',
        kind: KIND.OUTPUT, channel: n, uiNumber: null, chain: ['PEQ', 'Beam'], matrixRole: null,
    })),
    { id: 'automixer', name: 'Automix Output', short: 'Automix', group: 'Automixer', kind: KIND.OUTPUT, channel: 5, uiNumber: null, chain: ['PEQ'], matrixRole: null },
    // AEC reference is the device's Dante input (channel 06). No per-channel commands.
    { id: 'aec-ref', name: 'AEC Reference', short: 'AEC Ref', group: 'Reference', kind: KIND.INPUT, channel: 6, uiNumber: null, chain: [], matrixRole: null },
];

const channelCommands = [
    cmd('chan_name', range(1, 5)),
    cmd('na_chan_name', range(1, 5)),
    cmd('audio_gain', range(1, 5)),
    cmd('audio_gain_postgate', range(1, 4)),
    cmd('audio_mute', range(1, 5)),
    cmd('audio_mute_postgate', range(1, 4)),
    cmd('chan_automix_solo_en', range(1, 4)),
    cmd('peq', range(1, 5)),
    cmd('polar_pattern', range(1, 4)),
    chanCmd('lobe_angle', 'Lobe Angle', 'Beam', 'LOBE_ANGLE', { kind: 'raw', label: 'Angle', hint: 'angle (15° steps)' }, range(1, 4), { inc: true }),
    cmd('speech_gating', oneOf(5)),
    chanCmd('automix_gate_ext', 'Automix Gate Out (External Signal)', 'Automixer', 'AUTOMIX_GATE_OUT_EXT_SIG', { kind: 'none' }, range(1, 4), { repVals: ['ON', 'OFF'], notes: 'Read-only gate status.' }),
    cmd('audio_in_peak', range(1, 5)),
    cmd('audio_in_rms', range(1, 5)),
    cmd('audio_out_clip', range(1, 5)),
    cmd('get_all', range(1, 5)),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),

    // Device-wide EQ / DSP
    { ...deviceEnableCmd('bypass_all_eq', 'Bypass All EQ', 'EQ', 'BYPASS_ALL_EQ') },
    { ...deviceEnableCmd('eq_contour', 'EQ Contour (Low-Cut)', 'EQ', 'EQ_CONTOUR') },
    { ...deviceEnableCmd('bypass_imx', 'Bypass IntelliMix DSP', 'Processing', 'BYPASS_IMX') },

    // LED
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness'),
    dcmd('led_color_muted'),
    dcmd('led_color_unmuted'),
    dcmd('led_state_muted'),
    dcmd('led_state_unmuted'),
    deviceRoCmd('dev_mute_status_led_state', 'Mute-Status LED State', 'LED', 'DEV_MUTE_STATUS_LED_STATE', ['ON', 'OFF']),

    // Mute / logic / status
    deviceEnumCmd('mute_control_func', 'Mute Control Function', 'Mute', 'MUTE_CONTROL_FUNC', ['LOGIC', 'LOCAL', 'DISABLED'], 'Function'),
    deviceRoCmd('ext_switch_out_state', 'External Switch Output State', 'Status', 'EXT_SWITCH_OUT_STATE', ['ON', 'OFF']),
    deviceRoCmd('device_state', 'Device State', 'Status', 'DEVICE_STATE', ['state']),
    dcmd('num_active_mics'),

    dcmd('flash'), dcmd('reboot'), dcmd('default_settings'),
    dcmd('encryption'), dcmd('control_mac'), dcmd('ip_addr'),

    // Metering
    dcmd('meter_rate'),
    { ...deviceValueCmd('meter_rate_postgate', 'Metering Rate - Post-Gate', 'Metering', 'METER_RATE_POSTGATE', 'meterRate') },
    { ...deviceValueCmd('meter_rate_mxr_gain', 'Metering Rate - Automixer Gain', 'Metering', 'METER_RATE_MXR_GAIN', 'meterRate') },
    { ...deviceValueCmd('meter_rate_precomp', 'Metering Rate - Pre-Compressor', 'Metering', 'METER_RATE_PRECOMP', 'meterRate') },
    { ...deviceValueCmd('meter_rate_aecref', 'Metering Rate - AEC Reference', 'Metering', 'METER_RATE_AECREF', 'meterRate') },
    { ...deviceValueCmd('meter_rate_agc', 'Metering Rate - AGC Gain', 'Metering', 'METER_RATE_AGC', 'meterRate') },

    dcmd('preset_name'),
];

export default makeModel({
    meta: {
        id: 'mxa320',
        name: 'MXA320',
        fullName: 'MXA320 Table Array',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/microphones/mxa320',
        docVersion: '0.1',
        docDate: 'January 2026',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 2,
        blurb: '4-channel table array with steerable lobes (polar pattern + lobe angle per channel) and IntelliMix. Mic channels 01-04, automix 05.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
