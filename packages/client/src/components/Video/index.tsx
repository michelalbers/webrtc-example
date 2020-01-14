import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';

const UnstyledVideo = (props: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement> & { visible?: boolean; small?: boolean; mediaStream?: MediaStream }) => {
    const {
        visible,
        small,
        mediaStream,
        className,
        ...otherProps
    } = props;

    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && mediaStream) {
            videoRef.current.srcObject = mediaStream;
        }
    }, [videoRef, mediaStream]);

    return (
        <div className={className}>
            <video {...otherProps} ref={videoRef} />
        </div>
    );
};

export const Video = styled(UnstyledVideo)`
    position: absolute;
    opacity: ${props => props.visible ? 1 : 0};
    top: ${props => props.small ? 'inherit' : 0 };
    right: ${props => props.small ? '20px' : 0 };
    bottom: ${props => props.small ? '20px' : 0 };
    left: ${props => props.small ? 'inherit' : 0 };
    width: ${props => props.small ? '20%' : '100%'};
    height: ${props => props.small ? '20%' : '100%'};
    box-shadow: ${props => props.small ? `0px 0px 20px #888` : 'inherit'};
    z-index: ${props => props.small ? 2 : 1};

    video { 
        position: absolute;
        top: 0;
        right: 0;
        left: 0;
        bottom: 0;
        background: #000;
        object-fit: cover;
        width: 100%;
        height: 100%;
    }
`;

export const VideoContainer = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    ${Video} {
        position: relative;
        flex: 1;
        min-width: 20%;
        box-shadow: none;
        width: inherit;
        height: inherit;
    }
`;

export default Video;