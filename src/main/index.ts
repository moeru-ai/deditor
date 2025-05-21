import { dirname, join } from 'node:path'
import { env } from 'node:process'
import { fileURLToPath } from 'node:url'
import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { drizzle } from 'drizzle-orm/postgres-js'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { isMacOS } from 'std-env'

import icon from '../../resources/icon.png?asset'

app.dock?.setIcon(icon)

let mainWindow: BrowserWindow | undefined

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    title: 'Deditor',
    width: 1920,
    height: 1080,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(dirname(fileURLToPath(import.meta.url)), '../preload/index.mjs'),
      sandbox: false,
    },
    titleBarStyle: isMacOS ? 'hidden' : undefined,
    trafficLightPosition: isMacOS ? { x: 10, y: 10 } : undefined,
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(env.ELECTRON_RENDERER_URL)
  }
  else {
    mainWindow.loadFile(join(dirname(fileURLToPath(import.meta.url)), '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('ai.moeru.deditor')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  // eslint-disable-next-line no-console
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('request:connect-remote-database', (_, databaseDsn: string) => {
    try {
      const client = drizzle(databaseDsn)
      // eslint-disable-next-line no-console
      client.execute('SELECT 1').then(res => console.log(res))
      mainWindow?.webContents.send('response:connect-remote-database', true)
    }
    catch (err) {
      mainWindow?.webContents.send('response:error:connect-remote-database', err)
    }
  })

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!isMacOS) {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
