//==========================================================
//               		CONFIGURACION
//==========================================================

// CONFIGURACION de Pines
var pinAzimutP = 5;
var pinAzimutN = 6;
var pinTiltP = 10;
var pinTiltN = 11;

var pinLectorPulsosAzimut = "A1";
var pinLectorPulsosTilt = "A5";

// Configuracion de Relacion =  Pulsos Por grado ( Pulsos/Grados)
var relacionAzimut = 72/90;
var relacionTilt = 65/21;

// Configuracion de Sensores
var frequenciaDeMuestreo = 1 	// Milisegindo (Maxima muestra posible es de 10 ms)
var thresholdDeCambio = 5 		// 0-1023 - Jugar con esto si se detectan demasiados pulsos
var voltajeMinimoDeAlto = 1000 	// 0 -1023 - Jugar con esto si se detectan demasiados o muy pocos pulsos

// Configuracion de Motores
var velocidadMaxima = 255 		//1-255 - Representa 0 a 5 Volts en PWD
var velocidadMinima = 127 		//1-255 - Representa 0 a 5 Volts en PWD


//==========================================================
//               VARIABLES DE ESTADO
//==========================================================

// AZIMUT 
var azimutState = 	{ 	pulseCount : 0,
						prevVoltage : 0,
						grades : 0,
						isOn : false,
						isActive : false
					};

// TILT 
var tiltState = 	{ 	pulseCount : 0,
						prevVoltage : 0,
						grades : 0,
						isOn : false,
						isActive : false
					};			

var boardReady = false;

//==========================================================
//               VARIABLES DE Control
//==========================================================

var motorTilt, sensorTilt;
var mototAzimut, sensorAzimut;

//==========================================================
//               ARDUINO COMMUNICATION
//==========================================================
var five = require('johnny-five');
var log = require("../libs/log.js");
var express = require('express');

var board = new five.Board(); 
var router = express.Router(); 



board.on("ready", function () {
	console.log('Board ready');
	boardReady = true;

	mototAzimut = new five.Motor({ pins: [pinAzimutP, pinAzimutN], invertPWM:true });
	mototTilt 	= new five.Motor({ pins: [pinTiltP, pinTiltN], invertPWM:true });

	sensorAzimut	= new five.Sensor({ pin: pinLectorPulsosAzimut, freq: frequenciaDeMuestreo, threshold: thresholdDeCambio });
	sensorTilt		= new five.Sensor({ pin: pinLectorPulsosTilt, freq: frequenciaDeMuestreo, threshold: thresholdDeCambio });

	// sensorAzimut.within([ 1000, 1023 ], function() {
	sensorAzimut.on("change", function() {
		var currentV = this.value
		if (currentV > voltajeMinimoDeAlto)
			{	
				// console.log("Detected a Change voltage on Azimut: %s ", currentV);
				if 		( currentV > azimutState.prevVoltage && !azimutState.isOn && azimutState.isActive)
							{ 	
								azimutState.isOn = true; 	
								azimutState.prevVoltage = currentV; 
								azimutState.pulseCount++ 
								console.log("azimut count up: %s with voltage %s ", azimutState.pulseCount, currentV);
							}
				else if ( currentV < azimutState.prevVoltage && azimutState.isOn && azimutState.isActive)
							{ 
								azimutState.isOn = false; 
								azimutState.prevVoltage = currentV; 
								// console.log("azimut count down: %s with voltage %s ", azimutState.pulseCount, currentV);
							}
			};
		
	});

	sensorTilt.on("change", function() {
		var currentV = this.value
		if (currentV > voltajeMinimoDeAlto)
			{	
				// console.log("Detected a Change voltage on Tilt: %s ", currentV);
				if 		( currentV > tiltState.prevVoltage && !tiltState.isOn && tiltState.isActive)
							{ 	
								tiltState.isOn = true; 	
								tiltState.prevVoltage = currentV; 
								tiltState.pulseCount++ 
								console.log("azimut count up: %s with voltage %s ", azimutState.pulseCount, currentV);
							}
				else if ( currentV < tiltState.prevVoltage && tiltState.isOn && tiltState.isActive)
							{ 
								tiltState.isOn = false; 
								tiltState.prevVoltage = currentV; 
								// console.log("azimut count down: %s with voltage %s ", azimutState.pulseCount, currentV);
							}
			};
		
	});
});


router.post("/moverA", function (request, response) {
    log(request); 
    if(boardReady && !azimutState.isActive && !tiltState.isActive){
    	response.json({msg: "Iniciando movimiento"});

    	azimutState.isActive = true;

    	var gradosAzimut = request.body.azimut;  // Valor en gradosAzimut

		gradosAzimut -= azimutState.grades;
		var movimientoEnPulsosAzimut = Math.abs(Math.round(gradosAzimut * relacionAzimut));
		if(gradosAzimut > 0)  	{ mototAzimut.forward(velocidadMinima); } 
		else 					{ mototAzimut.reverse(velocidadMaxima); };
		// console.log("movimiento azimut empezando hacia " + request.body.azimut + ", Ultimo " + lastAzimutMovement);

		var timerAzimut = setInterval(function(){
			if(movimientoEnPulsosAzimut <= azimutState.pulseCount){
				console.log("movimiento azimut terminado, count " + movimientoEnPulsosAzimut);
				mototAzimut.stop();
				clearInterval(timerAzimut);
				azimutState.pulseCount = 0;
    	
				azimutState.grades = request.body.azimut;
				azimutState.isActive = false;
			}   
		},50);

		tiltState.isActive = true;

    	var gradosTilt = request.body.tilt;  // Valor en gradosAzimut

		gradosTilt -= tiltState.grades;
		var movimientoEnPulsosTilt = Math.abs(Math.round(gradosTilt * relacionTilt));
		if(gradosTilt > 0)  	{ mototTilt.forward(velocidadMinima); } 
		else 					{ mototTilt.reverse(velocidadMaxima); };
		// console.log("movimiento azimut empezando hacia " + request.body.azimut + ", Ultimo " + lastAzimutMovement);

		var timerTilt = setInterval(function(){
			if(movimientoEnPulsosTilt <= tiltState.pulseCount){
				console.log("movimiento tilt terminado, count " + movimientoEnPulsosTilt);
				mototTilt.stop();
				clearInterval(timerTilt);
				tiltState.pulseCount = 0;
    	
				tiltState.grades = request.body.tilt;
				tiltState.isActive = false;
			}   
		},50);

    }else{
    	response.json({msg: "Azimut o tilt se encuentra en movimiento"});
    	console.log("Azimut o tilt se encuentra en movimiento")
    }
});


module.exports = router;