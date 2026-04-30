import os from "node:os";
import path from "node:path";
import fs from "node:fs";

export default class TokenStore {
    private static token_store: string;

    static {
        this.token_store = path.join(os.homedir(), ".insighta", "credentials.json");
    }

    static async store(access_token: string, refresh_token: string) {
        if (!access_token && !refresh_token) {
            console.log("Login failed or was cancelled.");
        } else {
            fs.mkdirSync(path.dirname(this.token_store), { recursive: true });

            fs.writeFileSync(this.token_store, JSON.stringify({ access_token, refresh_token }));
        }
    }

    static async clear() {
        fs.unlinkSync(this.token_store);
    }
}