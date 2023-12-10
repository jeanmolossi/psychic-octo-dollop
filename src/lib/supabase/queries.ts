'use server';

import { validate } from "uuid";
import { folders, users, workspaces } from "../../../migrations/schema"
import db from "./db"
import { Folder, Subscription, User, workspace, File, ProductWithPrice } from "./supabase.types"
import { and, eq, ilike, notExists } from "drizzle-orm";
import { collaborators, files } from "./schema";

// WORKSPACE

export const createWorkspace = async (workspace: workspace) => {
    try {
        const response = await db.insert(workspaces).values(workspace);
        return {
            rows: response.length,
            createWorkspaceError: null,
        }
    } catch (error) {
        return {
            rows: 0,
            createWorkspaceError: error
        }
    }
}

export const updateWorkspace = async (workspace: Partial<workspace>, workspaceId: string) => {
    if (!workspaceId) return;

    try {
        await db
            .update(workspaces)
            .set(workspace)
            .where(eq(workspaces.workspaceId, workspaceId));

        return { updateWorkspaceErr: null }
    } catch (error) {
        console.log('updateWorkspace error', error)

        return { updateWorkspaceErr: 'Some error was happen' }
    }
}

export const deleteWorkspace = async (workspaceId: string) => {
    if (!workspaceId) return;
    await db
        .delete(workspaces)
        .where(eq(workspaces.workspaceId, workspaceId))
}

export const getWorkspaceDetails = async (workspaceId: string) => {
    if (!validate(workspaceId)) return {
        workspace: null,
        getWorkspaceErr: 'Invalid workspace'
    }

    try {
        const workspacesDetails = await db
            .select()
            .from(workspaces)
            .where(eq(workspaces.workspaceId, workspaceId))
            .limit(1) as workspace[];

        return {
            workspace: workspacesDetails[0],
            getWorkspaceErr: null,
        }
    } catch (error) {
        console.log('getWorkspaceDetails error', error)

        return {
            workspace: null,
            getWorkspaceErr: null,
        }
    }
}

export const getUserWorkspace = async (userId: string) => {
    try {
        const data = await db.query.workspaces.findFirst({
            where: (w, { eq }) => eq(w.workspaceOwner, userId)
        })

        return {
            workspace: data || null,
            workspaceError: null,
        }
    } catch (error) {
        console.log('getUserWorkspace error', error)

        return {
            workspace: null,
            workspaceError: `Some error was happen`
        }
    }
}

export const getPrivateWorkspaces = async (userId: string) => {
    if (!userId) return [];

    const privateWorkspaces = await db
        .select({
            workspaceId: workspaces.workspaceId,
            createdAt: workspaces.createdAt,
            workspaceOwner: workspaces.workspaceOwner,
            title: workspaces.title,
            iconId: workspaces.iconId,
            data: workspaces.data,
            inTrash: workspaces.inTrash,
            logo: workspaces.logo,
            bannerUrl: workspaces.bannerUrl,
        })
        .from(workspaces)
        .where(and(
            notExists(
                db
                    .select()
                    .from(collaborators)
                    .where(eq(collaborators.workspaceId, workspaces.workspaceId))
                ),
                eq(workspaces.workspaceOwner, userId)
        )) as workspace[]

    return privateWorkspaces
}

export const getCollaboratingWorkspaces = async (userId: string) => {
    if (!userId) return [];

    const collaboratedWorkspaces = await db.select({
        workspaceId: workspaces.workspaceId,
        createdAt: workspaces.createdAt,
        workspaceOwner: workspaces.workspaceOwner,
        title: workspaces.title,
        iconId: workspaces.iconId,
        data: workspaces.data,
        inTrash: workspaces.inTrash,
        logo: workspaces.logo,
        bannerUrl: workspaces.bannerUrl,
    })
        .from(users)
        .innerJoin(collaborators, eq(users.id, collaborators.userId))
        .innerJoin(workspaces, eq(workspaces.workspaceId, collaborators.workspaceId))
        .where(eq(users.id, userId)) as workspace[];

    return collaboratedWorkspaces
}

