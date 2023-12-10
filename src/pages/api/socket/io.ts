import { NextApiResponseServerIO } from "@/lib/types";
import { NextApiRequest } from "next";
import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';

export const config = {
    api: { bodyParser: false }
}

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if (!res.socket.server.io) {
        try {
            const httpServer: NetServer = res.socket.server as any;

            const io = new ServerIO(httpServer, {
                path: '/api/socket/io',
                addTrailingSlash: false,
            })

            io.on('connection', (socket) => {
                socket.on('create-room', (fileId) => {
                    socket.join(fileId);
                })

                socket.on('send-changes', (deltas, fileId) => {
                    socket.to(fileId).emit('receive-changes', deltas, fileId);
                })

                socket.on('send-cursor-move', (range, fileId, cursorId) => {
                    socket.to(fileId).emit('receive-cursor-move', range, fileId, cursorId)
                })
            })

            console.log('new socket set')
            res.socket.server.io = io;
        } catch(e) {
            console.log('error', e)
        }
    }

    res.end()
}

export const dynamic = 'force-dynamic'
