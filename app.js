var express = require("express");
var http = require('http');
var port = process.env.PORT || 8082
var app = express();
var server = http.createServer(app);
var psTree = require('ps-tree');
var shell = require('shelljs');
var awsIot = require('aws-iot-device-sdk');
var moment = require('moment');
// Check connections ip and port
// var net = require('net');
// var Promise = require('bluebird');
var ping = require('ping');

var cfg = {
  timeout: 10,
  // WARNING: -i 2 may not work in other platform like window
  extra: ["-i 2"],
};

const MIKROTIK_IP = '192.168.15.1';
const ZEUS_IP = '190.145.37.234';
const REFRESH_TIME = 30 * 1000; // 10 * 1000

///// INI Variables Knex mssql
var knex = require('knex')(
  { client: 'mssql', 
    connection: { 
      host: ZEUS_IP, 
      user: 'zeus_test', 
      password: 'L3m0n',
      database: 'Zeus_test',
      charset: 'utf8',
      port: 15680 
    },
    pool: { 
      min: 0, 
      max: 7 
    },
      debug: true 
    }
  );
var mk_global_users_manager_csv;

///// END Variables Knex mssql

///// INI Variables AWS IoT
// Para cada cosa es necesario descargar el certificado desde AWS
// const THING_NAME = "kl-mkt-robin-mac"
// var config = {
//   "host": "a3nbzybngzmrvj-ats.iot.us-east-1.amazonaws.com",
//   "thingName": THING_NAME,
//   "caCert": "./certs/root-CA.crt",
//   "privateKey": "./certs/c07c5fc370-private.pem.key",
//   "clientCert": "./certs/c07c5fc370-certificate.pem.crt",
//   "keepalive": 5000,
//   "region": 
// }

///// INI Funcion StartUp de app.js
server.listen(port, function() {
    console.log('##### INI server.listen port');
    console.log('#server.listen.port Listening on port ' + port);
    // checkAndCreateUsersZeusDB();
    
    // Reportar a los usuarios en User Manager
    // setInterval(function () {
    //   console.log('# server.listen: Next Refresh Time in seconds: ', REFRESH_TIME/1000);
    //   console.log('# server.listen: Checking connections...');

    //   // Checking Mikrotik Router Board is active
    //   console.log('# server.listen: Checking Mikrotik and Zeus Database are active...')
    //   ping.promise.probe(MIKROTIK_IP)
    //     .then(function (resMk) {
    //         console.log(resMk);
    //         if (resMk.alive) {
    //           console.log('## server.listen: Mikrotik is active');
    //           // Checking Zeus Database is active
    //           ping.promise.probe(ZEUS_IP)
    //             .then(function (resZues) {
    //               if(resZues.alive) {
    //                 console.log('## server.listen: Zeus Database is active');
                    
    //               } else {
    //                 console.log('## server.listen: Zeus Database is NOT active');
    //               }
    //             });
    //         }else {
    //           console.log('## server.listen: Mikrotik is NOT active');
    //         }
    //     });
    // }, REFRESH_TIME);
    
    console.log('##### END server.listen port');
  });
///// END Funcion StartUp de app.js


// ######## INI FUNCIONES IOT
// ref: https://github.com/aws/aws-iot-device-sdk-js
// Creacion de la instancia de Device
// var device = awsIot.device(config);
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

// Primer evento on "connect"
device.on('connect', function() {
    console.log('connect');
    device.subscribe('kio-topic');
    device.publish('kio-topic', JSON.stringify({ test_data: 1}));
  });

