
export interface User {
    merchant_id: string;
    userName: string;
    email: string
    password: string;

}

export interface loginUserDetails {
    email: string,
    password: string,

}

export interface loggedUser {
    merchant_id: string,
    userName: string;
    email: string,
    password: string,
    isAdmin: boolean,
    isWelcomed: boolean,
    isDeleted: boolean

}