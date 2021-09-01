const deviceModule = require('aws-iot-device-sdk').device;
const cmdLineProcess = require('aws-iot-device-sdk/examples/lib/cmdline');


var awsIot = require('aws-iot-device-sdk');
var shell = require('shelljs');
const pinataSDK = require('@pinata/sdk');
var AWS = require('aws-sdk');
const assets = require("./assets.json")

const CardanocliJs = require("./index.js");
const os = require("os");
const path = require("path");
const fs = require('fs');
// Thumbnail
const sharp = require('sharp');

const ProposalJs = require("./proposal.js");
//UUID
const { v4: uuidv4 } = require("uuid");
// Crypto library
const crypto = require('crypto');

// Global variables from credential.json and config.json
const credentials = require('./config/credentials.json')
const credentialsAWS = credentials['aws_credentials']
const credentialsPinata = credentials['pinata_credentials']
const config = require('./config/config.json')
const configCardanoCli = config['cardano_cli']
const configAWSIoTDevice = config['aws_iot_device']
const configLocalFiles = config['local_files']

// Cardano CLI instance
const dir = path.join(os.homedir(), configCardanoCli.cardano_node);
const shelleyPath = path.join(
  os.homedir(),
  configCardanoCli.cardano_node,
  configCardanoCli.testnet_shelley_genesis_json
);

const cardanocliJs = new CardanocliJs({
  network: configCardanoCli.network,
  dir: dir,
  shelleyGenesisPath: shelleyPath,
  socketPath: configCardanoCli.socketPath,
});

// Piñata instance
const pinata = pinataSDK(credentialsPinata.access_key_id, credentialsPinata.secret_access_key);


//begin module

function processTest(args) {
   //
   // The device module exports an MQTT instance, which will attempt
   // to connect to the AWS IoT endpoint configured in the arguments.
   // Once connected, it will emit events which our application can
   // handle.
   //
   const device = deviceModule({
      keyPath: args.privateKey,
      certPath: args.clientCert,
      caPath: args.caCert,
      clientId: args.clientId,
      region: args.region,
      baseReconnectTimeMs: args.baseReconnectTimeMs,
      keepalive: args.keepAlive,
      protocol: args.Protocol,
      port: args.Port,
      host: args.Host,
      debug: args.Debug
   });


   device.subscribe(configAWSIoTDevice.topic_ui);
   
  //  var timeout;
  //  var count = 0;
  //  const minimumDelay = 250;

  //  if (args.testMode === 1) {
  //     device.subscribe('topic_1');
  //  } else {
  //     device.subscribe('topic_2');
  //  }
  //  if ((Math.max(args.delay, minimumDelay)) !== args.delay) {
  //     console.log('substituting ' + minimumDelay + 'ms delay for ' + args.delay + 'ms...');
  //  }
  //  timeout = setInterval(function() {
  //     count++;

  //     if (args.testMode === 1) {
  //        device.publish('topic_2', JSON.stringify({
  //           mode1Process: count
  //        }));
  //     } else {
  //        device.publish('topic_1', JSON.stringify({
  //           mode2Process: count
  //        }));
  //     }
  //  }, Math.max(args.delay, minimumDelay)); // clip to minimum

   //
   // Do a simple publish/subscribe demo based on the test-mode passed
   // in the command line arguments.  If test-mode is 1, subscribe to
   // 'topic_1' and publish to 'topic_2'; otherwise vice versa.  Publish
   // a message every four seconds.
   //
   device
      .on('connect', function() {
         console.log('connect');
      });
   device
      .on('close', function() {
         console.log('close');
      });
   device
      .on('reconnect', function() {
         console.log('reconnect');
      });
   device
      .on('offline', function() {
         console.log('offline');
      });
   device
      .on('error', function(error) {
         console.log('error', error);
      });
   device
      .on('message', function(topic, payload) {
         console.log('message', topic, payload.toString());
      });

}

module.exports = cmdLineProcess;

if (require.main === module) {
   cmdLineProcess('connect to the AWS IoT service and publish/subscribe to topics using MQTT, test modes 1-2',
      process.argv.slice(2), processTest);
}