export const getSharedWorkspaces = async (userId: string) => {
    if (!userId) return [];

    const sharedWorkspaces = await db
        .selectDistinct({
            workspaceId: workspaces.workspaceId,
            createdAt: workspaces.createdAt,
            workspaceOwner: workspaces.workspaceOwner,
            title: workspaces.title,
            iconId: workspaces.iconId,
            data: workspaces.data,
            inTrash: workspaces.inTrash,
            logo: workspaces.logo,
            bannerUrl: workspaces.bannerUrl,
        })
        .from(workspaces)
        .orderBy(workspaces.createdAt)
        .innerJoin(collaborators, eq(workspaces.workspaceId, collaborators.workspaceId))
        .where(eq(workspaces.workspaceOwner, userId)) as workspace[];

    return sharedWorkspaces;
}

// WORKSPACE COLLABORATORS

export const addCollaborators = async (users: User[], workspaceId: string) => {
    const usersIds = users.map(u => u.id);

    const usersWhoExists = await db.query.collaborators.findMany({
        where: (u, { inArray }) => and(
            inArray(u.userId, usersIds),
            eq(u.workspaceId, workspaceId)
        )
    })

    const alreadyIncludedIds = usersWhoExists.map(u => u.userId);
    const newCollaborators = users
        .filter(u => !alreadyIncludedIds.includes(u.id))
        .map(u => ({ workspaceId, userId: u.id }))

    if (newCollaborators.length > 0) {
        await db.insert(collaborators)
            .values(newCollaborators)
    }
}

export const removeCollaborators = async (
    users: User[],
    workspaceId: string,
) => {
    users.forEach(async (user: User) => {
        const userExists = await db.query.collaborators.findFirst({
            where: (u, { eq }) =>
                and(
                    eq(u.userId, user.id),
                    eq(u.workspaceId, workspaceId),
                )
        });

        if (userExists)
            await db
                .delete(collaborators)
                .where(
                    and(
                        eq(collaborators.workspaceId, workspaceId),
                        eq(collaborators.userId, user.id),
                    )
                );
    })
}

// USERS

export const findUser = async (userId: string) => {
    return await db.query.users
        .findFirst({
            where: (u, { eq }) => eq(u.id, userId),
        })
}

export const getUsersFromSearch = async (email: string) => {
    if (!email) return [];

    const accounts = await db
        .select()
        .from(users)
        .where(ilike(users.email, `${email}%`))

    return accounts
}

export const getCollaborators = async (workspaceId: string) => {
    const response = await db
        .select()
        .from(collaborators)
        .where(eq(collaborators.workspaceId, workspaceId));

    if (!response.length) return [];

    const userIds = response.map(r => r.userId)

    const resolvedUsers: User[] | undefined = await db.query.users.findMany({
        where: (u, { inArray }) => inArray(u.id, userIds)
    })

    return resolvedUsers;
};

// SUBSCRIPTION

export const getUserSubscriptionStatus = async (userId: string) => {
    try {
        const data = await db.query.subscriptions.findFirst({
            where: (subscription, { eq }) => eq(subscription.userId, userId)
        })

        if (data) {
            return {
                subscription: data as Subscription,
                subscriptionErr: null,
            }
        }

        return {
            subscription: null,
            subscriptionErr: null,
        }
    } catch (error) {
        console.log('getUserSubscriptionStatus error', error)

        return {
            subscription: null,
            subscriptionErr: `Some error was happen`,
        }
    }
}

// FOLDERS

export const createFolder = async (folder: Folder) => {
    try {
        await db.insert(folders).values(folder)
        return {
            folder,
            createFolderErr: null
        }
    } catch (error) {
        console.log('createFolder error', error)

        return {
            folder: null,
            createFolderErr: 'Failed to create a folder'
        }
    }
}

