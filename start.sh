#!/usr/bin/env bash
# stop script on error
set -e

# Check to see if root CA file exists, download if not
if [ ! -f ./certs/root-CA.crt ]; then
  printf "\nDownloading AWS IoT Root CA certificate from AWS...\n"
  curl https://www.amazontrust.com/repository/AmazonRootCA1.pem > root-CA.crt
fi

# install AWS Device SDK for NodeJS if not already installed
if ! node -e "require('aws-iot-device-sdk')" &> /dev/null; then
  printf "\nInstalling AWS SDK...\n"
  npm install aws-iot-device-sdk
fi

# run pub/sub sample app using certificates downloaded in package
printf "\nRunning pub/sub sample application...\n"
# node node_modules/aws-iot-device-sdk/examples/device-example.js --host-name=az6wto8a6h0jn-ats.iot.us-east-1.amazonaws.com --private-key=certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.private.key --client-certificate=certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.cert.pem --ca-certificate=certs/kio-smart-contracts-iot-device/root-CA.crt --client-id=sdk-nodejs-e57c917f-032c-4778-8184-69116bc19f76

# node node_modules/aws-iot-device-sdk/examples/device-example.js 
# --host-name=az6wto8a6h0jn-ats.iot.us-east-1.amazonaws.com 
# --private-key=kio-smart-contracts-iot-device.private.key 
# --client-certificate=kio-smart-contracts-iot-device.cert.pem 
# --ca-certificate=root-CA.crt 
# --client-id=sdk-nodejs-e57c917f-032c-4778-8184-69116bc19f76


node device-example.js \
--host-name=az6wto8a6h0jn-ats.iot.us-east-1.amazonaws.com \
--private-key=certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.private.key \
--client-certificate=certs/kio-smart-contracts-iot-device/kio-smart-contracts-iot-device.cert.pem \
--ca-certificate=certs/kio-smart-contracts-iot-device/root-CA.crt \
--client-id=sdk-nodejs-e57c917f-032c-4778-8184-69116bc19f76
