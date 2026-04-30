import os from "node:os";
import path from "node:path";
import fs from "node:fs";

export default class TokenStore {
    private static token_store: string;

    static {
        this.token_store = path.join(os.homedir(), ".insighta", "credentials.json");
    }

    static async store(status: string, access_token: string, refresh_token: string) {
        if (status === "error") {
            console.log("Login failed or was cancelled.");
            return;
        } else {
            fs.mkdirSync(path.dirname(this.token_store), { recursive: true });

            fs.writeFileSync(this.token_store, JSON.stringify({ access_token, refresh_token }));
            return;
        }
    }

    static async clear() {
        fs.unlinkSync(this.token_store);
    }
}