export declare const generateToken: (user: any) => string;
export declare const verifyToken: (token: string) => {
    id: any;
    name: any;
    role: any;
};
