"use client";

import React, { Dispatch, createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { File, Folder, workspace } from "../supabase/supabase.types";
import { usePathname } from "next/navigation";
import { getFiles } from "../supabase/queries";

type Optional<T> = T | undefined;
export type appFoldersType = Folder & { files: File[] };
export type appWorkspacesType = workspace & {
    folders: appFoldersType[];
};

interface AppState {
    workspaces: appWorkspacesType[];
    avatarUrl: string;
}

type Action =
    | { type: "ADD_WORKSPACE"; payload: appWorkspacesType }
    | { type: "DELETE_WORKSPACE"; payload: string }
    | {
          type: "UPDATE_WORKSPACE";
          payload: {
              workspace: Partial<appWorkspacesType>;
              workspaceId: string;
          };
      }
    | {
          type: "SET_WORKSPACES";
          payload: { workspaces: appWorkspacesType[] };
      }
    | {
          type: "SET_FOLDERS";
          payload: { workspaceId: string; folders: appFoldersType[] };
      }
    | {
          type: "ADD_FOLDER";
          payload: { workspaceId: string; folder: appFoldersType };
      }
    | {
          type: "ADD_FILE";
          payload: { workspaceId: string; file: File; folderId: string };
      }
    | {
          type: "DELETE_FILE";
          payload: { workspaceId: string; folderId: string; fileId: string };
      }
    | {
          type: "DELETE_FOLDER";
          payload: { workspaceId: string; folderId: string };
      }
    | {
          type: "SET_FILES";
          payload: { workspaceId: string; files: File[]; folderId: string };
      }
    | {
          type: "UPDATE_FOLDER";
          payload: {
              folder: Partial<appFoldersType>;
              workspaceId: string;
              folderId: string;
          };
      }
    | {
          type: "UPDATE_FILE";
          payload: {
              file: Partial<File>;
              folderId: string;
              workspaceId: string;
              fileId: string;
          };
      }
    | {
        type: 'UPDATE_PROFILE_PIC',
        payload: { avatarUrl: string }
    }

const initialState: AppState = {
    workspaces: [],
    avatarUrl: '',
};

const appReducer = (
    state: AppState = initialState,
    action: Action
): AppState => {
    function byDate<T extends { createdAt: string }>(a: T, b: T) {
        return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
    }

    switch (action.type) {
        case "ADD_WORKSPACE":
            return {
                ...state,
                workspaces: [...state.workspaces, action.payload],
            };
        case "DELETE_WORKSPACE":
            return {
                ...state,
                workspaces: state.workspaces.filter(
                    (workspace) => workspace.workspaceId !== action.payload
                ),
            };
        case "UPDATE_WORKSPACE":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if (workspace.workspaceId === action.payload.workspaceId) {
                        return {
                            ...workspace,
                            ...action.payload.workspace,
                        };
                    }
                    return workspace;
                }),
            };
        case "SET_WORKSPACES":
            return {
                ...state,
                workspaces: action.payload.workspaces,
            };
        case "SET_FOLDERS":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if (workspace.workspaceId === action.payload.workspaceId) {
                        return {
                            ...workspace,
                            folders: action.payload.folders.sort(byDate),
                        };
                    }
                    return workspace;
                }),
            };
        case "ADD_FOLDER":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    return {
                        ...workspace,
                        folders: [
                            ...workspace.folders,
                            action.payload.folder,
                        ].sort(byDate),
                    };
                }),
            };
        case "UPDATE_FOLDER":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if (workspace.workspaceId === action.payload.workspaceId) {
                        return {
                            ...workspace,
                            folders: workspace.folders.map((folder) => {
                                if (folder.folderId === action.payload.folderId) {
                                    return {
                                        ...folder,
                                        ...action.payload.folder,
                                    };
                                }
                                return folder;
                            }),
                        };
                    }
                    return workspace;
                }),
            };
        case "DELETE_FOLDER":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if (workspace.workspaceId === action.payload.workspaceId) {
                        return {
                            ...workspace,
                            folders: workspace.folders.filter(
                                (folder) =>
                                    folder.folderId !== action.payload.folderId
                            ),
                        };
                    }
                    return workspace;
                }),
            };
        case "SET_FILES":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if (workspace.workspaceId === action.payload.workspaceId) {
                        return {
                            ...workspace,
                            folders: workspace.folders.map((folder) => {
                                if (folder.folderId === action.payload.folderId) {
                                    return {
                                        ...folder,
                                        files: action.payload.files,
                                    };
                                }
                                return folder;
                            }),
                        };
                    }
                    return workspace;
                }),
            };
        case "ADD_FILE":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if (workspace.workspaceId === action.payload.workspaceId) {
                        return {
                            ...workspace,
                            folders: workspace.folders.map((folder) => {
                                if (folder.folderId === action.payload.folderId) {
                                    return {
                                        ...folder,
                                        files: [
                                            ...folder.files,
                                            action.payload.file,
                                        ].sort(byDate),
                                    };
                                }
                                return folder;
                            }),
                        };
                    }
                    return workspace;
                }),
            };
        case "DELETE_FILE":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if (workspace.workspaceId === action.payload.workspaceId) {
                        return {
                            ...workspace,
                            folder: workspace.folders.map((folder) => {
                                if (folder.folderId === action.payload.folderId) {
                                    return {
                                        ...folder,
                                        files: folder.files.filter(
                                            (file) =>
                                                file.fileId !==
                                                action.payload.fileId
                                        ),
                                    };
                                }
                                return folder;
                            }),
                        };
                    }
                    return workspace;
                }),
            };
        case "UPDATE_FILE":
            return {
                ...state,
                workspaces: state.workspaces.map((workspace) => {
                    if (workspace.workspaceId === action.payload.workspaceId) {
                        return {
                            ...workspace,
                            folders: workspace.folders.map((folder) => {
                                if (folder.folderId === action.payload.folderId) {
                                    return {
                                        ...folder,
                                        files: folder.files.map((file) => {
                                            if (
                                                file.fileId ===
                                                action.payload.fileId
                                            ) {
                                                return {
                                                    ...file,
                                                    ...action.payload.file,
                                                };
                                            }
                                            return file;
                                        }),
                                    };
                                }
                                return folder;
                            }),
                        };
                    }
                    return workspace;
                }),
            };
        case "UPDATE_PROFILE_PIC": {
            return {
                ...state,
                avatarUrl: action.payload.avatarUrl
            }
        }
        default:
            return initialState;
    }
};

