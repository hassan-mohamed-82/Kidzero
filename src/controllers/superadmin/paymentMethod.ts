import { Request, Response } from 'express';
import { db } from '../../models/db';
import { SuccessResponse } from '../../utils/response';
import { paymentMethod } from '../../models/schema';
import { eq } from 'drizzle-orm';
import { BadRequest } from '../../Errors/BadRequest';
import { saveBase64Image } from "../../utils/handleImages";

const BASE64_IMAGE_REGEX = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/;

const validateAndSaveLogo = async (req: Request, logo: string): Promise<string> => {
    if (!logo.match(BASE64_IMAGE_REGEX)) {
        throw new BadRequest("Invalid logo format. Must be a base64 encoded image (JPEG, PNG, GIF, or WebP)");
    }
    try {
        const logoData = await saveBase64Image(req, logo, 'paymentMethods');
        return logoData.url;
    } catch (error: any) {
        throw new BadRequest(`Failed to save logo: ${error.message}`);
    }
};

export const getAllPaymentMethods = async (req: Request, res: Response) => {
    // const paymentMethods = await db.query.paymentMethod.findMany();
    const paymentMethods = await db.select().from(paymentMethod).where(eq(paymentMethod.isActive, true));
    return SuccessResponse(res, { paymentMethods }, 200);
};

export const getPaymentMethodById = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Payment Method ID is required");
    }
    const paymentMethodRecord = await db.query.paymentMethod.findFirst({
        where: eq(paymentMethod.id, id),
    });
    if (!paymentMethodRecord) {
        throw new BadRequest("Payment Method not found");
    }
    return SuccessResponse(res, { paymentMethod: paymentMethodRecord }, 200);
};

export const createPaymentMethod = async (req: Request, res: Response) => {
    const { name, description, logo, is_active, fee_status, fee_amount } = req.body;
    if (!name || !logo || is_active === undefined || fee_status === undefined) {
        throw new BadRequest("Missing required fields");
    }
    let feeAmountNumber: number;
    const logoUrl = await validateAndSaveLogo(req, logo);
    if (fee_status == true) {
        if (isNaN(fee_amount) || fee_amount < 0) {
            throw new BadRequest("Invalid fee amount");
        } else {
            feeAmountNumber = Number(fee_amount);
        }
    } else {
        feeAmountNumber = 0;
    }
    await db.insert(paymentMethod).values({
        name,
        description,
        logo: logoUrl,
        isActive: is_active,
        feeStatus: fee_status,
        feeAmount: feeAmountNumber,
    });
    return SuccessResponse(res, { message: "Payment method created successfully" }, 201);
};

export const updatePaymentMethod = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Payment Method ID is required");
    }
    const { name, description, logo, is_active, fee_status, fee_amount } = req.body;

    const existingPaymentMethod = await db.query.paymentMethod.findFirst({
        where: eq(paymentMethod.id, id),
    });

    if (!existingPaymentMethod) {
        throw new BadRequest("Payment Method not found");
    }
    const logoUrl = await validateAndSaveLogo(req, logo);

    let feeAmountNumber: number;
    if (fee_status) {
        if (isNaN(fee_amount) || fee_amount < 0) {
            throw new BadRequest("Invalid fee amount");
        } else {
            feeAmountNumber = Number(fee_amount);
        }
    } else {
        feeAmountNumber = existingPaymentMethod.feeAmount;
    }
    await db.update(paymentMethod).set({
        name: name || existingPaymentMethod.name,
        description: description || existingPaymentMethod.description,
        logo: logoUrl || existingPaymentMethod.logo,
        isActive: is_active ?? existingPaymentMethod.isActive,
        feeStatus: fee_status ?? existingPaymentMethod.feeStatus,
        feeAmount: fee_amount ?? existingPaymentMethod.feeAmount,
    }).where(eq(paymentMethod.id, id));
    return SuccessResponse(res, { message: "Payment method updated successfully" }, 200);
};

export const deletePaymentMethod = async (req: Request, res: Response) => {
    const { id } = req.params;
    if (!id) {
        throw new BadRequest("Payment Method ID is required");
    }
    const existingPaymentMethod = await db.query.paymentMethod.findFirst({
        where: eq(paymentMethod.id, id),
    });
    if (!existingPaymentMethod) {
        throw new BadRequest("Payment Method not found");
    }
    await db.delete(paymentMethod).where(eq(paymentMethod.id, id));
    return SuccessResponse(res, { message: "Payment method deleted successfully" }, 200);
};