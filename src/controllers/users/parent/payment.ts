import {
    parentPayment,
    parentPlans,
    paymentMethod,
    organizationServices,
    zones,
    parentPaymentOrgServices,
    students,
    parentServicesSubscriptions,
    servicePaymentInstallments,
    parentPaymentInstallments,
    parents
} from "../../../models/schema";
import { db } from "../../../models/db";
import { eq, and, inArray } from "drizzle-orm";
import { Request, Response } from "express";
import { SuccessResponse } from "../../../utils/response";
import { BadRequest } from "../../../Errors/BadRequest";
import { saveBase64Image } from "../../../utils/handleImages";
import { NotFound } from "../../../Errors/NotFound";

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
    const { ServiceId, paymentMethodId, amount, receiptImage, studentId, paymentType, numberOfInstallments } = req.body;

    if (!ServiceId || !paymentMethodId || !amount || !receiptImage || !studentId) {
        throw new BadRequest("ServiceId, paymentMethodId, amount, receiptImage and studentId are required");
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

    // Calculate Base Cost
    let serviceCost;
    if (orgService.useZonePricing === true) {
        if (!zoneId) {
            throw new BadRequest("Zone ID is required for this service");
        }
        const zone = await db.query.zones.findFirst({ where: eq(zones.id, zoneId), });
        if (!zone) {
            throw new BadRequest("Zone Not Found");
        }
        serviceCost = zone.cost;
    } else {
        serviceCost = orgService.servicePrice;
    }

    if (paymentType !== 'onetime' && paymentType !== 'installment') {
        throw new BadRequest("Invalid payment type");
    }

    const type = paymentType || 'onetime';
    let installments = 1;

    if (type === 'installment') {
        if (!orgService.allowInstallments) {
            throw new BadRequest("This service does not support installments");
        }
        if (!numberOfInstallments || numberOfInstallments > (orgService.maxInstallmentDates || 12)) {
            throw new BadRequest(`Invalid number of installments. Max allowed: ${orgService.maxInstallmentDates}`);
        }
        installments = numberOfInstallments;
    }

    const installmentAmount = serviceCost / installments; // Example 1000/4 = 250 every time he must pays this amount

    let requiredAmount = installmentAmount;
    if (type === 'onetime') {
        requiredAmount = serviceCost;
    }

    let totalRequired = requiredAmount;
    if (payMethod.feeStatus === true) {
        if (payMethod.feeAmount < 0) {
            throw new BadRequest("Invalid payment method fee amount");
        }
        totalRequired += payMethod.feeAmount;
    }

    if (amount < totalRequired) {
        throw new BadRequest(`Amount must be at least ${totalRequired} (Service: ${requiredAmount} + Fees: ${payMethod.feeAmount || 0})`);
    }

    // 7. Save Receipt & Create Payment Record
    let receiptImageUrl: string | null = null;
    if (receiptImage) {
        const savedImage = await saveBase64Image(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }
    if (!receiptImageUrl) {
        throw new BadRequest("Failed to process receipt image");
    }

    const transactionId = crypto.randomUUID();
    await db.insert(parentPaymentOrgServices).values({
        id: transactionId,
        parentId: user,
        studentId: studentId,
        serviceId: ServiceId,
        type,
        requestedInstallments: installments,
        paymentMethodId,
        organizationId: StudentOrganizationId,
        amount,
        receiptImage: receiptImageUrl || "",
        status: "pending",
        rejectedReason: null,
    });

    return SuccessResponse(res, { message: "Payment created successfully awaiting admin approval", transactionId }, 201);
};

export const payServiceInstallment = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) throw new BadRequest("User not Logged In");

    const { installmentId, paymentMethodId, receiptImage, paidAmount } = req.body;
    if (!installmentId || !paymentMethodId || !receiptImage || !paidAmount) throw new BadRequest("All fields required");

    const installment = await db.query.servicePaymentInstallments.findFirst({ where: eq(servicePaymentInstallments.id, installmentId) });
    if (!installment) throw new NotFound("Installment not found");

    if (installment.status === 'paid') throw new BadRequest("Installment already paid");

    const subscription = await db.query.parentServicesSubscriptions.findFirst({ where: eq(parentServicesSubscriptions.id, installment.subscriptionId) });
    if (!subscription) throw new NotFound("Subscription not found");

    const service = await db.query.organizationServices.findFirst({ where: eq(organizationServices.id, subscription.serviceId) });
    if (!service) throw new NotFound("Service not found");

    const payMethod = await db.query.paymentMethod.findFirst({ where: eq(paymentMethod.id, paymentMethodId) });
    if (!payMethod) throw new NotFound("Payment Method not found");

    let InstallmentRequiredAmount = installment.amount;
    if (paidAmount > InstallmentRequiredAmount) {
        throw new BadRequest(`Paid amount is greater than installment amount, remaining amount is ${InstallmentRequiredAmount - paidAmount}`);
    }
    let NumberOfInstallmentsRequested = installment.numberOfInstallmentsRequested;
    let NumberOfInstallmentsPaid = installment.numberOfInstallmentsPaid;
    if (NumberOfInstallmentsPaid >= NumberOfInstallmentsRequested) {
        throw new BadRequest(`Number of installments paid is greater than number of installments requested`);
    }
    if (NumberOfInstallmentsPaid == (NumberOfInstallmentsRequested - 1)) {
        if (paidAmount < installment.amount) {
            throw new BadRequest(`Paid amount is less than installment amount, You must pay the remaining amount in the last installment`);
        }
    }
    // Send the Request to the Admin to accept it
    await db.insert(parentPaymentInstallments).values({
        installmentId,
        paymentMethodId,
        receiptImage,
        paidAmount,
        parentId: user,
    });

    return SuccessResponse(res, { message: "Payment submitted for approval" }, 200);
};

