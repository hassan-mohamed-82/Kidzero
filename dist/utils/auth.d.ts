import { TokenPayload } from "../types/custom";
import "dotenv/config";
export declare const generateSuperAdminToken: (data: {
    id: number;
    name: string;
}) => string;
export declare const generateOrganizationToken: (data: {
    id: number;
    name: string;
}) => string;
export declare const generateParentToken: (data: {
    id: number;
    name: string;
    organizationId: number;
}) => string;
export declare const generateDriverToken: (data: {
    id: number;
    name: string;
    organizationId: number;
}) => string;
export declare const generateCoDriverToken: (data: {
    id: number;
    name: string;
    organizationId: number;
}) => string;
export declare const verifyToken: (token: string) => TokenPayload;
