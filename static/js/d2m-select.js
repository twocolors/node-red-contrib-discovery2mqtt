function d2m_getComponentList(node, nodeValue) {

  function d2m_updateComponentList(nodeValue, refresh = false) {
    //disable component element
    componentElm.multipleSelect('disable');

    let controller = RED.nodes.node(serverElm.val());
    if (controller) {
      // get json
      $.getJSON('discovery2mqtt/getComponents', {
        controllerID: controller.id,
        forceRefresh: refresh
      })
        .done(function (data) {
          // remove all
          componentElm.children().remove();
          try {
            // sort data
            data.sort(function (a, b) {
              if (a.control_name > b.control_name) { return 1; }
              if (a.control_name < b.control_name) { return -1; }
              return 0;
            });

            let optgroup = '';
            let htmlgroup = '';

            data.forEach(function (p) {
              if (optgroup != p.control_name) {
                htmlgroup = $('<optgroup/>', { label: p.control_name });
                htmlgroup.appendTo(componentElm);
                optgroup = p.control_name;
              }

              let topic = d2m_getTopic(p);
              let friendly_name = p.device_name + ' (' + p.control_name + ')';
              let name = p.device_name + ' (' + p.control_name + '.' + p.type + ')';
              let homekit = p.homekit || '';

              let option = '';
              if (node.type == 'discovery2mqtt-in') {
                option = '<option value=\'' + topic + '\' data-name="' + friendly_name + '" data-homekit="' + homekit + '">' + name + '</option>';
              } else if (node.type == 'discovery2mqtt-out' && p.command_topic) {
                option = '<option value=\'' + topic + '\' data-name="' + friendly_name + '">' + name + '</option>';
              }
              $(option).appendTo(htmlgroup);
            });

            componentElm.val(nodeValue);
            componentElm.multipleSelect('refresh');
          } catch (_) { }
        });
    }
  }

  var serverElm = $('#node-input-server');
  var componentElm = $('#node-input-component');
  var refreshElm = $('#force-refresh');
  var nameElm = $('#node-input-name');

  // init multiselect
  componentElm.multipleSelect({ filter: true });

  // get value
  let value = componentElm.val() || nodeValue;

  // init
  d2m_updateComponentList(value);

  // change server
  serverElm.change(function () {
    d2m_updateComponentList(value, true);
  });

  // click refresh
  refreshElm.click(function () {
    d2m_updateComponentList(value, true);
  });

  // change component
  componentElm.change(function () {
    // update name
    let name = $(this).find(":selected").attr('data-name');
    if(!nameElm.val()) {
      nameElm.val(name);
    }
  });
}

function d2m_getTopic(p) {
  let array = [];

  for (const [key, value] of Object.entries(p)) {
    //topic
    // if (new RegExp('\_topic$').exec(key.toString())) {
    //   array.push(value);
    // }
    var parts = key.split('_');
    if (parts.pop() == 'topic') {
      array.push(value);
    }
  }

  return JSON.stringify(array);
}

function d2m_getTypeList(nodeValue) {

  function d2m_updateTypeList(nodeValue) {
    typeElm.multipleSelect('disable');
    typeElm.children().remove();

    // init
    $('<option value="raw">Raw</option>').appendTo(typeElm);
    let homekit = $('#node-input-component option:selected').attr('data-homekit');
    if (homekit) {
      $('<option value="' + homekit + '">' + homekit + ' (HomeKit)</option>').appendTo(typeElm);
    }

    nodeValue = homekit != nodeValue ? 'raw' : homekit;

    typeElm.val(nodeValue);
    typeElm.multipleSelect('refresh');
  }

  var typeElm = $('#node-input-payload_type');
  var componentElm = $('#node-input-component');
  var refreshElm = $('#force-refresh');

  // init multiselect
  typeElm.multipleSelect();

  // get value
  let value = typeElm.val() || nodeValue;

  // init
  d2m_updateTypeList(value);

  // click refresh
  refreshElm.click(function () {
    d2m_updateTypeList(value);
  });

  // change component
  componentElm.change(function () {
    d2m_updateTypeList(value);
  });
}