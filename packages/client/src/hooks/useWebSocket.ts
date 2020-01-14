import { useState, useRef, useEffect } from "react";
import { MessageFromServer, MessageType } from "@interwebs/webrtc-messages";

export default () => {
    const ws = useRef<WebSocket>();
    if (!ws.current) ws.current = new WebSocket(process.env.REACT_APP_WS_URL as string);
    const [wsConnection, setWsConnection] = useState<WebSocket>();
    const [error, setError] = useState<Error>();
    const [clientId, setClientId] = useState<string>();

    ws.current.onopen = () => { 
        setWsConnection(ws.current);
        setError(undefined);
    }

    ws.current.onclose = () => setWsConnection(undefined);
    ws.current.onerror = (ev) => {
        setError(new Error(JSON.stringify(ev)));
    } 

    useEffect(() => {
        if (!wsConnection) return;

        const clientIdMessageCallback = (ev: MessageEvent) => {
            const parsedMessage = JSON.parse(ev.data as string) as MessageFromServer;
            if (parsedMessage.type === MessageType.ClientId) {
                setClientId(parsedMessage.payload.clientId);
            }
        }

        wsConnection.addEventListener('message', clientIdMessageCallback);

        return () => {
            wsConnection.removeEventListener('message', clientIdMessageCallback);
            setClientId(undefined);
        }
    }, [wsConnection])

    return { error, wsConnection, clientId };
};
