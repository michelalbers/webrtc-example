"use strict";
exports.__esModule = true;
var MessageType;
(function (MessageType) {
    MessageType[MessageType["PresenterRequest"] = 0] = "PresenterRequest";
    MessageType[MessageType["PresenterResponse"] = 1] = "PresenterResponse";
    MessageType[MessageType["PresenterQuery"] = 2] = "PresenterQuery";
    MessageType[MessageType["PresenterQueryResponse"] = 3] = "PresenterQueryResponse";
    MessageType[MessageType["StopPresenter"] = 4] = "StopPresenter";
    MessageType[MessageType["LocalICECandidate"] = 5] = "LocalICECandidate";
    MessageType[MessageType["LocalSDP"] = 6] = "LocalSDP";
    MessageType[MessageType["RemoteICECandidate"] = 7] = "RemoteICECandidate";
    MessageType[MessageType["RemoteSDPOffer"] = 8] = "RemoteSDPOffer";
    MessageType[MessageType["RemoteSDPAnswer"] = 9] = "RemoteSDPAnswer";
    MessageType[MessageType["ClientId"] = 10] = "ClientId";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
;
