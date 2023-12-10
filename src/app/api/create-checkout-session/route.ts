import { stripe } from "@/lib/stripe";
import { createOrRetrieveCustomer } from "@/lib/stripe/admin-tasks";
import { getURL } from "@/lib/utils";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { price, quantity = 1, metadata = {} } = await request.json()

    try {
        const supabase = createRouteHandlerClient({ cookies });
        const { data: { user } } = await supabase.auth.getUser();

        if (!user)
            throw new Error('Unauthorized')

        const customer = await createOrRetrieveCustomer({
            email: user.email || `empty-${user.id}@email.com`,
            uuid: user.id,
        })

        const session = await stripe.checkout.sessions.create({
            // @ts-ignore
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            customer,
            line_items: [
                {
                    price: price.id,
                    quantity,
                }
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            subscription_data: { trial_from_plan: true, metadata },
            success_url: `${getURL()}/dashboard`,
            cancel_url: `${getURL()}/dashboard`
        });

        return NextResponse.json({ session: session.id })
    } catch (error: any) {
        console.log('create checkout session error', error);

        let response = 'Internal server error'
        let status = 500

        if (error.message === 'Unauthorized') {
            response = 'Unauthorized'
            status = 401
        }

        return new NextResponse(
            response,
            { status }
        )
    }
}
