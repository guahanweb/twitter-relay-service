import { EventEmitter } from 'node:events'
import needle from 'needle'

const STREAM_URL = 'https://api.twitter.com/2/tweets/search/stream';
const RULES_URL = 'https://api.twitter.com/2/tweets/search/stream/rules';

interface TwitterStreamRule {
    value: string;
    tag?: string;
}

interface TwitterConnectorOptions {
    token: string | null;
    fields?: string[];
    userFields?: string[];
    expansions?: string[];
}

const defaultOptions: TwitterConnectorOptions = {
    token: null,
    fields: [
        'created_at',
        'author_id',
        'referenced_tweets',
        'geo',
        'entities',
        'public_metrics',
    ],

    userFields: [
        'id',
        'username',
        'public_metrics',
    ],

    expansions: [
        'author_id',
        'entities.mentions.username',
    ]
}

export class TwitterConnector extends EventEmitter {
    private options: TwitterConnectorOptions

    constructor(opts: TwitterConnectorOptions) {
        super();

        this.options = {
            ...defaultOptions,
            ...opts,
        };
    }

    // persist a connection to the 
    connect(retryAttempt = 0) {
        const { token, fields, userFields, expansions } = this.options;
        const query = [
            'tweet.fields=' + fields?.join(','),
            'user.fields=' + userFields?.join(','),
            'expansions=' + expansions?.join(','),
        ].join('&');

        const stream = needle.get(`${STREAM_URL}?${query}`, {
            headers: {
                'User-Agent': 'TwitterRelayBroker',
                'Authorization': `Bearer ${token}`,
            },
            timeout: 20000,
        });

        let statusCode, headers;
        stream.on('header', (code, h) => {
            statusCode = code;
            headers = h;
        });

        let keep_alive = true;
        stream.on('data', data => {
            try {
                // if regular data, we will relay it
                const json = JSON.parse(data);
                retryAttempt = 0;
                this.emit('data', json);
            } catch (err: any) {
                if (data.detail === 'This stream is currently at the maximum allowed connection limit.') {
                    // if we get max connections, destroy the current
                    // connection and retry after 1 minute
                    this.emit('error', data.detail);
                    (stream as any).destroy();
                    setTimeout(() => {
                        if (keep_alive) this.connect();
                    }, 60000);
                } else {
                    // keep alive signal received. do nothing.
                }
            }
        });

        stream.on('err', error => {
            if (error.code !== 'ECONNRESET') {
                // twitter error, so bubble up
                this.emit('error', error);
            } else {
                // reconnect with exponential backoff
                (stream as any).destroy();
                if (keep_alive) {
                    setTimeout(
                        () => this.connect(retryAttempt++),
                        2 ** retryAttempt
                    )
                }
            }
        });

        // return a complete function to allow for graceful
        // disconnect
        return function clear() {
            keep_alive = false;
            (stream as any)?.destroy();
        }
    }

    // delete the specified rule IDs from the current stream ID
    async deleteRules(rules: any[]) {
        const { token } = this.options;
        const ids = rules.map((rule: any) => rule.id);
        const data = { 'delete': { ids } };
        const response = await needle('post', RULES_URL, data, {
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`,
            }
        });

        if (response.statusCode !== 200) {
            throw new Error(response.body);
        }

        return response.body;
    }

    // look up all the current rules being streamed
    async fetchRules() {
        const { token } = this.options;
        const response = await needle('get', RULES_URL, {
            headers: {
                'authorization': `Bearer ${token}`,
            }
        });

        if (response.statusCode !== 200) {
            throw new Error(response.body);
        }

        return response.body.data || [];
    }

    // set the rules we want for this stream ID
    async setRules(rules: TwitterStreamRule[]) {
        const { token } = this.options;
        const data = { 'add': rules };
        const response = await needle('post', RULES_URL, data, {
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`,
            }
        });

        if (response.statusCode !== 201) {
            throw new Error(response.body);
        }

        return response.body;
    }
}
