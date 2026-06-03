// MXA310 — Microflex Advance table array microphone (predecessor of the MXA320).
// Channel map (PDF v3.2): mic channels 1-4, automixer output 5. Single-digit channels.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, range, chanCmd, P_ON_OFF,
    deviceEnableCmd, deviceEnumCmd, deviceRoCmd, deviceValueCmd,
} from '@/models/commandLib.js';

const elements = [
    ...[1, 2, 3, 4].map((n) => ({
        id: `mic-${n}`, name: `Dante Output ${n} (Lobe)`, short: `Out ${n}`, group: 'Lobe Outputs',
        kind: KIND.OUTPUT, channel: n, uiNumber: null, chain: ['PEQ', 'Beam'], matrixRole: null,
    })),
    { id: 'automixer', name: 'Automix Output', short: 'Automix', group: 'Automixer', kind: KIND.OUTPUT, channel: 5, uiNumber: null, chain: ['PEQ'], matrixRole: null },
];

const channelCommands = [
    cmd('chan_name', range(1, 5)),
    cmd('na_chan_name', range(1, 5)),
    cmd('audio_gain', range(1, 5)),
    cmd('audio_gain_postgate', range(1, 4)),
    cmd('audio_mute', range(1, 5)),
    cmd('chan_automix_solo_en', range(1, 4)),
    cmd('peq', range(1, 5)),
    cmd('bypass_all_eq', range(1, 5)),
    chanCmd('low_cut_filter', 'Low Cut Filter', 'EQ', 'LOW_CUT_FILTER', P_ON_OFF, range(1, 4)),
    cmd('polar_pattern', range(1, 4)),
    chanCmd('lobe_angle', 'Lobe Angle', 'Beam', 'LOBE_ANGLE', { kind: 'raw', label: 'Angle', hint: 'angle (15° steps)' }, range(1, 4), { inc: true }),
    cmd('chan_led_in_state', range(1, 4)),
    chanCmd('chan_mute_status_led_state', 'Channel Mute-Status LED', 'LED', 'CHAN_MUTE_STATUS_LED_STATE', { kind: 'none' }, range(1, 4), { repVals: ['ON', 'OFF'], notes: 'Read-only.' }),
    chanCmd('automix_gate_ext', 'Automix Gate Out (External Signal)', 'Automixer', 'AUTOMIX_GATE_OUT_EXT_SIG', { kind: 'none' }, range(1, 4), { repVals: ['ON', 'OFF'], notes: 'Read-only gate status.' }),
    cmd('audio_in_peak', range(1, 5)),
    cmd('audio_in_rms', range(1, 5)),
    cmd('audio_out_clip', range(1, 5)),
    cmd('get_all', range(1, 5)),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),

    // Mute button / logic
    deviceRoCmd('mute_button_status', 'Mute Button Status', 'Mute', 'MUTE_BUTTON_STATUS', ['ON', 'OFF']),
    deviceEnumCmd('mute_control_func', 'Mute Control Function', 'Mute', 'MUTE_CONTROL_FUNC', ['LOGIC', 'LOCAL', 'DISABLED'], 'Function'),
    deviceRoCmd('ext_switch_out_state', 'External Switch Output State', 'Status', 'EXT_SWITCH_OUT_STATE', ['ON', 'OFF']),

    // LED
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness', { notes: 'Base firmware uses 0-2 (Disabled/Dim/Default); the 0-5 percentage steps require firmware > v3.0.' }),
    dcmd('led_color_muted', { notes: 'Base firmware supports only RED, GREEN, BLUE, PINK, PURPLE, YELLOW, ORANGE, WHITE; the rest require firmware > v3.0.' }),
    dcmd('led_color_unmuted', { notes: 'Base firmware supports only RED, GREEN, BLUE, PINK, PURPLE, YELLOW, ORANGE, WHITE; the rest require firmware > v3.0.' }),
    dcmd('led_state_muted'),
    dcmd('led_state_unmuted'),
    deviceRoCmd('dev_mute_status_led_state', 'Mute-Status LED State', 'LED', 'DEV_MUTE_STATUS_LED_STATE', ['ON', 'OFF']),
    deviceRoCmd('mute_button_led_state', 'Mute Button LED State', 'LED', 'MUTE_BUTTON_LED_STATE', ['ON', 'OFF']),

    dcmd('num_active_mics'),
    dcmd('flash'), dcmd('reboot'), dcmd('default_settings'),
    dcmd('encryption'), dcmd('control_mac'), dcmd('ip_addr'), dcmd('last_error_event'),

    dcmd('meter_rate'),
    { ...deviceValueCmd('meter_rate_mxr_gain', 'Metering Rate - Automixer Gain', 'Metering', 'METER_RATE_MXR_GAIN', 'meterRate'), fw: '3.0' },

    dcmd('preset_names'),
];

export default makeModel({
    meta: {
        id: 'mxa310',
        name: 'MXA310',
        fullName: 'MXA310 Table Array',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/microphones/mxa310',
        docVersion: '3.2',
        docDate: 'March 2023',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 1,
        blurb: '4-channel table array with steerable lobes (polar pattern + lobe angle per channel) and IntelliMix. Mic channels 1-4, automix 5. Predecessor of the MXA320.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
