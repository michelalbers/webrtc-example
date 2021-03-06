import { LocalICECandidate, LocalSDP, MessageFromServer, MessageType, StopPresenter } from "@interwebs/webrtc-messages";
import { useRef, useState } from "react";
import { createPeerConnection } from "../lib/webRTCConnection";

export default () => {
    const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
    const [error, setError] = useState<Error>();
    const [clientMediaStreams, setClientMediaStreams] = useState<MediaStream[]>([]);
    const iceCandidateQueue: { [key: string]: RTCIceCandidateInit[] } = {};

    const disconnectAllClients = () => {
        for (const clientId in peerConnections.current) {
            const pc = peerConnections.current[clientId];
            pc.close();
            delete peerConnections.current[clientId];
        }
        setClientMediaStreams([]);
    }

    const onError = (err: Error, context?: string) => {
        if (context) {
            console.error(`Error in ${context}`);
        }
        console.error(err);
        setError(err);
        disconnectAllClients();
    }

    const startPresenting = (wsConnection: WebSocket, mediaStream: MediaStream) => {
        const messageCallback = async (ev: MessageEvent) => {
            const parsedMessage = JSON.parse(ev.data as string) as MessageFromServer;

            switch (parsedMessage.type) {
                case MessageType.RemoteSDPOffer: {
                    const { clientId, sdp } = parsedMessage.payload;
                    const peerConnection = createPeerConnection(mediaStream);
                    const remoteStream = new MediaStream();

                    peerConnections.current[clientId] = peerConnection;

                    peerConnection.oniceconnectionstatechange = (ev) => {
                        switch (peerConnection.iceConnectionState) {
                            case 'completed':
                            case 'connected': {
                                setClientMediaStreams((streams) => streams.concat(remoteStream));
                                break;
                            }

                            case 'disconnected': {
                                delete iceCandidateQueue[clientId];
                                delete peerConnections.current[clientId];
                            }

                            default: {
                                setClientMediaStreams((streams) => {
                                    const index = streams.indexOf(remoteStream);
                                    if (index > -1) streams.splice(index, 1);
                                    return Array.from(streams);
                                })
                            }
                        }
                    }

                    peerConnection.onicecandidate = (ev) => {
                        const iceCandidate = ev.candidate;
                        if (!iceCandidate) return;
                        const message: LocalICECandidate = {
                            type: MessageType.LocalICECandidate,
                            payload: {
                                forClientId: clientId,
                                iceCandidate: iceCandidate.toJSON(),
                            },
                        };
                        wsConnection.send(JSON.stringify(message));
                    }

                    peerConnection.ontrack = (ev) => {
                        const track = ev.track;
                        remoteStream.addTrack(track);
                    }

                    if (!peerConnection) {
                        setError(new Error(`Peer Connection for Client Id ${clientId} is not present`));
                    }

                    try {
                        await peerConnection.setRemoteDescription({
                            type: 'offer',
                            sdp,
                        });

                        if (iceCandidateQueue[clientId]) {
                            while (iceCandidateQueue[clientId].length) {
                                const iceCandidate = iceCandidateQueue[clientId].shift();
                                try {
                                    await peerConnection.addIceCandidate(iceCandidate as RTCIceCandidateInit);
                                } catch (err) {
                                    onError(err, 'startPresenting -> MessageType.RemoteSDPOffer -> setRemoteDescription -> addIceCandidate (:88)');
                                }
                            }
                        }

                        const answer = await peerConnection.createAnswer();

                        await peerConnection.setLocalDescription({ sdp: answer.sdp, type: 'answer' });

                        const message: LocalSDP = {
                            type: MessageType.LocalSDP,
                            payload: {
                                forClientId: clientId,
                                sdp: answer.sdp as string,
                            }
                        }

                        wsConnection.send(JSON.stringify(message));
                    } catch (err) {
                        onError(err, 'startPresenting -> MessageType.RemoteSDPOffer -> setRemoteDescription (:118)');
                    }

                    break;
                }

                case MessageType.RemoteICECandidate: {
                    const { clientId, iceCandidate } = parsedMessage.payload;
                    const peerConnection = peerConnections.current[clientId];

                    if (!peerConnection) {
                        onError(new Error(`Peer Connection for Client Id ${clientId} is not present`), 'startPresenting -> MessageType.RemoteICECandidate (:129)');
                        return;
                    }

                    if (!peerConnection.remoteDescription) {
                        const queue = iceCandidateQueue[clientId] || [];
                        queue.push(iceCandidate);
                        iceCandidateQueue[clientId] = queue;
                        return;
                    }

                    try {
                        await peerConnection.addIceCandidate(iceCandidate)
                    } catch (err) {
                        onError(err, 'startPresenting -> MessageType.RemoteIceCandidate -> addIceCandidate (:143)');
                    }

                    break;
                }
            }
        }

        wsConnection.addEventListener('message', messageCallback);

        return () => {
            disconnectAllClients();
            wsConnection.removeEventListener('message', messageCallback);
            const message: StopPresenter = {
                type: MessageType.StopPresenter,
            }
            wsConnection.send(JSON.stringify(message));
        };
    }

    return { error, clientMediaStreams, startPresenting };
};
