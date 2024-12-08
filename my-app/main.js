// public/electron.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'), // You can add preload scripts if needed
      nodeIntegration: true, // Allow Node.js APIs to be available in the renderer process
      contextIsolation: false // Allow use of require in React code
    }
  });

  // Load the React app (in development, load from localhost)
  mainWindow.loadURL(
    'http://localhost:3000'
  );

  // // Open DevTools in development mode
  // if (process.env.NODE_ENV === 'development') {
  //   mainWindow.webContents.openDevTools();
  // }
}

app.whenReady().then(createWindow);

// app.on('activate', function () {
//   if (BrowserWindow.getAllWindows().length === 0) createWindow();
// });