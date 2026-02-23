"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getparentInstallmentById = exports.getparentInstallments = exports.getparentPaymentOrgServicebyId = exports.payServiceInstallment = exports.createParentPaymentOrgService = exports.createParentPayment = exports.getParentPaymentbyId = exports.getParentPayments = void 0;
const schema_1 = require("../../../models/schema");
const db_1 = require("../../../models/db");
const drizzle_orm_1 = require("drizzle-orm");
const response_1 = require("../../../utils/response");
const BadRequest_1 = require("../../../Errors/BadRequest");
const handleImages_1 = require("../../../utils/handleImages");
const NotFound_1 = require("../../../Errors/NotFound");
const drizzle_orm_2 = require("drizzle-orm");
// get parent payments for logged in parent
const getParentPayments = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest_1.BadRequest("User not Logged In");
    }
    const payments = await db_1.db.query.parentPayment.findMany({ where: (0, drizzle_orm_1.eq)(schema_1.parentPayment.parentId, user), });
    // const orgServicePayments = await db.query.parentPaymentOrgServices.findMany({ where: eq(parentPaymentOrgServices.parentId, user), });
    const rows = await db_1.db.select({
        id: schema_1.parentPaymentOrgServices.id,
        parentId: schema_1.parentPaymentOrgServices.parentId,
        serviceId: schema_1.parentPaymentOrgServices.serviceId,
        paymentMethodId: schema_1.parentPaymentOrgServices.paymentMethodId,
        amount: schema_1.parentPaymentOrgServices.amount,
        receiptImage: schema_1.parentPaymentOrgServices.receiptImage,
        status: schema_1.parentPaymentOrgServices.status,
        rejectedReason: schema_1.parentPaymentOrgServices.rejectedReason,
        createdAt: schema_1.parentPaymentOrgServices.createdAt,
        updatedAt: schema_1.parentPaymentOrgServices.updatedAt,
        studentId: schema_1.students.id,
        studentName: schema_1.students.name,
        serviceName: schema_1.organizationServices.serviceName,
        useZonePrice: schema_1.organizationServices.useZonePricing,
        servicePrice: schema_1.organizationServices.servicePrice,
        studentZoneCost: schema_1.zones.cost,
        finalPrice: (0, drizzle_orm_2.sql) `
            CASE 
                WHEN ${schema_1.organizationServices.useZonePricing} = true THEN ${schema_1.zones.cost}
                ELSE ${schema_1.organizationServices.servicePrice}
            END`,
        paymentMethodName: schema_1.paymentMethod.name,
    }).from(schema_1.parentPaymentOrgServices)
        .leftJoin(schema_1.students, (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.studentId, schema_1.students.id))
        .leftJoin(schema_1.organizationServices, (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.serviceId, schema_1.organizationServices.id))
        .leftJoin(schema_1.paymentMethod, (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.paymentMethodId, schema_1.paymentMethod.id))
        .innerJoin(schema_1.zones, (0, drizzle_orm_1.eq)(schema_1.students.zoneId, schema_1.zones.id))
        .where((0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.parentId, user));
    const orgServicePayments = rows.map(row => ({
        id: row.id,
        parentId: row.parentId,
        serviceId: row.serviceId,
        paymentMethodId: row.paymentMethodId,
        amount: row.amount,
        receiptImage: row.receiptImage,
        status: row.status,
        rejectedReason: row.rejectedReason,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        student: {
            id: row.studentId,
            name: row.studentName,
        },
        service: {
            id: row.serviceId,
            name: row.serviceName,
            useZonePrice: row.useZonePrice,
            servicePrice: row.servicePrice,
            studentZoneCost: row.studentZoneCost,
            finalPrice: row.finalPrice
        },
        paymentMethod: {
            id: row.paymentMethodId,
            name: row.paymentMethodName,
        }
    }));
    return (0, response_1.SuccessResponse)(res, { message: "Payments retrieved successfully", payments, orgServicePayments }, 200);
};
exports.getParentPayments = getParentPayments;
const getParentPaymentbyId = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest_1.BadRequest("User not Logged In");
    }
    const { id } = req.params;
    const payment = await db_1.db.query.parentPayment.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.parentPayment.id, id),
    });
    if (payment?.parentId !== user) {
        throw new BadRequest_1.BadRequest("Unauthorized Access to Payment");
    }
    return (0, response_1.SuccessResponse)(res, { message: "Payment retrieved successfully", payment });
};
exports.getParentPaymentbyId = getParentPaymentbyId;
const createParentPayment = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest_1.BadRequest("User not Logged In");
    }
    const { planId, paymentMethodId, amount, receiptImage } = req.body;
    if (!planId || !paymentMethodId || !amount || !receiptImage) {
        throw new BadRequest_1.BadRequest("All fields are required");
    }
    const plan = await db_1.db.query.parentPlans.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.parentPlans.id, planId), });
    if (!plan) {
        throw new BadRequest_1.BadRequest("Plan Not Found");
    }
    const payMethod = await db_1.db.query.paymentMethod.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, paymentMethodId), });
    if (!payMethod) {
        throw new BadRequest_1.BadRequest("Payment Method Not Found");
    }
    // Save receipt image
    let receiptImageUrl = null;
    if (receiptImage) {
        const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }
    if (!receiptImageUrl) {
        throw new BadRequest_1.BadRequest("Failed to process receipt image");
    }
    await db_1.db.insert(schema_1.parentPayment).values({
        parentId: user,
        planId,
        paymentMethodId,
        amount,
        receiptImage: receiptImageUrl || "",
        status: "pending",
        rejectedReason: null,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Payment created successfully" }, 201);
};
exports.createParentPayment = createParentPayment;
const createParentPaymentOrgService = async (req, res) => {
    const user = req.user?.id;
    if (!user) {
        throw new BadRequest_1.BadRequest("User not Logged In");
    }
    const { ServiceId, paymentMethodId, amount, receiptImage, studentId, paymentType, numberOfInstallments } = req.body;
    if (!ServiceId || !paymentMethodId || !amount || !receiptImage || !studentId) {
        throw new BadRequest_1.BadRequest("ServiceId, paymentMethodId, amount, receiptImage and studentId are required");
    }
    const payMethod = await db_1.db.query.paymentMethod.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, paymentMethodId), });
    if (!payMethod) {
        throw new BadRequest_1.BadRequest("Payment Method Not Found");
    }
    const student = await db_1.db.query.students.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.students.id, studentId), });
    if (!student) {
        throw new BadRequest_1.BadRequest("Student Not Found");
    }
    const zoneId = student.zoneId;
    const StudentOrganizationId = student.organizationId;
    const orgService = await db_1.db.query.organizationServices.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.organizationServices.id, ServiceId), });
    if (!orgService) {
        throw new BadRequest_1.BadRequest("Organization Service Not Found");
    }
    // Calculate Base Cost
    let serviceCost;
    if (orgService.useZonePricing === true) {
        if (!zoneId) {
            throw new BadRequest_1.BadRequest("Zone ID is required for this service");
        }
        const zone = await db_1.db.query.zones.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.zones.id, zoneId), });
        if (!zone) {
            throw new BadRequest_1.BadRequest("Zone Not Found");
        }
        serviceCost = zone.cost;
    }
    else {
        serviceCost = orgService.servicePrice;
    }
    if (paymentType !== 'onetime' && paymentType !== 'installment') {
        throw new BadRequest_1.BadRequest("Invalid payment type");
    }
    const type = paymentType || 'onetime';
    let installments = 1;
    if (type === 'installment') {
        if (!orgService.allowInstallments) {
            throw new BadRequest_1.BadRequest("This service does not support installments");
        }
        if (!numberOfInstallments || numberOfInstallments > (orgService.maxInstallmentDates || 12)) {
            throw new BadRequest_1.BadRequest(`Invalid number of installments. Max allowed: ${orgService.maxInstallmentDates}`);
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
            throw new BadRequest_1.BadRequest("Invalid payment method fee amount");
        }
        totalRequired += payMethod.feeAmount;
    }
    if (amount < totalRequired) {
        throw new BadRequest_1.BadRequest(`Amount must be at least ${totalRequired} (Service: ${requiredAmount} + Fees: ${payMethod.feeAmount || 0})`);
    }
    // 7. Save Receipt & Create Payment Record
    let receiptImageUrl = null;
    if (receiptImage) {
        const savedImage = await (0, handleImages_1.saveBase64Image)(req, receiptImage, "payments/receipts");
        receiptImageUrl = savedImage.url;
    }
    if (!receiptImageUrl) {
        throw new BadRequest_1.BadRequest("Failed to process receipt image");
    }
    const transactionId = crypto.randomUUID();
    await db_1.db.insert(schema_1.parentPaymentOrgServices).values({
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
    return (0, response_1.SuccessResponse)(res, { message: "Payment created successfully awaiting admin approval", transactionId }, 201);
};
exports.createParentPaymentOrgService = createParentPaymentOrgService;
const payServiceInstallment = async (req, res) => {
    const user = req.user?.id;
    if (!user)
        throw new BadRequest_1.BadRequest("User not Logged In");
    const { installmentId, paymentMethodId, receiptImage, paidAmount } = req.body;
    if (!installmentId || !paymentMethodId || !receiptImage || !paidAmount)
        throw new BadRequest_1.BadRequest("All fields required");
    const installment = await db_1.db.query.servicePaymentInstallments.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.servicePaymentInstallments.id, installmentId) });
    if (!installment)
        throw new NotFound_1.NotFound("Installment not found");
    if (installment.status === 'paid')
        throw new BadRequest_1.BadRequest("Installment already paid");
    const subscription = await db_1.db.query.parentServicesSubscriptions.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.parentServicesSubscriptions.id, installment.subscriptionId) });
    if (!subscription)
        throw new NotFound_1.NotFound("Subscription not found");
    const service = await db_1.db.query.organizationServices.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.organizationServices.id, subscription.serviceId) });
    if (!service)
        throw new NotFound_1.NotFound("Service not found");
    const payMethod = await db_1.db.query.paymentMethod.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.paymentMethod.id, paymentMethodId) });
    if (!payMethod)
        throw new NotFound_1.NotFound("Payment Method not found");
    let InstallmentRequiredAmount = installment.amount;
    if (paidAmount > InstallmentRequiredAmount) {
        throw new BadRequest_1.BadRequest(`Paid amount is greater than installment amount, remaining amount is ${InstallmentRequiredAmount - paidAmount}`);
    }
    let NumberOfInstallmentsRequested = installment.numberOfInstallmentsRequested;
    let NumberOfInstallmentsPaid = installment.numberOfInstallmentsPaid;
    if (NumberOfInstallmentsPaid >= NumberOfInstallmentsRequested) {
        throw new BadRequest_1.BadRequest(`Number of installments paid is greater than number of installments requested`);
    }
    if (NumberOfInstallmentsPaid == (NumberOfInstallmentsRequested - 1)) {
        if (paidAmount < installment.amount) {
            throw new BadRequest_1.BadRequest(`Paid amount is less than installment amount, You must pay the remaining amount in the last installment`);
        }
    }
    // Send the Request to the Admin to accept it
    await db_1.db.insert(schema_1.parentPaymentInstallments).values({
        installmentId,
        paymentMethodId,
        receiptImage,
        paidAmount,
        parentId: user,
    });
    return (0, response_1.SuccessResponse)(res, { message: "Payment submitted for approval" }, 200);
};
exports.payServiceInstallment = payServiceInstallment;
const getparentPaymentOrgServicebyId = async (req, res) => {
    const user = req.user?.id;
    if (!user)
        throw new BadRequest_1.BadRequest("User not Logged In");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Payment ID is required");
    const payment = await db_1.db.query.parentPaymentOrgServices.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.parentPaymentOrgServices.id, id) });
    if (!payment)
        throw new NotFound_1.NotFound("Payment not found");
    return (0, response_1.SuccessResponse)(res, { payment }, 200);
};
exports.getparentPaymentOrgServicebyId = getparentPaymentOrgServicebyId;
const getparentInstallments = async (req, res) => {
    const user = req.user?.id;
    if (!user)
        throw new BadRequest_1.BadRequest("User not Logged In");
    const parent = await db_1.db.query.parents.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.parents.id, user) });
    if (!parent)
        throw new NotFound_1.NotFound("Unauthorized Access");
    // Get ALL subscriptions for the parent (not just the first one)
    const subscriptions = await db_1.db.query.parentServicesSubscriptions.findMany({
        where: (0, drizzle_orm_1.eq)(schema_1.parentServicesSubscriptions.parentId, parent.id)
    });
    if (subscriptions.length === 0) {
        return (0, response_1.SuccessResponse)(res, { installments: [] }, 200);
    }
    // Get installments for ALL subscriptions
    const subscriptionIds = subscriptions.map(sub => sub.id);
    const installments = await db_1.db.query.servicePaymentInstallments.findMany({
        where: (0, drizzle_orm_1.inArray)(schema_1.servicePaymentInstallments.subscriptionId, subscriptionIds)
    });
    return (0, response_1.SuccessResponse)(res, { installments }, 200);
};
exports.getparentInstallments = getparentInstallments;
const getparentInstallmentById = async (req, res) => {
    const user = req.user?.id;
    if (!user)
        throw new BadRequest_1.BadRequest("User not Logged In");
    const { id } = req.params;
    if (!id)
        throw new BadRequest_1.BadRequest("Installment ID is required");
    const parent = await db_1.db.query.parents.findFirst({ where: (0, drizzle_orm_1.eq)(schema_1.parents.id, user) });
    if (!parent)
        throw new NotFound_1.NotFound("Unauthorized Access");
    // Get the installment
    const installment = await db_1.db.query.servicePaymentInstallments.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.servicePaymentInstallments.id, id)
    });
    if (!installment)
        throw new NotFound_1.NotFound("Installment not found");
    // Verify the parent owns this installment's subscription
    const subscription = await db_1.db.query.parentServicesSubscriptions.findFirst({
        where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.parentServicesSubscriptions.id, installment.subscriptionId), (0, drizzle_orm_1.eq)(schema_1.parentServicesSubscriptions.parentId, parent.id))
    });
    if (!subscription)
        throw new BadRequest_1.BadRequest("Unauthorized Access to Installment");
    return (0, response_1.SuccessResponse)(res, { installment }, 200);
};
exports.getparentInstallmentById = getparentInstallmentById;
