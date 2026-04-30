import type { LoginRequest } from "./types/auth.types";
import TokenStore from "./util/tokens-store.utils";

export default class AuthAPI {
    static async getDeviceCode(): Promise<LoginRequest> {
        const reqt = await fetch(`${process.env.API_URL}/api/auth/github/device`, {
                method: "GET"
            })

            if (!reqt.ok) {
                throw new Error(`Failed to fetch device code: ${reqt.statusText}`);
            }

            return (await reqt.json()) as LoginRequest;
    }

    static async login(interval: number, device_code: string): Promise<LoginRequest | void> {
        const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        while (true) {
            await sleep(interval * 1000);

            const reqt2 = await fetch(`${process.env.API_URL}/api/auth/github/device/callback`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({device_code})
            });

            const resp2 = (await reqt2.json()) as LoginRequest;

            if (resp2.status === "authorization_pending") {
                console.log("Waiting for approval...");
                continue;
            }

            if (resp2.status === "slow_down") {
                console.log("Waiting for approval...");
                interval += 5;
                continue;
            }

            if (resp2.status === "expired_token") {
                console.log("Device code expired. Please try logging in again.");
                return;
            }

            if (resp2.status === "unsupported_grant_type") {
                console.log("Unsupported grant type. Please check your configuration.");
                return;
            }

            if (resp2.status === "incorrect_client_credentials") {
                console.log("Incorrect client credentials. Please check your configuration.");
                return;
            }

            if (resp2.status === "incorrect_device_code") {
                console.log("Incorrect device code. Please try again.");
                return;
            }

            if (resp2.status === "access_denied") {
                console.log("Access denied. Please try again.");
                return;
            }

            if (resp2.status === "device_flow_disabled") {
                console.log("Sorry, but device flow is disabled for this application.");
                return;
            }

            if (resp2.status === "success") {
                return resp2;
            }
        }
    }

    static async logout(access_token: string): Promise<void | LoginRequest> {
        // Implement logout logic here, such as clearing tokens or session data
        // const reqt = await fetch(`${process.env.API_URL}/api/auth/logout`, {
        //     method: "GET",
        //     headers: {
        //         "Authorization": `Bearer ${access_token}`,
        //         "Content-Type": "application/json"
        //     }
        // });

        // if (!reqt.ok) {
        //     throw new Error(`Failed to fetch user information: ${reqt.statusText}`);
        // }

        // return await reqt.json();

        await TokenStore.clear();
        return;
    }

    static async whoami(access_token: string, refresh_token: string) {
        const reqt = await fetch(`${process.env.API_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${access_token}`,
                "Content-Type": "application/json"
            }
        });

        if (!reqt.ok && reqt.status === 401) {
            const reqt2 = await fetch(`${process.env.API_URL}/api/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ refresh_token })
            })

            return await reqt2.json();            
        }

        return await reqt.json();
    }
}