
module.exports = function (RED) {
    class Discovery2mqttNodeIn {
        constructor(config) {
            RED.nodes.createNode(this, config);

            var node = this;
            node.config = config;
            node.server = RED.nodes.getNode(node.config.server);
            node.statusText = 'offline';
            node.statusTimer = null;

            if (typeof (node.config.component) === 'string') {
                node.config.component = JSON.parse(node.config.component); //for compatible
            }

            if (node.server) {
                node.status({})

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
                    fill: "red",
                    shape: "dot",
                    text: "node-red-contrib-discovery2mqtt/in:status.no_server"
                });
            }
        }

        onConnect() {
            this.status({
                fill: "green",
                shape: "dot",
                text: "node-red-contrib-discovery2mqtt/in:status.connected"
            });
        }

        onConnectError() {
            this.status({
                fill: "red",
                shape: "dot",
                text: "node-red-contrib-discovery2mqtt/in:status.no_connection"
            });
        }

        onClose() {
            var node = this;

            if (node.listener_onConnect) {
                node.server.removeListener('onConnect', node.listener_onConnect);
            }
            if (node.listener_onConnectError) {
                node.server.removeListener('onConnectError', node.listener_onConnectError);
            }
            if (node.listener_onMessage) {
                node.server.removeListener("onMessage", node.listener_onMessage);
            }

            node.onConnectError();
        }

        onMessage(data) {
            var node = this;

            if (node.hasComponent(data.topic)) {
                var parts = data.topic.split('/');

                clearTimeout(node.statusTimer);

                var topic = parts.pop();
                if (topic == 'status') {
                    node.statusText = data.payload;
                }

                if (topic == 'state') {
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: data.payload
                    });

                    node.send({
                        payload: data.payload,
                        topic: data.topic
                    });
                }

                node.statusTimer = setTimeout(function () {
                    node.status({
                        fill: "green",
                        shape: "dot",
                        text: node.statusText
                    });
                }, 3 * 1000);
            }
        }

        hasComponent(component) {
            var node = this;
            var result = false;

            for (var i in node.config.component) {
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
