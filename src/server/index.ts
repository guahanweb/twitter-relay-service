import { default as express, Express } from 'express'
import { SocketManager } from '../socket-manager';
import { createAuthCheck } from './middleware/auth'

export async function createServer(config, sockets: SocketManager): Promise<Express> {
    const app = express();

    // POST /connect
    // This endpoint allows the client to authenticate and receive
    // a "ticket" that can be used for a subsequent upgrade request
    app.post('/connect', createAuthCheck(config.server.authToken), (req, res) => {
        const ticket = sockets.requestTicket();
        return res.send({ ticket });
    });

    // return 404 for all other requests
    app.get('*', (req, res) => res.status(404).send('not found'));

    return app;
}
