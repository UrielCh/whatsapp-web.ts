// global.d.ts or src/types/whatsapp.d.ts
declare global {
  interface Window {
    Store: {
      WidFactory: {
        createWid: (chatId: string) => any; // Replace 'any' with the real return type if known
      };
      Settings: {
        getAutoDownloadDocuments: () => boolean;
        setAutoDownloadDocuments: (flag: boolean) => Promise<void> | void;
        // Add other Settings methods as needed
      };
      // ...add other Store properties as needed
    };
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