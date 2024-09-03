const { execSync } = require("child_process");
try { execSync(process.platform === "win32" ? "cls" : "clear", { stdio: "inherit" }); } catch {}
