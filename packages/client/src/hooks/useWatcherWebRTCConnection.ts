import { LocalICECandidate, LocalSDP, MessageFromServer, MessageType } from "@interwebs/webrtc-messages";
import { useRef, useState } from "react";
import { createPeerConnection } from "../lib/webRTCConnection";

export enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected,
}

export default (wsConnection?: WebSocket) => {
    const peerConnection = useRef<RTCPeerConnection>();
    const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream>();
    const [error, setError] = useState<Error>();
    const [connectionStatus, setConnectionStatus] = useState(ConnectionStatus.Disconnected);

    const onError = (err: Error, context?: string) => {
        if (context) {
            console.error(`Error in ${context}`);
        }
        console.error(err);
        setError(err);
        setRemoteMediaStream(undefined);
        cleanUpRTCConnection();
    }

    const cleanUpRTCConnection = () => {
        if (!peerConnection.current) return;

        peerConnection.current.close();
        peerConnection.current = undefined;

        setRemoteMediaStream(undefined);
    }

    const websocketMessageCallback = async (ev: MessageEvent) => {
        const parsedMessage = JSON.parse(ev.data as string) as MessageFromServer;
        const iceCandidateQueue: RTCIceCandidateInit[] = [];

        switch (parsedMessage.type) {
            case MessageType.PresenterQueryResponse: {
                const { clientId } = parsedMessage.payload;
                if (!clientId) {
                    cleanUpRTCConnection();
                }
                break;
            }

            case MessageType.RemoteICECandidate: {
                const { iceCandidate } = parsedMessage.payload;
                if (peerConnection.current?.remoteDescription) {
                    try {
                        await peerConnection.current?.addIceCandidate(iceCandidate);
                    } catch (err) {
                        onError(err, 'websocketMessageCallback -> MessageType.RemoteICECandidate (:55)');
                    }
                } else {
                    iceCandidateQueue.push(iceCandidate);
                }
                break;
            }

            case MessageType.RemoteSDPAnswer: {
                const { sdp } = parsedMessage.payload;

                try {
                    console.log(peerConnection.current?.signalingState);
                    await peerConnection.current?.setRemoteDescription(new RTCSessionDescription({
                        sdp,
                        type: 'answer',
                    }));
                    while (iceCandidateQueue.length) {
                        const iceCandidate = iceCandidateQueue.shift() as RTCIceCandidateInit;
                        try {
                            await peerConnection.current?.addIceCandidate(iceCandidate);
                        } catch (err) {
                            onError(err, 'websocketMessageCallback -> MessageType.RemoteSDPAnswer -> iceCandidateQueueLoop (:76)')
                        }
                    }
                } catch (err) {
                    onError(err, 'websocketMessageCallback -> MessageType.RemoteSDPAnswer (:80)');
                }

                break;
            }
        }
    }

    const startWatching = async (presenterId: string, mediaStream: MediaStream) => {
        if (!wsConnection) return;
        cleanUpRTCConnection();
        peerConnection.current = createPeerConnection(mediaStream);
        wsConnection.addEventListener('message', websocketMessageCallback);

        const onStopWatching = () => {
            setConnectionStatus(ConnectionStatus.Disconnected);
            cleanUpRTCConnection();
            wsConnection?.removeEventListener('message', websocketMessageCallback);
        };

        peerConnection.current.ontrack = (ev) => {
            const stream = new MediaStream();
            stream.addTrack(ev.track);
            setRemoteMediaStream(stream);
        }

        peerConnection.current.oniceconnectionstatechange = () =>  {
            switch (peerConnection.current?.iceConnectionState) {
                case 'checking': {
                    setConnectionStatus(ConnectionStatus.Connecting);
                    break;
                }
                case 'completed':
                case 'connected': {
                    setConnectionStatus(ConnectionStatus.Connected);
                    break;
                }
                case 'closed': {
                    onStopWatching();
                    break;
                }
                default: {
                    setConnectionStatus(ConnectionStatus.Disconnected);
                    break;
                }
            }
        }

        peerConnection.current.onicecandidate = (ev) => {
            const { candidate: iceCandidate } = ev;
            if (!iceCandidate) return;

            const message: LocalICECandidate = {
                type: MessageType.LocalICECandidate,
                payload: {
                    forClientId: presenterId,
                    iceCandidate: iceCandidate.toJSON(),
                }
            };

            wsConnection.send(JSON.stringify(message));
        }

        try {
            const offer = await peerConnection.current.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: true,
            });

            await peerConnection.current.setLocalDescription(offer);

            const message: LocalSDP = {
                type: MessageType.LocalSDP,
                payload: {
                    forClientId: presenterId,
                    sdp: offer.sdp as string,
                }
            };

            wsConnection.send(JSON.stringify(message));
        } catch (err) {
            onError(err, 'startWatching -> createOffer / setLocalDescription (:157)');
            onStopWatching();
        }

        return onStopWatching;
    }

    return {
        startWatching,
        remoteMediaStream,
        connectionStatus,
        error,
    }
};