device.on('message', function(topic, payload) {
    console.log('### device.on message: ', topic, payload.toString());
    const obj = JSON.parse(payload);
    // console.log('## DashboardComponent device.on obj: ', obj);

    if (obj.Command_From_UI) {
      console.log('## device.on message Command_From_UI');
      var command_from_ui = "sshpass -p 'C0lt3n02019$' ssh -p 2223 admin@192.168.15.1 " + obj.Command_From_UI[0].command;
      console.log('## device.on message Command_From_UI command_from_ui: ', command_from_ui);
      command_from_ui_result = shell.exec(command_from_ui, {silent:true}).stdout;
      console.log('## device.on message Command_From_UI command_from_ui_result: ', command_from_ui_result);
      var pl_command_from_ui_result = {}; // empty Object
      var key = 'Command_From_UI_Result';
      pl_command_from_ui_result[key] = []; // empty Array, which you can push() values into
      var data = {
        result: command_from_ui_result
      };
      pl_command_from_ui_result[key].push(data);
      device.publish('kl-lwf-mikrotik-topic', JSON.stringify(pl_command_from_ui_result));
    }

    if (obj.Create_Vouchers_From_UI) {
      console.log('## device.on message Create_Vouchers_From_UI');
      var command_set_global_vars_create_or_update =  "sshpass -p 'C0lt3n02019$' ssh -p 2223 admin@192.168.15.1 " +
                                                "\\{" +
                                                  ":global pRoomUsername \\;" +
                                                  ":global pUsername \\;" +
                                                  ":global pAmount \\;" +
                                                  ":set \\$pUsername " + obj.Create_Vouchers_From_UI[0].pUsername + "\\;" +
                                                  ":set \\$pAmount " + obj.Create_Vouchers_From_UI[0].pAmount + "\\;" +
                                                  ":set \\pRoomUsername " + "\\;" +
                                                "\\}";
      console.log('## checkAndCreateUsersZeusDB command_set_global_vars_create_or_update: ', command_set_global_vars_create_or_update);
      command_set_global_vars_create_or_update_result = shell.exec(command_set_global_vars_create_or_update, {silent:false}).stdout;
      console.log('## checkAndCreateUsersZeusDB command_set_global_vars_create_or_update_result: ', command_set_global_vars_create_or_update_result);

  
      var command_create_users_manager = "sshpass -p 'C0lt3n02019$' ssh -p 2223 system script run createUsersManager";
      console.log('## device.on message Create_Vouchers_From_UI command_create_users_manager: ', command_create_users_manager);
      command_create_users_manager_result = shell.exec(command_create_users_manager, {silent:true}).stdout;

      var pl_command_from_ui_result = {}; // empty Object
      var key = 'Command_From_UI_Result';
      pl_command_from_ui_result[key] = []; // empty Array, which you can push() values into
      var data = {
        result: command_create_users_manager_result
      };
      pl_command_from_ui_result[key].push(data);
      device.publish('kl-lwf-mikrotik-topic', JSON.stringify(pl_command_from_ui_result));
    }

    if (obj.Create_Social_User_From_UI) {
      console.log('## device.on message Create_Social_User_From_UI');
      var command_set_global_vars_create_or_update =  "sshpass -p 'C0lt3n02019$' ssh -p 2223 admin@192.168.15.1 " +
                                                "\\{" +
                                                  ":global pSocialProfile \\;" +
                                                  ":global pSocialUsername \\;" +
                                                  ":global pSocialPassword \\;" +
                                                  ":set \\$pSocialProfile " + obj.Create_Social_User_From_UI[0].pSocialProfile + "\\;" +
                                                  ":set \\$pSocialUsername " + obj.Create_Social_User_From_UI[0].pSocialUsername + "\\;" +
                                                  ":set \\$pSocialPassword " + obj.Create_Social_User_From_UI[0].pSocialPassword + "\\;" +
                                                "\\}";
      console.log('## device.on message Create_Social_User_From_UI command_set_global_vars_create_or_update: ', command_set_global_vars_create_or_update);
      command_set_global_vars_create_or_update_result = shell.exec(command_set_global_vars_create_or_update, {silent:false}).stdout;
      console.log('## device.on message Create_Social_User_From_UI command_set_global_vars_create_or_update_result: ', command_set_global_vars_create_or_update_result);

  
      var command_create_social_user = "sshpass -p 'C0lt3n02019$' ssh -p 2223 system script run createSocialUser";
      console.log('## device.on message Create_Social_User_From_UI command_create_social_user: ', command_create_social_user);
      command_create_social_user_result = shell.exec(command_create_social_user, {silent:true}).stdout;

      var pl_command_from_ui_result = {}; // empty Object
      var key = 'Command_From_UI_Result';
      pl_command_from_ui_result[key] = []; // empty Array, which you can push() values into
      var data = {
        result: command_create_social_user_result
      };
      pl_command_from_ui_result[key].push(data);
      device.publish('kl-lwf-mikrotik-topic', JSON.stringify(pl_command_from_ui_result));
    }
    
  });

// ######## END FUNCIONES IOT


