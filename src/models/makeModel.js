// Assembles a model spec into the object the UI consumes.
import { buildEncoders } from '@/models/encoders.js';

/**
 * @param {object} spec
 *   meta: { id, name, fullName, port, fwTarget, gainOffsetDb, hasMatrix, blurb }
 *   elements: []        selectable nodes (inputs/processing/outputs)
 *   channelCommands: [] composed via cmd()
 *   crosspointCommands: [] composed via xcmd()  (optional)
 *   deviceCommands: []  composed via dcmd()
 */
const DEVICE_NODE = {
    id: 'device',
    name: 'Device (Global)',
    short: 'Device',
    group: 'Device',
    kind: 'device',
    channel: null,
    uiNumber: null,
    chain: [],
    matrixRole: null,
};

export function makeModel(spec) {
    const baseElements = spec.elements || [];
    // Every model gets a synthetic Device node for global commands.
    const elements = baseElements.some((e) => e.id === 'device')
        ? baseElements
        : [...baseElements, DEVICE_NODE];
    const channelCommands = spec.channelCommands || [];
    const crosspointCommands = spec.crosspointCommands || [];
    const deviceCommands = spec.deviceCommands || [];
    const encoders = buildEncoders({ gainOffsetDb: spec.meta.gainOffsetDb });

    return {
        meta: { hasMatrix: false, populated: true, channelPad: 2, ...spec.meta },
        elements,
        channelCommands,
        crosspointCommands,
        deviceCommands,
        encoders,
        byId: Object.fromEntries(elements.map((e) => [e.id, e])),
        matrixInputs: elements
            .filter((e) => e.matrixRole === 'input')
            .sort((a, b) => a.matrixOrder - b.matrixOrder),
        matrixOutputs: elements
            .filter((e) => e.matrixRole === 'output')
            .sort((a, b) => a.matrixOrder - b.matrixOrder),
        commandsForChannel(ch) {
            return channelCommands.filter((c) => c.appliesTo(ch));
        },
        commandsForCrosspoint(inCh, outCh) {
            return crosspointCommands.filter((c) => c.appliesToCrosspoint(inCh, outCh));
        },
        defaultElementId() {
            const first = elements.find((e) => e.kind !== 'device');
            return first ? first.id : (elements[0] && elements[0].id) || null;
        },
    };
}
