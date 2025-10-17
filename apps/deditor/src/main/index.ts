import http from 'node:http'

import { dirname, join } from 'node:path'
import { env } from 'node:process'
import { fileURLToPath } from 'node:url'

import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { Format, LogLevel, setGlobalFormat, setGlobalLogLevel } from '@guiiai/logg'
import { app, BrowserWindow, screen, shell } from 'electron'
import { isMacOS } from 'std-env'

import icon from '../../resources/icon.png?asset'

import { registerDatabaseDialects } from './ipc/databases/remote/'
import { registerApp, registerDialog, registerFs, registerPath, registerSafeStorage } from './ipc/electron'

setGlobalFormat(Format.Pretty)
setGlobalLogLevel(LogLevel.Log)

if (/^true$/i.test(env.DEDITOR_REMOTE_DEBUG || '')) {
  const remoteDebugPort = Number(env.DEDITOR_REMOTE_DEBUG_PORT || '9222')
  if (Number.isNaN(remoteDebugPort) || !Number.isInteger(remoteDebugPort) || remoteDebugPort < 0 || remoteDebugPort > 65535) {
    throw new Error(`Invalid remote debug port: ${env.DEDITOR_REMOTE_DEBUG_PORT}`)
  }

  app.commandLine.appendSwitch('remote-debugging-port', String(remoteDebugPort))
  app.commandLine.appendSwitch('remote-allow-origins', `http://localhost:${remoteDebugPort}`)
}

app.dock?.setIcon(icon)

function createWindow(): BrowserWindow {
  // Fit screen
  //
  // Read more on:
  // https://www.electronjs.org/docs/latest/api/screen
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'Deditor',
    width,
    height,
    show: false,
    icon,
    minWidth: 1024,
    minHeight: 768,
    // Preload
    webPreferences: {
      preload: join(dirname(fileURLToPath(import.meta.url)), '../preload/index.mjs'),
      sandbox: false,
    },
    // Title bar style
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

  // When developing, do not automatically focus and show the window immediately
  // after launch.
  //
  // Thanks to
  //
  // Question: is there a way to disable auto focus of electron app after "npm run dev"
  // https://github.com/SimulatedGREG/electron-vue/issues/269#issuecomment-308320467
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.debug('Running in development mode, window will not be focused automatically.')
    mainWindow.showInactive()
  }

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(env.ELECTRON_RENDERER_URL)
  }
  else {
    mainWindow.loadFile(join(dirname(fileURLToPath(import.meta.url)), '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  if (/^true$/i.test(env.DEDITOR_REMOTE_DEBUG || '')) {
    const remoteDebugEndpoint = `http://localhost:${env.DEDITOR_REMOTE_DEBUG_PORT || '9222'}`
    http.get(`${remoteDebugEndpoint}/json`, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const targets = JSON.parse(data)
          if (targets.length > 0) {
            let wsUrl = targets[0].webSocketDebuggerUrl
            if (wsUrl.startsWith('ws://')) {
              wsUrl = wsUrl.substring(5)
              // eslint-disable-next-line no-console
              console.log(`Inspect remotely: ${remoteDebugEndpoint}/devtools/inspector.html?ws=${wsUrl}`)
              shell.openExternal(`${remoteDebugEndpoint}/devtools/inspector.html?ws=${wsUrl}`)
            }
            else {
              console.warn('[Remote Debugging] Invalid WebSocket URL:', wsUrl)
            }
          }
          else {
            console.warn('[Remote Debugging] No targets found')
          }
        }
        catch (err) {
          console.error('[Remote Debugging] Failed to parse metadata from /json:', err)
        }
      })
    }).on('error', (err) => {
      console.error('[Remote Debugging] Failed to fetch metadata from /json:', err)
    })
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('ai.moeru.deditor')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  const mainWindow = createWindow()

  // Node.js APIs
  // similar to Node Integration, but with a more secure context
  registerFs(mainWindow, app)
  registerPath(mainWindow, app)

  // Electron specific IPC handlers
  registerApp(mainWindow, app)
  registerSafeStorage(mainWindow, app)
  registerDialog(mainWindow, app)

  // Deditor specific IPC handlers
  registerDatabaseDialects(mainWindow)

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
