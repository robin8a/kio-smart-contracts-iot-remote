#!/usr/bin/env bash
# stop script on error
set -e


# run pub/sub sample app using certificates downloaded in package
printf "\nRunning pub/sub sample application...\n"
# node node_modules/aws-iot-device-sdk/examples/device-example.js --host-name=az6wto8a6h0jn-ats.iot.us-east-1.amazonaws.com --private-key=certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.private.key --client-certificate=certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.cert.pem --ca-certificate=certs/kio-smart-contracts-iot-device/root-CA.crt --client-id=sdk-nodejs-e57c917f-032c-4778-8184-69116bc19f76


## Run changed device-example.js from node_modules/aws-iot-device-sdk/examples/device-example.js 
node app-two.js \
--host-name=az6wto8a6h0jn-ats.iot.us-east-1.amazonaws.com \
--private-key=certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.private.key \
--client-certificate=certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.cert.pem \
--ca-certificate=certs/kio-smart-contracts-iot-device/root-CA.crt \
--client-id=sdk-nodejs-e57c917f-032c-4778-8184-69116bc19f76
