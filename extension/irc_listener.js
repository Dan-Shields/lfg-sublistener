'use strict';

const chat = require('tmi.js');
const EventEmitter = require('events').EventEmitter;
const emitter = new EventEmitter();

module.exports = function (nodecg) {
	const client = new chat.client(nodecg.bundleConfig['tmi.js']);
	const reconnecting = nodecg.Replicant('reconnecting', {
		defaultValue: false,
		persistent: false
	});

	nodecg.listenFor('reconnect', () => {
		reconnecting.value = true;
		client.disconnect();
		client.connect();
	});

	client.connect();

	client.addListener('connected', () => {
		reconnecting.value = false;
		nodecg.log.info(`Listening for subscribers on ${nodecg.bundleConfig['tmi.js'].channels.join(', ')}`);
	});

	client.addListener('disconnected', reason => {
		nodecg.log.warn(`DISCONNECTED: ${reason}`);
	});

	client.addListener('reconnect', () => {
		reconnecting.value = true;
		nodecg.log.info('Attempting to reconnect...');
	});

	// `extra` is an object that currently has just one bool property, "prime", that represents if this is a Prime sub.
	client.addListener('subscription', (channel, username, extra) => {
		const channelNoPound = channel.replace('#', '');
		emitter.emit('subscription', username, channelNoPound, 1, extra);
	});

	client.addListener('resub', (channel, username, months) => {
		const channelNoPound = channel.replace('#', '');
		emitter.emit('subscription', username, channelNoPound, parseInt(months, 10));
	});

	return emitter;
};
