import { stripe } from "@/lib/stripe";
import { manageSubscriptionStatusChange, upsertPriceRecord, upsertProductRecord } from "@/lib/stripe/admin-tasks";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const relevantEvents = new Set([
    'product.created',
    'product.updated',
    'product.deleted',
    'price.created',
    'price.updated',
    'price.deleted',
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
])

export async function POST(request: NextRequest) {
    const body = await request.text();
    const sig = headers().get('Stripe-Signature');

    try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret || !sig)
            throw new Error('Forbidden')

        const event: Stripe.Event = stripe.webhooks.constructEvent(
            body,
            sig,
            webhookSecret
        )

        if (!relevantEvents.has(event.type))
            return NextResponse.json({ received: true }, { status: 200 })

        await eventHandler(event);


        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error: any) {
        let response = error.message || 'Internal server error'
        let status = 500

        if (response.includes('Bad request'))
            status = 400

        return new NextResponse(
            response,
            { status }
        )
    }
}

async function eventHandler(event: Stripe.Event) {
    switch(event.type) {
        case 'product.created':
        case 'product.updated':
        case 'product.deleted':
            if (event.type === 'product.deleted')
                event.data.object.active = false

            await upsertProductRecord(event.data.object)
            break;

        case 'price.created':
        case 'price.updated':
        case 'price.deleted':
            if (event.type === 'price.deleted')
                event.data.object.active = false

            await upsertPriceRecord(event.data.object)
            break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const { id, customer } = event.data.object;

            const customerId = typeof customer === 'string'
                ? customer
                : customer.id;

            await manageSubscriptionStatusChange(
                id,
                customerId,
                event.type === 'customer.subscription.created'
            )

            break;
        }

        case 'checkout.session.completed': {
            const { mode, subscription, customer } = event.data.object;

            if (mode === 'subscription') {
                const subscriptionId = typeof subscription === 'string'
                    ? subscription
                    : subscription?.id

                if (!subscriptionId)
                    throw new Error('Bad request. Subscription id missing')

                const customerId = typeof customer === 'string'
                    ? customer
                    : customer?.id

                if (!customerId)
                    throw new Error('Bad request. Customer id missing')

                await manageSubscriptionStatusChange(
                    subscriptionId,
                    customerId,
                    true
                )
            }

            break;
        }

        default:
            throw new Error('Unhandled relevant event!');
    }
}
