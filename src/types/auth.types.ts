export interface LoginData {
    device_code: string;
    verification_uri: string;
    user_code: string;
    interval: number;

    username: string;
}

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    avatar_url: string;
}

export type LoginRequest = {
    status: string;
    message: string;
    data: LoginData;
    tokens?: {
        access_token: string;
        refresh_token: string;
    };
};