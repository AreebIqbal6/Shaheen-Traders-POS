interface Window {
  electronAPI?: {
    saveBackup: (driveLetter: string, data: unknown) => Promise<{ success: boolean; path?: string; error?: string }>;
    printPdf: (html: string, receiptNumber: string) => Promise<{ success: boolean; error?: string }>;
    dispatchOrder: (orderPayload: any) => Promise<{ success: boolean; receiptPath?: string; error?: string }>;
    loginBooker: (username: string, password: string) => Promise<{ success: boolean; bookerName?: string; error?: string }>;
  };
}
