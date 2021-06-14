var awsIot = require('aws-iot-device-sdk');
var shell = require('shelljs');
const pinataSDK = require('@pinata/sdk');
var AWS = require('aws-sdk');

const CardanocliJs = require("./index.js");
const os = require("os");
const path = require("path");
const fs = require('fs');

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


const pinata = pinataSDK('8ae8c06d4e674e2c0487', 'be5bab6e2aa91194afa472f2a83f87d355bb738ec4a02e38341ef97c3a734674');

// AWS S3
// module variables
const config = require('./aws_credentials.json');

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

 const createWallet = (account) => {
  const payment = cardanocliJs.addressKeyGen(account);
  const stake = cardanocliJs.stakeAddressKeyGen(account);
  cardanocliJs.stakeAddressBuild(account);
  cardanocliJs.addressBuild(account, {
    paymentVkey: payment.vkey,
    stakeVkey: stake.vkey,
  });
  return cardanocliJs.wallet(account);
};

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
    console.log('##########################################')
    console.log('message topic payload: ', topic, payload);
    console.log('message topic payload.toString(): ', topic, payload.toString());
    const jsonString = JSON.parse(payload);
    const obj = JSON.parse(jsonString);
    console.log('obj: ', obj);
    console.log('##########################################')
    // debugger
    // console.log('obj.Command_From_UI', obj.Command_From_UI);
    // console.log('obj.msg.Command_From_UI', obj.msg.Command_From_UI);

    if (obj.Command_From_UI !== undefined) {
        console.log('## device.on message Command_From_UI');
        // var command_from_ui = "sshpass -p 'C0lt3n02019$' ssh -p 2223 admin@192.168.15.1 " + obj.Command_From_UI[0].command;
        var command_from_ui = obj.Command_From_UI[0].command;
        console.log('## device.on message Command_From_UI command_from_ui: ', command_from_ui);
        command_from_ui_result = shell.exec(command_from_ui, {silent:true}).stdout;
        console.log('## device.on message Command_From_UI command_from_ui_result: ', command_from_ui_result);
        device.publish('topic_2', JSON.stringify(command_from_ui_result));
    }

    if (obj.Command_From_UI_Query_Tip !== undefined) {
      
      console.log('## device.on message Command_From_UI_Query_Tip');
      var command_from_ui_query_tip = obj.Command_From_UI_Query_Tip[0].command;
      console.log('## device.on message Command_From_UI_Query_Tip command_from_ui: ', command_from_ui_query_tip);
      command_from_ui_query_tip_result = cardanocliJs.queryTip();
      console.log('## device.on message Command_From_UI_Query_Tip command_from_ui_result: ', command_from_ui_query_tip_result);
      device.publish('topic_2', JSON.stringify(command_from_ui_query_tip_result));
    }

    if (obj.Create_Wallet_From_UI !== undefined) { 
      console.log('## device.on message Create_Wallet_From_UI');
      var walletName = obj.Create_Wallet_From_UI[0].wallet_name;
      console.log('## device.on message Wallet Name: ', walletName);
      command_from_create_wallet_result = createWallet(walletName);
      console.log('## device.on message Create_Wallet_From_UI command_from_ui_result: ', command_from_create_wallet_result);
      device.publish('topic_2', JSON.stringify(command_from_create_wallet_result));
    }

    if (obj.Get_Wallet_Balance_By_Name_From_UI !== undefined) { 
      console.log('## device.on message Get_Wallet_Balance_By_Name_From_UI');
      var walletName = obj.Get_Wallet_Balance_By_Name_From_UI[0].wallet_name;
      console.log('## device.on message Wallet Name: ', walletName);
      // command_from_get_wallet_balance_by_name_result = cardanocliJs.wallet(walletName).balance().value.lovelace;
      command_from_get_wallet_balance_by_name_result = cardanocliJs.wallet(walletName).balance();
      console.log('## device.on message Get_Wallet_Balance_By_Name_From_UI command_from_ui_result: ', command_from_get_wallet_balance_by_name_result);
      device.publish('topic_2', JSON.stringify(command_from_get_wallet_balance_by_name_result));
    }
    
    if (obj.Transfer_Funds_Between_Wallets_From_UI !== undefined) { 
      console.log('## device.on message Transfer_Funds_Between_Wallets_From_UI');

      var walletNameOrigin = obj.Transfer_Funds_Between_Wallets_From_UI[0].wallet_name_origin;
      console.log('## device.on message Wallet Name Origin: ', walletNameOrigin);

      var walletAddressDestination = obj.Transfer_Funds_Between_Wallets_From_UI[0].wallet_address_destination;
      console.log('## device.on message Wallet Address Destination: ', walletAddressDestination);

      var transactionAmount = parseFloat(obj.Transfer_Funds_Between_Wallets_From_UI[0].transaction_amount);
      console.log('## device.on message Transaction Amount: ', transactionAmount);

      //funded wallet
      const sender = cardanocliJs.wallet(walletNameOrigin);
      console.log(
        "Balance of Sender wallet: " +
          cardanocliJs.toAda(sender.balance().value.lovelace) +
          " ADA"
      );

      //receiver address
      const receiver = walletAddressDestination;

      // create raw transaction
      let txInfo = {
        txIn: cardanocliJs.queryUtxo(sender.paymentAddr),
        txOut: [
          {
            address: sender.paymentAddr,
            value: {
              lovelace: sender.balance().value.lovelace - cardanocliJs.toLovelace(transactionAmount),
            },
          }, //value going back to sender
          { address: receiver, value: { lovelace: cardanocliJs.toLovelace(transactionAmount) } }, //value going to receiver
        ],
        metadata: { 1: { cardanocliJs: "First Metadata from cardanocli-js" }},
      };
      debugger
      let raw = cardanocliJs.transactionBuildRaw(txInfo);
      debugger

      //calculate fee
      let fee = cardanocliJs.transactionCalculateMinFee({
        ...txInfo,
        txBody: raw,
        witnessCount: 1,
      });
      debugger

      //pay the fee by subtracting it from the sender utxo
      txInfo.txOut[0].value.lovelace -= fee;

      //create final transaction
      let tx = cardanocliJs.transactionBuildRaw({ ...txInfo, fee });
      debugger

      //sign the transaction
      let txSigned = cardanocliJs.transactionSign({
        txBody: tx,
        signingKeys: [sender.payment.skey],
      });
      debugger

      //broadcast transaction
      let txHash = cardanocliJs.transactionSubmit(txSigned);
      debugger
      console.log("TxHash: " + txHash);

      command_from_get_wallet_balance_by_name_result = cardanocliJs.wallet(walletName).balance();
      console.log('## device.on message Transfer_Funds_Between_Wallets_From_UI command_from_ui_result: ', command_from_get_wallet_balance_by_name_result);
      // device.publish('topic_2', JSON.stringify(command_from_get_wallet_balance_by_name_result));
      device.publish('topic_2', JSON.stringify(txHash));
    }

    if (obj.Upload_File_To_IPFS_From_UI !== undefined) { 
      console.log('## device.on message Upload_File_To_IPFS_From_UI');
      var fileName = obj.Upload_File_To_IPFS_From_UI[0].file_name;
      console.log('## device.on message File Name: ', fileName);
      command_from_upload_file_to_IPFS_result = downloadFileFromAWSS3(fileName);
      if (command_from_upload_file_to_IPFS_result !== undefined) {
        console.log('## device.on message Upload_File_To_IPFS_From_UI command_from_upload_file_to_IPFS_result: ', command_from_upload_file_to_IPFS_result);
        device.publish('topic_2', JSON.stringify(command_from_upload_file_to_IPFS_result));
      }
    }
    
  });

  pinata.testAuthentication().then((result) => {
    //handle successful authentication here
    console.log(result);
  }).catch((err) => {
      //handle error here
      console.log(err);
  });

  function uploadFileToIPFS(pFileName) {
    debugger
    const readableStreamForFile = fs.createReadStream('./'+pFileName);
    const options = {
        pinataMetadata: {
            name: 'MyCustomName',
            keyvalues: {
                customKey: 'customValue',
                customKey2: 'customValue2'
            }
        },
        pinataOptions: {
            cidVersion: 0
        }
    };

    pinata.pinFileToIPFS(readableStreamForFile, options).then((result) => {
        //handle results here
        console.log(result);
        return result
    }).catch((err) => {
        //handle error here
        console.log(err);
        return err
    });
  };
  
  function downloadFileFromAWSS3(pFileName) {
    const credentials = config.credentials;
    var result = '';

    var s3 = new AWS.S3({
      accessKeyId: credentials.access_key_id,
      secretAccessKey: credentials.secret_access_key,
      region: 'us-east-1'
    })
    debugger
    var params = {
        Key: credentials.path+pFileName,
        Bucket: credentials.bucket_name
    }

    s3.getObject(params, function(err, data) {
        if (err) {
            throw err
        }
        fs.writeFileSync('./'+pFileName, data.Body)
        console.log('file downloaded successfully')
        result = uploadFileToIPFS(pFileName)
        console.log('file uploaded to piñata IPFS')
        return result
    })

  }
  
  // downloadFileFromAWSS3('02_Colombia.jpg')