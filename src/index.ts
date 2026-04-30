#!/usr/bin/env node
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import Yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { configDotenv } from "dotenv";
import open from "open";
import AuthAPI from "./api";    
import { LoginRequest } from "./types/auth.types";
import { TokenStore } from "./util/store-tokens.utils";

configDotenv({ quiet: true });

Yargs(hideBin(process.argv))
    .command("login", "Log in to the system",
        () => {},
        async () => {
            const token = await AuthAPI.getDeviceCode();

            console.log("Please enter the following code in your browser: ", token.data.user_code);
            console.error("Openning Web Browser...");

            await open(token.data.verification_uri);

            const { access_token, refresh_token, data } = await AuthAPI.login(token.data.interval, token.data.device_code) as LoginRequest;

            await TokenStore(access_token, refresh_token)
            
            console.log("Logged in as ", data.username);
        }
    )
    .command("logout", "Log out of the system",
        () => {},
        async () => {
            const tokens = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".insighta", "credentials.json"), "utf8"));

            await AuthAPI.logout(tokens.access_tokens);

            console.log("You have been logged out.");
        }
    )
    .command("whoami", "Check current logged in user",
        () => {},
        async () => {
            const { access_token, refresh_token} = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".insighta", "credentials.json"), "utf8"));

            const { status, access_token: new_access, refresh_token: new_refresh, data } = await AuthAPI.whoami(access_token, refresh_token) as LoginRequest;

            if (!data || status === "error") {
                return console.log("Session Expired please Login");
            }

            await TokenStore(new_access, new_refresh);

            return console.log("Logged in as @", data.username);
        }
    )
    .command("profiles", "Manage profiles query",
        (yargs) => (
            yargs.command("list", "List all profiles",
                (yargs) => (
                    yargs
                    .option("gender", {
                        alias: "g",
                        type: "string",
                        choices: ["male", "female"],
                        describe: "Enable verbose output"
                    })
                    .option("country", {
                        alias: "a",
                        type: "string",
                        describe: "Enable verbose output",
                    })
                    .option("age-group", {
                        alias: "ag",
                        type: "string",
                        choices: ["child", "teenager", "adult", "senior"],
                        describe: "Enable verbose output"
                    })
                    .option("min-age", {
                        type: "string",
                        describe: ""
                    })
                    .option("max-age", {
                        type: "string",
                        describe: ""
                    })
                    .option("sort-by", {
                        type: "string",
                        describe: ""
                    })
                    .option("order", {
                        type: "string",
                        describe: ""
                    })
                    .option("page", {
                        type: "string"
                    })
                    .option("limit", {
                        type: "string"
                    })
                ),
                async (argv) => {
                    try {
                        const tokens = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".insighta", "credentials.json"), "utf8"));

                        const query = new URLSearchParams();

                        if (argv.gender) {
                            query.append("gender", argv.gender);
                        }

                        if (argv.country) {
                            query.append("age_group", argv.country);
                        }

                        if (argv["age-group"]) {
                            query.append("age_group", argv["age-group"]);
                        }

                        if (argv["min-age"]) {
                            query.append("min_age", argv["min-age"]);
                        }

                        if (argv["min-age"]) {
                            query.append("max_age", argv["min-age"]);
                        }

                        if (argv["sort-by"]) {
                            query.append("country", argv["sort-by"]);
                        }

                        if (argv.order) {
                            query.append("country", argv.order);
                        }

                        if (argv.page) {
                            query.append("page", argv.page);
                        }

                        if (argv.limit) {
                            query.append("limit", argv.limit);
                        }
                        
                        let reqt;

                        if (argv) {
                            reqt = await fetch(`${process.env.API_URL}/api/profiles?${query}`, {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${tokens.access_token}`,
                                    "Content-Type": "application/json"
                                }
                            })
                        } else {
                            reqt = await fetch(`${process.env.API_URL}/api/profiles`, {
                                method: "GET",
                                headers: {
                                    Authorization: `Bearer ${tokens.access_token}`,
                                    "Content-Type": "application/json"
                                }
                            })
                        }

                        if (!reqt?.ok) {
                            throw new Error(`${reqt?.statusText}`);
                        }
                        
                        const profiles = await reqt.json();

                        console.log("Listing all profiles...");

                        console.log(profiles);
                    } catch (error) {
                        console.error("Error occurred while reading credentials:", error);
                    }
                }
            )
            .command("get <id>", "Get a specific profile",
                (yargs) => (
                    yargs.positional("id", {
                        describe: "The ID of the profile to get"
                    })
                ),
                async (argv) => {
                    try {
                        const tokens = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".insighta", "credentials.json"), "utf8"));
                        const reqt = await fetch(`${process.env.API_URL}/api/profiles/${argv.id}`, {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${tokens.access_token}`,
                                "Content-Type": "application/json"
                            }
                        });
                        if (!reqt.ok) {
                            throw new Error(`Failed to fetch profile: ${reqt.statusText}`);
                        }
                        const { data } = await reqt.json() as LoginRequest;

                        console.log("Getting specific profile...");

                        console.log(data);
                    } catch (error) {
                        console.error("Error occurred while reading credentials:", error);
                    }
                }
            )
            .command("search", "Search for profiles",
                (yargs) => (
                    yargs.positional("q", {
                        describe: "The search query"
                    })
                ),
                async (argv) => {
                    try {
                        // const tokens = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".insighta", "credentials.json"), "utf8"));
                        const reqt = await fetch(`${process.env.API_URL}/api/profiles/search?q=${argv.q}`)
                        if (!reqt.ok) {
                            throw new Error(`Failed to fetch profile: ${reqt.statusText}`);
                        }
                        const { data } = await reqt.json() as { data: <T>() => Array<T> };

                        console.log("Searching for profiles...");

                        console.log(data.length);
                    } catch (error) {
                        console.error("Error occurred while reading credentials:", error);
                    }
                }
            )
            .command("create", "Create a new profile",
                (yargs) => (
                    yargs
                    .option("name", {
                        alias: "n",
                        type: "string",
                        describe: "the name to genderize"
                    })
                ),
                async (argv) => {
                    try {
                        const tokens = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".insighta", "credentials.json"), "utf8"));

                        const reqt = await fetch(`${process.env.API_URL}/api/profiles`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${tokens.access_token}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({name: argv.name})
                        })

                        const data = await reqt.json() as LoginRequest;

                        if (data.status === "error") {
                            console.error(data.message)
                            return;
                        }

                        console.log("Creating new profile...");

                        console.log(data);
                    } catch (error) {
                        console.error("Error occurred while reading credentials:", error);
                    }
                }
            )
            .command("export", "Export profiles",
                (yargs) => (
                    yargs
                    .positional("q", {
                        describe: "query"
                    })
                ),
                async (argv) => {
                    try {
                    const tokens = JSON.parse(fs.readFileSync(path.join(os.homedir(), ".insighta", "credentials.json"), "utf8"));

                        const reqt = await fetch(`${process.env.API_URL}/api/profiles/export?q=${argv.q}`, {
                            method: "GET",
                            headers: {
                                Authorization: `Bearer ${tokens.access_token}`,
                                "Content-Type": "text/csv"
                            }
                        })

                        const data = await reqt.json() as LoginRequest;

                        if (data.status === "error") {
                            console.error(data.message)
                            return;
                        }

                        console.log("Exporting profiles...");

                        console.log(data);
                    } catch (error) {
                        console.error("Error occurred while reading credentials:", error);
                    }
                }
            )           
        ),
    )
    .help()
    .parse();




    // return yargs.option("username", {
    //         alias: "u",
    //         describe: "Your username"
    //     }).option("password", {
    //         alias: "p",
    //         describe: "Your password"
    //     });
    // })