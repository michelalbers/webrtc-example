export declare enum MessageType {
    PresenterRequest = 0,
    PresenterResponse = 1,
    PresenterQuery = 2,
    PresenterQueryResponse = 3,
    StopPresenter = 4,
    LocalICECandidate = 5,
    LocalSDP = 6,
    RemoteICECandidate = 7,
    RemoteSDPOffer = 8,
    RemoteSDPAnswer = 9,
    ClientId = 10
}
export declare type StopPresenter = {
    type: MessageType.StopPresenter;
};
export declare type ClientId = {
    type: MessageType.ClientId;
    payload: {
        clientId: string;
    };
};
export declare type PresenterQuery = {
    type: MessageType.PresenterQuery;
};
export declare type PresenterQueryResponse = {
    type: MessageType.PresenterQueryResponse;
    payload: {
        clientId?: string;
    };
};
export declare type PresenterRequest = {
    type: MessageType.PresenterRequest;
};
export declare type PresenterRequestResponse = {
    type: MessageType.PresenterResponse;
    payload: {
        ok: boolean;
    };
};
export declare type LocalSDP = {
    type: MessageType.LocalSDP;
    payload: {
        forClientId: string;
        sdp: string;
    };
};
export declare type LocalICECandidate = {
    type: MessageType.LocalICECandidate;
    payload: {
        forClientId: string;
        iceCandidate: RTCIceCandidateInit;
    };
};
export declare type RemoteSDP = {
    type: MessageType.RemoteSDPOffer | MessageType.RemoteSDPAnswer;
    payload: {
        clientId: string;
        sdp: string;
    };
};
export declare type RemoteICECandidate = {
    type: MessageType.RemoteICECandidate;
    payload: {
        clientId: string;
        iceCandidate: RTCIceCandidateInit;
    };
};
export declare type MessageToServer = PresenterQuery | PresenterRequest | LocalICECandidate | LocalSDP | StopPresenter;
export declare type MessageFromServer = RemoteICECandidate | RemoteSDP | PresenterQueryResponse | PresenterRequestResponse | ClientId;
