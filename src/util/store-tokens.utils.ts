import os from "node:os";
import path from "node:path";
import fs from "node:fs";

export const TokenStore = async (access_token: string, refresh_token: string) => {
    if (!access_token && !refresh_token) {
        console.log("Login failed or was cancelled.");
    } else {
        const token_store = path.join(os.homedir(), ".insighta", "credentials.json");

        fs.mkdirSync(path.dirname(token_store), { recursive: true });

        fs.writeFileSync(token_store, JSON.stringify({ access_token, refresh_token}));
    }
}