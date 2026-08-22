import webpush from 'web-push';
import { env } from './env';

webpush.setVapidDetails(env.vapid.subject, env.vapid.publicKey, env.vapid.privateKey);

export default webpush;
