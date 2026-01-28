"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = void 0;
const auth_1 = require("../utils/auth");
const db_1 = require("../models/db");
const Ride_1 = require("../models/admin/Ride");
const drizzle_orm_1 = require("drizzle-orm");
const initSocket = (io) => {
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];
        if (!token) {
            return next(new Error("Authentication error"));
        }
        try {
            const decoded = (0, auth_1.verifyToken)(token);
            socket.user = decoded;
            next();
        }
        catch (err) {
            next(new Error("Authentication error"));
        }
    });
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user?.id} (${socket.user?.role})`);
        socket.on("joinRide", (rideId) => {
            // In a real app, you might want to verify if the parent is actually linked to this ride/student
            socket.join(`ride_${rideId}`);
            console.log(`User ${socket.user?.id} joined ride ${rideId}`);
        });
        socket.on("updateLocation", async (data) => {
            // Allow drivers and codrivers to update location
            if (socket.user?.role !== "driver" && socket.user?.role !== "codriver" && socket.user?.role !== "superadmin") {
                console.warn(`Unauthorized location update attempt by ${socket.user?.id}`);
                return;
            }
            const { rideId, lat, lng } = data;
            try {
                // Update DB with new location
                await db_1.db.update(Ride_1.rides)
                    .set({
                    currentLat: lat.toString(),
                    currentLng: lng.toString(),
                    updatedAt: new Date()
                })
                    .where((0, drizzle_orm_1.eq)(Ride_1.rides.id, rideId));
            }
            catch (error) {
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
exports.initSocket = initSocket;
