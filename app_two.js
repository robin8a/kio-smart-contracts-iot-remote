// ToDo test trasactions without funds
// ToDo try catch on TXs

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


//
// Replace the values of '<YourUniqueClientIdentifier>' and '<YourCustomEndpoint>'
// with a unique client identifier and custom host endpoint provided in AWS IoT.
// NOTE: client identifiers must be unique within your AWS account; if a client attempts
// to connect with a client identifier which is already in use, the existing
// connection will be terminated.
//
var device = awsIot.device({
    keyPath: configAWSIoTDevice.keyPath,
   certPath: configAWSIoTDevice.certPath,
     caPath: configAWSIoTDevice.caPath,
   clientId: configAWSIoTDevice.clientId,
       host: configAWSIoTDevice.host,
     region: configAWSIoTDevice.region,
       port: configAWSIoTDevice.port,
      debug: configAWSIoTDevice.debug
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
    device.subscribe(configAWSIoTDevice.topic_subscribe);
    device.publish(configAWSIoTDevice.topic_publish, JSON.stringify({ test_data: 1}));
  });

device
  .on('message', async function(topic, payload) {
    console.log('##########################################')
    console.log('message topic payload: ', topic, payload);
    console.log('message topic payload.toString(): ', topic, payload.toString());
    const jsonString = JSON.parse(payload);
    const obj = JSON.parse(jsonString);
    console.log('obj: ', obj);
    console.log('##########################################')
    // console.log('obj.Command_From_UI', obj.Command_From_UI);
    // console.log('obj.msg.Command_From_UI', obj.msg.Command_From_UI);

    if (obj.Command_From_UI !== undefined) {
        console.log('## device.on message Command_From_UI');
        // var command_from_ui = "sshpass -p 'C0lt3n02019$' ssh -p 2223 admin@192.168.15.1 " + obj.Command_From_UI[0].command;
        var command_from_ui = obj.Command_From_UI[0].command;
        console.log('## device.on message Command_From_UI command_from_ui: ', command_from_ui);
        command_from_ui_result = shell.exec(command_from_ui, {silent:true}).stdout;
        console.log('## device.on message Command_From_UI command_from_ui_result: ', command_from_ui_result);
        device.publish(configAWSIoTDevice.topic_publish, JSON.stringify(command_from_ui_result));
    }

    if (obj.Command_From_UI_Query_Tip !== undefined) {
      
      console.log('## device.on message Command_From_UI_Query_Tip');
      var command_from_ui_query_tip = obj.Command_From_UI_Query_Tip[0].command;
      console.log('## device.on message Command_From_UI_Query_Tip command_from_ui: ', command_from_ui_query_tip);
      command_from_ui_query_tip_result = cardanocliJs.queryTip();
      console.log('## device.on message Command_From_UI_Query_Tip command_from_ui_result: ', command_from_ui_query_tip_result);
      device.publish(configAWSIoTDevice.topic_publish, JSON.stringify(command_from_ui_query_tip_result));
    }

    if (obj.Create_Wallet_From_UI !== undefined) { 
      console.log('## device.on message Create_Wallet_From_UI');
      var walletName = obj.Create_Wallet_From_UI[0].wallet_name;
      console.log('## device.on message Wallet Name: ', walletName);
      command_from_create_wallet_result = createWallet(walletName);
      console.log('## device.on message Create_Wallet_From_UI command_from_ui_result: ', command_from_create_wallet_result);
      device.publish(configAWSIoTDevice.topic_publish, JSON.stringify(command_from_create_wallet_result));
    }

    if (obj.Get_Wallet_Balance_By_Name_From_UI !== undefined) { 
      console.log('## device.on message Get_Wallet_Balance_By_Name_From_UI');
      var walletName = obj.Get_Wallet_Balance_By_Name_From_UI[0].wallet_name;
      console.log('## device.on message Wallet Name: ', walletName);
      // command_from_get_wallet_balance_by_name_result = cardanocliJs.wallet(walletName).balance().value.lovelace;
      command_from_get_wallet_balance_by_name_result = cardanocliJs.wallet(walletName).balance();
      console.log('## device.on message Get_Wallet_Balance_By_Name_From_UI command_from_ui_result: ', command_from_get_wallet_balance_by_name_result);
      device.publish(configAWSIoTDevice.topic_publish, JSON.stringify(command_from_get_wallet_balance_by_name_result));
    }
    
    if (obj.Transfer_Funds_Between_Wallets_From_UI !== undefined) { 
      console.log('## device.on message Transfer_Funds_Between_Wallets_From_UI');
      debugger
      var walletNameOrigin = obj.Transfer_Funds_Between_Wallets_From_UI[0].wallet_name_origin;
      console.log('## device.on message Wallet Name Origin: ', walletNameOrigin);
      debugger
      var walletAddressDestination = obj.Transfer_Funds_Between_Wallets_From_UI[0].wallet_address_destination;
      console.log('## device.on message Wallet Address Destination: ', walletAddressDestination);
      debugger
      var transactionAmount = parseFloat(obj.Transfer_Funds_Between_Wallets_From_UI[0].transaction_amount);
      console.log('## device.on message Transaction Amount: ', transactionAmount);
      debugger
      // funded wallet
      const sender = cardanocliJs.wallet(walletNameOrigin);
      console.log(
        "Balance of Sender wallet: " +
          cardanocliJs.toAda(sender.balance().value.lovelace) +
          " ADA"
      );
      debugger
      //receiver address
      const receiver = walletAddressDestination;
      debugger
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
      debugger

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

      device.publish(configAWSIoTDevice.topic_publish, JSON.stringify({txHash: txHash}));

    }

    if (obj.Upload_File_To_IPFS_From_UI !== undefined) { 
      console.log('## device.on message Upload_File_To_IPFS_From_UI');
      var fileName = obj.Upload_File_To_IPFS_From_UI[0].file_name;
      console.log('## device.on message File Name: ', fileName);
      command_from_upload_file_to_IPFS_result = await downloadFileFromAWSS3UploadIPFS(fileName);
      if (command_from_upload_file_to_IPFS_result !== undefined) {
        console.log('## device.on message Upload_File_To_IPFS_From_UI command_from_upload_file_to_IPFS_result: ', command_from_upload_file_to_IPFS_result);
        device.publish(configAWSIoTDevice.topic_publish, JSON.stringify(command_from_upload_file_to_IPFS_result));
      }
    }

    // createTimeLockedMintPolicyThenCreateMintAsset
    
    
    if (obj.Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI !== undefined) { 

      // createTimeLockedMintPolicyThenCreateMintAsset(
      //   'Test_0958', 
      //   'ACME', // pAssetName, 
      //   'ACME', // pTokenName
      //   'ipfs://QmbeLpUmznRs7AY8aGxixDN3KAsjP2dFpvCa1XkXyzQ7HF', // pIpfsImage
      //   'pIpfsImageDescription', //pIpfsImageDescription 
      //   'image/png', //pIpfsImageType
      //   'ipfs://QmQ7AeHSWtfrcFqmjUUGet6YbfSWGuiRo9L9emWco3tVhk', // pThumbnailImage
      // )

      console.log('## device.on message Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI');
      var pWalletName = obj.Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI[0].pWalletName
      var pAssetName = obj.Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI[0].pAssetName
      var pTokenName = obj.Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI[0].pTokenName
      var pIpfsImage = obj.Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI[0].pIpfsImage
      var pIpfsImageDescription = obj.Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI[0].pIpfsImageDescription
      var pIpfsImageType = obj.Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI[0].pIpfsImageType
      var pThumbnailImage = obj.Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI[0].pThumbnailImage

      const createdTimeLockedMintPolicyThenCreateMintAssetResult = await createTimeLockedMintPolicyThenCreateMintAsset(
        pWalletName, // pWalletName
        pAssetName, // pAssetName, 
        pTokenName, // pTokenName
        pIpfsImage, // pIpfsImage
        pIpfsImageDescription, //pIpfsImageDescription 
        pIpfsImageType, //pIpfsImageType
        pThumbnailImage, // pThumbnailImage
      )
      debugger
      if (createdTimeLockedMintPolicyThenCreateMintAssetResult !== undefined) {
        console.log('## device.on message Create_Time_Locked_Mint_Policy_Then_Create_Mint_Asset_From_UI createdTimeLockedMintPolicyThenCreateMintAssetResult: ', JSON.stringify(createdTimeLockedMintPolicyThenCreateMintAssetResult));
        device.publish(configAWSIoTDevice.topic_publish, JSON.stringify(createdTimeLockedMintPolicyThenCreateMintAssetResult));
      }
    }
   
   if (obj.Create_Proposal_From_UI !== undefined) { 
     debugger
     var sub_metadata = obj.Create_Proposal_From_UI[0]
     var voterRegistrationID = uuidv4();
     var proposalID = uuidv4();
     var seed = voterRegistrationID+proposalID
     const voterHash = crypto.createHash('sha256')
      .update(seed,'utf8')
      .digest('hex');
      
      // Create first fields in metadata
      var metadata = { "276541159": {
        "ObjectType": "VoteProposal",
        "ProposalID": proposalID,
        "VoterHash": voterHash,
        sub_metadata,
        //The next fields are fixed for the time being
        "VoteType": "choice",
        "VoteLimit": 1,
        "VoteMultiple": 0,
        "VoteRanked": 0,
        "VoteOptions": [],
        "VoteStartPeriod": "",
        "VoteEndPeriod": 300,
      }
      };
      
      var walletNameOrigin = "W0107";
      const sender = cardanocliJs.wallet(walletNameOrigin);
      console.log(
        "Balance of Sender wallet: " +
          cardanocliJs.toAda(sender.balance().value.lovelace) +
          " ADA"
      );
      // create raw transaction
      let txInfo = {
        txIn: cardanocliJs.queryUtxo(sender.paymentAddr),
        txOut: [
          {
            address: sender.paymentAddr,
            value: {
              lovelace: 0,
            },
          },
        ],
        metadata: metadata,
      };
      
      //Build transaction to calculate fees
      let raw = cardanocliJs.transactionBuildRaw(txInfo);
      //calculate fee
      let fee = cardanocliJs.transactionCalculateMinFee({
        ...txInfo,
        txBody: raw,
        witnessCount: 1,
      });
      //pay the fee by subtracting it from the sender utxo
      txInfo.txOut[0].value.lovelace = sender.balance().value.lovelace - fee;

      //create final transaction
      let tx = cardanocliJs.transactionBuildRaw({ ...txInfo, fee });

      //sign the transaction
      let txSigned = cardanocliJs.transactionSign({
        txBody: tx,
        signingKeys: [sender.payment.skey],
      });

      //broadcast transaction
      let txHash = cardanocliJs.transactionSubmit(txSigned);
      console.log("TxHash: " + txHash);

      device.publish(configAWSIoTDevice.topic_publish, JSON.stringify({txHash: txHash}));

    }
    
  });

  pinata.testAuthentication().then((result) => {
    //handle successful authentication here
    console.log(result);
  }).catch((err) => {
      //handle error here
      console.log(err);
  });

  async function uploadFileToIPFS(pFileName) {
    return new Promise(resolve => {

      const readableStreamForFile = fs.createReadStream('./'+pFileName);
      const options = {
          pinataMetadata: {
              name: pFileName,
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
          console.log('uploadFileToIPFS: pinFileToIPFS: result: ', result);
          resolve(result)
          // return result
      }).catch((err) => {
          //handle error here
          console.log('uploadFileToIPFS: pinFileToIPFS: err: ', err);
          resolve(err)
          // return err
      });
    });
  };
  
  async function downloadFileFromAWSS3UploadIPFS(pFileName) {
    return new Promise(resolve => {
      const awsCredentials = credentials.aws_credentials;

      var s3 = new AWS.S3({
        accessKeyId: credentialsAWS.access_key_id,
        secretAccessKey: credentialsAWS.secret_access_key,
        region: credentialsAWS.region
      })

      var params = {
          Key: credentialsAWS.path+pFileName,
          Bucket: credentialsAWS.bucket_name
      }

      s3.getObject(params, async function(err, data) {
          if (err) {
              throw err
          }
          await fs.writeFileSync(configLocalFiles.write_aws_s3_path+pFileName, data.Body)
          console.log('downloadFileFromAWSS3UploadIPFS: file downloaded successfully')
          debugger
          var pathFileThumbnail = configLocalFiles.write_aws_s3_path+pFileName.split('.')[0]
          const resultcreateThumbnail = await createThumbnail(pFileName)
          console.log('downloadFileFromAWSS3UploadIPFS: resultcreateThumbnail: ', resultcreateThumbnail)
          debugger
          const resultCompleteImage = await uploadFileToIPFS(configLocalFiles.write_aws_s3_path+pFileName)
          const resultThumbnailImage = await uploadFileToIPFS(pathFileThumbnail+'_thumbnail.png')
          debugger
          console.log('downloadFileFromAWSS3UploadIPFS: file uploaded resultCompleteImage: ', resultCompleteImage)
          console.log('downloadFileFromAWSS3UploadIPFS: file uploaded resultThumbnailImage: ', resultThumbnailImage)

          // console.log('file uploaded to piñata IPFS')
          // if (resultCompleteImage) {
          //   console.log('file uploaded resultCompleteImage: ', resultCompleteImage)
          // }
          // if (resultThumbnailImage) {
          //   console.log('file uploaded resultThumbnailImage: ', resultThumbnailImage)
          // }
          const ipfsImages = {
            completeImage: resultCompleteImage,
            thumbNailImage: resultThumbnailImage,
          }
          resolve(ipfsImages)
      })
    });

  }

  async function createThumbnail(pFileName) {
    return new Promise(resolve => {
      sharp(configLocalFiles.write_aws_s3_path+pFileName)
      .resize(320, 240)
      .toFile(configLocalFiles.write_aws_s3_path+pFileName.split('.')[0]+'_thumbnail.png', (err, info) => 
        { 
          resolve(info)
        }
      );
    });
    
  }

  async function createTimeLockedMintPolicy(pWalletName) {
    return new Promise(resolve => {
      // const fs = require("fs")

      const wallet = cardanocliJs.wallet(pWalletName)

      const { slot } = cardanocliJs.queryTip()

      const SLOTS_PER_EPOCH = 5 * 24 * 60 * 60 // 432000
      const mintScript = {
          type: "all",
          scripts: [
              {
                  slot: slot + (SLOTS_PER_EPOCH * 5),
                  type: "before"
              },
              {
                  keyHash: cardanocliJs.addressKeyHash(wallet.name),
                  type: "sig"
              }
          ]
      }
      // The __dirname in a node script returns the path of the folder where the current JavaScript file resides. __filename and _
      // _dirname are used to get the filename and directory name of the currently executing file.
      // ToDo change mint-policy.json to <DDMMYYHH24>-<WALLET_NAME>-mint-policy.json
      const mintPolicyJsonPath = __dirname + '/policies/mint-policy.json'
      const mintPolicyIdTxt = __dirname + "/policies/mint-policy-id.txt"
      
      fs.writeFileSync(mintPolicyJsonPath, JSON.stringify(mintScript, null, 2))
      fs.writeFileSync(mintPolicyIdTxt, cardanocliJs.transactionPolicyid(mintScript))

      const mintScriptResult = {
        mintScript: mintScript,
        mintPolicyJsonPath: mintPolicyJsonPath,
        mintPolicyIdTxt: mintPolicyIdTxt,
      }

      resolve(mintScriptResult)
      
    });
  }

  async function createMintAsset(pWalletName, pMintScript, pAssetName, pTokenName, pIpfsImage, pIpfsImageDescription, pIpfsImageType, pThumbnailImage) {

    return new Promise(async resolve => {
      const wallet = cardanocliJs.wallet(pWalletName)
      const POLICY_ID = cardanocliJs.transactionPolicyid(pMintScript)
      const ASSET_NAME = pAssetName
      const ASSET_ID = POLICY_ID + "." + ASSET_NAME
      const metadata = {
        721: {
          [POLICY_ID]: {
            [ASSET_NAME]: {
              name: pTokenName,
              image: pIpfsImage, // Original Image
              description: pIpfsImageDescription,
              type: pIpfsImageType,
              src: pThumbnailImage, // Thumbnail Image
            },
          },
        },
      };
      const tx = {
        txIn: wallet.balance().utxo,
        txOut: [
          {
            address: wallet.paymentAddr,
            value: { ...wallet.balance().value, [ASSET_ID]: 1 },
          },
        ],
        mint: {
          action: [{ type: "mint", quantity: 1, asset: ASSET_ID }],
          script: [pMintScript],
        },
        metadata, // For NFTs
        witnessCount: 2,
      };
      const raw = await createTransaction(tx);
      const signed = await signTransaction(wallet, raw);

      console.log(cardanocliJs.transactionView({ txFile: signed }));
      const txHash = cardanocliJs.transactionSubmit(signed);
      
      const mintAssetResult = {
        raw: raw,
        signed: signed,
        txHash: txHash,
      }
      resolve(mintAssetResult);
      
    });
  }

  async function createTimeLockedMintPolicyThenCreateMintAsset(pWalletName, pAssetName, pTokenName, pIpfsImage, pIpfsImageDescription, pIpfsImageType, pThumbnailImage) {
    return new Promise(async resolve => {
      const createdTimeLockedMintPolicyResult = await createTimeLockedMintPolicy(pWalletName)
      const createdMintAssetResult = await createMintAsset(
        pWalletName,
        createdTimeLockedMintPolicyResult.mintScript,
        pAssetName, 
        pTokenName, 
        pIpfsImage, 
        pIpfsImageDescription, 
        pIpfsImageType, 
        pThumbnailImage
      )
      resolve(createdMintAssetResult)
    });
  }

  const createTransaction = async (tx) => {
    return new Promise(async resolve => {
      let raw = cardanocliJs.transactionBuildRaw(tx);
      let fee = cardanocliJs.transactionCalculateMinFee({
        ...tx,
        txBody: raw,
      });
      tx.txOut[0].value.lovelace -= fee;
      // return cardanocliJs.transactionBuildRaw({ ...tx, fee });
      resolve(cardanocliJs.transactionBuildRaw({ ...tx, fee }));
    });
  };
  
  const signTransaction = async (wallet, tx, script) => {
    return new Promise(async resolve => {
      // return cardanocliJs.transactionSign({
      //   signingKeys: [wallet.payment.skey, wallet.payment.skey],
      //   txBody: tx,
      // });
      resolve(cardanocliJs.transactionSign({
        signingKeys: [wallet.payment.skey, wallet.payment.skey],
        txBody: tx,
      }));
    });
  };

  // const wallet2 = cardanocliJs.wallet('Test_0958')
  // const txOut_amount = assets.reduce((result, asset) => {
    
  //   const ASSET_ID = "POLICY_ID" + "." + asset.id
  //   result[ASSET_ID] = 1
  //   return result

  // }, {
  //     ...wallet2.balance().amount
  // })
  
  // console.log('txOut_amount: ', txOut_amount)
  // createTimeLockedMintPolicy('Test_0958')
  // downloadFileFromAWSS3UploadIPFS('10_lll_rrr.png')
  // createThumbnail('yourfile_1.png')

async function testMint() {
  // const createdTimeLockedMintPolicyResult = await createTimeLockedMintPolicy(pWalletName)
  // console.log('createdTimeLockedMintPolicyResult: ', createdTimeLockedMintPolicyResult)
  const createdTimeLockedMintPolicyThenCreateMintAssetResult = createTimeLockedMintPolicyThenCreateMintAsset(
    'Test_0958', // pWalletName
    'ACME', // pAssetName, 
    'ACME', // pTokenName
    'ipfs://QmbeLpUmznRs7AY8aGxixDN3KAsjP2dFpvCa1XkXyzQ7HF', // pIpfsImage
    'pIpfsImageDescription', //pIpfsImageDescription 
    'image/png', //pIpfsImageType
    'ipfs://QmQ7AeHSWtfrcFqmjUUGet6YbfSWGuiRo9L9emWco3tVhk', // pThumbnailImage
  )
  console.log('createdTimeLockedMintPolicyThenCreateMintAssetResult: ', createdTimeLockedMintPolicyThenCreateMintAssetResult)
}

// testMint()