export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
    user: {
        id: number;
        name: string;
        email: string;
        roles: string[];
    };
    token: string;
}   
