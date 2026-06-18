import { WebSocket } from "ws";
import readline from "readline";
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}
async function main() {
    const chain = await question("Enter chain (e.g., eth, bsc): ");
    const txHash = await question("Enter tx_hash: ");

    const url = `ws://localhost:7788/ws/tx-status?chain=${chain}&tx_hash=${txHash}`;
    console.log(`Connecting to ${url}...`);

    const ws = new WebSocket(url);

    ws.on("open", () => {
        console.log("Connected!");
    });

    ws.on("message", (data) => {
        console.log("Status:", data.toString());
    });

    ws.on("close", () => {
        console.log("Connection closed");
        rl.close();
    });

    ws.on("error", (err) => {
        console.error("Error:", err);
        rl.close();
    });
}
main();
