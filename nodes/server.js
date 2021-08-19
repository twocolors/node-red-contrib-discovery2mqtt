const d2mHelper = require('../lib/d2mHelper.js');
var mqtt = require('mqtt');

module.exports = function (RED) {
    class ServerNode {

        constructor(n) {
            RED.nodes.createNode(this, n);

            var node = this;
            node.config = n;
            node.connection = false;
            node.topic = '#';
            node.components = [];
            node.on('close', () => this.onClose());
            node.setMaxListeners(0);

            node.init();
        }

        async init() {
            var node = this;

            node.log('Initialized ...');

            this.mqtt = this.connectMQTT();
            this.mqtt.on('connect', () => this.onMQTTConnect());
            this.mqtt.on('message', (topic, message) => this.onMQTTMessage(topic, message));
            this.mqtt.on('close', () => this.onMQTTClose());
            this.mqtt.on('end', () => this.onMQTTEnd());
            this.mqtt.on('reconnect', () => this.onMQTTReconnect());
            this.mqtt.on('offline', () => this.onMQTTOffline());
            this.mqtt.on('disconnect', (error) => this.onMQTTDisconnect(error));
            this.mqtt.on('error', (error) => this.onMQTTError(error));
        }

        connectMQTT(clientId = null) {
            var node = this;
            var options = {
                port: node.config.mqtt_port,
                username: node.credentials.mqtt_username || null,
                password: node.credentials.mqtt_password || null,
                clientId: "NodeRed-" + node.id + (clientId ? "-" + clientId : "")
            };
            return mqtt.connect('mqtt://' + node.config.host, options);
        }

        subscribeMQTT() {
            var node = this;
            node.mqtt.subscribe(node.topic, function (error) {
                if (error) {
                    node.warn('MQTT Error Subscribe to: "' + node.config.base_topic + '/#"');
                    node.emit('onConnectError', error);
                } else {
                    node.log('MQTT Subscribed to: "' + node.config.base_topic + '/#"');
                    node.emit('onConnect');
                    // console.log(node.components);
                }
            })
        }

        unsubscribeMQTT() {
            var node = this;
            node.log('MQTT Unsubscribe from: "' + node.config.base_topic + '/#"');
            node.mqtt.unsubscribe(node.topic, (error) => { });
        }

        onMQTTConnect() {
            var node = this;
            node.connection = true;
            node.log('MQTT Connected (' + node.config.host + ')');
            node.getComponents(function () {
                node.subscribeMQTT();
            }, true);
        }

        onMQTTClose() {
            var node = this;
            node.log('MQTT Close');
            // node.emit('onClose');
        }

        onMQTTEnd() {
            var node = this;
            node.log('MQTT End');
        }

        onMQTTReconnect() {
            var node = this;
            node.log('MQTT Reconnect');
        }

        onMQTTOffline() {
            var node = this;
            node.log('MQTT Offline');
        }

        onMQTTDisconnect(error) {
            var node = this;
            node.log('MQTT Disconnected');
            console.log(error);
        }

        onMQTTError(error) {
            var node = this;
            node.log('MQTT Error');
            console.log(error);
        }

        onClose() {
            var node = this;
            node.unsubscribeMQTT();
            node.mqtt.end();
            node.connection = false;
            node.log('MQTT connection closed');
        }

        getTypeByTopic(topic) {
            var type;
            var parts = topic.split('/');
            if (parts.pop() == 'config') {
                if (parts.length === 4) {
                    type = parts[1];
                }
                else if (parts.length === 3) {
                    type = parts[0];
                }
            }
            return type;
        }

        onMQTTMessage(topic, message) {
            var node = this;
            var messageString = message.toString();

            // console.log('topic:' + topic);
            // console.log('message:' + messageString);

            node.emit('onMessage', { topic: topic, payload: messageString });
        }

        getComponents(callback, forceRefresh = false) {
            var node = this;

            if (forceRefresh || node.components.length === 0) {
                node.components = [];

                node.log('MQTT Refreshing components ...');

                var timeout = null;
                var client = node.connectMQTT('tmp');

                client.on('connect', function () {
                    timeout = setTimeout(function () {
                        client.end(true);
                    }, 5000);

                    client.subscribe(node.config.base_topic + '/#', function (error) {
                        if (error) {
                            RED.log.error("discovery2mqtt: " + error);
                            client.end(true);
                        }
                    });
                });

                client.on('error', function (error) {
                    RED.log.error("discovery2mqtt: " + error);
                    client.end(true);
                });

                client.on('end', function () {
                    clearTimeout(timeout);
                    if (typeof (callback) === "function") {
                        callback(node.components);
                    }
                    return node.components;
                });

                client.on('message', function (topic, message) {
                    var messageString = message.toString();
                    var type = node.getTypeByTopic(topic);
                    var component = undefined;

                    switch (type) {
                        // switch
                        case 'switch':
                            if (d2mHelper.isJson(messageString)) {
                                var payload = JSON.parse(messageString);
                                component = d2mHelper.switchComponent(payload);
                            }
                            break;
                        // sensor
                        case 'sensor':
                            if (d2mHelper.isJson(messageString)) {
                                var payload = JSON.parse(messageString);
                                component = d2mHelper.sensorComponent(payload);
                            }
                            break;
                    }

                    if (typeof (component) !== 'undefined') {
                        node.components = [].concat(node.components, component);
                    }
                });
            } else {
                node.log('MQTT Cache components ...');
                if (typeof (callback) === "function") {
                    callback(node.components);
                }
                return node.components;
            }
        }

    }

    RED.nodes.registerType('discovery2mqtt-server', ServerNode, {
        credentials: {
            mqtt_username: { type: "text" },
            mqtt_password: { type: "text" }
        }
    });
};
