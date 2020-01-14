import { useEffect, useState } from "react"
import { MessageFromServer, MessageType, PresenterQuery, PresenterRequest } from "@interwebs/webrtc-messages";

export default (wsConnection?: WebSocket) => {
    const [presentingAvailable, setPresentingAvailable] = useState(false);
    const [presenterId, setPresenterId] = useState<string>();

    const requestPresenting = () => {
        if (!wsConnection) throw new Error('WsConnection is not available');

        const message: PresenterRequest = { type: MessageType.PresenterRequest };
        wsConnection.send(JSON.stringify(message));
    }

    useEffect(() => {
        if (!wsConnection) return;

        const query: PresenterQuery = {
            type: MessageType.PresenterQuery,
        };

        const presenterQueryCallback = (ev: MessageEvent) => {
            const parsedMessage: MessageFromServer = JSON.parse(ev.data as string);
            if (parsedMessage.type === MessageType.PresenterQueryResponse) {
                setPresentingAvailable(!parsedMessage.payload.clientId);
                setPresenterId(parsedMessage.payload.clientId);
            }
        };

        wsConnection.addEventListener('message', presenterQueryCallback);

        wsConnection.send(JSON.stringify(query));

        return () => { wsConnection.removeEventListener('message', presenterQueryCallback) };
    }, [wsConnection]);

    return {
        presentingAvailable,
        presenterId,
        requestPresenting,
    };
}