const { execSync } = require("child_process");
const args = JSON.stringify({ clerkId: "user_3AQBIQ9tpPwgqqJXF6mnIOpLiyp" });
console.log("Running migration with args:", args);
try {
    const result = execSync(`npx convex run users:fixLocationData "${args.replace(/"/g, '\\"')}"`, {
        cwd: "d:\\Align_Final",
        encoding: "utf8",
        stdio: "pipe"
    });
    console.log("Result:", result);
} catch (e) {
    console.error("Error:", e.stderr || e.message);
    console.error("stdout:", e.stdout);
}