// Funcion que publica la lista de Usuarios en UserManager
function checkUsersManager(new_room) {
  console.log('##### INI checkUsersManager');
  var users_manager_command = "ssh admin@192.168.15.1 system script run getListUsersManager";
  console.log('users_manager_command: ', users_manager_command);
  users_manager_csv = shell.exec(users_manager_command, {silent:false}).stdout;
  console.log('users_manager_csv: ', users_manager_csv);
  var users_manager_array = users_manager_csv.split(',');
  mk_global_users_manager_csv = users_manager_array;
  // console.log('users_manager_array:', users_manager_array);

  var pl_active_user_manager = {}; // empty Object
  var key = 'Active_Users_Manager_Mikrotik';
  pl_active_user_manager[key] = []; // empty Array, which you can push() values into
  for (let i = 0; i < users_manager_array.length; i++){
    // console.log('users_manager_array[i]: ', users_manager_array[i]);
    var data = {
      username: users_manager_array[i]
    };
    pl_active_user_manager[key].push(data);
  } 
  // console.log('pl_active_user_manager: ', pl_active_user_manager);
  // console.log('JSON.stringify(pl_active_user_manager): ', JSON.stringify(pl_active_user_manager));
  device.publish('kl-lwf-mikrotik-topic', JSON.stringify(pl_active_user_manager));
  // console.log('##### END checkUsersManager');
}


