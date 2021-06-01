var awsIot = require('aws-iot-device-sdk');
var shell = require('shelljs');

const CardanocliJs = require("./index.js");
const os = require("os");
const path = require("path");

const dir = path.join(os.homedir(), "testnet");
const shelleyPath = path.join(
  os.homedir(),
  "testnet",
  "testnet-shelley-genesis.json"
);

const cardanocliJs = new CardanocliJs({
  network: "testnet-magic 1097911063",
  dir: dir,
  shelleyGenesisPath: shelleyPath,
  // socketPath: path.join(os.homedir(), "testnet", "db", "socket"),
  socketPath: "/opt/cardano/cnode/sockets/node0.socket",
});



//
// Replace the values of '<YourUniqueClientIdentifier>' and '<YourCustomEndpoint>'
// with a unique client identifier and custom host endpoint provided in AWS IoT.
// NOTE: client identifiers must be unique within your AWS account; if a client attempts
// to connect with a client identifier which is already in use, the existing
// connection will be terminated.
//
var device = awsIot.device({
    keyPath: 'certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.private.key',
   certPath: 'certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.cert.pem',
     caPath: 'certs/kio-smart-contracts-iot-device/root-CA.crt',
   clientId: 'sdk-nodejs-e57c917f-032c-4778-8184-69116bc19f76',
       host: 'az6wto8a6h0jn-ats.iot.us-east-1.amazonaws.com',
     region: 'us-east-1',
       port: 8883,
      debug: true
 });

//
// Device is an instance returned by mqtt.Client(), see mqtt.js for full
// documentation.
//
device
  .on('connect', function() {
    console.log('connect');
    device.subscribe('topic_1');
    device.publish('topic_2', JSON.stringify({ test_data: 1}));
  });

device
  .on('message', function(topic, payload) {
    console.log('message topic payload: ', topic, payload);
    console.log('message topic payload.toString(): ', topic, payload.toString());
    const obj = JSON.parse(payload);

    // console.log('obj.Command_From_UI', obj.Command_From_UI);
    // console.log('obj.msg.Command_From_UI', obj.msg.Command_From_UI);

    if (obj.Command_From_UI) {
        console.log('## device.on message Command_From_UI');
        // var command_from_ui = "sshpass -p 'C0lt3n02019$' ssh -p 2223 admin@192.168.15.1 " + obj.Command_From_UI[0].command;
        var command_from_ui = obj.Command_From_UI.command;
        console.log('## device.on message Command_From_UI command_from_ui: ', command_from_ui);
        command_from_ui_result = shell.exec(command_from_ui, {silent:true}).stdout;
        console.log('## device.on message Command_From_UI command_from_ui_result: ', command_from_ui_result);
        device.publish('topic_2', JSON.stringify(command_from_ui_result));
    }

    if (obj.Command_From_UI_Query_Tip) {
        console.log('## device.on message Command_From_UI_Query_Tip');
        var command_from_ui_query_tip = obj._query_tip_Query_Tip.command;
        console.log('## device.on message Command_From_UI_Query_Tip command_from_ui: ', command_from_ui_query_tip);
        command_from_ui_query_tip_result = cardanocliJs.queryTip();
        console.log('## device.on message Command_From_UI_Query_Tip command_from_ui_result: ', command_from_ui_query_tip);
        device.publish('topic_2', JSON.stringify(command_from_ui_query_tip));
    }

    device.publish('topic_2', JSON.stringify(cardanocliJs.queryTip()));
    // device.publish('topic_2', JSON.stringify('NO COMMAND ON JSON'));

  });
