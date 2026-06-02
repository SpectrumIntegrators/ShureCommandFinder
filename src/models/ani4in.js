// ANI4IN — 4-channel analog-to-Dante interface.
// Channel map (PDF): 1-4 individual analog input channels. Single-digit channel numbers.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import { cmd, dcmd, range, deviceEnumCmd } from '@/models/commandLib.js';

const elements = [1, 2, 3, 4].map((n) => ({
    id: `analog-in-${n}`,
    name: `Analog Input ${n}`,
    short: `In ${n}`,
    group: 'Analog Inputs',
    kind: KIND.INPUT,
    channel: n,
    uiNumber: null,
    chain: ['EQ'],
    matrixRole: null,
}));

const channelCommands = [
    cmd('chan_name', range(1, 4)),
    cmd('na_chan_name', range(1, 4)),
    cmd('audio_gain', range(1, 4)),
    cmd('audio_mute', range(1, 4)),
    cmd('phantom_pwr', range(1, 4)),
    cmd('chan_led_in_state', range(1, 4)),
    cmd('hw_gating_logic', range(1, 4)),
    cmd('audio_in_peak', range(1, 4), { fw: '2.0' }),
    cmd('audio_in_rms', range(1, 4), { fw: '2.0' }),
    cmd('limiter_engaged', range(1, 4), { fw: '2.0' }),
    cmd('get_all', range(1, 4)),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'),
    { ...deviceEnumCmd('audio_summing_mode', 'Audio Summing Mode', 'Routing', 'AUDIO_SUMMING_MODE', ['OFF', '1+2', '3+4', '1+2/3+4', '1+2+3+4'], 'Summing'), fw: '2.0' },
    dcmd('flash'), dcmd('led_brightness'), dcmd('reboot', { fw: '2.0' }), dcmd('default_settings', { fw: '2.0' }),
    dcmd('encryption', { fw: '2.0' }), dcmd('control_mac'), dcmd('ip_addr'),
    dcmd('input_meter_mode', { fw: '2.0' }), dcmd('meter_rate'),
];

export default makeModel({
    meta: {
        id: 'ani4in',
        name: 'ANI4IN',
        fullName: 'ANI4IN (4-Channel Analog-to-Dante)',
        port: 2202,
        docVersion: '2.2',
        docDate: 'June 2024',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 1,
        blurb: '4 analog inputs (1-4) to Dante. Phantom power, hardware gating logic, summing, PEQ. Single-digit channel numbers.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
