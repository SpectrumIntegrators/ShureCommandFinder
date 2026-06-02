// ANI4OUT — 4-channel Dante-to-analog interface.
// Channel map (PDF): 1-4 individual analog output channels. Single-digit channel numbers.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import { cmd, dcmd, range, deviceEnumCmd } from '@/models/commandLib.js';

const elements = [1, 2, 3, 4].map((n) => ({
    id: `analog-out-${n}`,
    name: `Analog Output ${n}`,
    short: `Out ${n}`,
    group: 'Analog Outputs',
    kind: KIND.OUTPUT,
    channel: n,
    uiNumber: null,
    chain: ['PEQ'],
    matrixRole: null,
}));

const channelCommands = [
    cmd('na_chan_name', range(1, 4)),
    cmd('audio_gain', range(1, 4)),
    cmd('audio_mute', range(1, 4)),
    cmd('audio_out_lvl', range(1, 4)),
    cmd('audio_in_peak', range(1, 4)),
    cmd('audio_in_rms', range(1, 4)),
    cmd('limiter_engaged', range(1, 4)),
    cmd('get_all', range(1, 4)),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'), dcmd('na_device_name'),
    dcmd('preset'),
    deviceEnumCmd('audio_summing_mode', 'Audio Summing Mode', 'Routing', 'AUDIO_SUMMING_MODE', ['OFF', '1+2', '3+4', '1+2/3+4', '1+2+3+4'], 'Summing'),
    dcmd('flash'), dcmd('led_brightness'), dcmd('reboot'), dcmd('default_settings'),
    dcmd('encryption'), dcmd('control_mac'), dcmd('ip_addr'),
    dcmd('output_meter_mode'), dcmd('meter_rate'),
];

export default makeModel({
    meta: {
        id: 'ani4out',
        name: 'ANI4OUT',
        fullName: 'ANI4OUT (4-Channel Dante-to-Analog)',
        port: 2202,
        fwTarget: 'current',
        gainOffsetDb: 110,
        hasMatrix: false,
        channelPad: 1,
        blurb: '4 Dante channels to analog outputs (1-4). Output level switch, summing, PEQ. Single-digit channel numbers.',
    },
    elements,
    channelCommands,
    deviceCommands,
});
