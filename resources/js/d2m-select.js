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
            let statusgroup = '';

            data.forEach(function (p) {
              if (node.type != 'discovery2mqtt-status') {
                if (optgroup != p.control_name) {
                  htmlgroup = $('<optgroup/>').attr('label', p.control_name);
                  htmlgroup.appendTo(componentElm);
                  optgroup = p.control_name;
                }
              }

              let topic = d2m_getTopic(p);
              let friendly_name = p.device_name + ' (' + p.control_name + ')';
              let name = p.device_name + ' (' + p.control_name + '.' + p.type + ')';
              let homekit = p.homekit || '';

              if (node.type == 'discovery2mqtt-in') {
                $(`<option>${name}</option>`).attr('value', topic).attr('data-name', friendly_name).attr('data-homekit', homekit).appendTo(htmlgroup);
              } else if (node.type == 'discovery2mqtt-out' && p.command_topic) {
                $(`<option>${name}</option>`).attr('value', topic).attr('data-name', friendly_name).appendTo(htmlgroup);
              } else if (node.type == 'discovery2mqtt-status' && p.availability_topic) {
                if (statusgroup != p.control_name) {
                  $(`<option>${p.control_name}</option>`).attr('value', topic).attr('data-name', p.control_name).appendTo(componentElm);
                  statusgroup = p.control_name;
                }
              }
            });

            componentElm.multipleSelect('refresh').multipleSelect('enable');
            componentElm.multipleSelect('setSelects', [nodeValue]);
          } catch (_) { }
        });
    }
  }

  var serverElm = $('#node-input-server');
  var componentElm = $('#node-input-component');
  var refreshElm = $('#force-refresh');
  var nameElm = $('#node-input-name');

  // init multiselect
  componentElm.addClass('multiple-select');
  componentElm.multipleSelect({ filter: true, single: true });

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
    $(`<option>Raw</option>`).attr('value', 'raw').appendTo(typeElm);
    let homekit = $('#node-input-component option:selected').attr('data-homekit');
    if (homekit) {
      $(`<option>${homekit} (HomeKit)</option>`).attr('value', homekit).appendTo(typeElm);
    }

    nodeValue = homekit != nodeValue ? 'raw' : homekit;

    typeElm.multipleSelect('refresh').multipleSelect('enable');
    typeElm.multipleSelect('setSelects', [nodeValue]);
  }

  var typeElm = $('#node-input-payload_type');
  var componentElm = $('#node-input-component');
  var refreshElm = $('#force-refresh');

  // init multiselect
  typeElm.addClass('multiple-select');
  typeElm.multipleSelect({ filter: true, single: true });

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