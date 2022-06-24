import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({
    path: path.resolve(__dirname, '../.env'),
});

export interface ServerConfig {
    port: number | null;
    host?: string | null;
    authToken?: string | null;
}

export interface AppConfig {
    logLevel: string;

    apiKey: string | null;
    apiSecret: string | null;
    bearerToken: string | null;

    server: ServerConfig;
}

const init = function(): AppConfig {
    return {
        logLevel: loadFromEnv('LOG_LEVEL', 'info'),

        apiKey: loadFromEnv('API_KEY'),
        apiSecret: loadFromEnv('API_KEY_SECRET'),
        bearerToken: loadFromEnv('BEARER_TOKEN'),

        server: {
            port: loadFromEnv('PORT', 3000),
            host: loadFromEnv('HOST', 'localhost'),
            authToken: loadFromEnv('AUTH_TOKEN', 'testing'),
        }
    };
}

export default init();

function loadFromEnv(key: string, defaultValue: any = null) {
    const value = process.env && process.env[key];
    return value || defaultValue;
}

