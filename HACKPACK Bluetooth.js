var bleno = require('bleno');
var fs = require('fs');
var DEVICE_UUID = 'D33F400C-FCEA-9C8D-81BE-EE3A87B5D716';
var TX_UUID = 'D33F400C-FCEA-9C8D-81BE-EE3A87B5D716';
var RX_UUID = 'D33F400C-FCEA-9C8D-81BE-EE3A87B5D716';
var DEVICE_NAME = 'HACKPACK';
var RECEIVING_FILE = false;
var transmitBuffer = new Buffer(10);
var receiveBuffer = new Buffer(10);

function start() {
    bleno.on('stateChange', function (state) { //if something happened to the state
        console.log('on -> stateChange: ' + state); //log it on the console
        if (state === 'poweredOn') { // if the bluetooth turned on
            bleno.startAdvertising(DEVICE_NAME, [DEVICE_UUID]); //start advertising
        }
        else {
            bleno.stopAdvertising(); //otherwise, stop
        }
    })

    bleno.on('advertisingStart', function (error) { // once we start to advertise
        console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success')); //tell the console log whether it worked/how it failed
        if (!error) { // if it worked
            bleno.setServices([//set services
                new bleno.PrimaryService({ //set the primary service...
                    uuid: DEVICE_UUID, //...UUID to device's UUID
                    characteristics: [//its characteristics are
                        new bleno.Characteristic({
                            value: null,
                            uuid: TX_UUID,
                            properties: ['write'], //...properties

                            // Accept a new value for the characterstic's value
                            onWriteRequest: function (data, offset, withoutResponse, callback) {
                                this.value = data;
                                //do anything with the recieved value
                                if (this.value.toString("utf-8").substr(0, 0).includes("F")) { //are we about to recieve a file? what's it called?
                                    RECEIVING_FILE = true;
                                    CURRENT_FILE = this.value.toString("utf-8").slice(1, this.value.toString("utf-8").length() - 1);
                                }
                                if (this.value.toString("utf-8").substr(0, 1).includes("F0")) { //are we done recieving a file?
                                    RECEIVING_FILE = false;
                                    CURRENT_FILE = "";
                                }
                                if (RECEIVING_FILE = true) {
                                    fs.appendFile(CURRENT_FILE, this.value, function (err) {
                                        if (err) throw err;
                                    });
                                } else {
                                    receiveBuffer.write(this.value.toString("utf-8"))
                                }
                                console.log('Write request: value = ' + this.value.toString("utf-8"));
                                callback(this.RESULT_SUCCESS);
                            }
                        }),

                        new bleno.Characteristic({
                            value: null,
                            uuid: RX_UUID,
                            properties: ['read', 'notify'], //...properties

                            // Send a message back to the client with the characteristic's value
                            onReadRequest: function (offset, callback) {
                                this.value = transmitBuffer.toString('utf8', 0, 0); //get ready to send something
                                console.log("Read request received");
                                callback(this.RESULT_SUCCESS, new Buffer(this.value ? this.value.toString("utf-8") : ""));
                                this.value = null; //reset the message
                            }
                        })
                    ]
                })
            ]);
        }
    });
}

function send(message) {
    transmitBuffer.write(message); //add message to the buffer for transmission
}

function read() {
    return receiveBuffer.toString('utf8', 0, 0); //read latest character from the recieve buffer
}
/* no need for these
function clearRxBuffer() {

}
function clearTxBuffer() {

}
*/
/*
client(app) side commands
F[name] register a new loaded file
S1 display is in sand mode
B1 display is in boids mode
D1 display is in file display mode
D0 display is in sleep mode
E[error] report an error

display(backpack) side commands
F[name] create a new file and get ready to accept data
F0 file upload end flag
S1 set display to sand mode
S1 P[int] set number of particles in sandbox
S1 G[int] set gravity in sandbox
B1 set the display to boids mode
B1 S[int] set seperation in boidspace
B1 A[int] set alignment in boidspace
B1 C[int] set cohesion in boidspace
D[name] select a file to be displayed and set display to file display mode
D0 set display to sleep mode
*/