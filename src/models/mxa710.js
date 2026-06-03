// MXA710 — Microflex Advance linear array microphone.
// Channel map (PDF v3.8): this models the 4 ft (8-lobe) unit — lobe/mic channels 1-8,
// automixer output 9. The 2 ft unit uses lobes 1-4 with automix output 5.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, range, oneOf, chanCmd,
    deviceEnableCmd, deviceSelectCmd, deviceRoCmd, deviceValueCmd,
} from '@/models/commandLib.js';

const elements = [
    ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
        id: `lobe-${n}`, name: `Dante Output ${n} (Lobe)`, short: `Out ${n}`, group: 'Lobe Outputs',
        kind: KIND.OUTPUT, channel: n, uiNumber: null, chain: ['PEQ', 'Beam'], matrixRole: null,
    })),
    { id: 'automixer', name: 'Automix Output', short: 'Automix', group: 'Automixer', kind: KIND.OUTPUT, channel: 9, uiNumber: null, chain: ['PEQ'], matrixRole: null },
    // AEC reference is the device's Dante input (channel 10). No per-channel commands.
    { id: 'aec-ref', name: 'AEC Reference', short: 'AEC Ref', group: 'Reference', kind: KIND.INPUT, channel: 10, uiNumber: null, chain: [], matrixRole: null },
];

const channelCommands = [
    cmd('chan_name', range(1, 9)),
    cmd('na_chan_name', range(1, 9)),
    cmd('audio_gain', range(1, 9)),
    cmd('audio_gain_postgate', range(1, 8)),
    cmd('audio_mute', range(1, 9)),
    cmd('chan_automix_solo_en', range(1, 8)),
    cmd('peq', range(1, 9)),
    chanCmd('beam_angle', 'Lobe Beam Angle', 'Beam', 'BEAM_ANGLE', { kind: 'raw', label: 'Angle', hint: '-90 to +90 degrees', default: '0' }, range(1, 8), { repVal: 'nnn' }),
    chanCmd('beam_w', 'Lobe Beam Width', 'Beam', 'BEAM_W', { kind: 'enum', label: 'Width', options: ['NARROW', 'MEDIUM', 'WIDE'], rep: ['NARROW', 'MEDIUM', 'WIDE'] }, range(1, 8)),
    cmd('speech_gating', oneOf(9)),
    cmd('noise_filter', oneOf(9)),
    chanCmd('automix_gate_ext', 'Automix Gate Out (External Signal)', 'Automixer', 'AUTOMIX_GATE_OUT_EXT_SIG', { kind: 'none' }, range(1, 8), { repVals: ['ON', 'OFF'], notes: 'Read-only gate status.' }),
    cmd('audio_in_peak', range(1, 9)),
    cmd('audio_in_rms', range(1, 9)),
    cmd('audio_out_clip', range(1, 9)),
    cmd('get_all', range(1, 9)),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),

    // Device-wide EQ / DSP
    { ...deviceEnableCmd('bypass_all_eq', 'Bypass All EQ', 'EQ', 'BYPASS_ALL_EQ') },
    { ...deviceEnableCmd('eq_contour', 'EQ Contour (Low-Cut)', 'EQ', 'EQ_CONTOUR') },
    { ...deviceEnableCmd('bypass_imx', 'Bypass IntelliMix DSP', 'Processing', 'BYPASS_IMX') },

    // Coverage / beam
    deviceSelectCmd('device_installation', 'Device Installation Position', 'Coverage', 'DEVICE_INSTALLATION', [
        { value: 'CEILING', label: 'CEILING' },
        { value: 'WALL_HORIZONTAL', label: 'WALL_HORIZONTAL' },
        { value: 'WALL_VERTICAL', label: 'WALL_VERTICAL' },
        { value: 'TABLE', label: 'TABLE' },
    ], 'Position'),
    { ...deviceEnableCmd('autofocus', 'Automatic Focus', 'Beam', 'AUTOFOCUS') },

    // LED
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness'),
    dcmd('led_color_muted'),
    dcmd('led_color_unmuted'),
    dcmd('led_state_muted'),
    dcmd('led_state_unmuted'),
    deviceRoCmd('dev_mute_status_led_state', 'Mute-Status LED State', 'LED', 'DEV_MUTE_STATUS_LED_STATE', ['ON', 'OFF']),

    dcmd('num_active_mics'),
    dcmd('flash'), dcmd('reboot'), dcmd('default_settings'),
    dcmd('encryption'), dcmd('control_mac'), dcmd('ip_addr'),

    // Metering
    dcmd('meter_rate'),
    { ...deviceValueCmd('meter_rate_postgate', 'Metering Rate - Post-Gate', 'Metering', 'METER_RATE_POSTGATE', 'meterRate') },
    { ...deviceValueCmd('meter_rate_mxr_gain', 'Metering Rate - Automixer Gain', 'Metering', 'METER_RATE_MXR_GAIN', 'meterRate') },
    { ...deviceValueCmd('meter_rate_aecref', 'Metering Rate - AEC Reference', 'Metering', 'METER_RATE_AECREF', 'meterRate') },

    dcmd('preset_name'),
];

export default makeModel({
    meta: {
        id: 'mxa710',
        name: 'MXA710',
        fullName: 'MXA710 Linear Array',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/microphones/mxa710',
        docVersion: '3.8',
        docDate: 'July 2025',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 1,
        blurb: 'Linear array with steerable lobes + IntelliMix. Modeled as the 4 ft unit (lobes 1-8, automix 9); the 2 ft unit uses lobes 1-4 with automix 5.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