export const updateFolder = async (folder: Partial<Folder>, folderId: string) => {
    try {
        await db
            .update(folders)
            .set(folder)
            .where(eq(folders.folderId, folderId))

        return {
            folder,
            updateFolderErr: null,
        }
    } catch (error) {
        console.log(`updateFolder error`, error)

        return {
            folder: null,
            updateFolderErr: 'Some error was happen'
        }
    }
}

export const getFolders = async (workspaceId: string) => {
    if (!validate(workspaceId)) {
        return {
            folders: null,
            foldersError: new Error('Invalid workspace id')
        }
    }

    try {
        const results: Folder[] = await db
            .select()
            .from(folders)
            .orderBy(folders.createdAt)
            .where(eq(folders.workspaceId, workspaceId))

        return {
            folders: results,
            foldersError: null
        }
    } catch (error) {
        return {
            folders: null,
            foldersError: error,
        }
    }
}

export const getFolderDetails = async (folderId: string): Promise<{ folder: Folder | null, getFolderErr: string | null }> => {
    if (!validate(folderId)) return { folder: null, getFolderErr: 'Invalid folder' };

    try {
        const foldersList = await db
            .select()
            .from(folders)
            .where(eq(folders.folderId, folderId))
            .limit(1);

        return {
            folder: foldersList?.[0],
            getFolderErr: null,
        }
    } catch (error) {
        console.log('getFolderDetails error', error);

        return {
            folder: null,
            getFolderErr: 'Some error happen'
        }
    }
}

export const deleteFolder = async (folderId: string ) => {
    if (!folderId) return;
    await db.delete(folders).where(eq(folders.folderId, folderId));
}

// FILES

export const createFile = async (file: File) => {
    try {
        await db.insert(files).values(file);
        return { createFileErr: null }
    } catch (error) {
        console.log('createFile error', error)

        return { createFileErr: 'Some error was happen' }
    }
}

export const updateFile = async (file: Partial<File>, fileId: string) => {
    try {
        await db
            .update(files)
            .set(file)
            .where(eq(files.fileId, fileId))

        return { updateFileErr: null }
    } catch (error) {
        console.log('updateFile error', error)

        return { updateFileErr: 'Some error was happen' }
    }
}

export const getFileDetails = async (fileId: string): Promise<{ file: File | null; getFileErr: string | null }> => {
    if (!validate(fileId)) return { file: null, getFileErr: 'Invalid file' };

    try {
        const fileList = await db
            .select()
            .from(files)
            .where(eq(files.fileId, fileId))
            .limit(1);

        return {
            file: fileList?.[0],
            getFileErr: null,
        }
    } catch (error) {
        console.log('getFileDetails error', error);

        return {
            file: null,
            getFileErr: 'Some error was happen'
        }
    }
}

export const deleteFile = async (fileId: string) => {
    if (!fileId) return;
    await db.delete(files).where(eq(files.fileId, fileId))
}

export const getFiles = async (folderId: string) => {
    if (!validate(folderId)) return {
        files: [] as File[],
        getFilesErr: 'Invalid folder'
    }

    try {
        const results: File[] = await db
            .select()
            .from(files)
            .orderBy(files.createdAt)
            .where(eq(files.folderId, folderId));

        return {
            files: results || [] as File[],
            getFilesErr: null,
        }
    } catch (error) {
        console.log('getFiles error', error)

        return {
            files: [] as File[],
            getFilesErr: 'Some error was happen',
        }
    }
}

// PRODUCTS

export const getActiveProductsWithPrice = async (): Promise<{ products: ProductWithPrice[], getProductsErr: string | null}> => {
    try {
        const res = await db.query.products.findMany({
            where: (pro, { eq }) => eq(pro.active, true),
            with: {
                prices: {
                    where: (pri, { eq }) => eq(pri.active, true),
                }
            }
        })

        if (!res.length) return { products: [], getProductsErr: null }

        return {
            products: res,
            getProductsErr: null,
        }
    } catch (error) {
        console.log('getActiveProductsWithPrice error', error)
        return {
            products: [],
            getProductsErr: 'Some error happened',
        }
    }
}
