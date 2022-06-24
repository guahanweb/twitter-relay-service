export function createAuthCheck(token: string) {
    return function (req, res, next) {
        const { authorization } = req.headers;
        if (!authorization) {
            return res.status(401).send('unauthorized');
        }

        // look for bearer token and check
        const m = authorization.match(/^bearer\s+([^\s]+)/i);
        if (!m) {
            return res.status(401).send('unauthorized');
        }

        // check provided token
        const bearer = Buffer.from(m[1], 'base64').toString('ascii');
        if (bearer !== token) {
            return res.status(401).send('not allowed');
        }

        next();
    }
}
