// P300 selectable elements (the nodes you click in the signal-flow view and the rows /
// columns of the matrix grid).
//
// IMPORTANT numbering note: Shure Designer's UI labels inputs 1-14 and outputs 1-12.
// For INPUTS the UI number equals the API channel (01-14). For OUTPUTS they DIFFER:
//   UI 1-2  -> Dante Out 1-2   = API ch 15-16
//   UI 3-8  -> Dante Out 3-8   = API ch 23-28  (firmware 4.1.x+)
//   UI 9-10 -> Analog Out 1-2  = API ch 17-18
//   UI 11   -> USB Out         = API ch 19
//   UI 12   -> Mobile Out      = API ch 20
// Surfacing both numbers is the whole point of this tool, so every element carries
// `channel` (used in commands) and `uiNumber` (the Designer label).
//
// `matrixRole` marks whether the element is a matrix input row, output column, or both.
// Matrix inputs = API ch 01-14 and 21 (automix out); outputs = ch 15-20, 23-28.

import { KIND } from '@/models/kinds.js';

// chain = inline processing chips drawn on the signal-flow row (purely visual, but each
// chip can focus the matching command group in the panel).
export const elements = [
    // ---- Inputs: Dante mic channels 1-8 (full mic processing) ----
    ...Array.from({ length: 8 }, (_, i) => ({
        id: `dante-in-${i + 1}`,
        name: `Dante Input ${i + 1}`,
        short: `D-In ${i + 1}`,
        group: 'Dante Mic Inputs',
        kind: KIND.INPUT,
        channel: i + 1,
        uiNumber: i + 1,
        chain: ['PEQ', 'AEC', 'NR', 'AGC'],
        matrixRole: 'input',
        matrixOrder: i + 1,
    })),

    // ---- Inputs: Dante 9-10 (EQ only, no mic processing / not in automixer) ----
    ...[9, 10].map((n) => ({
        id: `dante-in-${n}`,
        name: `Dante Input ${n}`,
        short: `D-In ${n}`,
        group: 'Dante Inputs',
        kind: KIND.INPUT,
        channel: n,
        uiNumber: n,
        chain: ['EQ'],
        matrixRole: 'input',
        matrixOrder: 100 + n, // placed after automix in the grid
    })),

    // ---- Inputs: Analog 1-2 (line/aux level switch) ----
    {
        id: 'analog-in-1',
        name: 'Analog Input 1',
        short: 'Analog In 1',
        group: 'Analog Inputs',
        kind: KIND.INPUT,
        channel: 11,
        uiNumber: 11,
        chain: ['EQ'],
        matrixRole: 'input',
        matrixOrder: 111,
    },
    {
        id: 'analog-in-2',
        name: 'Analog Input 2',
        short: 'Analog In 2',
        group: 'Analog Inputs',
        kind: KIND.INPUT,
        channel: 12,
        uiNumber: 12,
        chain: ['EQ'],
        matrixRole: 'input',
        matrixOrder: 112,
    },

    // ---- Inputs: USB / Mobile ----
    {
        id: 'usb-in',
        name: 'USB Input',
        short: 'USB In',
        group: 'Other Inputs',
        kind: KIND.INPUT,
        channel: 13,
        uiNumber: 13,
        chain: ['EQ'],
        matrixRole: 'input',
        matrixOrder: 113,
    },
    {
        id: 'mobile-in',
        name: 'Mobile Input',
        short: 'Mobile In',
        group: 'Other Inputs',
        kind: KIND.INPUT,
        channel: 14,
        uiNumber: 14,
        chain: ['EQ'],
        matrixRole: 'input',
        matrixOrder: 114,
    },

    // ---- Processing ----
    {
        id: 'automixer',
        name: 'Automixer Output',
        short: 'Automix',
        group: 'Processing',
        kind: KIND.PROCESSING,
        channel: 21,
        uiNumber: null,
        chain: ['PEQ', 'Comp'], // post-mix processing lives on channel 21
        matrixRole: 'input',
        matrixOrder: 9, // inserted after Dante mic in 8 in the grid
    },
    {
        id: 'aec-ref',
        name: 'AEC Reference',
        short: 'AEC Ref',
        group: 'Processing',
        kind: KIND.PROCESSING,
        channel: 22,
        uiNumber: null,
        chain: [],
        matrixRole: null,
    },

    // ---- Outputs ----
    {
        id: 'dante-out-1',
        name: 'Dante Output 1',
        short: 'D-Out 1',
        group: 'Dante Outputs',
        kind: KIND.OUTPUT,
        channel: 15,
        uiNumber: 1,
        chain: ['PEQ'],
        matrixRole: 'output',
        matrixOrder: 1,
    },
    {
        id: 'dante-out-2',
        name: 'Dante Output 2',
        short: 'D-Out 2',
        group: 'Dante Outputs',
        kind: KIND.OUTPUT,
        channel: 16,
        uiNumber: 2,
        chain: ['PEQ'],
        matrixRole: 'output',
        matrixOrder: 2,
    },
    ...[3, 4, 5, 6, 7, 8].map((n) => ({
        id: `dante-out-${n}`,
        name: `Dante Output ${n}`,
        short: `D-Out ${n}`,
        group: 'Dante Outputs',
        kind: KIND.OUTPUT,
        channel: 20 + n, // 23-28
        uiNumber: n,
        chain: ['PEQ'],
        fw: '4.1',
        matrixRole: 'output',
        matrixOrder: n,
    })),
    {
        id: 'analog-out-1',
        name: 'Analog Output 1',
        short: 'Analog Out 1',
        group: 'Analog Outputs',
        kind: KIND.OUTPUT,
        channel: 17,
        uiNumber: 9,
        chain: ['PEQ', 'Delay'],
        matrixRole: 'output',
        matrixOrder: 9,
    },
    {
        id: 'analog-out-2',
        name: 'Analog Output 2',
        short: 'Analog Out 2',
        group: 'Analog Outputs',
        kind: KIND.OUTPUT,
        channel: 18,
        uiNumber: 10,
        chain: ['PEQ', 'Delay'],
        matrixRole: 'output',
        matrixOrder: 10,
    },
    {
        id: 'usb-out',
        name: 'USB Output',
        short: 'USB Out',
        group: 'Other Outputs',
        kind: KIND.OUTPUT,
        channel: 19,
        uiNumber: 11,
        chain: ['PEQ', 'Delay'],
        matrixRole: 'output',
        matrixOrder: 11,
    },
    {
        id: 'mobile-out',
        name: 'Mobile Output',
        short: 'Mobile Out',
        group: 'Other Outputs',
        kind: KIND.OUTPUT,
        channel: 20,
        uiNumber: 12,
        chain: [],
        matrixRole: 'output',
        matrixOrder: 12,
    },

];
