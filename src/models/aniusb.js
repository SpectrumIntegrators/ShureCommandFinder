// ANIUSB-MATRIX — Audio Network Interface with USB + matrix mixer.
// Channel map (command-strings PDF v4.7):
//   01-04 Dante inputs, 05 analog input, 06 USB input,
//   07-08 Dante outputs, 09 analog output, 10 USB output.
// Matrix: inputs 01-06 x outputs 07-10. No automixer / AEC.
import { makeModel } from '@/models/makeModel.js';
import { KIND } from '@/models/kinds.js';
import { cmd, xcmd, dcmd, range, oneOf } from '@/models/commandLib.js';

const inEl = (id, name, short, channel, group) => ({
    id, name, short, group, kind: KIND.INPUT, channel, uiNumber: null,
    chain: [], matrixRole: 'input', matrixOrder: channel,
});
const outEl = (id, name, short, channel, group, chain = ['PEQ']) => ({
    id, name, short, group, kind: KIND.OUTPUT, channel, uiNumber: null,
    chain, matrixRole: 'output', matrixOrder: channel,
});

const elements = [
    inEl('dante-in-1', 'Dante Input 1', 'D-In 1', 1, 'Dante Inputs'),
    inEl('dante-in-2', 'Dante Input 2', 'D-In 2', 2, 'Dante Inputs'),
    inEl('dante-in-3', 'Dante Input 3', 'D-In 3', 3, 'Dante Inputs'),
    inEl('dante-in-4', 'Dante Input 4', 'D-In 4', 4, 'Dante Inputs'),
    inEl('analog-in', 'Analog Input', 'Analog In', 5, 'Analog / USB Inputs'),
    inEl('usb-in', 'USB Input', 'USB In', 6, 'Analog / USB Inputs'),
    outEl('dante-out-1', 'Dante Output 1', 'D-Out 1', 7, 'Dante Outputs'),
    outEl('dante-out-2', 'Dante Output 2', 'D-Out 2', 8, 'Dante Outputs'),
    outEl('analog-out', 'Analog Output', 'Analog Out', 9, 'Analog / USB Outputs'),
    outEl('usb-out', 'USB Output', 'USB Out', 10, 'Analog / USB Outputs'),
];

const isOut = range(7, 10);

const channelCommands = [
    cmd('chan_name', range(1, 10)),
    cmd('audio_gain', range(1, 10)),
    cmd('audio_mute', range(1, 10)),
    cmd('audio_in_lvl', oneOf(5)),
    cmd('audio_out_lvl', oneOf(9)),
    cmd('limiter_engaged', isOut),
    cmd('audio_out_clip', range(1, 10)),
    cmd('encryption_ch', range(1, 10)),
    cmd('get_all', range(1, 10)),

    // ---- Beyond Basic (tab category set centrally in CATEGORY) ----
    cmd('peq', isOut),
];

const crosspointCommands = [
    xcmd('matrix_route', () => true),
    xcmd('matrix_gain', () => true),
];

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'),
    dcmd('preset'), dcmd('preset_audio_route'),
    dcmd('device_audio_mute'), dcmd('logic_mute'),
    dcmd('flash'), dcmd('led_brightness_basic'), dcmd('reboot'),
    dcmd('usb_connect'), dcmd('ip_addr'),
    dcmd('input_meter_mode'), dcmd('output_meter_mode'), dcmd('meter_rate'),
    dcmd('onhook_enable'), dcmd('onhook_state'),
    dcmd('preset_names'),
];

export default makeModel({
    meta: {
        id: 'aniusb',
        name: 'ANIUSB-MATRIX',
        fullName: 'ANIUSB-MATRIX',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/mixers/aniusb-matrix',
        docVersion: '4.7',
        docDate: 'May 2024',
        gainOffsetDb: 110,
        hasMatrix: true,
        blurb: '4 Dante in, analog in, USB in; 2 Dante out, analog out, USB out; 6×4 matrix mixer. No automixer/AEC.',
    },
    elements,
    channelCommands,
    crosspointCommands,
    deviceCommands,
});
