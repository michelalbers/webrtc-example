import React, { useRef, useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import Video, { VideoContainer } from '../Video';
import Button from '@material-ui/core/Button';
import Snackbar from '@material-ui/core/Snackbar';
import useWebSocket from '../../hooks/useWebSocket';
import usePresenterStatus from '../../hooks/usePresenterStatus';
import usePresenterWebRTCConnection from '../../hooks/usePresenterWebRTCConnection';
import useWatcherWebRTCConnection, { ConnectionStatus } from '../../hooks/useWatcherWebRTCConnection';

const MainWrapper = styled.div`
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
`;

const VideoWrapper = styled.div`
    position: relative;
    background-color: #fff;
    height: 100%;
    flex: 1;
`;

const ControlWrapper = styled.div`
    display: flex;
    height: 150px;
`;

const WatcherButton = (props: { onShouldConnect: () => void; onShouldDisconnect: () => void; connectionStatus: ConnectionStatus }) => {
    switch (props.connectionStatus) {
        case ConnectionStatus.Connecting: {
            return (
                <Button
                    fullWidth
                    variant={'contained'}
                    disabled
                    color={'secondary'}
                >connecting ...</Button>
            );
        }
        case ConnectionStatus.Disconnected: {
            return (
                <Button
                    fullWidth
                    onClick={props.onShouldConnect}
                    variant={'contained'}
                    color={'secondary'}
                >start watching</Button>
            );
        }
        case ConnectionStatus.Connected: {
            return (
                <Button
                    fullWidth
                    onClick={props.onShouldDisconnect}
                    variant={'contained'}
                    color={'default'}
                >disconnect</Button>
            );
        }
    }
};

export default () => {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [localMediaStream, setLocalMediaStream] = useState<MediaStream>();
    const { error: wsError, wsConnection, clientId } = useWebSocket();
    const { presenterId, requestPresenting, presentingAvailable } = usePresenterStatus(wsConnection);
    const { error: presenterErrror, clientMediaStreams, startPresenting } = usePresenterWebRTCConnection();
    const { connectionStatus, error: watcherError, remoteMediaStream, startWatching } = useWatcherWebRTCConnection(wsConnection);
    const stopPresenting = useRef<() => void>();
    const stopWatching = useRef<() => void>();

    const isPresenter = useMemo(() => {
        return clientId === presenterId;
    }, [clientId, presenterId]);

    useEffect(() => {
        if (wsError) {
            setSnackbarMessage(wsError.message);
            setSnackbarOpen(true);
        }
    }, [wsError]);

    useEffect(() => {
        if (watcherError) {
            setSnackbarMessage(watcherError.message);
            setSnackbarOpen(true);
        }
    }, [watcherError]);

    useEffect(() => {
        if (presenterErrror) {
            setSnackbarMessage(presenterErrror.message);
            setSnackbarOpen(true);
        }
    }, [presenterErrror]);

    useEffect(() => {
        if (!isPresenter || !localMediaStream || !wsConnection) return;

        stopPresenting.current = startPresenting(
            wsConnection,
            localMediaStream,
        );

        return () => {};
    }, [isPresenter, localMediaStream, wsConnection]);

    const onStartLocalVideo = () => {
        navigator.mediaDevices.getUserMedia({
            video: {
                width: 1280,
                height: 720,
            },
            audio: false,
        })
            .then(mediaStream => setLocalMediaStream(mediaStream))
            .catch(err => { 
                setSnackbarMessage(err.message);
                setSnackbarOpen(true);
             });
    };

    const onRequestPresenting = () => {
        requestPresenting();
    };

    const onStartWatching = async () => {
        if (!presenterId || !wsConnection || !localMediaStream) return;

        stopWatching.current = await startWatching(
            presenterId,
            localMediaStream,
        );
    };

    const onStopWatching = () => {
        stopWatching.current?.();
    };

    const onStopPresenting = () => {
        if (!wsConnection || !isPresenter) return;
        stopPresenting.current?.();
    };

    return (
        <MainWrapper>
            <VideoWrapper>
                <Video playsInline mediaStream={localMediaStream} visible={!!localMediaStream} small={!!remoteMediaStream || !!clientMediaStreams.length} muted autoPlay />
                <Video playsInline mediaStream={remoteMediaStream} visible={!!remoteMediaStream} muted autoPlay />
                <VideoContainer>
                    {clientMediaStreams.map(clientMediaStream => (
                        <Video playsInline key={clientMediaStream.id} mediaStream={clientMediaStream} visible muted autoPlay />
                    ))}
                </VideoContainer>
            </VideoWrapper>
            <ControlWrapper>
                {!localMediaStream ? (
                    <Button
                        variant={'contained'}
                        color={'primary'}
                        fullWidth
                        onClick={onStartLocalVideo}
                    >
                        start local video
                    </Button>
                ) : (
                    <>
                    {presentingAvailable ? (
                        <Button
                            variant={'contained'}
                            color={'default'}
                            fullWidth
                            onClick={onRequestPresenting}
                        >
                            start presenting
                        </Button>
                    ) : (
                        !isPresenter ? <WatcherButton
                            onShouldConnect={onStartWatching}
                            onShouldDisconnect={onStopWatching}
                            connectionStatus={connectionStatus}
                        /> : <Button
                            variant={'contained'}
                            color={'secondary'}
                            fullWidth
                            onClick={onStopPresenting}
                        >Stop presenting</Button>
                    )}

                    </>
                )}
            </ControlWrapper>
            <Snackbar open={snackbarOpen} message={snackbarMessage} onClose={() => setSnackbarOpen(false)} autoHideDuration={3000} />
        </MainWrapper>
    );
};
