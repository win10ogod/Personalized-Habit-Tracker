const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200, // Increased width for better layout
    height: 800, // Increased height
    webPreferences: {
      nodeIntegration: false, // Recommended: false for security
      contextIsolation: true, // Recommended: true for security
      // Note: If you don't create a preload.js, you can remove the 'preload' line.
      // For this initial phase, if preload.js is not created in the next step,
      // and the web app doesn't need Node.js APIs in renderer, this is fine.
      // If issues arise with existing JS, nodeIntegration might need to be true
      // and contextIsolation false, but that's less secure.
    }
  });

  // Load the index.html of the app.
  mainWindow.loadFile('index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools(); // Optional: for debugging
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// In this file, you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
