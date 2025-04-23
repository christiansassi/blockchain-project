const { spawn } = require("child_process");
const net = require("net");

function waitForPort(port, host = "127.0.0.1", timeout = 10000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        function check() {
            const socket = net.connect(port, host);
            socket.on("connect", () => {
                socket.end();
                resolve();
            });
            socket.on("error", () => {
                if (Date.now() - start > timeout) return reject("Node not up");
                setTimeout(check, 200);
            });
        }
        check();
    });
}

const node = spawn("npx hardhat node", {
    shell: true,
    stdio: "ignore",
    detached: true,
});

node.unref();

waitForPort(8545)
    .then(() => {
        spawn("npx hardhat test ./tests/tests.js", {
            shell: true,
            stdio: "inherit",
        });
    })
    .catch((err) => {
        try {
            process.kill(-node.pid);
        } catch (_) {}
        process.exit(1); // Exit with an error code
    });