// Funcion que para crear Users Manager leyendo la BD:Zeus
function checkAndCreateUsersZeusDB() {
  console.log('##### INI checkAndCreateUsersZeusDB');
  // console.log('##### INI checkAndCreateUsersZeusDB mk_global_users_manager_csv: ', mk_global_users_manager_csv);
  checkUsersManager();
  knex('Zeus_test').table('vw_HuespedesCheckinRadius')
    .select('nrohab_hab', 'ident_aco', 'nrohab_hab', 'nombre_aco')
    .then((zeus_active_rooms) => {
      // Creando usuarios que no están creados en Mk pero si en Zeus
      for (let index = 0; index < zeus_active_rooms.length; index++) {
        const zeus_active_room = zeus_active_rooms[index];
        // console.log('### checkAndCreateUsersZeusDB ID:  ', zeus_active_room.ident_aco);
        // console.log('### checkAndCreateUsersZeusDB room: ', zeus_active_room.nrohab_hab[0].trim());
        // console.log('### checkAndCreateUsersZeusDB complete_name: ', zeus_active_room.nombre_aco);

        
        sleep(300).then(() => {
          // Creating the password based on lastname
        var completeNameArray = zeus_active_room.nombre_aco.trim().split(' ');
        // console.log('checkAndCreateUsersZeusDB completeNameArray: ', completeNameArray);
        var pPassword = completeNameArray[0].toUpperCase();
        // console.log('checkAndCreateUsersZeusDB pPassword: ', pPassword);
        var pUsername = zeus_active_room.nrohab_hab[0].trim();
        var command_set_global_vars_create_or_update =  "sshpass -p 'C0lt3n02019$' ssh -p 2223 admin@192.168.15.1 " +
                                                "\\{" +
                                                  ":global pPassword \\;" +
                                                  ":global pUsername \\;" +
                                                  ":global pSharedUsersNumber \\;" +
                                                  ":set \\$pPassword " + pPassword + "\\;" +
                                                  ":set \\$pUsername " + pUsername + "\\;" +
                                                  ":set \\$pSharedUsersNumber " + 10 + "\\;" +
                                                "\\}";
          console.log('## checkAndCreateUsersZeusDB command_set_global_vars_create_or_update: ', command_set_global_vars_create_or_update);
          command_set_global_vars_create_or_update_result = shell.exec(command_set_global_vars_create_or_update, {silent:true}).stdout;
          console.log('## checkAndCreateUsersZeusDB command_set_global_vars_create_or_update_result: ', command_set_global_vars_create_or_update_result);
          
          var command_create_or_update_users_manager = "sshpass -p 'C0lt3n02019$' ssh -p 2223 admin@192.168.15.1 system script run createOrUpdateUserPwdMatch";
          command_create_or_update_users_manager_result = shell.exec(command_create_or_update_users_manager, {silent:true}).stdout;
          console.log('## checkAndCreateUsersZeusDB command_create_or_update_users_manager_result: ', command_set_global_vars_create_or_update_result);
        });
        
        // // Comprobando si el usuario de BD_Zeus esta en Mikrotik
        // if (mk_global_users_manager_csv.includes(zeus_active_room.nombre_aco.trim())) {
        //   console.log('## checkAndCreateUsersZeusDB Zeus_User is in Mikrotik: ', zeus_active_room.ident_aco.trim());
          
        // } else {
        //   console.log('## checkAndCreateUsersZeusDB user_mk is NOT IN Zeus DB: ', zeus_active_room.ident_aco.trim());
        //   console.log('## checkAndCreateUsersZeusDB creating... : ', );
        //   sleep(500).then(() => {
            
        //     // command_set_global_vars_create_result = shell.exec(command_set_global_vars_create, {silent:true}).stdout;

        //     // var command_create_users_manager = "ssh admin@192.168.15.1 system script run createUsersManager";
        //     // // console.log('## device.on message checkAndCreateUsersZeusDB command_create_users_manager: ', command_create_users_manager);
        //     // command_create_users_manager_result = shell.exec(command_create_users_manager, {silent:true}).stdout;
        //     // console.log('## device.on message checkAndCreateUsersZeusDB command_create_users_manager_result: ', command_create_users_manager_result);
        //   });
        // }

        // if (active_room.ident_aco.trim()) {

        // }
          // var command_set_global_vars_remove = "ssh admin@192.168.15.1 global pRoomUsername | " + " | ssh admin@192.168.15.1 set \\$pRoomUsername " +  active_room.ident_aco.trim();
          // console.log('## device.on message checkAndCreateUsersZeusDB command_set_global_vars_remove: ', command_set_global_vars_remove);
          // var command_remove_user_manager = "ssh admin@192.168.15.1 system script run removeUserManager";
          // command_remove_user_manager_result = shell.exec(command_remove_user_manager, {silent:true}).stdout;
          // console.log('## device.on message checkAndCreateUsersZeusDB command_remove_user_manager_result: ', command_remove_user_manager_result);
        
        
        // else {
        //   console.log('## checkAndCreateUsersZeusDB user_mk is NOT in Zeus DB: ', active_room.ident_aco.trim());
          
        //   // sleep(500).then(() => {
        //   //   var command_set_global_vars_create = "ssh admin@192.168.15.1 global pPassword | ssh admin@192.168.15.1 global pRoomUsername | ssh admin@192.168.15.1 global pUsername | ssh admin@192.168.15.1 global pAmount | ssh admin@192.168.15.1 set \\$pUsername " + "default_room" + " | ssh admin@192.168.15.1 set \\$pAmount " + "1" + " | " + "ssh admin@192.168.15.1 set \\$pRoomUsername " + active_room.ident_aco.trim() + " | ssh admin@192.168.15.1 set \\$pPassword " + pPassword;
        //   //   console.log('## device.on message checkAndCreateUsersZeusDB command_set_global_vars_create: ', command_set_global_vars_create);
        //   //   command_set_global_vars_create_result = shell.exec(command_set_global_vars_create, {silent:true}).stdout;

        //   //   var command_create_users_manager = "ssh admin@192.168.15.1 system script run createUsersManager";
        //   //   console.log('## device.on message checkAndCreateUsersZeusDB command_create_users_manager: ', command_create_users_manager);
        //   //   command_create_users_manager_result = shell.exec(command_create_users_manager, {silent:true}).stdout;
        //   // });
        // }
      }
      // knex.client.destroy();
    })
    .catch((err) => {
      console.log('error occurred: ', err);
      // Disconnect
      // knex.client.destroy();
    });

  console.log('##### END checkAndCreateUsersZeusDB');
}

// ######## INI FUNCIONES UTIL

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// function checkConnection(host, port, timeout) {
//   return new Promise(function(resolve, reject) {
//       timeout = timeout || 10000;     // default of 10 seconds
//       var timer = setTimeout(function() {
//           reject("timeout");
//           socket.end();
//       }, timeout);
//       var socket = net.createConnection(port, host, function() {
//           clearTimeout(timer);
//           resolve();
//           socket.end();
//       });
//       socket.on('error', function(err) {
//           clearTimeout(timer);
//           reject(err);
//       });
//   });
// }

// ######## END FUNCIONES UTIL
