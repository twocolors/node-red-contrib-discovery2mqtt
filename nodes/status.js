module.exports = function (RED) {
    class Discovery2mqttNodeStatus {
        constructor(config) {
            RED.nodes.createNode(this, config);

            let node = this;
            node.config = config;
            node.server = RED.nodes.getNode(node.config.server);
            node.first_msg = true;

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
                    node.onGet();
                }
            } else {
                node.status({
                    fill: 'red',
                    shape: 'dot',
                    text: 'node-red-contrib-discovery2mqtt/status:status.no_server'
                });
            }
        }

        onConnect() {
            this.status({
                fill: 'green',
                shape: 'dot',
                text: 'node-red-contrib-discovery2mqtt/status:status.connected'
            });
        }

        onConnectError() {
            this.status({
                fill: 'red',
                shape: 'dot',
                text: 'node-red-contrib-discovery2mqtt/status:status.no_connection'
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

                let parts = data.topic.split('/');
                let topic = parts.pop();

                if (topic == 'status') {
                    node.status({
                        fill: (data.payload == 'online' ? 'green' : 'grey'),
                        shape: 'ring',
                        text: data.payload
                    });

                    if (node.first_msg) {
                        node.first_msg = false;
                    } else {
                        node.send({
                            payload: data.payload,
                            topic: data.topic
                        });
                    }
                }

            }
        }

        onGet() {
            let node = this;

            let timeout = null;
            let client = node.server.connectMQTT('get');

            client.on('connect', function () {
                timeout = setTimeout(function () {
                    client.end(true);
                }, 5000);

                let topic = node.hasStatus();
                client.subscribe(topic, function (error) {
                    if (error) {
                        node.first_msg = false;
                        client.end(true);
                    }
                });
            });

            client.on('error', function () {
                client.end(true);
            });

            client.on('end', function () {
                clearTimeout(timeout);
            });

            client.on('message', function (topic, message) {
                let messageString = message.toString();

                node.status({
                    fill: (messageString == 'online' ? 'green' : 'grey'),
                    shape: 'ring',
                    text: messageString
                });

                node.send({
                    payload: messageString,
                    topic: topic
                });

                client.end(true);
            });
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

        hasStatus() {
            let node = this;
            let result = false;

            for (let i in node.config.component) {
                let parts = node.config.component[i].split('/');
                let topic = parts.pop();

                if (topic === 'status') {
                    result = node.config.component[i];
                    break;
                }
            }

            return result;
        }

    }
    RED.nodes.registerType('discovery2mqtt-status', Discovery2mqttNodeStatus);
};
