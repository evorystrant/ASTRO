//==========================================================
//               		CONFIGURACION
//==========================================================

// CONFIGURACION de Pines
var pinAzimutP = 7;
var pinAzimutN = 8;
var pinTiltP = 9;
var pinTiltN = 10;

var pinLectorPulsosAzimut = "A1";
var pinLectorPulsosTilt = "A5";


var pulsosCountOn = false;
var secCountOn = true;
// Configuracion de Relacion =  Pulsos Por grado ( Pulsos/Grados)
var relacionAzimutPI = 159/180;	//0.85
var relacionAzimutPD = 81/180; 	//0.72
var relacionTiltP = 44/30;
// Configuracion de Relacion =  Milisengundos Por grado ( Pulsos/Grados)
var relacionAzimutSI = 29802/180;	//0.85
var relacionAzimutSD = 31821/180; 	//0.72
var relacionTiltS = 44/30;

// Configuracion de Sensores
var frequenciaDeMuestreo = 1; 	// Milisegundos (Maxima muestra posible es de 10 ms)
var thresholdDeCambio = 1; 		// 0-1023 - Jugar con esto si se detectan demasiados pulsos
var voltajeMinimoDeAlto = 40; 	// 0 -1023 - Jugar con esto si se detectan demasiados o muy pocos pulsos

// Configuracion de Motores
var velocidadMaxima = 255;		//1-255 - Representa 0 a 5 Volts en PWD
var velocidadMinima = 255; 		//1-255 - Representa 0 a 5 Volts en PWD


//==========================================================
//               VARIABLES DE ESTADO
//==========================================================

// AZIMUT 
var azimutState = 	{ 	pulseCount : 0,
						secCount : 0,
						prevVoltage : 0,
						grades : 0,
						isOn : false,
						isActive : false
					};

// TILT 
var tiltState = 	{ 	pulseCount : 0,
						secCount : 0,
						prevVoltage : 0,
						grades : 0,
						isOn : false,
						isActive : false
					};			

var movimientoLibre = false;
var boardReady = false;

//==========================================================
//               VARIABLES DE Control
//==========================================================

var createDigitalMotor = function (ledP, ledN) 	{  var motor = 	{ 	pinP 	: ledP, 
																	pinN 	: ledN,
																	forward : function() { this.pinN.off(); this.pinP.on(); },
																	reverse : function() { this.pinN.on(); 	this.pinP.off(); },
																	stop 	: function() { this.pinN.off(); this.pinP.off(); }
																};
													return motor;
												};
var motorTilt, sensorTilt;
var motorAzimut, sensorAzimut;
var contadorTiempo;

//==========================================================
//               ARDUINO COMMUNICATION
//==========================================================
var five = require('johnny-five');
var log = require("../libs/log.js");
var express = require('express');

var board = new five.Board(); 
var router = express.Router(); 

var normalizarGrados = function (grados) 	{ 	var normalizado; 
												while (grados >= 360)  	{ normalizado = grados - 360; };
												while (grados <= -360)  { normalizado = grados + 360; };
											};

var contadorAzimutPorPulso = function (grados){
	var movimientoEnPulsosAzimut = Math.abs(Math.round(grados * relacionAzimut));
	if(grados > 0)  	{ 	motorAzimut.forward(velocidadMinima);
								relacionAzimut = relacionAzimutPD;
							} 
	else 					{ 	motorAzimut.reverse(velocidadMaxima); 
								relacionAzimut = relacionAzimutPI;
							};
	// console.log("movimiento azimut empezando hacia " + request.body.azimut + ", Ultimo " + lastAzimutMovement);
	var timerAzimut = setInterval(function(){
		if(movimientoEnPulsosAzimut <= azimutState.pulseCount){
			console.log("movimiento azimut terminado, count " + movimientoEnPulsosAzimut);
			motorAzimut.stop();
			clearInterval(timerAzimut);
			azimutState.pulseCount = 0;
	
			azimutState.grades = grados;
			azimutState.isActive = false;
		}   
	},50);

	azimutState.isActive = true;
};	

