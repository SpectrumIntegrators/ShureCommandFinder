import { makeModel } from '@/models/makeModel.js';
import { elements } from '@/models/p300/elements.js';
import { channelCommands, crosspointCommands, deviceCommands } from '@/models/p300/commands.js';

export default makeModel({
    meta: {
        id: 'p300',
        name: 'P300',
        fullName: 'IntelliMix P300',
        port: 2202,
        docVersion: '4.4',
        docDate: 'April 2024',
        gainOffsetDb: 110,
        hasMatrix: true,
        blurb: 'IntelliMix conferencing processor: 8 Dante mic channels (AEC/NR/AGC), 2 Dante line, 2 analog, USB, mobile; automixer + compressor; 15×12 matrix mixer.',
    },
    elements,
    channelCommands,
    crosspointCommands,
    deviceCommands,
});
