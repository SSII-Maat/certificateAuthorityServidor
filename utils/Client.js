class Client {
    constructor(clientIdentifier) {
        this.clientIdentifier = clientIdentifier;
        this.hasSentCSR = false;
        this.hasReceivedCACert = false;
        this.hasReceivedSignedCert = false;
    }
}