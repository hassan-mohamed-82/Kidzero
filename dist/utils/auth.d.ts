import { TokenPayload } from "../types/custom";
import "dotenv/config";
export declare const generateSuperAdminToken: (data: {
    id: string;
    name: string;
}) => string;
export declare const generateOrganizationToken: (data: {
    id: string;
    name: string;
}) => string;
export declare const generateParentToken: (data: {
    id: string;
    name: string;
    organizationId: string;
}) => string;
export declare const generateDriverToken: (data: {
    id: string;
    name: string;
    organizationId: string;
}) => string;
export declare const generateCoDriverToken: (data: {
    id: string;
    name: string;
    organizationId: string;
}) => string;
export declare const verifyToken: (token: string) => TokenPayload;
