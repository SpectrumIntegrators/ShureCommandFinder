// P300 command catalog — composed from the shared command library with P300 channel
// ranges. Ranges transcribed from the P300 command-strings PDF (v4.4).
import { cmd, xcmd, dcmd, range, oneOf, any } from '@/models/commandLib.js';

const isMic = range(1, 8);

const AEC_REF_OPTIONS = [
    'DANTEOUT1', 'DANTEOUT2', 'DANTEOUT3', 'DANTEOUT4', 'DANTEOUT5', 'DANTEOUT6', 'DANTEOUT7', 'DANTEOUT8',
    'ANALOGOUT1', 'ANALOGOUT2', 'DANTEIN9', 'DANTEIN10', 'ANALOGIN1', 'ANALOGIN2', 'USBIN', 'MOBILEIN',
].map((v) => ({ value: v, label: v }));

// SAMPLE field placeholder: `count` space-separated groups of `width` distinct letters
// (aaa bbb ccc …), the full shape of the streamed response, per the command-strings doc.
const fields = (count, width = 3) =>
    Array.from({ length: count }, (_, i) => String.fromCharCode(97 + i).repeat(width)).join(' ');

// P300-specific metering (separate IN/OUT/PROC/ERLE/AGC rates with SAMPLE streams).
const meter = (id, token, group, sample, notes) => ({
    id,
    name: `Metering Rate - ${group}`,
    group: 'Metering',
    cat: 'details',
    templates: {
        get: `< GET ${token} >`,
        set: `< SET ${token} {v} >`,
        rep: [`< REP ${token} {v} >`, sample],
    },
    param: { kind: 'value', label: 'Rate', encoding: 'meterRate' },
    notes,
});

// Basic = common one-off control commands. Advanced adds the numeric/quality tuning
// (AGC, EQ/PEQ, AEC NLP, NR level, compressor, automixer params, direct-out tap). All
// adds niche / deprecated commands (gate inhibit, noise estimate).
export const channelCommands = [
    cmd('chan_name', any(range(1, 20), range(23, 28))),
    cmd('audio_gain', any(range(1, 20), range(22, 28))),
    cmd('audio_mute', any(range(1, 20), range(23, 28))),
    cmd('audio_in_lvl', oneOf(11, 12)),
    cmd('audio_out_lvl', oneOf(17, 18)),
    cmd('aec', isMic),
    cmd('noise_red', isMic),
    cmd('automxr_gate', isMic),
    cmd('automxr_mode', oneOf(21)),
    cmd('automxr_mute', oneOf(21)),
    cmd('compressor', oneOf(21)),
    cmd('aec_ref', oneOf(22), { param: { kind: 'select', label: 'Reference', options: AEC_REF_OPTIONS } }),
    cmd('delay', oneOf(17, 18, 19)),
    cmd('get_all', any(range(1, 21), range(23, 28))),

    // ---- Beyond Basic: per-channel (tab category set in CATEGORY) ----
    cmd('na_chan_name', any(range(1, 20), range(23, 28))),
    cmd('peq', any(range(1, 21), range(23, 28))),
    cmd('aec_nlp', isMic),
    cmd('agc', isMic),
    cmd('agc_max_cut', isMic),
    cmd('agc_max_boost', isMic),
    cmd('agc_target', isMic),
    cmd('noise_red_lvl', isMic),
    cmd('directout_point', isMic),
    cmd('automxr_always_on', isMic),
    cmd('automxr_priority', isMic),
    cmd('automxr_off_att', oneOf(21)),
    cmd('automxr_gate_sen', oneOf(21)),
    cmd('automxr_max_nom', oneOf(21)),
    cmd('automxr_lmlo', oneOf(21)),
    cmd('automxr_holdtime', oneOf(21)),
    cmd('comp_threshold', oneOf(21)),
    cmd('comp_ratio', oneOf(21)),

    // ---- All: niche / deprecated ----
    cmd('gate_inhibit', oneOf(22)),
    cmd('noise_lvl', isMic),
];

export const crosspointCommands = [
    xcmd('matrix_route', () => true),
    xcmd('matrix_gain', () => true, {
        settableInput: (inCh) => inCh === 21 || (inCh >= 9 && inCh <= 14),
        notes: 'Crosspoint gain is settable only for inputs 09-14 and the automixer (21); for the auto-mixed Dante channels (01-08) only GET is supported.',
    }),
];

export const deviceCommands = [
    dcmd('model'),
    dcmd('serial'),
    dcmd('fw_ver'),
    dcmd('device_id'),
    dcmd('na_device_name'),
    dcmd('preset'),
    dcmd('device_audio_mute'),
    dcmd('flash'),
    dcmd('led_brightness_basic'),
    dcmd('reboot'),
    dcmd('default_settings'),
    dcmd('encryption'),
    dcmd('usb_connect'),
    dcmd('ip_addr'),
    dcmd('control_mac'),
    dcmd('input_meter_mode'),
    dcmd('output_meter_mode'),
    meter('meter_rate_in', 'METER_RATE_IN', 'Inputs', `< SAMPLE_IN ${fields(14)} >`, '14 input levels, each 000-060 = -60..0 dBFS. 0 = off; 1-99 ms invalid. Order: 1-8 Dante mic, 9-10 Dante, 11-12 analog, 13 USB, 14 mobile.'),
    meter('meter_rate_out', 'METER_RATE_OUT', 'Outputs', `< SAMPLE_OUT ${fields(12)} >`, '12 output levels, each 000-060 dBFS. 0 = off. Order: 1-2 Dante out, 3-4 analog out, 5 USB out, 6 mobile out, 7-12 Dante out 3-8.'),
    meter('meter_rate_proc', 'METER_RATE_PROC', 'Processing', `< SAMPLE_PROC ${fields(12)} >`, '12 levels, each 000-060 dBFS. 0 = off. Order: 1-8 pre-AGC Dante inputs, 9 automix out, 10 pre-compressor, 11-12 AEC reference.'),
    meter('meter_rate_erle', 'METER_RATE_ERLE', 'ERLE', `< SAMPLE_ERLE ${fields(8)} >`, '8 mic channels. 0 = off. ERLE data 00-40 dB.'),
    meter('meter_rate_agc', 'METER_RATE_AGC', 'AGC Gain', `< SAMPLE_AGC ${fields(8)} >`, '8 mic channels. 0 = off. AGC gain scaled by 20: 00 = -20 dB, 20 = 0 dB, 40 = +20 dB.'),
    dcmd('onhook_enable'),
    dcmd('onhook_state'),
    dcmd('preset_names'),
];
