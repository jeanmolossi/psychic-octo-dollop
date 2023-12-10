'use client';

import React, { useState } from 'react'
import { useRouter } from 'next/navigation';
import z from 'zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormSchema } from '@/lib/types';
import { Form, FormControl, FormDescription, FormField, FormItem, FormMessage } from '@/components/ui/form';
import Link from 'next/link';
import Image from 'next/image';
import CypressLogo from '../../../../public/cypresslogo.svg'
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Loader from '@/components/global/loader';
import { actionLoginUser } from '@/lib/server-actions/auth-actions';

interface LoginProps {}

const Login = ({}: LoginProps) => {
    const router = useRouter()
    const [submitErr, setSubmitErr] = useState('');

    const form = useForm<z.infer<typeof FormSchema>>({
        mode: 'onChange',
        resolver: zodResolver(FormSchema),
        defaultValues: {
            email: '',
            password: '',
        }
    })

    const {
        formState: { isSubmitting },
        handleSubmit
    } = form

    const isLoading = isSubmitting

    const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (formData) => {
        const { error } = await actionLoginUser(formData)
        if (error) {
            form.reset();
            setSubmitErr(error.message);

            return;
        }

        router.replace('/dashboard')
    }

    return (
        <Form {...form}>
            <form
                className='w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col'
                onSubmit={handleSubmit(onSubmit)}
                onChange={() => {
                    if (submitErr) setSubmitErr('');
                }}
            >
                <Link
                    href="/"
                    className='
                    w-full
                    flex
                    justify-start
                    items-center'
                >
                    <Image
                        src={CypressLogo}
                        alt="Cypress Logo"
                        width={50}
                        height={50}
                    />

                    <span
                        className='font-semibold
                        dark:text-white
                        text-4xl
                        first-letter:ml-2'
                    >
                        cypress.
                    </span>
                </Link>

                <FormDescription className='text-foreground/60'>
                    An all-In-One Collaboration and Productivity Platform
                </FormDescription>

                <FormField
                    disabled={isLoading}
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder='E-mail'
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    disabled={isLoading}
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input
                                    type="password"
                                    placeholder='Password'
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {submitErr && (
                    <FormMessage>{submitErr}</FormMessage>
                )}

                <Button
                    type="submit"
                    className='w-full p-6'
                    size='lg'
                    disabled={isLoading}
                >
                    {!isLoading ? "Login" : (<Loader />)}
                </Button>

                <span className='self-container'>
                    Dont have an account?{' '}
                    <Link href="/signup" className='text-primary'>
                        Sign Up
                    </Link>
                </span>
            </form>
        </Form>
    )
}

export default Login;