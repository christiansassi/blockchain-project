const { execSync } = require("child_process");

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function clearScreen() {
    try { 
        execSync(process.platform === "win32" ? "cls" : "clear", { stdio: "inherit" }); 
    } catch {

    }
}

if (require.main === module) {
    clearScreen();
}

module.exports = {sleep, clearScreen};