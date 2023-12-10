'use client';

import React, { createContext, useContext, useEffect, useState } from 'react'
import { io as ClientIO, ManagerOptions, Socket, SocketOptions } from 'socket.io-client'

type SocketContextType = {
    socket: any | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>(null!)

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        console.log(process.env.NEXT_PUBLIC_SITE_URL)
        const instance: Socket = new (ClientIO as any)(
            process.env.NEXT_PUBLIC_SITE_URL!,
            {
                path: '/api/socket/io',
                addTrailingSlash: false,
            } satisfies  Partial<ManagerOptions & SocketOptions>
        )

        instance.on('connect', () => setIsConnected(true));
        instance.on('disconnect', () => setIsConnected(false));

        setSocket(instance)

        return () => {
            instance.disconnect();
        }
    }, [])

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider

export const useSocket = () => {
    return useContext(SocketContext);
}
