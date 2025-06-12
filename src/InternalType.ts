
export interface internalId {
    server: string /* value like: c.us */;
    user: string /* value like: 33611306069 */;
    constructor: (arg0: any, arg1: any) => any;
    getUserPartForLog: () => any;
    toString: (arg0: any) => any;
    toLogString: () => any;
    toJid: () => any;
    getJidServer: () => any;
    getDeviceId: () => any;
    equals: (arg0: any) => any;
    isLessThan: (arg0: any) => any;
    isGreaterThan: (arg0: any) => any;
    isCompanion: () => any;
    isSameAccountAndAddressingMode: (arg0: any) => any;
    isUser: () => any;
    isRegularUserPn: () => any;
    isLid: () => any;
    isUserNotPSA: () => any;
    isRegularUser: () => any;
    isBroadcast: () => any;
    isBroadcastList: () => any;
    isOfficialBizAccount: () => any;
    isEligibleForUSync: () => any;
    isGroup: () => any;
    isGroupCall: () => any;
    isServer: () => any;
    isPSA: () => any;
    isIAS: () => any;
    isStatus: () => any;
    isSupportAccount: () => any;
    isCAPISupportAccount: () => any;
    isNewsletter: () => any;
    isBot: () => any;
    isPnBot: () => any;
    isFbidBot: () => any;
    toJSON: () => any;
    isHosted: () => any;
  }; // getter


  export interface InternalChatShape {
    revisionNumber: number;
    parent: any;
    collection: {
      modelClass: () => any;
      notSpam: {[key: `${number}@c.us`]: boolean};
      promises: {
        sendUnstarAll: any;
      };
      setIndexes: () => any;
      findImpl: (arg0: any) => any;
    };
    msgs: {
      modelClass: () => any;
      triggerChangeLast: (arg0: any, arg1: any, arg2: any) => any;
      msgLoadState: {
        revisionNumber: number;
        parent: any;
        collection: any;
        mirror: {
          state: any /* circular reference */;
        };
      };
    };
    mirror: {
      state: {
        revisionNumber: number;
        parent: any;
        collection: any /* circular reference */;
        msgs: any /* circular reference */;
        mirror: any /* circular reference */;
        addQueue: {
        };
        sendQueue: {
        };
        saveAssignedColorsDebounced: () => any;
        eventMsgs: {
          modelClass: () => any;
          syncPromise: any;
          isFullySynced: boolean;
          isInitialized: boolean;
          chat: any /* circular reference */;
        };
        initialIndex: number;
      };
      masks: number[][];
      listeners: (arg0: any, arg1: any) => any[][];
      changeEvents: any[];
    };
    addQueue: any /* circular reference */;
    sendQueue: any /* circular reference */;
    saveAssignedColorsDebounced: () => any;
    eventMsgs: any /* circular reference */;
    initialIndex: number;
    readonly id: internalId; // getter

    readonly ping: any; // getter
    add: any;
    groupMetadata: any;
    newsletterMetadata: any;
    labels: any;
    groupMentions: any;
  }  
