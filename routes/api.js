
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

var pinLectorPulsosAzimut = 1;
var pinLectorPulsosTilt = 5;

//Relacion =  GRADOS / PULSOS
// var relacionAzimut = 90/40;
var relacionAzimut = 72/90;


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
var boardReady = false;



// VARIABLES DE AZIMUT
var azimutPulsosCount = 0; 
var azimutActive = 0;
var prevVoltageAzimut = 0;



// VARIABLES DE TILT
var tiltPulsosCount = 0; 
var tiltActive = 0;
var prevVoltageTilt = 0;



board.on("ready", function () {
	console.log('Board ready');
	boardReady = true;

	this.pinMode(pinAzimutP, five.Pin.OUTPUT);
	this.pinMode(pinAzimutN, five.Pin.OUTPUT);
	this.pinMode(pinTiltP, five.Pin.OUTPUT);
	this.pinMode(pinTiltN, five.Pin.OUTPUT);


	// //Lector de pulsos Azimut
	this.pinMode(pinLectorPulsosAzimut, five.Pin.ANALOG);
	this.analogRead(pinLectorPulsosAzimut, function(voltage) {
		if(voltage != prevVoltageAzimut){
			if(voltage > 1015 && (voltage > prevVoltageAzimut) && !azimutActive){
				azimutActive = true;
				azimutPulsosCount++;  
				console.log("azimut count: %s | voltage: %s ", azimutPulsosCount, voltage);
				
			}else if(voltage < (prevVoltageAzimut - 3)){
				azimutActive = false;
			}
			prevVoltageAzimut = voltage;
		}
		// console.log("voltage azimut: %s", voltage);
	});



	// //Lector de pulsos Azimut
	this.pinMode(pinLectorPulsosTilt, five.Pin.ANALOG);
	this.analogRead(pinLectorPulsosTilt, function(voltage) {
		if(voltage != prevVoltageTilt){
			if(voltage > 1015 && (voltage > prevVoltageTilt) && !tiltActive){
				tiltActive = true;
				tiltPulsosCount++;  
				console.log("tilt count: %s | voltage: %s ", tiltPulsosCount, voltage);
				
			}else if(voltage < (prevVoltageTilt - 3)){
				tiltActive = false;
			}

			prevVoltageTilt = voltage;
		}
		// console.log("voltage tilt: %s", voltage);
	});


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

router.post("/moverA", function (request, response) {
    log(request); 
    if(boardReady && !isAzimutMoving && !isTiltMoving){
    	response.json({msg: "movimiento en proceso"});

    	//Movimiento azimut
    	azimutPulsosCount = 0;
    	isAzimutMoving = true;

    	var gradosAzimut = request.body.azimut;  // Valor en gradosAzimut
		gradosAzimut -= lastAzimutMovement;
		var movimientoEnPulsosAzimut = Math.abs(Math.round(gradosAzimut / relacionAzimut));
		var pinAzimut = (gradosAzimut > 0) ? new five.Pin(pinAzimutP) : new five.Pin(pinAzimutN);
		if(movimientoEnPulsosAzimut > 0){
			five.Pin.write(pinAzimut, 1);
		}

		var timerAzimut = setInterval(function(){
			if(movimientoEnPulsosAzimut <= azimutPulsosCount){
				console.log("movimiento azimut terminado, count " + movimientoEnPulsosAzimut);
				five.Pin.write(pinAzimut, 0);
				clearInterval(timerAzimut);
				azimutPulsosCount = 0;
    	
				lastAzimutMovement = gradosAzimut;
				isAzimutMoving = false;
			}   
		},50);




		//Movimiento Tilt
		tiltPulsosCount = 0;
    	isTiltMoving = true;

    	var gradosTilt = request.body.tilt;  // Valor en gradosTilt    	
		gradosTilt -= lastTiltMovement;

		var movimientoEnPulsosTilt = Math.abs(Math.round(gradosTilt / relacionTilt));
		var pinTilt = (gradosTilt > 0) ? new five.Pin(pinTiltP) : new five.Pin(pinTiltN);
		if(movimientoEnPulsosTilt > 0){
			five.Pin.write(pinTilt, 1);
		}

		var timerTilt = setInterval(function(){
			if(movimientoEnPulsosTilt <= tiltPulsosCount){
				console.log("movimiento tilt terminado, count " + tiltPulsosCount);
				five.Pin.write(pinTilt, 0);
				clearInterval(timerTilt);
				tiltPulsosCount = 0;
    			lastTiltMovement = gradosTilt;
				isTiltMoving = false;
			}   
		},50);

    }else{
    	response.json({msg: "Azimut o tilt se encuentra en movimiento"});
    	console.log("Azimut o tilt se encuentra en movimiento")
    }
});


module.exports = router;