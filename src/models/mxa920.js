// MXA920 — Microflex Advance ceiling array with Automatic Coverage.
// Channel map (PDF v1.4): coverage areas / channels 01-08, automixer output 09,
// AEC reference 10 (two-digit). No matrix. Curated to audio/coverage/automix/LED
// features; deep camera (autofocus, talker tracking) commands omitted.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, range, chanCmd,
    deviceEnableCmd, deviceRawCmd, P_ON_OFF_TOGGLE,
} from '@/models/commandLib.js';

const elements = [
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        id: `ca-${n}`, name: `Coverage Area ${n}`, short: `CA ${n}`, group: 'Coverage Areas',
        kind: KIND.INPUT, channel: n, uiNumber: null, chain: ['PEQ', 'Beam'], matrixRole: null,
    })),
    { id: 'automixer', name: 'Automixer Output', short: 'Automix', group: 'Processing', kind: KIND.PROCESSING, channel: 9, uiNumber: null, chain: ['PEQ'], matrixRole: null },
];
// AEC reference (channel 10) is metered device-wide (METER_RATE_AECREF), so it is not a
// selectable per-channel element here.

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
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),
    deviceEnableCmd('auto_coverage', 'Automatic Coverage', 'Coverage', 'AUTO_COVERAGE'),
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness'),
    deviceRawCmd('led_color_muted', 'LED Color (Muted)', 'LED', 'LED_COLOR_MUTED', { hint: 'color code' }),
    deviceRawCmd('led_color_unmuted', 'LED Color (Unmuted)', 'LED', 'LED_COLOR_UNMUTED', { hint: 'color code' }),
    deviceRawCmd('led_state_muted', 'LED State (Muted)', 'LED', 'LED_STATE_MUTED', { hint: 'state code' }),
    deviceRawCmd('led_state_unmuted', 'LED State (Unmuted)', 'LED', 'LED_STATE_UNMUTED', { hint: 'state code' }),
    dcmd('flash'), dcmd('reboot'), dcmd('default_settings'),
    dcmd('encryption'), dcmd('control_mac'), dcmd('ip_addr'),
    dcmd('meter_rate'),
];

export default makeModel({
    meta: {
        id: 'mxa920',
        name: 'MXA920',
        fullName: 'MXA920 Ceiling Array',
        port: 2202,
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
