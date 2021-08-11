
module.exports = function (RED) {
    class Discovery2mqttNodeOut {
        constructor(config) {
            RED.nodes.createNode(this, config);

            var node = this;
            node.config = config;
            node.server = RED.nodes.getNode(node.config.server);
            node.last_change = null;

            if (typeof (node.config.component) === 'string') {
                node.config.component = JSON.parse(node.config.component); //for compatible
            }

            if (node.server) {
                node.status({});

                node.on('input', function (message) {
                    var topic = node.hasCommand();
                    if (topic) {
                        var payload = RED.util.evaluateNodeProperty(node.config.payload, node.config.payloadType, node, message);
                        if (payload) {
                            // node.log('Published to mqtt topic: ' + topic + ' : ' + payload.toString());
                            node.server.mqtt.publish(topic, payload.toString(), {retain: true});

                            node.last_change = new Date().getTime();

                            var text = payload.toString() + ' [' + new Date(node.last_change).toLocaleDateString('ru-RU') + ' ' + new Date(node.last_change).toLocaleTimeString('ru-RU')+']';

                            node.status({
                                fill: "green",
                                shape: "dot",
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
            var node = this;
            var result = null;

            for (var i in node.config.component) {
                var str = node.config.component[i].toString();
                if (new RegExp('\/command$').exec(str)) {
                    result = str;
                    break;
                }
            }

            return result;
        }

    }
    RED.nodes.registerType('discovery2mqtt-out', Discovery2mqttNodeOut);
};
