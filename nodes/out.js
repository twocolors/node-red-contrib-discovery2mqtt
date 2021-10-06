
module.exports = function (RED) {
    class Discovery2mqttNodeOut {
        constructor(config) {
            RED.nodes.createNode(this, config);

            let node = this;
            node.config = config;
            node.server = RED.nodes.getNode(node.config.server);

            if (typeof (node.config.component) === 'string') {
                node.config.component = JSON.parse(node.config.component); //for compatible
            }

            if (node.server) {
                node.status({});

                node.on('input', function (message) {
                    let topic = node.hasCommand();
                    if (topic) {
                        let payload = RED.util.evaluateNodeProperty(node.config.payload, node.config.payload_type, node, message);
                        if (payload) {
                            // node.log('Published to mqtt topic: ' + topic + ' : ' + payload.toString());
                            node.server.mqtt.publish(topic, payload.toString(), {retain: node.config.retain});

                            let text = payload.toString();
                            let last_seen = new Date().getTime();;

                            if (text.length > 4) {
                                text = text.substring(0, 4) + '...';
                            }

                            if (node.config.indicator) {
                                text = text + ' 🕑 ' + new Date(last_seen).toLocaleDateString('ru-RU') + ' ' + new Date(last_seen).toLocaleTimeString('ru-RU');
                            }

                            node.status({
                                fill: "green",
                                shape: "ring",
                                text: text
                            });
                        } else {
                            node.status({
                                fill: "red",
                                shape: "dot",
                                text: "node-red-contrib-discovery2mqtt/out:status.no_payload"
                            });
                        }
                    } else {
                        node.status({
                            fill: "red",
                            shape: "dot",
                            text: "node-red-contrib-discovery2mqtt/out:status.no_device"
                        });
                    }
                });
            } else {
                node.status({
                    fill: "red",
                    shape: "dot",
                    text: "node-red-contrib-discovery2mqtt/out:status.no_server"
                });
            }
        }

        hasCommand() {
            let node = this;
            let result = false;

            for (let i in node.config.component) {
                let parts = node.config.component[i].split('/');
                let topic = parts.pop();

                if (topic === 'command') {
                    result = node.config.component[i];
                    break;
                }
            }

            return result;
        }

    }
    RED.nodes.registerType('discovery2mqtt-out', Discovery2mqttNodeOut);
};
