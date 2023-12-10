"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import clsx from "clsx";
import { z } from "zod";
import Loader from "@/components/global/loader";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import CypressLogo from "../../../../public/cypresslogo.svg";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MailCheck } from "lucide-react";
import { FormSchema } from "@/lib/types";
import { actionSignUpUser } from "@/lib/server-actions/auth-actions";

interface SignUpProps {}

const SignUpFormSchema = z
  .object({
    email: z.string().describe("Email").email({ message: "Email is invalid" }),
    password: z
      .string()
      .describe("Password")
      .min(6, "Password must be minimum 6 characters"),
    confirmPassword: z
      .string()
      .describe("Confirm Password")
      .min(6, "Password must be minimum 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const SignUp = ({}: SignUpProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [submitErr, setSubmitErr] = useState("");
  const [confirmation, setConfirmation] = useState(false);

  const codeExchangeError = useMemo(() => {
    if (!searchParams) return "";
    return searchParams.get("error_description");
  }, [searchParams]);

  const confirmationAndErrorStyles = useMemo(
    () =>
      clsx("bg-primary", {
        "bg-red-500/10": codeExchangeError,
        "border-red-500/50": codeExchangeError,
        "text-red-700": codeExchangeError,
      }),
    [codeExchangeError]
  );

  const form = useForm<z.infer<typeof SignUpFormSchema>>({
    mode: "onChange",
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const isLoading = isSubmitting;

  const onSubmit =
    async ({ email, password }: z.infer<typeof FormSchema>) => {
        const { error } = await actionSignUpUser({ email, password })

        console.log(error)

        if (error) {
            setSubmitErr(error.message);
            form.reset();
            return;
        }

        setConfirmation(true)
    };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onChange={() => {
          if (submitErr) setSubmitErr("");
        }}
        className="w-full sm:justify-center sm:w-[400px]
                space-y-6 flex flex-col"
      >
        <Link
          href="/"
          className="
                    w-full
                    flex
                    justify-start
                    items-center"
        >
          <Image src={CypressLogo} alt="Cypress Logo" width={50} height={50} />

          <span
            className="font-semibold
                        dark:text-white
                        text-4xl
                        first-letter:ml-2"
          >
            cypress.
          </span>
        </Link>

        <FormDescription className="text-foreground/60">
          An all-In-One Collaboration and Productivity Platform
        </FormDescription>

        {!confirmation && !codeExchangeError && (
          <>
            <FormField
              disabled={isLoading}
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" placeholder="E-mail" {...field} />
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
                    <Input type="password" placeholder="Password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              disabled={isLoading}
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="password" placeholder="Confirm password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full p-6"
              size="lg"
              disabled={isLoading}
            >
              {!isLoading ? "Create Account" : <Loader />}
            </Button>
          </>
        )}
        
        {submitErr && <FormMessage>{submitErr}</FormMessage>}

        <span className="self-container">
          Already have an account?{" "}
          <Link href="/login" className="text-primary">
            Login
          </Link>
        </span>

        {(confirmation || codeExchangeError) && (
            <>
                <Alert className={confirmationAndErrorStyles}>
                    {!codeExchangeError && <MailCheck className="h-4 w-4" />}
                    <AlertTitle>
                        {codeExchangeError ? 'Invalid Link' : 'Check yout email.'}
                    </AlertTitle>

                    <AlertDescription>
                        {codeExchangeError || 'An email confirmation has been sent.'}
                    </AlertDescription>
                </Alert>
            </>
        )}
      </form>
    </Form>
  );
};

export default SignUp;