const AppStateContext = createContext<
    Optional<{
        state: AppState;
        dispatch: Dispatch<Action>;
        workspaceId: Optional<string>;
        folderId: Optional<string>;
        fileId: Optional<string>;
    }>
>(undefined);

const AppStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [ state, dispatch ] = useReducer(appReducer, initialState);
    const pathname = usePathname();

    const {
        workspaceId,
        folderId,
        fileId,
    } = useMemo(
        () => {
            const urlSegments = pathname?.split('/').filter(Boolean)

            let workspaceId = urlSegments?.[1],
                folderId = urlSegments?.[2],
                fileId = urlSegments?.[3]

            return {
                workspaceId,
                folderId,
                fileId,
            }
        },
        [pathname]
    )

    useEffect(() => {
        if (!folderId || !workspaceId) return;

        getFiles(folderId)
            .then(({ files, getFilesErr }) => {
                if (getFilesErr) {
                    return;
                }

                dispatch({
                    type: 'SET_FILES',
                    payload: {
                        workspaceId,
                        files,
                        folderId,
                    }
                })
            })
    }, [folderId, workspaceId])

    return (
        <AppStateContext.Provider
            value={{ state, dispatch, workspaceId, folderId, fileId }}
        >
            {children}
        </AppStateContext.Provider>
    );
};

export default AppStateProvider;

export const useAppState = () => {
    const context = useContext(AppStateContext);

    if (!context) {
        throw new Error("useAppState must be used within an AppStateProvider");
    }

    return context;
};
