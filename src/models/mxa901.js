// MXA901 — Microflex Advance single-zone ceiling array. The whole array presents as ONE
// audio channel. Channel map (PDF v0.3): automix output 09, AEC reference 10 (metered).
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, oneOf, chanCmd,
    deviceEnableCmd, deviceRawCmd, deviceRoCmd, deviceValueCmd,
} from '@/models/commandLib.js';

const elements = [
    { id: 'output', name: 'Automix Output', short: 'Output', group: 'Array', kind: KIND.OUTPUT, channel: 9, uiNumber: null, chain: [], matrixRole: null },
    // AEC reference is the device's Dante input (channel 10). No per-channel commands.
    { id: 'aec-ref', name: 'AEC Reference', short: 'AEC Ref', group: 'Reference', kind: KIND.INPUT, channel: 10, uiNumber: null, chain: [], matrixRole: null },
];
// The array's eight internal lobes are not individually addressable.

const channelCommands = [
    cmd('chan_name', oneOf(9)),
    cmd('na_chan_name', oneOf(9)),
    cmd('audio_gain', oneOf(9)),
    cmd('audio_mute', oneOf(9)),
    cmd('noise_filter', oneOf(9)),
    cmd('speech_gating', oneOf(9)),
    chanCmd('automix_gate_ext', 'Automix Gate Out (External Signal)', 'Automixer', 'AUTOMIX_GATE_OUT_EXT_SIG', { kind: 'none' }, oneOf(9), { repVals: ['ON', 'OFF'], notes: 'Read-only gate status.' }),
    cmd('audio_in_peak', oneOf(9)),
    cmd('audio_in_rms', oneOf(9)),
    cmd('audio_out_clip', oneOf(9)),
    cmd('get_all', oneOf(9)),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),

    // Coverage / beam
    { ...deviceEnableCmd('autofocus', 'Automatic Focus', 'Beam', 'AUTOFOCUS') },
    { ...deviceRawCmd('array_height', 'Array Height', 'Coverage', 'ARRAY_HEIGHT', { hint: 'height (cm)' }) },
    { ...deviceRawCmd('talker_position_rate', 'Talker Position Rate', 'Talker Positioning', 'TALKER_POSITION_RATE', { hint: 'rate (ms)' }) },
    { ...deviceRawCmd('talker_position_sensitivity', 'Talker Position Sensitivity', 'Talker Positioning', 'TALKER_POSITION_SENSITIVITY', { hint: '0-11' }) },
    { id: 'talker_positions', name: 'Talker Positions', group: 'Talker Positioning', cat: 'coverage', templates: { get: '< GET TALKER_POSITIONS >', rep: ['< SAMPLE TALKER_POSITIONS lobe ca x y z >'] }, param: { kind: 'none' }, notes: 'Read-only stream: one {lobe, coverage area, X, Y, Z} set per detected talker (1 to n sets, repeated), X/Y/Z in cm. No report when no talker is active.' },

    // LED
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness'),
    dcmd('led_color_muted'),
    dcmd('led_color_unmuted'),
    dcmd('led_state_muted'),
    dcmd('led_state_unmuted'),
    deviceRoCmd('dev_mute_status_led_state', 'Mute-Status LED State', 'LED', 'DEV_MUTE_STATUS_LED_STATE', ['ON', 'OFF']),

    dcmd('flash'), dcmd('reboot'), dcmd('default_settings'),
    dcmd('encryption'), dcmd('control_mac'), dcmd('ip_addr'),

    dcmd('meter_rate'),
    { ...deviceValueCmd('meter_rate_aecref', 'Metering Rate - AEC Reference', 'Metering', 'METER_RATE_AECREF', 'meterRate') },
    { ...deviceValueCmd('meter_rate_precomp', 'Metering Rate - Pre-Compressor', 'Metering', 'METER_RATE_PRECOMP', 'meterRate') },

    dcmd('preset_name'),
];

export default makeModel({
    meta: {
        id: 'mxa901',
        name: 'MXA901',
        fullName: 'MXA901 Ceiling Array (Single Zone)',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/microphones/mxa901',
        docVersion: '0.3',
        docDate: 'June 2025',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 2,
        blurb: 'Single-zone ceiling array — the whole array is one audio channel (automix output 09). Automatic focus + talker positioning. AEC reference on 10.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
