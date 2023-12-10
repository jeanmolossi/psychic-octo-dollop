import Stripe from "stripe";
import { Price, Product, Subscription } from "../supabase/supabase.types";
import db from "../supabase/db";
import { customers, prices, products, users } from "../../../migrations/schema";
import { stripe } from "./index";
import { eq } from "drizzle-orm";
import { toDateTime } from "../utils";
import { subscriptions } from "../supabase/schema";

export const upsertProductRecord = async (product: Stripe.Product) => {
    const {
        id,
        active,
        name,
        description = null,
        images,
        metadata
    } = product;

    const localProduct: Product = {
        id,
        active,
        description,
        image: images?.[0] || null,
        metadata,
        name
    }

    try {
        await db.insert(products)
            .values(localProduct)
            .onConflictDoUpdate({ target: products.id, set: localProduct })
    } catch (error) {
        console.log('upserProductRecord error', error)

        throw new Error('Some error occurs doing upsert');
    }

    console.log('product inserted/updated:', id)
}

export const upsertPriceRecord = async (price: Stripe.Price) => {
    const {
        id,
        product,
        active,
        currency,
        nickname = null,
        type,
        unit_amount,
        recurring,
        metadata
    } = price

    const localPrice: Price = {
        id,
        productId: typeof product === 'string' ? product : product.id,
        active,
        currency,
        description: nickname,
        type,
        unitAmount: unit_amount ?? null,
        interval: recurring?.interval ?? null,
        intervalCount: recurring?.interval_count ?? null,
        trialPeriodDays: recurring?.trial_period_days ?? null,
        metadata,
    }

    try {
        await db.insert(prices)
            .values(localPrice)
            .onConflictDoUpdate({ target: prices.id, set: localPrice })
    } catch (error) {
        console.log('upsertPriceRecord error', error)

        throw new Error('could not insert/update price')
    }

    console.log('price was insert/update:', id);
}

export const createOrRetrieveCustomer = async ({ email, uuid }: {
    email: string;
    uuid: string;
}) => {
    try {
        const response = await db.query.customers.findFirst({
            where: (u, { eq }) => eq(u.id, uuid)
        })

        if (!response)
            throw new Error('no customer found');

        return response.stripeCustomerId
    } catch (error) {
        console.log(
            'createOrRetrieveCustomer error:',
            'retrieve customer fail, trying to insert:',
            uuid,
            error,
        );

        const localCustomer: { metadata: {supabaseUUID: string}; email?: string } = {
            metadata: {
                supabaseUUID: uuid,
            }
        }

        if (email) localCustomer.email = email;

        try {
            const customer = await stripe.customers.create(localCustomer);
            await db.insert(customers).values({
                id: uuid,
                stripeCustomerId: customer.id
            })

            console.log(`New customer created and inserted for ${uuid}`);
        } catch (error) {
            console.log('createOrRetrieveCustomer error', error)
            throw new Error('Cloud not create customer or find the customer')
        }
    }
}

export const copyBillingDetailsToCustomer = async (uuid: string, paymentMethod: Stripe.PaymentMethod) => {
    const customer = typeof paymentMethod.customer === 'string'
        ? paymentMethod.customer
        : paymentMethod.customer?.id;

    const { name, phone, address = null } = paymentMethod.billing_details;

    if (!name || !phone || !address || !customer) {
        console.log('Missing customer/billing details', paymentMethod);
        return;
    }

    await stripe.customers.update(
        customer,
        {
            name,
            phone,
            // @ts-ignore
            address,
            // Alternative solution to @ts-ignore
            // Object
            //     .entries(address)
            //     .reduce((obj, [key, val]) => {
            //         // typecast only
            //         const k: keyof Stripe.AddressParam = key as any;

            //         if (val === null) obj[k] = undefined;
            //         else obj[k] = val

            //         return obj
            //     }, {} as Stripe.AddressParam)
        },
    )

    try {
        await db.update(users)
            .set({
                billingAddress: { ...address },
                paymentMethod: {
                    ...paymentMethod[paymentMethod.type]
                }
            })
            .where(eq(users.id, uuid))
    } catch (error) {
        console.log('copyBillingDetailsToCustomer error', error)

        throw new Error('Could not copy customer billing details')
    }

    console.log('billing details copied!', customer)
}

export const manageSubscriptionStatusChange = async (
    subscriptionId: string,
    customerId: string,
    createAction = false,
) => {
    try {
        const localCustomer = await db.query.customers.findFirst({
            where: (u, { eq }) => eq(u.stripeCustomerId, customerId)
        })

        if (!localCustomer) throw new Error('cannot find the customer')

        const { id: userId } = localCustomer

        const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            { expand: ['default_payment_method'] },
        )

        const {
            id,
            metadata,
            status,
            items,
            cancel_at_period_end,
            cancel_at,
            canceled_at,
            current_period_start,
            current_period_end,
            ended_at,
            trial_start,
            trial_end,
        } = subscription

        // @ts-ignore
        const localSubscription: Subscription = {
            id,
            userId,
            metadata,
            status,
            priceId: items.data?.[0].price.id,
            // @ts-ignore
            quantity: subscription.quantity,
            cancelAtPeriodEnd: cancel_at_period_end,
            cancelAt: toDateTime({ secs: cancel_at, isostring: true }),
            canceledAt: toDateTime({ secs: canceled_at, isostring: true }),
            currentPeriodStart: toDateTime({ secs: current_period_start, isostring: true }),
            currentPeriodEnd: toDateTime({ secs: current_period_end, isostring: true }),
            endedAt: toDateTime({ secs: ended_at, isostring: true }),
            trialStart: toDateTime({ secs: trial_start, isostring: true }),
            trialEnd: toDateTime({ secs: trial_end, isostring: true }),
        }

        console.log({ localSubscription });

        await db
            .insert(subscriptions)
            .values(localSubscription)
            .onConflictDoUpdate({
                target: subscriptions.id,
                set: localSubscription,
            })

        console.log(`Inserted/updated subscription [${id}] for user [${userId}]`)

        if (createAction && subscription.default_payment_method) {
            await copyBillingDetailsToCustomer(
                userId,
                subscription.default_payment_method as Stripe.PaymentMethod,
            )
        }
    } catch (error) {
        console.log('manageSubscriptionStatusChange error', error);

        throw error
    }
}
