// global.d.ts or src/types/whatsapp.d.ts
declare global {
  interface Window {
    onReaction: (reactions: any[]) => void;
    /**
     * Injected by src/util/Injected/Store.js
     */
    Store: {
      Features: {
        F: any;
        setFeature: (feature: string, enabled: boolean) => void;
        supportsFeature: (feature: string) => boolean;
      };

      WidFactory: {
        createWid: (chatId: string) => any;
        createUserWid: (chatId: string) => any;
      };
      Settings: {
        setGlobalOfflineNotifications: (flag: boolean) => Promise<void> | void;
        getGlobalOfflineNotifications: () => boolean;
        setPushname: (pushname: string) => Promise<void> | void;
        getAutoDownloadDocuments: () => boolean;
        setAutoDownloadDocuments: (flag: boolean) => Promise<void> | void;
        getAutoDownloadAudio?: () => boolean;
        setAutoDownloadAudio?: (flag: boolean) => Promise<void> | void;
        getAutoDownloadPhotos?: () => boolean;
        setAutoDownloadPhotos?: (flag: boolean) => Promise<void> | void;
        getAutoDownloadVideos?: () => boolean;
        setAutoDownloadVideos?: (flag: boolean) => Promise<void> | void;
      };
      Cmd?: {
        openChatBottom: (chat: any) => Promise<any>;
        openDrawerMid: (chat: any) => Promise<any>;
        chatSearch: (chat: any) => Promise<any>;
        openChatAt: (chat: any) => Promise<any>;
        msgInfoDrawer: (msg: any) => Promise<any>;
        closeDrawerRight: () => Promise<any>;
        archiveChat: (chat: any, archive: boolean) => Promise<any>;
        pinChat: (chat: any, pin: boolean) => Promise<any>;
        markChatUnread: (chat: any, unread: boolean) => Promise<any>;


        refreshQR: () => void;
        sendStarMsgs: (chat: any, msgs: any, clearMedia: boolean) => Promise<any>;
        sendUnstarMsgs: (chat: any, msgs: any, clearMedia: boolean) => Promise<any>;
        sendRevokeMsgs: Function; // (chat: any, msgs: any, clearMedia: boolean) => Promise<any>;
        sendDeleteMsgs: (chat: any, msgs: any, clearMedia: boolean) => Promise<any>;
       };
      Conn?: {
        platform?: string;
        on?: Function;
        ref?: string;
        serialize?: () => any;
        canSetMyPushname?: () => boolean;
        battery?: number;
        plugged?: boolean;
      };
      User?: {
        getMeUser?: () => {
          server: "c.us",
          user: string; // phonenumber
          _serialized: string; // "${phonenumber}@c.us"
        }
      };
      Msg?: {
        on?: Function;
        get?: Function;
        getMessagesById?: Function;
        search?: (query: string, page: number, count: number, remote: string) => Promise<any>;
      };
      AppState?: {
        state?: string;
        on?: Function;
        off?: Function;
        takeover?: Function;
        logout?: Function;
        reconnect?: Function;
      };
      GroupParticipants?: {
        removeParticipants?: Function;
        promoteParticipants?: Function;
        demoteParticipants?: Function;
      };
      Call?: { on?: Function };
      Chat?: {
        on?: Function;
        get?: (wid: any) => any;
        find?: (wid: any) => Promise<any> | any;
        getModelsArray?: () => any;
        filter?: (fn: (chat: any) => boolean) => any;
      };
      PollVote?: { on?: Function };
      Reactions?: { find?: Function };
      QuotedMsg?: { getQuotedMsgObj?: Function };
      BlockContact?: { blockContact?: Function, unblockContact?: Function };
      StatusUtils?: {
        getStatus?: Function;
        setMyStatus?: Function;
      };
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
        getMembershipApprovalRequests: (groupWid: any) => Promise<any> | any;
      };
      WidToJid?: {
        widToUserJid: (wid: any) => string;
        widToGroupJid: (wid: any) => string;
      };
      JidToWid?: {
        userJidToUserWid: (jid: string) => { _serialized: string };
        newsletterJidToWid: (jid: string) => { _serialized: string };
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
      AdCollection?: any;
      Blocklist?: any;
      OptOutList?: any;
      BotProfile?: any;
      BusinessCategoryResult?: any;
      BusinessProfile?: any;
      Catalog?: any;
      ChatAssignment?: any;
      ChatPreference?: any;
      Contact?: any;
      ConversionTuple?: any;
      DailyAggregatedStats?: any;
      EmojiVariant?: any;
      FavoriteCollection?: any;
      GroupMetadata?: any;
      Label?: any;
      MsgInfo?: any;
      Mute?: any;
      Order?: any;
      Presence?: any;
      ProfilePicThumb?: any;
      QuickReply?: any;
      RecentEmoji?: any;
      RecentSticker?: any;
      StarredMsg?: any;
      TextStatus?: any;
      Status?: any;
      Sticker?: any;
      StickerSearch?: any;
      RecentStickerMD?: any;
      StickerPackCollectionMD?: any;
      FavoriteSticker?: any;
      RecentReactions?: any;
      UnjoinedSubgroupMetadataCollection?: any;
      AgentCollection?: any;
      SubscriptionCollection?: any;
      UnattributedMessageCollection?: any;
      CommunityActivityCollection?: any;
      CommentCollection?: any;
      PinInChat?: any;
      NewsletterCollection?: any;
      NewsletterMetadataCollection?: any;
      PremiumMessageCollection?: any;
      FlattenedReactionsCollection?: any;
      UserDisclosureCollection?: any;
      EventResponseCollection?: any;
      DownloadManager?: any;
      MediaUpload?: any;
      MsgKey?: any;
      OpaqueData?: any;
      QueryProduct?: any;
      QueryOrder?: any;
      SendClear?: any;
      SendDelete?: any;
      SendMessage?: any;
      EditMessage?: any;
      SendSeen?: any;
      UserConstructor?: any;
      Validators?: any;
      ProfilePic?: any;
      PresenceUtils?: any;
      ChatState?: any;
      findCommonGroups?: any;
      ConversationMsgs?: any;
      sendReactionToMsg?: any;
      createOrUpdateReactionsModule?: any;
      EphemeralFields?: any;
      MsgActionChecks?: any;
      LinkPreview?: any;
      Socket?: any;
      SocketWap?: any;
      SearchContext?: any;
      DrawerManager?: any;
      LidUtils?: any;
      getMsgInfo?: any;
      pinUnpinMsg?: any;
      QueryExist?: any;
      ReplyUtils?: any;
      BotSecret?: any;
      BotProfiles?: any;
      ContactCollection?: any;
      DeviceList?: any;
      NumberInfo?: any;
      ForwardUtils?: any;
      VCard?: any;
      StickerTools?: any;
      GroupUtils?: any;
      GroupInvite?: any;
      GroupInviteV4?: any;
      ChannelUtils?: any;
      SendChannelMessage?: any;
      ChannelSubscribers?: any;

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
      getAllStatuses?: () => Promise<any[]>;
      getContacts?: () => Promise<Contact[]>;
      getContact?: (id: string) => Promise<Contact>;
      subscribeToUnsubscribeFromChannel?: (channelId: string, action: 'Subscribe' | 'Unsubscribe', options?: UnsubscribeOptions) => Promise<boolean>;
      pinUnpinMsgAction?: (msgId: string, action: number, duration?: number) => Promise<boolean>;
      getProfilePicThumbToBase64?: (chatId: string) => Promise<string>;
      getAddParticipantsRpcResult?: (groupMetadata: any, groupWid: any, pWid: any) => Promise<any>;
      deletePicture?: (chatId: string) => Promise<boolean>;
      setPicture?: (chatId: string, media: MessageMedia) => Promise<boolean>;
      sendSeen: (chatId: string) => Promise<boolean>;
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
      getChatModel?: (chat: any, opts?: { isChannel?: boolean }) => any;
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
      Conn?: {
        serialize?: () => {
          clientToken: undefined,
          connected: undefined,
          id: "1",
          is24h: undefined,
          isResponse: undefined,
          lc: undefined,
          lg: undefined,
          locales: undefined,
          phone: undefined,
          platform: "android",
          protoVersion: undefined,
          pushname: string; // "Whatsapp name"
          ref: string; // base-64 string (len: 102)
          refId: undefined,
          refTTL: 60000,
          secret: undefined,
          serverToken: undefined,
          smbTos: 0,
          tos: undefined,
          wid: undefined
        },
        ref?: string,
        on?: Function,
      };
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