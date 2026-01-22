import { parentPayment, parentPlans, paymentMethod, organizationServices, zones, parentPaymentOrgServices, students } from "../../../models/schema";
import { db } from "../../../models/db";
import { eq } from "drizzle-orm";
import { Request, Response } from "express";
import { SuccessResponse } from "../../../utils/response";
import { BadRequest } from "../../../Errors/BadRequest";
import { saveBase64Image } from "../../../utils/handleImages";
// get parent payments for logged in parent
export const getParentPayments = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest("User not Logged In");
    }
    const payments = await db.query.parentPayment.findMany({ where: eq(parentPayment.parentId, user), });
    const orgServicePayments = await db.query.parentPaymentOrgServices.findMany({ where: eq(parentPaymentOrgServices.parentId, user), });
    return SuccessResponse(res, { message: "Payments retrieved successfully", payments, orgServicePayments }, 200);
};


export const getParentPaymentbyId = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest("User not Logged In");
    }
    const { id } = req.params;
    const payment = await db.query.parentPayment.findFirst({
        where: eq(parentPayment.id, id),
    });
    if (payment?.parentId !== user) {
        throw new BadRequest("Unauthorized Access to Payment");
    }
    return SuccessResponse(res, { message: "Payment retrieved successfully", payment });
};

export const createParentPayment = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest("User not Logged In");
    }
    const { planId, paymentMethodId, amount, receiptImage } = req.body;
    if (!planId || !paymentMethodId || !amount || !receiptImage) {
        throw new BadRequest("All fields are required");
    }
    const plan = await db.query.parentPlans.findFirst({ where: eq(parentPlans.id, planId), });
    if (!plan) {
        throw new BadRequest("Plan Not Found");
    }
    const payMethod = await db.query.paymentMethod.findFirst({ where: eq(paymentMethod.id, paymentMethodId), });
    if (!payMethod) {
        throw new BadRequest("Payment Method Not Found");
    }
    // Save receipt image
    let receiptImageUrl: string | null = null;
    if (receiptImage) {
        const savedImage = await saveBase64Image(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }
    if (!receiptImageUrl) {
        throw new BadRequest("Failed to process receipt image");
    }

    await db.insert(parentPayment).values({
        parentId: user,
        planId,
        paymentMethodId,
        amount,
        receiptImage: receiptImageUrl || "",
        status: "pending",
        rejectedReason: null,
    });

    return SuccessResponse(res, { message: "Payment created successfully" }, 201);
};


export const createParentPaymentOrgService = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest("User not Logged In");
    }
    const { ServiceId, paymentMethodId, amount, receiptImage, studentId } = req.body;
    if (!ServiceId || !paymentMethodId || !amount || !receiptImage) {
        throw new BadRequest("All fields are required");
    }
    if (amount <= 0) {
        throw new BadRequest("Amount must be greater than zero");
    }
    const payMethod = await db.query.paymentMethod.findFirst({ where: eq(paymentMethod.id, paymentMethodId), });
    if (!payMethod) {
        throw new BadRequest("Payment Method Not Found");
    }

    const student = await db.query.students.findFirst({ where: eq(students.id, studentId), });
    if (!student) {
        throw new BadRequest("Student Not Found");
    }

    const zoneId = student.zoneId;
    const StudentOrganizationId = student.organizationId;

    
    const orgService = await db.query.organizationServices.findFirst({ where: eq(organizationServices.id, ServiceId), });

    if (!orgService) {
        throw new BadRequest("Organization Service Not Found");
    }
    let cost;

    if (orgService.useZonePricing === true) { // Use zone pricing

        if (!zoneId) {
            throw new BadRequest("Zone ID is required for this service");
        }
        const zone = await db.query.zones.findFirst({ where: eq(zones.id, zoneId), });
        if (!zone) {
            throw new BadRequest("Zone Not Found");
        }
        cost = zone.cost;
        if (payMethod.feeStatus === true) {
            if (payMethod.feeAmount < 0) {
                throw new BadRequest("Invalid payment method fee amount");
            }
            cost += payMethod.feeAmount;
        }
        if (amount < cost) {
            throw new BadRequest(`Amount must be at least ${cost}`);
        }
    } else { // Use standard pricing
        cost = orgService.servicePrice;
        if (payMethod.feeStatus === true) {
            if (payMethod.feeAmount < 0) {
                throw new BadRequest("Invalid payment method fee amount");
            }
            cost += payMethod.feeAmount;
        }
        if (amount < cost) {
            throw new BadRequest(`Amount must be at least ${cost}`);
        }
    }

    // Save receipt image
    let receiptImageUrl: string | null = null;
    if (receiptImage) {
        const savedImage = await saveBase64Image(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }
    if (!receiptImageUrl) {
        throw new BadRequest("Failed to process receipt image");
    }
    await db.insert(parentPaymentOrgServices).values({
        parentId: user,
        ServiceId,
        paymentMethodId,
        organizationId: StudentOrganizationId,
        amount,
        receiptImage: receiptImageUrl || "",
        status: "pending",
        rejectedReason: null,
    });
    return SuccessResponse(res, { message: "Payment created successfully" }, 201);
};
