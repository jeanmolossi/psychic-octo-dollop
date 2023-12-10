import { stripe } from "@/lib/stripe";
import { createOrRetrieveCustomer } from "@/lib/stripe/admin-tasks";
import { getURL } from "@/lib/utils";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const supabase = createRouteHandlerClient({ cookies });

        const { data: { user } } = await supabase.auth.getUser()

        if (!user) throw new Error('Unauthorized')

        const customer = await createOrRetrieveCustomer({
            email: user.email || `empty-${user.id}@email.com`,
            uuid: user.id,
        })

        if (!customer)
            throw new Error('Customer not found')

        const { url } = await stripe.billingPortal.sessions.create({
            customer,
            return_url: `${getURL()}/dashboard`
        })

        return NextResponse.json({ url });
    } catch (error: any) {
        console.log('create portal link error', error);

        let response = error.message || 'Internal server error';
        let status = 500

        if ('Unauthorized'.includes(error.message)) {
            status = 401
        }

        if ('Customer not found'.includes(error.message)) {
            status = 404
        }

        return new NextResponse(
            response,
            { status }
        )
    }
}
