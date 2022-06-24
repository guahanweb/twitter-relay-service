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
    const rules = [
        {
            value: '(from:Lucasfilm OR @Lucasfilm) -is:retweet',
            tag: 'lucasfilm content'
        },
        {
            value: '(from:Disney OR @Disney) -is:retweet',
            tag: 'disney content'
        }
    ];

    await twitter.setRules(rules);
    logger.info('rules set', { rules });
}
