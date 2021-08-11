var NODE_PATH = '/discovery2mqtt/';

module.exports = function(RED) {
    RED.httpAdmin.get(NODE_PATH + 'static/*', function (req, res) {
        var options = {
            root: __dirname + '/static/',
            dotfiles: 'deny'
        };
        res.sendFile(req.params[0], options);
    });

    RED.httpAdmin.get(NODE_PATH + 'getComponents', function (req, res) {
        var config = req.query;
        var controller = RED.nodes.getNode(config.controllerID);
        var force = config.forceRefresh ? ['1', 'yes', 'true', 'on'].includes(config.forceRefresh.toLowerCase()) : false;

        if (controller && controller.constructor.name === "ServerNode") {
            controller.getComponents(function (items) {
                if (items) {
                    res.json(items);
                } else {
                    res.status(404).end();
                }
            }, force);
        } else {
            res.status(404).end();
        }
    });
}
