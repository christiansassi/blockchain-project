const { execSync } = require("child_process");
const platform = process.platform;

try {
    if (platform === "win32") {

        execSync(`start cmd /k "python demo/demo.py && exit"`, { stdio: "inherit" });
        execSync(`start cmd /k "npx hardhat run utils/deploy.js && exit"`, { stdio: "inherit" });
        execSync(`start cmd /k "node utils/owner.js && exit"`, { stdio: "inherit" });

    } else if (platform === "darwin") {

        execSync(`osascript -e 'tell application "Terminal" to do script "python demo/demo.py"'`);
        execSync(`osascript -e 'tell application "Terminal" to do script "npx hardhat run utils/deploy.js"'`);
        execSync(`osascript -e 'tell application "Terminal" to do script "node utils/owner.js"'`);

    } else if (platform === "linux") {

        execSync(`gnome-terminal -- bash -c "python demo/demo.py; exec bash"`);
        execSync(`gnome-terminal -- bash -c "npx hardhat run utils/deploy.js; exec bash"`);
        execSync(`gnome-terminal -- bash -c "node utils/owner.js; exec bash"`);

    } else {
        console.error("Unsupported platform:", platform);
        return;
    }

    execSync('npx hardhat node', { stdio: "inherit" });

} catch (err) {
    console.error("Error launching terminals:", err.message);
}