export const getparentPaymentOrgServicebyId = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) throw new BadRequest("User not Logged In");

    const { id } = req.params;
    if (!id) throw new BadRequest("Payment ID is required");

    const payment = await db.query.parentPaymentOrgServices.findFirst({ where: eq(parentPaymentOrgServices.id, id) });
    if (!payment) throw new NotFound("Payment not found");

    return SuccessResponse(res, { payment }, 200);
};

export const getparentInstallments = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) throw new BadRequest("User not Logged In");
    const parent = await db.query.parents.findFirst({ where: eq(parents.id, user) });
    if (!parent) throw new NotFound("Unauthorized Access");

    // Get ALL subscriptions for the parent (not just the first one)
    const subscriptions = await db.query.parentServicesSubscriptions.findMany({
        where: eq(parentServicesSubscriptions.parentId, parent.id)
    });

    if (subscriptions.length === 0) {
        return SuccessResponse(res, { installments: [] }, 200);
    }

    // Get installments for ALL subscriptions
    const subscriptionIds = subscriptions.map(sub => sub.id);
    const installments = await db.query.servicePaymentInstallments.findMany({
        where: inArray(servicePaymentInstallments.subscriptionId, subscriptionIds)
    });

    return SuccessResponse(res, { installments }, 200);
};

export const getparentInstallmentById = async (req: Request, res: Response) => {
    const user = req.user?.id;
    if (!user) throw new BadRequest("User not Logged In");

    const { id } = req.params;
    if (!id) throw new BadRequest("Installment ID is required");

    const parent = await db.query.parents.findFirst({ where: eq(parents.id, user) });
    if (!parent) throw new NotFound("Unauthorized Access");

    // Get the installment
    const installment = await db.query.servicePaymentInstallments.findFirst({
        where: eq(servicePaymentInstallments.id, id)
    });
    if (!installment) throw new NotFound("Installment not found");

    // Verify the parent owns this installment's subscription
    const subscription = await db.query.parentServicesSubscriptions.findFirst({
        where: and(
            eq(parentServicesSubscriptions.id, installment.subscriptionId),
            eq(parentServicesSubscriptions.parentId, parent.id)
        )
    });
    if (!subscription) throw new BadRequest("Unauthorized Access to Installment");

    return SuccessResponse(res, { installment }, 200);
};
