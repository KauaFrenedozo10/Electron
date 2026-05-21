const { app, BrowserWindow } = require('electron')
const path = require('path')

require('./Back-end/server')

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    })

    // Forma correta e segura para sistemas operacionais:
    win.loadFile(path.join(__dirname, 'Front-end', 'index.html'))
}

app.whenReady().then(() => {
    createWindow()
})