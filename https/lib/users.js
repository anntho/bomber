const mysql = require('mysql');
const config = require('../bin/config');
const usersLibPool = mysql.createPool(config.mysql);
const { procHandler, procHandler2 } = require('../lib/sql');
const { Game } = require('../models/models');
const { reportError } = require('./errors');
const randomString = require('crypto-random-string');

const file = 'lib/users.js';
const env = process.env.NODE_ENV || 'development';

module.exports = {
    follow: async (data, socket) => {
        if (socket.request.session.user) {
            try {
                let userId = socket.request.session.user.id;
                let userToFollowId = data.userId;
                let proc = 'CALL sp_Follow(?, ?)';
                let inputs = [userToFollowId, userId];
                await procHandler(usersLibPool, proc, inputs);
                socket.emit('follow');
            } catch (err) {
                socket.emit('err');
                reportError(file, '22', err, false);
            }
        }
    },
    unfollow: async (data, socket) => {
        if (socket.request.session.user) {
            try {
                let userId = socket.request.session.user.id;
                let userToUnfollow = data.userId;
                let proc = 'CALL sp_Unfollow(?, ?)';
                let inputs = [userToUnfollow, userId];
                await procHandler(usersLibPool, proc, inputs);
                socket.emit('unfollow');
            } catch (err) {
                socket.emit('err');
                reportError(file, '37', err, false);
            }
        }
    },
    message: async (data, socket, io) => {
        if (socket.request.session.user) {
            try {
                const sid = randomString({length: 8, type: 'url-safe'});
                const userId = socket.request.session.user.id;
                const message = data.message.trim().replace(/[|&;$%@"<>()+,]/g, '');
                const proc = 'CALL sp_InsertMessage(?, ?, ?, ?)';
                const inputs = [userId, data.recipientId, sid, message];
                const result = await procHandler(usersLibPool, proc, inputs);
                socket.emit('message', result);

                let sockets = await module.exports.getSockets(data.recipientId);
                if (sockets && sockets.length) {
                    let notificationSocket = sockets.find(s => s.type == 'notification');
                    let chatSocket = sockets.find(s => s.type == 'chat');
                    if (notificationSocket) {
                        let socketId = notificationSocket.socketId;
                        io.to(socketId).emit('notify:message');
                    }
                    if (chatSocket) {
                        let socketId = chatSocket.socketId;
                        io.to(socketId).emit('incoming', result);
                    }
                }
            } catch (err) {
                socket.emit('err');
                reportError(file, '72', err, false);
            }
        }
    },
    getSockets: async (userId) => {
        try {
            const proc = 'CALL sp_GetSockets(?)';
            const inputs = [userId];
            return await procHandler(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    getUser: async (username) => {
        try {
            let proc = 'CALL sp_GetUser(?)';
            let inputs = [username];
            return await procHandler(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    getRankStandalone: async (userId) => {
        try {
            let playerQuery = {'players': {$elemMatch: {userId: userId}}};
            let games = await Game.find(playerQuery).exec();
            let closed = games.filter(g => g.status == 'closed');
            let total = (games && closed) ? closed.length : 0;
            
			let proc = 'CALL sp_GetRank(?, ?)';
			let inputs = [total, userId];
			return await procHandler(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    getRank: async (gamesPlayed, userId) => {
        try {
			let proc = 'CALL sp_GetRank(?, ?)';
			let inputs = [gamesPlayed, userId];
			return await procHandler(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    getFollowers: async (userId) => {
        try {
			let proc = 'CALL sp_GetFollowers(?)';
			let inputs = [userId];
			return await procHandler(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    getFollowing: async (userId) => {
        try {
			let proc = 'CALL sp_GetFollowing(?)';
			let inputs = [userId];
			return await procHandler(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    getInbox: async (userId) => {
        try {
            const proc = 'CALL sp_GetInbox(?)';
            const inputs = [userId];
            return await procHandler2(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    getMessages: async (data, socket) => {
        console.log(data);
        if (socket.request.session.user) {
            try {
                const userId = socket.request.session.user.id;
                const proc = 'CALL sp_GetMessages(?, ?)';
                const inputs = [userId, data.sid];
                const messages = await procHandler(usersLibPool, proc, inputs);
                socket.emit('getMessages', messages);
            } catch (err) {
                socket.emit('err');
                reportError(file, '121', err, false);
            }
        }
    },
    getGames: async (userId) => {
        try {
            let playerQuery = {'players': {$elemMatch: {userId: userId}}};
            let sortQuery = {created: 'desc'};
            let games = await Game.find(playerQuery).sort(sortQuery).exec();
            let active = games.filter(g => g.status == 'active');
            let closed = games.filter(g => g.status == 'closed');
            let total = (games && closed) ? closed.length : 0;
            let slim = [];

            for (const game of closed) {
                let date = new Date(game._id.getTimestamp());
                let str = date.toString().split('GMT')[0].trim();
                let mode = `${game.parameters.count} ${game.parameters.mode}`;
                let gameUser = game.players.find(p => p.userId == userId);
                let gameOpponent = game.players.find(p => p.userId != userId);
                let userColor = 'incorrect';
                let opponentColor = 'incorrect';
                let winner = false;

                if (game.outcome.winner == userId) {
                    winner = true;
                    userColor = 'correct';
                    opponentColor = 'incorrect';
                }

                slim.push({
                    room: game.room,
                    mode: mode,
                    date: str,
                    winner: winner,
                    gameUser: gameUser,
                    userColor: userColor,
                    gameOpponent: gameOpponent,
                    opponentColor: opponentColor
                });
            }

            return {
                active: active[0],
                total: total,
                slim: slim
            }
        } catch (err) {
            throw err;
        }
    },
    block: async (data, socket) => {
        if (socket.request.session.user) {
            try {
                const userId = socket.request.session.user.id;
                const proc = 'CALL sp_BlockUser(?, ?)';
                const inputs = [userId, data.userId];
                await procHandler(usersLibPool, proc, inputs);
                socket.emit('block');
            } catch (err) {
                socket.emit('err');
                reportError(file, '182', err, false);
            }
        }
    },
    unblock: async (data, socket) => {
        if (socket.request.session.user) {
            try {
                const userId = socket.request.session.user.id;
                const proc = 'CALL sp_UnblockUser(?, ?)';
                const inputs = [userId, data.userId];
                await procHandler(usersLibPool, proc, inputs);
                socket.emit('unblock');
            } catch (err) {
                socket.emit('err');
                reportError(file, '196', err, false);
            }
        }
    },
    getRestrictions: async (userId) => {
        try {
            const proc = 'CALL sp_GetRestrictions(?)';
            const inputs = [userId];
            return await procHandler(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    markRead: async (userId, sid) => {
        try {
            const proc = 'CALL sp_MarkRead(?, ?)';
            const inputs = [userId, sid];
            return await procHandler(usersLibPool, proc, inputs);
        } catch (err) {
            throw err;
        }
    },
    deleteConversation: async (data, socket) => {
        if (socket.request.session.user) {
            try {
                const userId = socket.request.session.user.id;
                const proc = 'CALL sp_DeleteConversation(?, ?)';
                const inputs = [userId, data.sid];
                await procHandler(usersLibPool, proc, inputs);
                socket.emit('deleteConversation', {
                    sid: data.sid
                });
            } catch (err) {
                socket.emit('err');
                reportError(file, '205', err, false);
            }
        }
    },
    findOpenChallenge: async (socket) => {
		if (socket.request.session.user) {
			try {
                const userId = socket.request.session.user.id;
                const challenges = await Game.find({type: 'challenge', status: 'open', env: env}).exec();
                if (challenges && challenges.length) {
                    let challenge = challenges.find(c => c.challenge.toId == userId);
                    socket.emit('findOpenChallenge', challenge);
                }
			} catch (err) {
				reportError(file, '260', err, false);
				return socket.emit('err', err);
			}	
		}
	},
}