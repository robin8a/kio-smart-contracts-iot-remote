var awsIot = require('aws-iot-device-sdk');

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
    console.log('message', topic, payload.toString());
  });