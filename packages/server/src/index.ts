import { MessageToServer, MessageType, PresenterQueryResponse, PresenterRequestResponse, RemoteICECandidate, RemoteSDP, ClientId } from '@interwebs/webrtc-messages/dist/index';
import { get, set } from 'lodash';
import * as uuid from 'uuid';
import * as WebSocket from 'ws';

const wss = new WebSocket.Server({
    port: Number(process.env.WS_PORT) || 8080,
});

const store: {
    connections: WebSocket[];
    presenter?: {
        clientId?: string;
    }
} = {
    connections: [] as WebSocket[],
};

const broadcastMessage = (message: string) => {
    store.connections.forEach((ws) => {
        ws.send(message);
    });
};

wss.on('listening', () => {
    console.log(`🎉 WebSocket Server online on Port ${wss.options.port}`);
});

wss.on('connection', (ws) => {
    const userId = uuid();

    // @ts-ignore
    store.connections = store.connections.concat(ws);
    set(store, `${userId}.wsConnection`, ws);

    const initialMessage: ClientId = {
        type: MessageType.ClientId,
        payload: {
            clientId: userId, },
    };

    ws.send(JSON.stringify(initialMessage));

    ws.on('message', (message) => {
        const parsedMessage = JSON.parse(message as string) as MessageToServer;

        switch (parsedMessage.type) {
            case MessageType.StopPresenter: {
                const currentPresenterId = get(store, 'presenter.clientId');
                if (currentPresenterId === userId) {
                    delete store.presenter?.clientId;

                    const messageForBroadcast: PresenterQueryResponse = {
                        type: MessageType.PresenterQueryResponse,
                        payload: {},
                    };

                    broadcastMessage(JSON.stringify(messageForBroadcast));
                } break;
            }

            case MessageType.LocalICECandidate: {
                const { iceCandidate, forClientId } = parsedMessage.payload;
                const wsConnection = get(store, `${forClientId}.wsConnection`) as WebSocket;
                if (!wsConnection) return; // TODO: Handle the error

                const message: RemoteICECandidate = {
                    type: MessageType.RemoteICECandidate,
                    payload: {
                        iceCandidate,
                        clientId: userId,
                    },
                };

                wsConnection.send(JSON.stringify(message));
                break;
            }

            case MessageType.LocalSDP: {
                const { forClientId, sdp } = parsedMessage.payload;
                const wsConnection = get(store, `${forClientId}.wsConnection`) as WebSocket;
                const isPresenter = get(store, `presenter.clientId`) === forClientId;

                if (!wsConnection) return; // TODO: Handle the error

                const message: RemoteSDP = {
                    type: isPresenter ? MessageType.RemoteSDPOffer : MessageType.RemoteSDPAnswer,
                    payload: {
                        clientId: userId,
                        sdp,
                    },
                }

                wsConnection.send(JSON.stringify(message));
                break;
            }

            case MessageType.PresenterQuery: {
                const presenterClientId = get(store, 'presenter.clientId');
                const message: PresenterQueryResponse = {
                    type: MessageType.PresenterQueryResponse,
                    payload: {
                        clientId: presenterClientId,
                    },
                };
                ws.send(JSON.stringify(message));
                break;
            }

            case MessageType.PresenterRequest: {
                const presenterClientId = get(store, 'presenter.clientId');
                if (presenterClientId) {
                    const message: PresenterRequestResponse = {
                        type: MessageType.PresenterResponse,
                        payload: {
                            ok: false,
                        },
                    };
                    ws.send(JSON.stringify(message));
                    return;
                }

                set(store, 'presenter.clientId', userId);

                const message: PresenterRequestResponse = {
                    type: MessageType.PresenterResponse,
                    payload: {
                        ok: true,
                    },
                };

                ws.send(JSON.stringify(message));

                const messageForBroadcast: PresenterQueryResponse = {
                    type: MessageType.PresenterQueryResponse,
                    payload: {
                        clientId: userId,
                    },
                };

                broadcastMessage(JSON.stringify(messageForBroadcast));
                break;
            }
        }
    });

    const closeOrErrorCallback = () => {
        const index = store.connections.indexOf(ws);
        if (index > -1) {
            store.connections.splice(index, 1);
        }

        const presenterId = get(store, 'presenter.clientId');

        if (presenterId === userId) {
            delete store.presenter.clientId;
            const messageForBroadcast: PresenterQueryResponse = {
                type: MessageType.PresenterQueryResponse,
                payload: {},
            };
            broadcastMessage(JSON.stringify(messageForBroadcast));
        }

        if (store[userId]) {
            delete store[userId];
        }
    }
    
    ws.on('error', () => closeOrErrorCallback());

    ws.on('close', () => closeOrErrorCallback());
});

