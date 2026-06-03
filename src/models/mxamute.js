// MXA-MUTE — networked mute button (Microflex accessory). No audio channels; all commands
// are device-level. Channel map (PDF v1.2): n/a.
import { makeModel } from '@/models/makeModel.js';
import { dcmd, deviceEnableCmd, deviceEnumCmd, deviceSelectCmd, deviceRoCmd } from '@/models/commandLib.js';

const deviceCommands = [
    dcmd('model'), dcmd('serial'), dcmd('fw_ver'), dcmd('device_id'),
    dcmd('preset'),

    // Mute button behavior
    deviceRoCmd('mute_button_status', 'Mute Button Status', 'Mute', 'MUTE_BUTTON_STATUS', ['ON', 'OFF', 'UNKNOWN']),
    deviceEnumCmd('mute_control_func', 'Mute Control Function', 'Mute', 'MUTE_CONTROL_FUNC', ['ENABLED', 'DISABLED'], 'Function'),
    deviceSelectCmd('mute_control_mode', 'Mute Control Mode', 'Mute', 'MUTE_CONTROL_MODE', [
        { value: 'TOG', label: 'TOG (Toggle)' },
        { value: 'PTT', label: 'PTT (Push-to-talk)' },
        { value: 'PTM', label: 'PTM (Push-to-mute)' },
    ], 'Mode'),
    deviceEnumCmd('default_toggle_state', 'Default Toggle State', 'Mute', 'DEFAULT_TOGGLE_STATE', ['Muted', 'Unmuted'], 'State'),
    deviceRoCmd('ext_switch_out_state', 'External Switch Output State', 'Status', 'EXT_SWITCH_OUT_STATE', ['ON', 'OFF']),

    // LED
    deviceEnableCmd('dev_led_in_state', 'Device LED Enable', 'LED', 'DEV_LED_IN_STATE'),
    dcmd('led_brightness'),
    dcmd('led_color_muted'),
    dcmd('led_color_unmuted'),
    dcmd('led_state_muted'),
    dcmd('led_state_unmuted'),
    deviceRoCmd('dev_mute_status_led_state', 'Mute-Status LED State', 'LED', 'DEV_MUTE_STATUS_LED_STATE', ['ON', 'OFF']),

    dcmd('flash'), dcmd('reboot'), dcmd('default_settings'),
    dcmd('last_error_event'), dcmd('control_mac'),
    dcmd('preset_name'),
];

export default makeModel({
    meta: {
        id: 'mxamute',
        name: 'MXA-MUTE',
        fullName: 'MXA-MUTE Network Mute Button',
        port: 2202,
        productUrl: 'https://www.shure.com/en-US/products/accessories/mxamute',
        docVersion: '1.2',
        docDate: 'March 2023',
        gainOffsetDb: 110,
        hasMatrix: false,
        blurb: 'Networked mute button (Microflex accessory). No audio channels — device-level mute behavior, logic output, and LED control only.',
    },
    elements: [],
    channelCommands: [],
    deviceCommands,
});
