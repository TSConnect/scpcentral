// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron')
const Notify = require('node-notifier').NotificationCenter;
const axios = require('axios');
const appConfig = require("./config.json")

let clientKey;
const { 
  v4: uuidv4,
} = require('uuid');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');
const path = require('node:path')
const log = require('./logger');



// define necessary variables
let mainWindow;
const store = new Store();
const notifier = new Notify({
  withFallback: false,
  customPath: path.join(__dirname, "./node_modules/node-notifier/vendor/mac.noindex/TSConnect.app/Contents/MacOS/TSConnect")
})
let readyForNotification = false;


// set before quit
app.on('before-quit', () => {
  if(mainWindow == undefined){
    mainWindow = {
      forceClose: false
    }
  }
  mainWindow.forceClose = true;
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  log.info(`[App Version] ${app.getVersion()}`)
  log.info(`[IS TESTING] ${process.env["TSC_TESTING"] == undefined ? false : process.env["TSC_TESTING"] }`)
  log.info(`[PLATFORM] ${process.platform}`)
  log.info(`[CONFIG LOCATION] "${store.path}"`)
  log.info(`[LOG LOCATION] ${log.transports.file.getFile()}`)


  //change this once able to be signed
  if(process.env["TSC_TESTING"] == "true"){
    log.info(`[AUTOUPDATE] Skipping autoupdater. PLATFORM: ${process.platform} | TSC_TESTING ENV: ${process.env["TSC_TESTING"] == undefined ? "Not Present" : process.env["TSC_TESTING"]}`)
    // CheckForUpdate()

    loadApp()
  }else{
    if(process.mas == true){
      log.info(`[MAS BUILD] Skipping AutoUpdate`)
      loadApp()
    }else{
      log.info(`[Version Check] Checking for Updates`)
      loadApp()
    }
    
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0){
      createWindow();
    }else{
      createWindow();
    }
  })

})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  app.quit()
})


// Loops


// IPC Main Processes


ipcMain.on("logConsole", (event, data) => {
  log.info(`[RENDERER LOGS] ${data}`)
})


ipcMain.on("getVersion", (event) => {
  event.returnValue = `v${app.getVersion()}(${packageInfo.buildNumber})`
})

ipcMain.on("getCategoryFiles", async (event, cat) => {
  let config = {
    method: 'get',
    url: appConfig.isDevelopment ? appConfig.devServerAddr : appConfig.serverAddr + '/files/getCat/' + cat,
    headers: { 
      'Content-Type': 'application/json'
    }
  };
  let res;
  try{
    res = await axios.request(config)
    res = res.data
  }catch(e){
    log.error(e)
  }
  event.returnValue = res
})

ipcMain.on("mdToHTML", async (event, markdown) => {

  var showdown  = require("showdown")
  converter = new showdown.Converter(),
  text      = markdown,
  html      = converter.makeHtml(text);

  event.returnValue = html;
})

ipcMain.on("getSpecific", async (event, fileid) => {
  let config = {
    method: 'get',
    url: appConfig.isDevelopment ? appConfig.devServerAddr : appConfig.serverAddr + '/files/getSpecific/' + fileid,
    headers: { 
      'Content-Type': 'application/json'
    }
  };
  let res;
  try{
    res = await axios.request(config)
    res = res.data
  }catch(e){
    log.error(e)
  }
  event.returnValue = res
})

// Auto Updater


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

autoUpdater.on('checking-for-update', () => {
  log.info("Checking for updates using the following feed: " + autoUpdater.getFeedURL())
  sendStatusToWindow('102-Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('102-Update available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('102-Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  sendStatusToWindow(`101-${progressObj.percent}`);
})
autoUpdater.on('update-not-available', (info) => {
  loadApp()
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
  autoUpdater.quitAndInstall()
});

// Notification Callback


notifier.on('click', function (notifierObject, options, event) {
  // Triggers if `wait: true` and user clicks notification
  createWindow()
});

notifier.on('timeout', function (notifierObject, options) {
  // Triggers if `wait: true` and notification closes
});



// All functions

/**
 * Manager menu actions
 *
 * @param {String} type "Home", "Quizzes", "Tour", "Merch Alert", "Spotify", "Debug"
 */
function menuManager(type) {
  if(mainWindow == undefined)return;
  type = type.toLowerCase()
  if(type == "home"){
    mainWindow.loadURL(`file://${__dirname}/public/index.html`);
  }else if(type == "debug"){
    log.info("[Debug] Opening Developer Tools.")
    mainWindow.webContents.openDevTools();
  }else if(type == "action monitor"){
    mainWindow.loadURL(`file://${__dirname}/public/actionMonitor.html`);
  }else if(type == "about us"){
    mainWindow.loadURL(`file://${__dirname}/public/aboutus.html`);
  }
}


function loadApp(){
  if (process.platform == 'darwin'){
    log.info(`[MACOS Only] Registering Menu Items and Shortcuts`)
    let menuItems = [
      {
        label: 'TSConnect', 
        submenu: [
          {accelerator: "CommandOrControl+q", label: 'Quit', click: function() {app.quit();}},
          {accelerator: "CommandOrControl+w", label: 'Close Window', click: function() {
            if(mainWindow != undefined && mainWindow.isVisible() == true){
              mainWindow.close()
            }
          }},
          {accelerator: "CommandOrControl+t", label: 'Open Main Window', click: function() {
            if(mainWindow != undefined && mainWindow.isVisible() == false){
              mainWindow.show()
            }
          }}
        ]
      },{
        label: 'App Control', 
        submenu: [
          {accelerator:"Alt+CommandOrControl+h", label: 'Home', click: function () { 
            log.info("[SHORTCUT TRIGGERED] Navigating to Home")
            menuManager("Home")
          } },
          {accelerator:"Alt+CommandOrControl+m", label: 'Action Monitor', click: function () { 
            log.info("[SHORTCUT TRIGGERED] Navigating to Action Monitor")
            menuManager("Action Monitor")
          } },
          {accelerator:"Alt+CommandOrControl+a", label: 'About Us', click: function () { 
            log.info("[SHORTCUT TRIGGERED] Navigating to About Us")
            menuManager("About Us")
          } }
        ]
      }
    ]
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuItems))
  }
  log.info(`[INFO] Loading Main Window`)
  createWindow()
}

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}

function createWindow () {
    // If mainwindow somehow is undefined, create a new window and load the main index file
    if(mainWindow == undefined){
    // Create the browser window.
      mainWindow = new BrowserWindow({
        title: 'SCP Central',
        width: 950,
        height: 700,
        resizable: false,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
        }
      })
  
      mainWindow.loadURL(`file://${__dirname}/public/index.html`);
  
      // window exists, and is actually hidden, then show the window.
    }else{
      if(!mainWindow.isVisible()){
        mainWindow.show();
      }
    }
  
    if(process.platform != 'darwin') {
      mainWindow.setMenu(null)
    }

    // mainWindow.webContents.openDevTools()
    
    mainWindow.on('close', (e) => {
      if(process.platform == 'darwin' && !mainWindow.forceClose){
        e.preventDefault();
        mainWindow.hide();
      }
    });
    readyForNotification = true;
    
  }
