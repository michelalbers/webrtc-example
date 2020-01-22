export const config: RTCConfiguration = {
    iceTransportPolicy: 'relay',
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
            urls: [
                process.env.REACT_APP_TURN_SERVER_URL as string,
            ],
            username: process.env.REACT_APP_TURN_SERVER_USERNAME as string,
            credential: process.env.REACT_APP_TURN_SERVER_PASSWORD as string,
        },
    ],
};

export default config;
