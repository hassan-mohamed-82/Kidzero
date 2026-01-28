import { Server, Socket } from "socket.io";
import { verifyToken } from "../utils/auth";
import { db } from "../models/db";
import { rides } from "../models/admin/Ride";
import { eq } from "drizzle-orm";

interface AuthenticatedSocket extends Socket {
    user?: any;
}

export const initSocket = (io: Server) => {
    io.use((socket: AuthenticatedSocket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
        if (!token) {
            return next(new Error("Authentication error"));
        }
        try {
            const decoded = verifyToken(token);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on("connection", (socket: AuthenticatedSocket) => {
        console.log(`User connected: ${socket.user?.id} (${socket.user?.role})`);

        socket.on("joinRide", (rideId: string) => {
            // In a real app, you might want to verify if the parent is actually linked to this ride/student
            socket.join(`ride_${rideId}`);
            console.log(`User ${socket.user?.id} joined ride ${rideId}`);
        });

        socket.on("updateLocation", async (data: { rideId: string; lat: number; lng: number }) => {
            // Allow drivers and codrivers to update location
            if (socket.user?.role !== "driver" && socket.user?.role !== "codriver" && socket.user?.role !== "superadmin") {
                console.warn(`Unauthorized location update attempt by ${socket.user?.id}`);
                return;
            }

            const { rideId, lat, lng } = data;

            try {
                // Update DB with new location
                await db.update(rides)
                    .set({
                        currentLat: lat.toString(),
                        currentLng: lng.toString(),
                        updatedAt: new Date()
                    })
                    .where(eq(rides.id, rideId));
            } catch (error) {
                console.error("Error updating location in DB (proceeding with emit):", error);
            }

            // Emit to room regardless of DB success
            io.to(`ride_${rideId}`).emit("locationUpdate", { rideId, lat, lng });
        });

        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.user?.id}`);
        });
    });
};