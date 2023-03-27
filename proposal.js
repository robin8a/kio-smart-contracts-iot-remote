const CardanocliJs = require("./index.js");
const fs = require('fs');
const os = require("os");
const path = require("path");

//UUID
const { v4: uuidv4 } = require("uuid");
// Crypto library
const crypto = require('crypto');

// Global variables from credential.json and config.json
//const credentials = require('./config/credentials.json');
//const credentialsAWS = credentials['aws_credentials'];
const config = require('./config/config.json');
const configCardanoCli = config['cardano_cli'];
//const configAWSIoTDevice = config['aws_iot_device'];
//const configLocalFiles = config['local_files'];

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
var proposal_methods = {};

// 1. Create metadata files with proposal details
proposal_methods.metadata = function createProposal(proposal) {
       var voterRegistrationID = uuidv4();
       var proposalID = uuidv4();
       var seed = voterRegistrationID+proposalID;
       const voterHash = crypto.createHash('sha256')
        .update(seed,'utf8')
        .digest('hex');
        
        // Create first fields in metadata
        var proposal_meta = { "276541159": {
          "ObjectType": "VoteProposal",
          "ProposalID": proposalID,
          "VoterHash": voterHash,
          "NetworkID": proposal.pNetworkId,
          "Title": proposal.pTitle,
          "Question": proposal.pQuestion,
          "Description": proposal.pDescription,
          "ProposalURL": proposal.pProposalURL,
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
        const voter_ids = [];
        for (let i = 0; i < proposal.pvoters; i++){
          voter_ids.push(uuidv4());
          
        }
        
        var voter_meta = { "466390691": {
          "ObjectType": "VoteRegistration",
          "NetworkID": proposal.pNetworkId,
          "ProposalID": proposalID,
          "RegistrationID": voterRegistrationID,
          "Voters": voter_ids,
          
        }
        };
        
        const proposalIDfile = __dirname + '/proposals/'+ `proposal_${proposalID}.json`;
        const voterIDfile = __dirname + '/proposals/'+ `voter_${proposalID}.json`;
        
        savefiles(proposalIDfile,proposal_meta);
        savefiles(voterIDfile,voter_meta);
        this.proposal = proposal_meta;
        this.proposal_path = proposalIDfile;
        this.voter = voter_meta;
        this.voter = voterIDfile;
        return {
            proposal_meta, 
            voter_meta,
        };
        

  }; 
    // 2. Submit proposal on-chain 
    proposal_methods.submitProposal = function submitProposal(walletName,metadata) {
          const sender = cardanocliJs.wallet(walletName);
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
    
          //device.publish(configAWSIoTDevice.topic_publish, JSON.stringify({txHash: txHash}));
    };

exports.data = proposal_methods;

async function savefiles (filepath,data) {
  fs.writeFile(filepath, JSON.stringify(data, null, 2), function (err){
  if (err) throw err;
  console.log('Saved');
    
  });
}

