// App-wide constants. Per-model facts (TCP port, firmware, gain offset, channel map)
// live in each model's meta — see src/models/.

export const ORG_URL = 'https://spectrumintegrators.com';
// LICENSE.txt is served as a static file from public/, so the browser shows it directly.
export const LICENSE_URL = import.meta.env.BASE_URL + 'LICENSE.txt';
export const DOC_TITLE = 'Shure DSP Command Finder';

// All Shure command-string devices use this TCP control port.
export const TCP_PORT = 2202;
