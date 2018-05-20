const { exec } = require('child_process');
const fs = require('fs');
function saveCSR(csrData, fqdn) {
    return new Promise((accept, reject) => {
        fs.writeFile("CAWarehouse/csr/"+fqdn, csrData, (err) => {
            if(err) {
                reject(err);
            } else {
                accept();
            }
        })
    });
}

function printCSR(csrString) {
    return new Promise((accept, reject) => {
        exec("echo '"+csrString+"' | openssl req -text -noout | grep 'CN = '", (err, stdout, stderr) => {
            if(err) {
                reject(err);
            } else {
                accept(stdout);
            }
        })
    });
}

function signCertificate(fqdn) {
    return new Promise((accept, reject) => {
        exec("openssl x509 -req -in CAWarehouse/csr/"+fqdn+" -CA CA.pem -CAkey privateKeyCA.key -pass file:CAPassword.txt -CAcreateserial \
            -out CAWarehouse/signed/"+fqdn+" -days 365 -sha256 -extfile CAWarehouse/signed/"+fqdn, (error, stdout, stderr) => {
                if(err) {
                    reject(err);
                } else {
                    accept(stdout);
                }
            })
    })
}

module.exports = {
    saveCSR,
    printCSR
}