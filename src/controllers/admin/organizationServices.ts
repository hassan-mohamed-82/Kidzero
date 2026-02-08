import { Request, Response } from "express";
import { db } from "../../models/db";
import { eq, and } from "drizzle-orm";
import { organizationServices } from "../../models/schema";
import { SuccessResponse } from "../../utils/response";
import { BadRequest } from "../../Errors/BadRequest";

export const getOrganizationServices = async (req: Request, res: Response) => {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization Id is required");
    }
    const services = await db.select().from(organizationServices).where(eq(organizationServices.organizationId, organizationId));
    return SuccessResponse(res, { message: "Organization Services Fetched Successfully", data: services }, 200);
};

export const getOrganizationServicebyId = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest("Organization Service Id is required");
    }
    if (!organizationId) {
        throw new BadRequest("Organization Id is required");
    }
    const service = await db.select().from(organizationServices).where(and(eq(organizationServices.id, id), eq(organizationServices.organizationId, organizationId)));
    return SuccessResponse(res, { message: "Organization Service Fetched Successfully", data: service }, 200);
}

export const deleteOrganizationService = async (req: Request, res: Response) => {
    const { id } = req.params;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest("Organization Service Id is required");
    }
    if (!organizationId) {
        throw new BadRequest("Organization Id is required");
    }
    const orgservice = await db.select().from(organizationServices).where(and(eq(organizationServices.id, id), eq(organizationServices.organizationId, organizationId)));
    if (!orgservice) {
        throw new BadRequest("Organization Service Not Found");
    }
    await db.delete(organizationServices).where(eq(organizationServices.id, id));
    return SuccessResponse(res, { message: "Organization Service Deleted Successfully" }, 200);
}

export const createOrganizationService = async (req: Request, res: Response) => {
    const { serviceName, serviceDescription, useZonePricing, servicePrice, allowInstallments, maxInstallmentDates, earlyPaymentDiscount, latePaymentFine, dueDay } = req.body;
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
        throw new BadRequest("Organization Id is required");
    }
    if (allowInstallments) {
        if (!maxInstallmentDates) {
            throw new BadRequest("Max Installment Dates is required");
        }
        if (!dueDay) {
            throw new BadRequest("Due Day is required");
        }
    }
    if (!serviceName) {
        throw new BadRequest("Service Name is required");
    }
    if (!serviceDescription) {
        throw new BadRequest("Service Description is required");
    }
    // Validate useZonePricing is provided and is a boolean
    if (typeof useZonePricing !== 'boolean') {
        throw new BadRequest("useZonePricing must be true or false");
    }

    // If not using zone pricing, servicePrice is required
    if (!useZonePricing && !servicePrice) {
        throw new BadRequest("Service Price is required when not using zone pricing");
    }

    await db.insert(organizationServices).values({
        organizationId,
        serviceName,
        serviceDescription,
        useZonePricing,
        servicePrice: useZonePricing ? 0 : servicePrice,
        allowInstallments,
        maxInstallmentDates,
        earlyPaymentDiscount,
        latePaymentFine,
        dueDay,
    });

    return SuccessResponse(res, { message: "Organization Service Created Successfully" }, 201);
};

export const updateOrganizationService = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { serviceName, serviceDescription, useZonePricing, servicePrice, allowInstallments, maxInstallmentDates, earlyPaymentDiscount, latePaymentFine, dueDay } = req.body;
    const organizationId = req.user?.organizationId;
    if (!id) {
        throw new BadRequest("Organization Service Id is required");
    }
    if (!organizationId) {
        throw new BadRequest("Organization Id is required");
    }
    // If not using zone pricing, servicePrice is required
    if (!useZonePricing && !servicePrice) {
        throw new BadRequest("Service Price is required when not using zone pricing");
    }
    const orgService = await db.query.organizationServices.findFirst({
        where: and(eq(organizationServices.id, id), eq(organizationServices.organizationId, organizationId)),
    })
    if (!orgService) {
        throw new BadRequest("Organization Service Not Found");
    }
    if (allowInstallments) {
        if (!maxInstallmentDates) {
            throw new BadRequest("Max Installment Dates is required");
        }
        if (!dueDay) {
            throw new BadRequest("Due Day is required");
        }
    }
    if (!serviceName) {
        throw new BadRequest("Service Name is required");
    }
    if (!serviceDescription) {
        throw new BadRequest("Service Description is required");
    }
    // Validate useZonePricing is provided and is a boolean
    if (typeof useZonePricing !== 'boolean') {
        throw new BadRequest("useZonePricing must be true or false");
    }

    // If not using zone pricing, servicePrice is required
    if (!useZonePricing && !servicePrice) {
        throw new BadRequest("Service Price is required when not using zone pricing");
    }

    await db.update(organizationServices).set({
        serviceName: serviceName || orgService.serviceName,
        serviceDescription: serviceDescription || orgService.serviceDescription,
        useZonePricing: useZonePricing ?? orgService.useZonePricing,
        servicePrice: useZonePricing ? 0 : servicePrice || orgService.servicePrice,
        allowInstallments: allowInstallments ?? orgService.allowInstallments,
        maxInstallmentDates: maxInstallmentDates ?? orgService.maxInstallmentDates,
        earlyPaymentDiscount: earlyPaymentDiscount ?? orgService.earlyPaymentDiscount,
        latePaymentFine: latePaymentFine ?? orgService.latePaymentFine,
        dueDay: dueDay ?? orgService.dueDay,
    }).where(and(eq(organizationServices.id, id), eq(organizationServices.organizationId, organizationId)));

    return SuccessResponse(res, { message: "Organization Service Updated Successfully" }, 200);
};
