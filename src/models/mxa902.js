// MXA902 — single-zone ceiling array with integrated loudspeaker. Channel map (PDF v0.5):
// automix output (microphone section) 09, loudspeaker section 10. AEC reference metered.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import {
    cmd, dcmd, oneOf, chanCmd,
    deviceEnableCmd, deviceRoCmd, deviceValueCmd,
} from '@/models/commandLib.js';

const elements = [
    { id: 'output', name: 'Automix Output (Mic)', short: 'Mic', group: 'Array', kind: KIND.OUTPUT, channel: 9, uiNumber: null, chain: ['PEQ'], matrixRole: null },
    { id: 'loudspeaker', name: 'Loudspeaker (AEC Reference)', short: 'Speaker', group: 'Loudspeaker', kind: KIND.INPUT, channel: 10, uiNumber: null, chain: ['PEQ', 'Delay'], matrixRole: null },
    { id: 'dante-in-1', name: 'Dante Input 1', short: 'Dante In 1', group: 'Dante Inputs', kind: KIND.INPUT, channel: 11, uiNumber: null, chain: [], matrixRole: null },
    { id: 'dante-in-2', name: 'Dante Input 2', short: 'Dante In 2', group: 'Dante Inputs', kind: KIND.INPUT, channel: 12, uiNumber: null, chain: [], matrixRole: null },
];

const channelCommands = [
    cmd('chan_name', oneOf(9, 10, 11, 12)),
    cmd('na_chan_name', oneOf(9, 10, 11, 12)),
    cmd('audio_gain', oneOf(9, 10, 11, 12)),
    cmd('audio_mute', oneOf(9, 10, 11, 12)),
    cmd('peq', oneOf(9, 10)),
    cmd('eq_contour', oneOf(9)),
    cmd('noise_filter', oneOf(9)),
    cmd('speech_gating', oneOf(9)),
    cmd('compressor', oneOf(9, 10)),
    cmd('delay', oneOf(10)),
    chanCmd('sig_gen', 'Signal Generator', 'Loudspeaker', 'SIG_GEN', { kind: 'enum', label: 'State', options: ['ON', 'OFF'], rep: ['ON', 'OFF'] }, oneOf(10)),
    chanCmd('sig_gen_type', 'Signal Generator Type', 'Loudspeaker', 'SIG_GEN_TYPE', { kind: 'select', label: 'Type', options: [{ value: 'PINK', label: 'PINK (Pink noise)' }, { value: 'WHITE', label: 'WHITE (White noise)' }, { value: 'TONE', label: 'TONE' }] }, oneOf(10)),
    chanCmd('sig_gen_freq', 'Signal Generator Frequency', 'Loudspeaker', 'SIG_GEN_FREQ', { kind: 'raw', label: 'Freq', hint: 'frequency' }, oneOf(10)),
    chanCmd('sig_gen_gain', 'Signal Generator Gain', 'Loudspeaker', 'SIG_GEN_GAIN', { kind: 'raw', label: 'Gain', hint: 'gain' }, oneOf(10)),
    cmd('audio_in_peak', oneOf(9, 10, 11, 12)),
    cmd('audio_in_rms', oneOf(9, 10, 11, 12)),
    cmd('audio_out_clip', oneOf(9, 10, 11, 12)),
    cmd('get_all', oneOf(9, 10, 11, 12)),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'), dcmd('device_audio_mute'),

    { ...deviceEnableCmd('speaker', 'Loudspeaker On/Off', 'Loudspeaker', 'SPEAKER') },
    { ...deviceEnableCmd('autofocus', 'Automatic Focus', 'Beam', 'AUTOFOCUS') },

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
        id: 'mxa902',
        name: 'MXA902',
        fullName: 'MXA902 Ceiling Array + Loudspeaker',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/microphones/mxa902',
        docVersion: '0.5',
        docDate: 'July 2025',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 2,
        blurb: 'Single-zone ceiling array with integrated loudspeaker. Mic/automix output on channel 09, loudspeaker (gain, PEQ, compressor, delay, signal generator) on channel 10.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