var contadorAzimutPorTiempo = function (grados) {
	if(grados > 0)  	{ 	motorAzimut.forward(velocidadMinima);
							relacionAzimut = relacionAzimutSD;
						} 
	else 				{ 	motorAzimut.reverse(velocidadMaxima); 
							relacionAzimut = relacionAzimutSI;
						};
	var movimientoEnMSecAzimut = Math.abs(Math.round(grados * relacionAzimut));					
	console.log("movimiento azimut empezando hacia " + grados + ", con " + movimientoEnMSecAzimut);

	setTimeout(function(){
			console.log("movimiento azimut terminado, en " + movimientoEnMSecAzimut);
			motorAzimut.stop();
			azimutState.grades = grados;
			azimutState.isActive = false;
	},movimientoEnMSecAzimut);

	azimutState.isActive = true;
};			

var contadorTiltPorPulso = function (grados) {
	var movimientoEnPulsosTilt = Math.abs(Math.round(grados * relacionTiltP));
		if(grados > 0)  	{ motorTilt.forward(velocidadMinima); } 
		else 					{ motorTilt.reverse(velocidadMaxima); };
		// console.log("movimiento azimut empezando hacia " + request.body.azimut + ", Ultimo " + lastAzimutMovement);

		var timerTilt = setInterval(function(){
			if(movimientoEnPulsosTilt <= tiltState.pulseCount){
				console.log("movimiento tilt terminado, count " + movimientoEnPulsosTilt);
				motorTilt.stop();
				clearInterval(timerTilt);
				tiltState.pulseCount = 0;
    	
				tiltState.grades = grados;
				tiltState.isActive = false;
			}   
		},50);	
};

var contadorTiltPorTiempo = function (grados) {
	var tiempoEnTilt = Math.abs(Math.round(grados * relacionTiltS));
	if(grados > 0)  	{ motorTilt.forward(velocidadMinima); } 
	else 				{ motorTilt.reverse(velocidadMaxima); };
	// console.log("movimiento azimut empezando hacia " + request.body.azimut + ", Ultimo " + lastAzimutMovement);

	setTimeout(function(){
			console.log("movimiento tilt terminado, en " + tiempoEnTilt);
			motorTilt.stop();
			tiltState.pulseCount = 0;
	
			tiltState.grades = grados;
			tiltState.isActive = false; 
	},tiempoEnTilt);

	tiltState.isActive = true;
};								


	


board.on("ready", function () {
	console.log('Board ready');
	boardReady = true;

	motorAzimut = createDigitalMotor ( new five.Led(pinAzimutP), new five.Led(pinAzimutN) );
	motorTilt = createDigitalMotor ( new five.Led(pinTiltP), new five.Led(pinTiltN) );

	motorAzimut.stop();
	motorTilt.stop();

	sensorAzimut	= new five.Sensor({ pin: pinLectorPulsosAzimut, freq: frequenciaDeMuestreo, threshold: thresholdDeCambio });
	sensorTilt		= new five.Sensor({ pin: pinLectorPulsosTilt, freq: frequenciaDeMuestreo, threshold: thresholdDeCambio });

	// sensorAzimut.within([ 1000, 1023 ], function() {
	sensorAzimut.on("change", function() {
		var currentV = this.value;
		// console.log("Detected a Change voltage on Azimut: %s ", currentV);
		if (currentV > voltajeMinimoDeAlto)
			{	
				if 		( currentV > azimutState.prevVoltage && !azimutState.isOn && azimutState.isActive)
							{ 	
								azimutState.isOn = true; 
								azimutState.prevVoltage = currentV; 
							}
				
				
			}
		else if ( currentV < azimutState.prevVoltage && azimutState.isOn && azimutState.isActive)
			{ 
				azimutState.isOn = false; 	
				azimutState.pulseCount++; 
				azimutState.prevVoltage = currentV; 
				console.log("azimut count up: %s ", azimutState.pulseCount);
				// console.log("azimut count down: %s with voltage %s ", azimutState.pulseCount, currentV);
			};
		
	});

	sensorTilt.on("change", function() {
		var currentV = this.value;
		// console.log("Detected a Change voltage on Tilt: %s ", currentV);
		if (currentV > voltajeMinimoDeAlto)
			{	
				if 		( currentV > tiltState.prevVoltage && !tiltState.isOn && tiltState.isActive)
							{ 	
								tiltState.isOn = true; 
								tiltState.prevVoltage = currentV; 
								// console.log("azimut count down: %s with voltage %s ", azimutState.pulseCount, currentV);
							}
				
			}
		else if ( currentV < tiltState.prevVoltage && tiltState.isOn && tiltState.isActive)
			{ 
				tiltState.isOn = false; 	
				tiltState.pulseCount++ 
				tiltState.prevVoltage = currentV; 
				console.log("tilt count up: %s ", tiltState.pulseCount); 
			};
		
	});
});

