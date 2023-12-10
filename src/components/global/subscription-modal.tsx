import { useSubscriptionModal } from '@/lib/providers/subscription-modal-provider'
import { Price, ProductWithPrice } from '@/lib/supabase/supabase.types'
import React, { useState } from 'react'
import { useToast } from '../ui/use-toast';
import { useSupabaseUser } from '@/lib/providers/supabase-user-provider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import Loader from './loader';
import { postData, toBRL } from '@/lib/utils';
import { getStripe } from '@/lib/stripe/stripe-client';

const SubscriptionModal = ({
    products,
}: {
    products: ProductWithPrice[],
}) => {
    const { open, setOpen } = useSubscriptionModal();
    const { toast } = useToast()
    const { user, subscription } = useSupabaseUser()
    const [isLoading, setIsLoading] = useState(false)

    const onClickContinue = async (price: Price) => {
        try {
            setIsLoading(true)

            if (!user) {
                toast({ title: 'You must be logged in' });
                return;
            }

            if (subscription) {
                toast({ title: 'Already on a Pro plan' });
                return;
            }

            const { session } = await postData({
                url: '/api/create-checkout-session',
                data: { price }
            })

            if (!session)
                throw new Error('missing session id')

            console.log('Getting checkout for stripe');

            const stripe = await getStripe()
            stripe?.redirectToCheckout({ sessionId: session })
        } catch (error) {
            console.log('onClickContinue error', error);

            toast({
                title: 'Oops! Something went wrong.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        {subscription?.status !== 'active' ? (
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upgrade to a Pro Plan</DialogTitle>
                </DialogHeader>

                <DialogDescription>
                    To access Pro features you need to have a paid plan.
                </DialogDescription>

                {products.length
                    ? products.map(product => (
                        <div className="flex justify-between items-center" key={product.id}>
                            {product.prices?.map((price) => (
                                <React.Fragment key={price.id}>
                                    <strong className="text-3xl">
                                        {toBRL(price)} / <small>{price.interval}</small>
                                    </strong>

                                    <Button onClick={() => onClickContinue(price)} disabled={isLoading}>
                                        {isLoading ? <Loader /> : 'Upgrade ✨'}
                                    </Button>
                                </React.Fragment>
                            ))}
                        </div>
                    )) : null}
            </DialogContent>
        ) : (
            <DialogContent>Already on Pro plan</DialogContent>
        )}
    </Dialog>
  )
}

export default SubscriptionModal
