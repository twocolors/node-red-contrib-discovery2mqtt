const d2mHelper = require('../lib/d2mHelper.js');

module.exports = function (RED) {
    class Discovery2mqttNodeIn {
        constructor(config) {
            RED.nodes.createNode(this, config);

            let node = this;
            node.config = config;
            node.server = RED.nodes.getNode(node.config.server);
            node.first_msg = true;
            node.clean_timer = null;
            node.last_status = null;

            if (typeof (node.config.component) === 'string') {
                node.config.component = JSON.parse(node.config.component); //for compatible
            }

            if (node.server) {
                node.status({});

                node.listener_onConnect = function () { node.onConnect(); }
                node.server.on('onConnect', node.listener_onConnect);

                node.listener_onConnectError = function () { node.onConnectError(); }
                node.server.on('onConnectError', node.listener_onConnectError);

                node.listener_onMessage = function (data) { node.onMessage(data); }
                node.server.on('onMessage', node.listener_onMessage);

                node.on('close', () => this.onClose());

                if (typeof (node.server.mqtt) === 'object') {
                    node.onConnect();
                }
            } else {
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: 'node-red-contrib-discovery2mqtt/in:status.no_server'
                });
            }
        }

        onConnect() {
            this.status({
                fill: 'green',
                shape: 'dot',
                text: 'node-red-contrib-discovery2mqtt/in:status.connected'
            });
        }

        onConnectError() {
            this.status({
                fill: 'red',
                shape: 'dot',
                text: 'node-red-contrib-discovery2mqtt/in:status.no_connection'
            });
        }

        onClose() {
            let node = this;

            if (node.listener_onConnect) {
                node.server.removeListener('onConnect', node.listener_onConnect);
            }
            if (node.listener_onConnectError) {
                node.server.removeListener('onConnectError', node.listener_onConnectError);
            }
            if (node.listener_onMessage) {
                node.server.removeListener('onMessage', node.listener_onMessage);
            }

            node.onConnectError();
        }

        onMessage(data) {
            let node = this;

            if (node.hasComponent(data.topic)) {
                clearTimeout(node.clean_timer);

                let parts = data.topic.split('/');
                let topic = parts.pop();

                if (topic == 'status') {
                    node.last_status = data.payload;
                    node.status({
                        fill: (node.last_status == 'online' ? 'green' : 'grey'),
                        shape: 'dot',
                        text: node.last_status
                    });
                }

                if (topic == 'state') {
                    let text = data.payload.toString();
                    let last_seen = new Date().getTime();;

                    let payload_type = node.config.payload_type;
                    if (payload_type == 'TemperatureSensor') {
                        text = '??????? ' + text;
                    }
                    else if (payload_type == 'HumiditySensor') {
                        text = '???? ' + text;
                    }
                    else if (payload_type == 'Battery') {
                        text = '???? ' + text;
                    }
                    else if (text.length > 4) {
                        text = text.substring(0, 4) + '...';
                    }

                    if (node.config.indicator) {
                        text = text + ' ???? ' + new Date(last_seen).toLocaleDateString('ru-RU') + ' ' + new Date(last_seen).toLocaleTimeString('ru-RU');
                    }

                    node.status({
                        fill: 'green',
                        shape: 'ring',
                        text: text
                    });

                    if (node.last_status) {
                        node.clean_timer = setTimeout(function () {
                            node.status({
                                fill: (node.last_status == 'online' ? 'green' : 'grey'),
                                shape: 'dot',
                                text: node.last_status
                            });
                        }, 3.5 * 1000);
                    }

                    if (node.first_msg && !node.config.start_msg) {
                        node.first_msg = false;
                    } else {
                        let payload = data.payload;
                        let payload_type = node.config.payload_type;
                        if (payload_type != 'raw') {
                            payload = d2mHelper.payload2homekit(payload_type, payload);
                        }

                        node.send({
                            payload: payload,
                            payload_raw: data.payload,
                            topic: data.topic
                        });
                    }
                }

            }
        }

        hasComponent(component) {
            let node = this;
            let result = false;

            for (let i in node.config.component) {
                if (node.config.component[i] === component) {
                    result = true;
                    break;
                }
            }

            return result;
        }

    }
    RED.nodes.registerType('discovery2mqtt-in', Discovery2mqttNodeIn);
};
