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
        return n !== '' && !isNaN(n) && Math.round(n) === n;
    }

    static isFloat(n) {
        if (n === 'true' || n === true || n === 'false' || n === false) return false;
        return n !== '' && !isNaN(n) && Math.round(n) !== n;
    }

    static device2homekit(p) {
        switch (p) {
            case 'switch':
                return 'Switch';
            case 'temperature':
                return 'TemperatureSensor';
            case 'humidity':
                return 'HumiditySensor';
            case 'battery':
                return 'Battery';
            default:
                return '';
        }
    }

    static payload2homekit(type, payload) {
        let msg = {};
        switch (type) {
            case 'Switch':
                return msg["Switch"] = {
                    "On": payload == "ON"
                };
            case 'TemperatureSensor':
                return msg["TemperatureSensor"] = {
                    "CurrentTemperature": parseFloat(payload)
                };
            case 'HumiditySensor':
                return msg["HumiditySensor"] = {
                    "CurrentRelativeHumidity": parseFloat(payload)
                };
            case 'Battery':
                return msg["Battery"] = {
                    "BatteryLevel": parseInt(payload),
                    "StatusLowBattery": parseInt(payload) <= 30 ? 1 : 0
                };
            default:
                return payload;
        }
    }

    static switchComponent(p) {
        let array = [];

        if ('json_attr_t' in p || 'json_attributes_topic' in p) {
            array.push({
                control_name: typeof (p.dev.name) !== 'undefined' ? p.dev.name : p.device.name,
                device_name: p.name + '/JSON Attr',
                state_topic: typeof (p.json_attr_t) !== 'undefined' ? p.json_attr_t : p.json_attributes_topic,
                availability_topic: typeof (p.avty_t) !== 'undefined' ? p.avty_t : p.availability_topic,
                type: 'switch'
            });
        }

        if ('stat_t' in p || 'state_topic' in p || 'cmd_t' in p || 'command_topic' in p) {
            array.push({
                control_name: typeof (p.dev.name) !== 'undefined' ? p.dev.name : p.device.name,
                device_name: p.name,
                state_topic: typeof (p.stat_t) !== 'undefined' ? p.stat_t : p.state_topic,
                command_topic: typeof (p.cmd_t) !== 'undefined' ? p.cmd_t : p.command_topic,
                availability_topic: typeof (p.avty_t) !== 'undefined' ? p.avty_t : p.availability_topic,
                type: 'switch',
                homekit: d2mHelper.device2homekit('switch')
            });
        }

        return array;
    }

    static sensorComponent(p) {
        let array = [];

        if ('json_attr_t' in p || 'json_attributes_topic' in p) {
            array.push({
                control_name: typeof (p.dev.name) !== 'undefined' ? p.dev.name : p.device.name,
                device_name: p.name + '/JSON Attr',
                state_topic: typeof (p.json_attr_t) !== 'undefined' ? p.json_attr_t : p.json_attributes_topic,
                availability_topic: typeof (p.avty_t) !== 'undefined' ? p.avty_t : p.availability_topic,
                type: 'sensor'
            });
        }

        if ('stat_t' in p || 'state_topic' in p) {
            array.push({
                control_name: typeof (p.dev.name) !== 'undefined' ? p.dev.name : p.device.name,
                device_name: p.name,
                state_topic: typeof (p.stat_t) !== 'undefined' ? p.stat_t : p.state_topic,
                availability_topic: typeof (p.avty_t) !== 'undefined' ? p.avty_t : p.availability_topic,
                type: 'sensor',
                homekit: d2mHelper.device2homekit(typeof (p.dev_cla) !== 'undefined' ? p.dev_cla : p.device_class)
            });
        }

        return array;
    }
}

module.exports = d2mHelper;
