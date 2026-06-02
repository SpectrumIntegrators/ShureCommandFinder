// ANI22 — 2x2 Audio Network Interface (analog <-> Dante).
// Channel map (PDF): 01-02 analog inputs, 03-04 analog outputs. No matrix / automixer.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import { cmd, dcmd, range, oneOf, deviceEnumCmd, deviceEnableCmd, deviceRoCmd } from '@/models/commandLib.js';

const elements = [
    { id: 'analog-in-1', name: 'Analog Input 1', short: 'In 1', group: 'Analog Inputs', kind: KIND.INPUT, channel: 1, uiNumber: null, chain: ['EQ'], matrixRole: null },
    { id: 'analog-in-2', name: 'Analog Input 2', short: 'In 2', group: 'Analog Inputs', kind: KIND.INPUT, channel: 2, uiNumber: null, chain: ['EQ'], matrixRole: null },
    { id: 'analog-out-1', name: 'Analog Output 1', short: 'Out 1', group: 'Analog Outputs', kind: KIND.OUTPUT, channel: 3, uiNumber: null, chain: ['PEQ'], matrixRole: null },
    { id: 'analog-out-2', name: 'Analog Output 2', short: 'Out 2', group: 'Analog Outputs', kind: KIND.OUTPUT, channel: 4, uiNumber: null, chain: ['PEQ'], matrixRole: null },
];

const channelCommands = [
    cmd('audio_gain', range(1, 4)),
    cmd('audio_mute', range(1, 4)),
    cmd('phantom_pwr', oneOf(1, 2)),
    cmd('audio_out_lvl', oneOf(3, 4)),
    cmd('chan_led_in_state', oneOf(1, 2)),
    cmd('audio_out_clip', range(1, 4)),
    cmd('get_all', range(1, 4)),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'),
    dcmd('preset'), dcmd('device_audio_mute'),
    deviceEnumCmd('audio_summing_mode', 'Audio Summing Mode', 'Routing', 'AUDIO_SUMMING_MODE', ['OFF', '1+2', '3+4', '1+2/3+4'], 'Summing'),
    deviceEnableCmd('hw_gating_logic', 'Hardware Gating Logic', 'Logic', 'HW_GATING_LOGIC'),
    deviceRoCmd('limiter_engaged', 'Limiter Engaged', 'Status', 'LIMITER_ENGAGED', ['ON', 'OFF']),
    dcmd('encryption_ch'),
    dcmd('flash'), dcmd('led_brightness'), dcmd('reboot'),
    dcmd('ip_addr'), dcmd('input_meter_mode'), dcmd('meter_rate'),
];

export default makeModel({
    meta: {
        id: 'ani22',
        name: 'ANI22',
        fullName: 'ANI22 (Audio Network Interface 2×2)',
        port: 2202,
        fwTarget: 'current',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 2,
        blurb: '2 analog inputs (01-02) and 2 analog outputs (03-04) to/from Dante. Phantom power, summing, PEQ.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
