import { db } from "../../models/db";
import { paymentMethod } from "../../models/schema";
import { Seed } from "../runner";
import { sql } from "drizzle-orm";

const defaultPaymentMethods = [
    {
        name: "Cash",
        description: "Pay with cash at the office",
        logo: "/assets/payments/cash.png",
        isActive: true,
        feeStatus: false,
        feeAmount: 0,
    },
    {
        name: "Credit Card",
        description: "Pay with Visa, Mastercard, or other credit cards",
        logo: "/assets/payments/credit-card.png",
        isActive: true,
        feeStatus: true,
        feeAmount: 2.5,
    },
    {
        name: "Bank Transfer",
        description: "Direct bank transfer to our account",
        logo: "/assets/payments/bank-transfer.png",
        isActive: true,
        feeStatus: false,
        feeAmount: 0,
    },
    {
        name: "Mobile Wallet",
        description: "Pay using mobile wallet services",
        logo: "/assets/payments/mobile-wallet.png",
        isActive: true,
        feeStatus: true,
        feeAmount: 1.5,
    },
];

const seed: Seed = {
    name: "06_payment_methods",

    async run() {
        console.log("   📝 Inserting payment methods...");

        for (const method of defaultPaymentMethods) {
            await db.insert(paymentMethod).values({
                name: method.name,
                description: method.description,
                logo: method.logo,
                isActive: method.isActive,
                feeStatus: method.feeStatus,
                feeAmount: method.feeAmount,
            });
        }

        console.log(
            `   📝 Inserted ${defaultPaymentMethods.length} payment methods`
        );
    },

    async rollback() {
        await db.delete(paymentMethod).where(sql`1=1`);
    },
};

export default seed;
