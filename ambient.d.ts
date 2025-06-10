// global.d.ts or src/types/whatsapp.d.ts
declare global {
  interface Window {
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
      Chat?: { on?: Function };
      PollVote?: { on?: Function };
      Reactions?: { find?: Function };
      QuotedMsg?: { getQuotedMsgObj?: Function };
      BlockContact?: { blockContact?: Function, unblockContact?: Function };
      StatusUtils?: { getStatus?: Function };
      AddonReactionTable?: any;
      AddressbookContactUtils?: {
        deleteContactAction: (phoneNumber: string) => Promise<void> | void;
        saveContactAction?: (phoneNumber: string, arg2: any, firstName: string, lastName: string, syncToAddressbook: boolean) => Promise<any>;
      };
      // ...add more as needed
    };
    WWebJS: {
      membershipRequestAction: (
        groupId: string,
        action: 'Approve' | 'Reject',
        requesterIds?: string[] | null,
        sleep?: [number, number]
      ) => Promise<any>;
      getLabels?: () => any;
      getChatLabels?: (chatId: string) => any;
      getMessageModel?: (msg: any) => any;
      getPollVoteModel?: (vote: any) => any;
      getChatModel?: (chat: any) => any;
      forwardMessage?: (chatId: string, msgId: string) => any;
      editMessage?: (msg: any, message: string, options?: any) => any;
      getOrderDetail?: (orderId: string, token: string, chatId: string) => any;
      rejectCall?: (peerJid: string, id: string) => any;
      // ...add more as needed
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
  
    WWebJS: {
      membershipRequestAction: (
        groupId: string,
        action: 'Approve' | 'Reject',
        requesterIds?: string[] | null,
        sleep?: [number, number]
      ) => Promise<any>; // Replace `any` with the actual return type if known
    };

  }
}
export {};