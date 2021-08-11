'use strict';

class d2mHelper {
    static isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }
    static isNumber(n) {
        return d2mHelper.isInt(n) || d2mHelper.isFloat(n);
    }

    static isInt(n) {
        if (n === 'true' || n === true || n === 'false' || n === false) return false;
        return n !== "" && !isNaN(n) && Math.round(n) === n;
    }

    static isFloat(n) {
        if (n === 'true' || n === true || n === 'false' || n === false) return false;
        return n !== "" && !isNaN(n) && Math.round(n) !== n;
    }

    static switchComponent(p) {
        return [{
            control_name: p.device.name,
            device_name: p.name,
            state_topic: p.stat_t || p.state_topic,
            command_topic: p.cmd_t || p.command_topic,
            availability_topic: p.avty_t || p.availability_topic,
            type: 'switch',
            model: p.device.model,
        }];
    }

    static sensorComponent(p) {
        return [{
            control_name: p.device.name,
            device_name: p.name,
            state_topic: p.stat_t || p.state_topic,
            availability_topic: p.avty_t || p.availability_topic,
            type: 'sensor',
            model: p.device.model,
        }];
    }
}

module.exports = d2mHelper;
