const db = require('../database');

function getSettings() {
    return new Promise(resolve => {
        db.query("SELECT * FROM settings", (err, settings) => {
            if(err) console.error(err);
            resolve(settings[0])
        }) 
    })
}

function saveSettings(company_name, company_logo, company_banner) {
    return new Promise(resolve => {
        db.query("UPDATE settings SET company_name = ?, company_logo = ?, company_banner = ?", [company_name, company_logo, company_banner], (err) => {
            if(err) console.error(err);
            resolve()
        }) 
    })
}

module.exports = {
    getSettings,
    saveSettings,
}