import webRTCConfig from './webRTCConfig';

export const createPeerConnection = (mediaStream?: MediaStream) => {
    const peerConnection = new RTCPeerConnection(webRTCConfig);
    if (mediaStream) {
        mediaStream.getTracks().map(t => peerConnection.addTrack(t));
    }
    return peerConnection;
}