router.post("/moverAziF", function (request, response) {
    log(request); 
	response.json({msg: "Movimiento Libre Azimut en Directa"});
    if(boardReady && !azimutState.isActive && !tiltState.isActive){
    	// azimutState.isActive = true;
    	motorAzimut.forward();
   	};
   	contadorTiempo = setInterval(function(){ azimutState.secCount = azimutState.secCount + 1 },1);
});
router.post("/moverAziR", function (request, response) {
    log(request); 
	response.json({msg: "Movimiento Libre Azimut en Inversa"});
    if(boardReady && !azimutState.isActive && !tiltState.isActive){
    	// azimutState.isActive = true;
    	motorAzimut.reverse();
   	};
   	contadorTiempo = setInterval(function(){ azimutState.secCount = azimutState.secCount + 1 },1);
});

router.post("/moverTiF", function (request, response) {
    log(request); 
	response.json({msg: "Movimiento Libre Tilt en Directa"});
    if(boardReady && !azimutState.isActive && !tiltState.isActive){
    	// tiltState.isActive = true;
    	motorTilt.forward();
   	};
});
router.post("/moverTiR", function (request, response) {
    log(request); 
	response.json({msg: "Movimiento Libre Tilt en Inversa"});
    if(boardReady && !azimutState.isActive && !tiltState.isActive){
    	// tiltState.isActive = true;
    	motorTilt.reverse();
   	};
});
router.post("/parar", function (request, response) {
    log(request); 
	response.json({msg: "Parando movimiento"});
	clearInterval(contadorTiempo); 
	console.log("Me tarde %s en completar", azimutState.secCount);

	motorAzimut.stop();
	motorTilt.stop();
	tiltState.isActive = false;
	azimutState.isActive = false;
	azimutState.pulseCount = 0;
	tiltState.pulseCount = 0;
	azimutState.secCount = 0;
	tiltState.secCount = 0;
});


router.post("/moverA", function (request, response) {
    log(request); 
    if(boardReady && !azimutState.isActive && !tiltState.isActive){
    	response.json({msg: "Iniciando movimiento"});

    	azimutState.isActive = true;

    	var gradosAzimut = request.body.azimut;  // Valor en gradosAzimut

		gradosAzimut -= azimutState.grades;

		if(pulsosCountOn) {contadorAzimutPorPulso(gradosAzimut)};
		if(secCountOn) {contadorAzimutPorTiempo(gradosAzimut)};

		

    	var gradosTilt = request.body.tilt;  // Valor en gradosAzimut

		gradosTilt -= tiltState.grades;
		contadorTiltPorPulso(gradosTilt);
		

    }else{
    	response.json({msg: "Azimut o tilt se encuentra en movimiento"});
    	console.log("Azimut o tilt se encuentra en movimiento")
    }
});


module.exports = router;