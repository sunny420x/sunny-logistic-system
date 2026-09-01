const db = require('../database');
const { exec } = require('child_process');

function getSettings() {
    return new Promise(resolve => {
        db.query("SELECT * FROM settings", (err, settings) => {
            if(err) console.error(err);
            resolve(settings[0])
        }) 
    })
}

function saveSettings(company_name, company_logo, company_banner, zone) {
    return new Promise(resolve => {
        db.query("UPDATE settings SET company_name = ?, company_logo = ?, company_banner = ?, zone = ?", [company_name, company_logo, company_banner, zone], (err) => {
            if(err) console.error(err);
            resolve()
        }) 
    })
}

function getCurrentZone() {
    return new Promise(resolve => {
        db.query("SELECT zone FROM settings", (err, settings) => {
            if(err) console.error(err);
            resolve(settings)
        })
    })
}

function getCurrentVersion() {
    return new Promise(resolve => {
        exec('git rev-list --count HEAD', (err, stdout, stderr) => {
            if(err) {
                console.error(err);
                resolve(null);
            }
            resolve(stdout.trim());
        })
    })
}

module.exports = {
    getSettings,
    saveSettings,
    getCurrentZone,
    getCurrentVersion,
}