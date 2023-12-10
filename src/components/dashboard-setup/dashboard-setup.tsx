"use client";

import { AuthUser } from "@supabase/supabase-js";
import React, { useState } from "react";
import { v4 } from 'uuid';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import EmojiPicker from "../global/emoji-picker";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { FieldValues, SubmitHandler, useForm } from "react-hook-form";
import { Subscription, workspace } from "@/lib/supabase/supabase.types";
import { z } from "zod";
import { CreateWorkspaceFormSchema } from "@/lib/types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "../ui/use-toast";
import { createWorkspace } from "@/lib/supabase/queries";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/providers/state-provider";
import { Button } from "../ui/button";
import Loader from "../global/loader";

interface DashboardSetupProps {
    user: AuthUser;
    subscription: Subscription | null;
}

const DashboardSetup = ({ user, subscription }: DashboardSetupProps) => {
    const [selectedEmoji, setSelectedEmoji] = useState('😄')
    const { toast } = useToast()
    const router = useRouter()
    const { dispatch } = useAppState()

    const supabase = createClientComponentClient();

    const {
        register,
        handleSubmit,
        reset,
        formState: {
            isSubmitting,
            errors,
        }
    } = useForm<z.infer<typeof CreateWorkspaceFormSchema>>({
        mode: 'onChange',
        defaultValues: {
            logo: '',
            workspaceName: '',
        }
    })

    const onSubmit: SubmitHandler<
        z.infer<typeof CreateWorkspaceFormSchema>
    > = async (data) => {
        const file = data.logo?.[0];
        let filePath = null;
        const workspaceUUID = v4();

        console.log(file);

        if (!file) return;

        try {
            const { data, error } = await supabase.storage
                .from('workspace-logos')
                .upload(`workspaceLogo.${workspaceUUID}`, file, {
                    cacheControl: '3600',
                    upsert: true,
                })

            if (error) throw error

            filePath = data.path;
        } catch (error) {
            console.log('onSubmit workspace error', error)

            toast({
                variant: 'destructive',
                title: 'Error! Could not upload your workspace logo'
            })
        }

        try {
            const newWorkspace: workspace = {
                workspaceId: workspaceUUID,
                title: data.workspaceName,
                workspaceOwner: user.id,
                logo: filePath || null,
                bannerUrl: '',
                iconId: selectedEmoji,
                createdAt: (new Date().toISOString()),
                inTrash: '',
                data: null,
            }

            const { createWorkspaceError } = await createWorkspace(newWorkspace);

            if (createWorkspaceError) {
                throw createWorkspaceError
            }

            dispatch({
                type: 'ADD_WORKSPACE',
                payload: { ...newWorkspace, folders: [] }
            })

            toast({
                title: 'Workspace created.',
                description: `${newWorkspace.title} has been created successfully.`
            })

            router.replace(`/dashboard/${newWorkspace.workspaceId}`);
        } catch (error) {
            console.log('onSubmit workspace error', error)

            toast({
                variant: 'destructive',
                title: 'Could not create your workspace',
                description:
                    'Oops! Something went wrong, and we couldn\'t create your workspace. Try again or come back later.'
            })
        } finally {
            reset();
        }
    }

    return (
        <div>
            <Card
                className="w-full md:w-[600px]
                h-screen
                sm:h-auto"
            >
                <CardHeader>
                    <CardTitle>Create a Workspace</CardTitle>
                    <CardDescription>
                        Let{"'"}s create a private workspace to get you started.
                        You can add collaborators later from workspace settings
                        tab.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div
                            className="flex
                            flex-col
                            gap-4"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">
                                    <EmojiPicker getValue={(emoji) => setSelectedEmoji(emoji)}>
                                        {selectedEmoji}
                                    </EmojiPicker>
                                </div>

                                <div className="w-full">
                                    <Label
                                        htmlFor="workspaceName"
                                        className="text-sm
                                        text-muted-foreground"
                                    >
                                        Name
                                    </Label>

                                    <Input
                                        id="workspaceName"
                                        type="text"
                                        placeholder="Workspace name"
                                        disabled={isSubmitting}
                                        {...register(
                                            'workspaceName',
                                            { required: 'Workspace name is required' },
                                        )}
                                    />

                                    <small className="text-red-600">
                                        {errors.workspaceName?.message?.toString()}
                                    </small>
                                </div>
                            </div>

                            <div>
                                <Label
                                    htmlFor="workspaceLogo"
                                    className="text-sm
                                    text-muted-foreground"
                                >
                                    Workspace logo
                                </Label>

                                <Input
                                    id="workspaceLogo"
                                    type="file"
                                    accept="image/*"
                                    multiple={false}
                                    placeholder="Workspace logo"
                                    disabled={isSubmitting}
                                    {...register('logo', { required: false })}
                                />

                                <small className="text-red-600">
                                    {errors.logo?.message?.toString()}
                                </small>

                                {subscription?.status !== 'active' && (
                                    <small className="text-muted-foreground block">
                                        To customize your workspace, you need to be on a Pro Plan
                                    </small>
                                )}
                            </div>

                            <div className="self-end">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {!isSubmitting ? 'Create Workspace' : <Loader />}
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default DashboardSetup;
