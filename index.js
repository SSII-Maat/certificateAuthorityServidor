const net = require('net');
const fs = require('fs');

const winston = require('winston');

const openssl = require('./utils/openssl');

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'server.log' })
    ]
});

var CACertificate;

fs.readFile("CA.pem", (err, data) => {
    if(err) {
        throw new Error("Can't access CA certificate!");
    } else {
        CACertificate = data;
    }
})

var clients = [];

var server = net.createServer((socket) => {
    var state = 0; // 0 - Comunicará CSR, 1 - Respondemos con certificado de CA, 2 - Confirmado por cliente, respondemos con su certificado firmado

    var csr;
    var certificate;

    var fqdn;

    logger.log({
        level: 'info',
        message: "Connection established with "+socket.remoteAddress+":"+socket.remotePort+"."
    });

    console.log(openssl);

    socket.on('data', (data) => {
        if(state == 0) {
            // Esperamos el CSR
            var csrTemp = data.toString("utf8");
            if(csrTemp.indexOf("-----BEGIN CERTIFICATE REQUEST-----") != -1) {
                csr = csrTemp;
                openssl.printCSR(csrTemp).then((info) => {
                    logger.log({
                        level: 'info',
                        message: "Subject's information: "+info
                    });
                    var tmpData = info.substr(info.indexOf("CN"))
                    fqdn = tmpData.substr(0, tmpData.indexOf(","));

                    logger.log({
                        level: 'info',
                        message: "FQDN: "+fqdn
                    });

                    openssl.saveCSR(data, fqdn);

                    logger.log({
                        level: 'info',
                        message: "CSR saved successfuly"
                    });

                    state++;

                    socket.write(CACertificate);
                });
            } else {
                socket.write(Buffer.from("400"));
            }
        } else if(state == 1) {
            // Generalmente, si responde es porque se ha verificado correctamente el mensaje, continuamos con el certificado
            openssl.signCertificate(fqdn).then((sendData) => {
                socket.write(sendData);
                
                state++; 
            }).catch((err) => {
                error(err);
            });
        } else if(state == 2) {
            // Esperamos confirmación del proceso y cerramos el socket
            var status = data.toString("utf8");
            if(status != "200") {
                logger.log({
                    level: 'error',
                    message: "No se ha realizado correctamente la operación, se ha recibido un código de error != 200."
                });
            }
            socket.close();
        }
    });
});

server.listen(8290);