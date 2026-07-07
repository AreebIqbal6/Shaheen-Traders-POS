const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveBackup: (driveLetter, data) => ipcRenderer.invoke('save-backup', driveLetter, data),
  printPdf: (html, receiptNumber) => ipcRenderer.invoke('print-pdf', html, receiptNumber),
  dispatchOrder: (orderPayload) => ipcRenderer.invoke('dispatch-order', orderPayload),
  loginBooker: (username, password) => ipcRenderer.invoke('login-booker', username, password)
});
