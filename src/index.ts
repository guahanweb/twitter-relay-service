import config from './config'
import logger from './logger'
import { createServer } from './server'
import { SocketManager } from './socket-manager'
import { TwitterConnector } from './twitter-connector'

main();

async function main() {
    // const config = await config.initialize();

    // set up the rules around socket management
    // we are not listening for inbound message events
    // in this application
    const sockets = new SocketManager({ ticketTTL: 600000 });
    sockets.initialize();

    // set up the Twitter connection, and relay
    // any events that come through down to the
    // socket connections (using broadcast)
    const twitter = new TwitterConnector({ token: config.bearerToken });
    twitter.connect();
    twitter.on('data', (data) => {
        sockets.broadcast(data)
    });
    twitter.on('error', (err) => console.warn(err));

    // finally, spin up the server
    const app = await createServer(config, sockets);

    const { port } = config.server;
    const server = app.listen(port);
    server.on('upgrade', sockets.upgrade());

    logger.info('server is listening', { port });
}
