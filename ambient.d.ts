// global.d.ts or src/types/whatsapp.d.ts
declare global {
  interface Window {
    /**
     * Injected by src/util/Injected/Store.js
     */
    Store: {
      WidFactory: {
        createWid: (chatId: string) => any;
      };
      Settings: {
        getAutoDownloadDocuments: () => boolean;
        setAutoDownloadDocuments: (flag: boolean) => Promise<void> | void;
        getAutoDownloadAudio?: () => boolean;
        setAutoDownloadAudio?: (flag: boolean) => Promise<void> | void;
        getAutoDownloadPhotos?: () => boolean;
        setAutoDownloadPhotos?: (flag: boolean) => Promise<void> | void;
        getAutoDownloadVideos?: () => boolean;
        setAutoDownloadVideos?: (flag: boolean) => Promise<void> | void;
      };
      Cmd?: { refreshQR: () => void };
      Conn?: { ref?: string, serialize?: () => any };
      User?: { getMeUser?: () => any };
      Msg?: { on?: Function, get?: Function, getMessagesById?: Function };
      AppState?: { state?: string, on?: Function, off?: Function, takeover?: Function };
      GroupParticipants?: { removeParticipants?: Function, demoteParticipants?: Function };
      Call?: { on?: Function };
      Chat?: {
        on?: Function;
        get?: (wid: any) => any;
        find?: (wid: any) => Promise<any> | any;
      };
      PollVote?: { on?: Function };
      Reactions?: { find?: Function };
      QuotedMsg?: { getQuotedMsgObj?: Function };
      BlockContact?: { blockContact?: Function, unblockContact?: Function };
      StatusUtils?: { getStatus?: Function };
      AddonReactionTable?: any;
      ContactMethods?: {
        getIsMe: (contact: any) => boolean;
        getIsUser: (contact: any) => boolean;
        getIsGroup: (contact: any) => boolean;
        getIsWAContact: (contact: any) => boolean;
        getIsMyContact: (contact: any) => boolean;
        getUserid: (contact: any) => string;
        getIsEnterprise: (contact: any) => boolean;
        getVerifiedName: (contact: any) => string;
        getVerifiedLevel: (contact: any) => string | number;
        getStatusMute: (contact: any) => boolean;
        getName: (contact: any) => string;
        getShortName: (contact: any) => string;
        getPushname: (contact: any) => string;
      };

      MembershipRequestUtils?: {
        sendMembershipRequestsActionRPC: (args: any) => Promise<any> | any;
      };
      WidToJid?: {
        widToUserJid: (wid: any) => string;
        widToGroupJid: (wid: any) => string;
      };
      JidToWid?: {
        userJidToUserWid: (jid: string) => { _serialized: string };
      };
      GroupQueryAndUpdate?: (args: { id: string }) => Promise<any> | any;

      HistorySync?: {
        sendPeerDataOperationRequest: (op: number, data: {chatId: string}) => Promise<any> | any;
      };

      AddressbookContactUtils?: {
        deleteContactAction: (phoneNumber: string) => Promise<void> | void;
        saveContactAction?: (phoneNumber: string, arg2: any, firstName: string, lastName: string, syncToAddressbook: boolean) => Promise<any>;
      };
      // ...add more as needed
      MediaPrep?: {
        prepRawMedia: (opaqueData: any, mediaParams: any) => { waitForPrep: () => Promise<any> };
      };
      MediaObject?: {
        getOrCreateMediaObject: (filehash: string) => any;
      };
      MediaTypes?: {
        msgToMediaType: (opts: { type: string; isGif?: boolean; isNewsletter?: boolean }) => any;
      };

    };
    /**
     * Injected by src/util/Injected/Utils.js
     */
    WWebJS: {
      membershipRequestAction: (
        groupId: string,
        action: 'Approve' | 'Reject',
        requesterIds?: string[] | null,
        sleep?: [number, number]
      ) => Promise<any>; // Replace `any` with the actual return type if known
      getLabels?: () => any[];
      getLabelModel?: (label: any) => any; // {hexColor: string, ...}
      getLabel?: (labelId: string) => any;
      
      getOrderDetail?: (orderId: string, token: string, chatId: string) => Promise<any>;
      getProductMetadata?: (productId: string) => Promise<any>;
      rejectCall?: (peerJid: string, id: string) => Promise<void>;

      arrayBufferToBase64?: (arrayBuffer: ArrayBuffer) => string;

      arrayBufferToBase64Async?: (arrayBuffer: ArrayBuffer) => Promise<string>;
      getFileHash?: (data: { arrayBuffer: () => Promise<ArrayBuffer> }) => Promise<string>;
      generateHash?: (length: number) => Promise<string>;
      generateWaveform?: (audioFile: { arrayBuffer: () => Promise<ArrayBuffer> }) => Promise<Uint8Array | undefined>;
      sendClearChat?: (chatId: string) => Promise<boolean>;
      sendDeleteChat?: (chatId: string) => Promise<boolean>;
      sendChatstate?: (state: 'typing' | 'recording' | 'stop', chatId: string) => Promise<boolean>;

      getChatLabels?: (chatId: string) => Promise<any | any[]>;
      
      getMessageModel?: (msg: any) => any;
      getPollVoteModel?: (vote: any) => any;
      getChatModel?: (chat: any) => any;
      getContactModel?: (contact: any) => any;
      getChat?: (chatId: string, opts?: { getAsModel?: boolean }) => Promise<any>;
      getChannelMetadata?: (inviteCode: string) => Promise<any>;
      getChats?: () => Promise<any[]>;
      getChannels?: () => Promise<any[]>;

      forwardMessage?: (chatId: string, msgId: string) => any;
      sendMessage?: (
        chat: any,
        content: any,
        options?: { [key: string]: any }
      ) => Promise<any>;

      editMessage?: (msg: any, message: string, options?: any) => any;
      cropAndResizeImage?: (
        media: { mimetype: string; data: string; [key: string]: any },
        options?: { size?: number; mimetype?: string; quality?: number; asDataUrl?: boolean; [key: string]: any }
      ) => Promise<string | { mimetype: string; data: string; [key: string]: any }>;
      toStickerData?: (mediaInfo: { mimetype: string; data: string; [key: string]: any }) => Promise<{ mimetype: string; data: string }>;
      processMediaData?: (
        mediaInfo: { mimetype: string; data: string; [key: string]: any },
        opts: { forceSticker?: boolean; forceGif?: boolean; forceVoice?: boolean; forceDocument?: boolean; forceMediaHd?: boolean; sendToChannel?: boolean }
      ) => Promise<any>;

    };
    AuthStore?: {
      AppState?: { state?: string, on?: Function, off?: Function };
      Cmd?: { on?: Function };
      Conn?: { ref?: string, on?: Function };
      OfflineMessageHandler?: { getOfflineDeliveryProgress?: () => any };
      PairingCodeLinkUtils?: { setPairingType?: Function, initializeAltDeviceLinking?: Function, startAltLinkingFlow?: Function };
      Base64Tools?: { encodeB64?: Function };
      RegistrationUtils?: { waSignalStore?: any, waNoiseInfo?: any, getADVSecretKey?: Function, DEVICE_PLATFORM?: string };
    };
    Debug?: { VERSION?: string };
    compareWwebVersions?: (v1: string, op: string, v2: string) => boolean;
    onQRChangedEvent?: (qr: string) => void;
    onAuthAppStateChangedEvent?: (state: string) => void;
    onAppStateHasSyncedEvent?: () => void;
    onOfflineProgressUpdateEvent?: (percent: number) => void;
    onLogoutEvent?: () => void;
    onChangeMessageEvent?: (msg: any) => void;
    onChangeMessageTypeEvent?: (msg: any) => void;
    onMessageAckEvent?: (msg: any, ack: any) => void;
    onMessageMediaUploadedEvent?: (msg: any) => void;
    onRemoveMessageEvent?: (msg: any) => void;
    onEditMessageEvent?: (msg: any, newBody: any, prevBody: any) => void;
    onAppStateChangedEvent?: (state: string) => void;
    onBatteryStateChangedEvent?: (state: any) => void;
    onIncomingCall?: (call: any) => void;
    onRemoveChatEvent?: (chat: any) => void;
    onArchiveChatEvent?: (chat: any, currState: any, prevState: any) => void;
    onAddMessageEvent?: (msg: any) => void;
    onAddMessageCiphertextEvent?: (msg: any) => void;
    onChatUnreadCountEvent?: (chat: any) => void;
    onPollVoteEvent?: (pollVoteModel: any) => void;
    originalError?: any;
  }
}
export {};