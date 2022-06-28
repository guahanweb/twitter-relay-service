import fs from 'node:fs'
import path from 'node:path'
import config from '../src/config'
import logger from '../src/logger'
import { TwitterConnector } from '../src/twitter-connector'

main();

async function main() {
    const twitter = new TwitterConnector({ token: config.bearerToken });

    // remove any current rules
    const current = await twitter.fetchRules();
    if (current && current.length) {
        await twitter.deleteRules(current);
    }

    // add whatever our current set is
    const filename = path.resolve(__dirname, '../data/rules.json');
    const payload = JSON.parse(fs.readFileSync(filename, 'utf8'));
    const { rules } = payload;

    await twitter.setRules(rules);
    logger.info('rules set', { rules });
}
