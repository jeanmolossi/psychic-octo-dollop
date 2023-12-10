'use client';

import {
    appWorkspacesType,
    appFoldersType,
    useAppState,
} from "@/lib/providers/state-provider";
import { File, Folder, workspace } from "@/lib/supabase/supabase.types";
import React from "react";
import { Label } from "../ui/label";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { UploadBannerFormSchema } from "@/lib/types";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Loader from "../global/loader";
import { updateFile, updateFolder, updateWorkspace } from "@/lib/supabase/queries";
import { useToast } from "../ui/use-toast";

interface BannerUploadFormProps {
    dirType: "workspace" | "folder" | "file";
    id: string;
    details: appWorkspacesType | appFoldersType | File | workspace | Folder;
}

const BannerUploadForm = ({
    dirType,
    id,
}: BannerUploadFormProps) => {
    const supabase = createClientComponentClient();
    const { toast } = useToast()
    const { workspaceId, folderId, dispatch } = useAppState()
    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting: isUploading, errors },
    } = useForm<z.infer<typeof UploadBannerFormSchema>>({
        mode: 'onChange',
        defaultValues: { banner: '' }
    })

    const onSubmitHandler: SubmitHandler<
        z.infer<typeof UploadBannerFormSchema>
    > = async (values) => {
        const file = values.banner?.[0];
        if (!file || !id) return;

        try {
            const uploadBanner = async () => {
                const { data, error } = await supabase.storage
                    .from('file-banners')
                    .upload(
                        `banner-${id}`,
                        file,
                        {
                            cacheControl: '5',
                            upsert: true,
                        },
                    )

                if (error) {
                    console.log('uploadBanner error',error)
                    throw new Error();
                }

                return data.path;
            }

            if (dirType === 'file') {
                if (!workspaceId || !folderId) return;

                const filePath = await uploadBanner();

                dispatch({
                    type: 'UPDATE_FILE',
                    payload: {
                        file: { bannerUrl: filePath },
                        fileId: id,
                        folderId,
                        workspaceId,
                    }
                })

                await updateFile({ bannerUrl: filePath }, id);
            }

            if (dirType === 'folder') {
                if (!workspaceId) return;

                const filePath = await uploadBanner();

                dispatch({
                    type: 'UPDATE_FOLDER',
                    payload: {
                        folder: { bannerUrl: filePath },
                        folderId: id,
                        workspaceId,
                    }
                })

                await updateFolder({ bannerUrl: filePath }, id)
            }

            if (dirType === 'workspace') {
                const filePath = await uploadBanner();

                dispatch({
                    type: 'UPDATE_WORKSPACE',
                    payload: {
                        workspace: { bannerUrl: filePath },
                        workspaceId: id,
                    }
                })

                await updateWorkspace({ bannerUrl: filePath }, id);
            }

            toast({ title: 'Banner sent' })
        } catch (error) {
            console.log('upload error', error)
            toast({
                title: 'Error',
                variant: 'destructive',
                description: 'Could not upload banner'
            })
        } finally {
            reset()
        }
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmitHandler)}
            className="flex flex-col gap-2"
        >
            <Label htmlFor="banner-image" className="text-sm text-muted-foreground">
                Banner image
            </Label>

            <Input
                id="banner-image"
                type="file"
                accept="image/*"
                disabled={isUploading}
                {...register('banner', { required: 'Banner image is required' })}
            />

            <small className="text-red-600">{errors.banner?.message}</small>

            <Button disabled={isUploading} type="submit">
                {!isUploading ? 'Upload banner' : <Loader />}
            </Button>
        </form>
    );
};

export default BannerUploadForm;
