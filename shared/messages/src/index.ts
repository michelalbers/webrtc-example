export enum MessageType {
    PresenterRequest,
    PresenterResponse,
    PresenterQuery,
    PresenterQueryResponse,
    StopPresenter,
    LocalICECandidate,
    LocalSDP,
    RemoteICECandidate,
    RemoteSDPOffer,
    RemoteSDPAnswer,
    ClientId,
};

export type StopPresenter = {
    type: MessageType.StopPresenter,
}

export type ClientId = {
    type: MessageType.ClientId,
    payload: {
        clientId: string;
    }
}

export type PresenterQuery = {
    type: MessageType.PresenterQuery,
}

export type PresenterQueryResponse = {
    type: MessageType.PresenterQueryResponse,
    payload: {
        clientId?: string,
    }
}

export type PresenterRequest = {
    type: MessageType.PresenterRequest,
};

export type PresenterRequestResponse = {
    type: MessageType.PresenterResponse,
    payload: {
        ok: boolean,
    }
}

export type LocalSDP = {
    type: MessageType.LocalSDP;
    payload: {
        forClientId: string;
        sdp: string,
    };
};

export type LocalICECandidate = {
    type: MessageType.LocalICECandidate;
    payload: {
        forClientId: string;
        iceCandidate: RTCIceCandidateInit,
    };
};

export type RemoteSDP = {
    type: MessageType.RemoteSDPOffer | MessageType.RemoteSDPAnswer;
    payload: {
        clientId: string;
        sdp: string,
    };
};

export type RemoteICECandidate = {
    type: MessageType.RemoteICECandidate;
    payload: {
        clientId: string;
        iceCandidate: RTCIceCandidateInit,
    };
};

export type MessageToServer = PresenterQuery | PresenterRequest | LocalICECandidate | LocalSDP | StopPresenter;
export type MessageFromServer = RemoteICECandidate | RemoteSDP | PresenterQueryResponse | PresenterRequestResponse | ClientId;
