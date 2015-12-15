
/*
	PIN 4 = Azimut horaria/positiva
	PIN 5 = Azimut antohoraria/negativa

	PIN 6 = Tilt horaria/positiva
	PIN 7 = Tilt antohoraria/negativa

	PIN 8 = LECTOR DE PULSOS AZIMUT
	PIN 9 = LECTOR DE PULSOS TILT
	
	|
	V
*/

var pinAzimutP = 4;
var pinAzimutN = 5;

var pinTiltP = 6;
var pinTiltN = 7;

var pinLectorPulsosAzimut = 8;
var pinLectorPulsosTilt = 9;

//Relacion =  PULSOS / GRADOS
var relacionAzimut = 90/40;
var relacionTilt = 65/21;

// Azimut 40 pulsos por 90 grados de movimiento 
// 2.25 grados por cada pulso de movimiento

// Tilt 21 pulsos 65 grados.
// 3.09523 grados por cada pulso de movimiento



//==========================================================
//               ARDUINO COMMUNICATION
//==========================================================
var five = require('johnny-five');
var board = new five.Board();
var toggleState = false;
var boardReady = false;

// LECTOR DE PULSOS AZIMUT
var azimutPulsosCount = 0;
var pulsosReaderAzimutInit = (function(){
	var active = 0;
	return function(){
		var pulsosReader = new five.Pin(pinLectorPulsosAzimut);
		pulsosReader.read(function(error, value) {
			if(value != active){
				active = value;
				if(value == 1){
					azimutPulsosCount++; 
				}
			}
		});
		console.log("Lector de pulsos Azimut ready");
	};
})();

// LECTOR DE PULSOS TILT
var tiltPulsosCount = 0;
var pulsosReaderTiltInit = (function(){
	var active = 0;
	return function(){
		var pulsosReader = new five.Pin(pinLectorPulsosTilt);
		pulsosReader.read(function(error, value) {
			if(value != active){
				active = value;
				if(value == 1){
					tiltPulsosCount++;
				}
			}
		});
		console.log("Lector de pulsos Tilt ready");
	};
})();





board.on("ready", function () {
	console.log('Board ready');
	boardReady = true;

	this.pinMode(pinAzimutP, five.Pin.OUTPUT);
	this.pinMode(pinAzimutN, five.Pin.OUTPUT);
	this.pinMode(pinTiltP, five.Pin.OUTPUT);
	this.pinMode(pinTiltN, five.Pin.OUTPUT);
	pulsosReaderAzimutInit();
	pulsosReaderTiltInit();

	this.pinMode(13, five.Pin.OUTPUT);
	this.digitalWrite(13,1);


});









/*
*	API
*/
var express = require('express');
var router = express.Router(); 
var log = require("../libs/log.js");

var lastAzimutMovement = 0;
var isAzimutMoving = false;

var lastTiltMovement = 0;
var isTiltMoving = false;

router.get("/azimut/:grados", function (request, response) {
    log(request); 
    if(boardReady && !isAzimutMoving){
    	azimutPulsosCount = 0;
    	isAzimutMoving = true;

    	var grados = request.params.grados;  // Valor en grados    	
		grados -= lastAzimutMovement;

		var movimientoEnPulsos = Math.abs(Math.round(grados / relacionAzimut));
		
		var pinAzimut = (grados > 0) ? new five.Pin(pinAzimutP) : new five.Pin(pinAzimutN);
		five.Pin.write(pinAzimut, 1);
		var timer = setInterval(function(){
			if(movimientoEnPulsos == azimutPulsosCount){
				console.log("movimiento azimut terminado");
				five.Pin.write(pinAzimut, 0);
				clearInterval(timer);
				azimutPulsosCount = 0;
    	
				lastAzimutMovement = grados;
				isAzimutMoving = false;
			}   
		},100);
    }else{
    	console.log("Azimut se encuentra en movimiento")
    }
});


router.get("/tilt/:grados", function (request, response) {
    log(request);

    if(boardReady && !isTiltMoving){
    	tiltPulsosCount = 0;
    	isTiltMoving = true;

    	var grados = request.params.grados;  // Valor en grados    	
		grados -= lastTiltMovement;

		var movimientoEnPulsos = Math.abs(Math.round(grados / relacionTilt));
		
		var pinTilt = (grados > 0) ? new five.Pin(pinTiltP) : new five.Pin(pinTiltN);
		five.Pin.write(pinTilt, 1);
		var timer = setInterval(function(){
			if(movimientoEnPulsos == tiltPulsosCount){
				console.log("movimiento tilt terminado");
				five.Pin.write(pinTilt, 0);
				clearInterval(timer);
				tiltPulsosCount = 0;
    			lastTiltMovement = grados;
				isTiltMoving = false;
			}   
		},100);
    }else{
    	console.log("Tilt se encuentra en movimiento")
    } 
});


module.exports = router;