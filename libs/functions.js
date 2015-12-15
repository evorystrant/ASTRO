var dataManager = require('../dataManager.js');
var sha512 = require("js-sha512").sha512;

exports.login = function (data, socket, session, cb) {
    var email = data.email, password = data.p;
    dataManager.getUserByEmail(email, function(result){
        password = sha512(password + result.u_salt);
        checkbrute(result.u_id, function (val) {
            if(val){
                console.log("Cuenta bloqueada por demasiados intentos fallidos de login");
                //Envia un correo electrónico al usuario que le informa que su cuenta está bloqueada
                cb(false);
            } else {
                if(result.u_password === password){
                    //Inicio de sesión exitosa
                    session.email = data.email;
                    session.user_id = result.u_id;
                    session.login_string = sha512(password + socket.handshake.headers['user-agent']);   
                    // $_SESSION['idEmpresa'] = $idEmpresa;
                    // $_SESSION['idTipoUsuario'] = $idTipoUsuario;
                    // $_SESSION['flotasPermitidas'] = $flotasAsignadas;
                    session.save();
                    socket.emit('session', session);
                    cb(true);
                }else{
                    //La conexión no es correcta
                    //Grabamos este intento en la base de datos
                    var now = new Date().getTime();
                    dataManager.loginAttempts(result.u_id ,now);
                    cb(false);
                }
            } 
        });
    });
};

function checkbrute(user_id, cb){
    //Obteniendo timestamp en tiempo actual
    var now = new Date().getTime();
    //Todos los intentos de inicio de sesión son contados desde las 2 horas anteriores.
    var valid_attempts = now - (2 * 60 * 60 * 1000);
    dataManager.getLoginAttempts(user_id, valid_attempts, function(numRows){
        if(numRows > 5){
            cb(true);
        }else{
            cb(false);
        }
    });
}

exports.login_check = function (session, socket, cb) {
    // //Revisa si todas las variables de sesión están configuradas.
    if(session) {
        dataManager.loginCheck(session.user_id, function(result){
            if(result.length > 0){
                var res = result[0];
                var login_check = sha512(res.password + socket.handshake.headers['user-agent']);
                if(session.login_string === login_check){
                    //¡¡¡¡Conectado!!!!
                    // date_default_timezone_set('America/El_Salvador');
                    // $dateTime = date('Y-m-d H:i:s', time());
                    // $conexion->query("UPDATE  `users` SET  `lastvisitDate` =  '$dateTime' WHERE  `users`.`id` = $user_id");
                    cb(true);
                } else {
                    cb(false);
                }
            }else{
                cb(false);
            }
        });
    } else {
        //No conectado
        cb(false);
    }
};

exports.getHousesByUserId = function (userId, cb) {
    dataManager.getHousesByUserId(userId, function (houses) {
        var mainLevel = {};
        mainLevel.UserId = userId;
        mainLevel.Name = "Gustavo Aguilar";
        mainLevel.Houses = houses;
        cb(mainLevel);
    });
};

exports.getHouseDiagramByHouseId = function (houseId, cb) {
    dataManager.getDiagramByHouseId(houseId, function (response) {
        var floors = {};
        if(response.length > 0){
            var diagram = response[0].Diagram;
            floors = JSON.parse (diagram);
        }
        else console.log("NO DATA FOUND!");
        cb(floors);
    });
};
