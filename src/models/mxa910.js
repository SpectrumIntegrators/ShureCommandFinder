// MXA910 — Microflex Advance ceiling array microphone.
// Channel map (PDF v6.2): 0 all, 1-8 individual (beam) channels, 9 automix output,
// 10 AEC reference. Single-digit channel numbers. No matrix.
// Curated to the audio/automix/echo/LED features; advanced camera commands omitted.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, range,
    chanCmd, deviceEnableCmd, deviceRawCmd,
} from '@/models/commandLib.js';

const elements = [
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        id: `chan-${n}`, name: `Channel ${n}`, short: `Ch ${n}`, group: 'Mic Channels',
        kind: KIND.INPUT, channel: n, uiNumber: null, chain: ['PEQ', 'Beam'], matrixRole: null,
    })),
    { id: 'automixer', name: 'Automixer Output', short: 'Automix', group: 'Processing', kind: KIND.PROCESSING, channel: 9, uiNumber: null, chain: ['PEQ'], matrixRole: null },
];
// AEC reference (channel 10) is controlled device-wide (ECHO_RED / AUDIO_GAIN_ECHO_RED),
// so it is not a selectable per-channel element here.

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
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness'),
    deviceRawCmd('led_color_muted', 'LED Color (Muted)', 'LED', 'LED_COLOR_MUTED', { hint: 'color code nnnn' }),
    deviceRawCmd('led_color_unmuted', 'LED Color (Unmuted)', 'LED', 'LED_COLOR_UNMUTED', { hint: 'color code nnnn' }),
    deviceRawCmd('led_state_muted', 'LED State (Muted)', 'LED', 'LED_STATE_MUTED', { hint: 'state code nnn' }),
    deviceRawCmd('led_state_unmuted', 'LED State (Unmuted)', 'LED', 'LED_STATE_UNMUTED', { hint: 'state code nnn' }),
    dcmd('flash'), dcmd('reboot', { fw: '2.0' }), dcmd('default_settings', { fw: '2.0' }),
    dcmd('encryption', { fw: '2.0' }), dcmd('control_mac'), dcmd('ip_addr'),
    dcmd('meter_rate'),
];

export default makeModel({
    meta: {
        id: 'mxa910',
        name: 'MXA910',
        fullName: 'MXA910 Ceiling Array',
        port: 2202,
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
