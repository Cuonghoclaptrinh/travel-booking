import { useEffect } from 'react';
import { socket } from '../socket';

export function useUserSocket(
    userId?: number | null,
    onBookingUpdated?: (payload: any) => void,
    onPaymentUpdated?: (payload: any) => void,
) {
    useEffect(() => {
        if (!userId) return;
        console.log("JOIN USER ROOM", userId);
        // Join room của user
        socket.emit('join_user_room', { userId });

        // Lắng nghe payment
        const handlePaymentUpdated = (payload: any) => {
            console.log("PAYMENT UPDATED RECEIVED", payload);
            if (onPaymentUpdated) onPaymentUpdated(payload);
        };
        socket.on('payment.updated', handlePaymentUpdated);

        // Lắng nghe booking update (ví dụ expire)
        const handleBookingUpdated = (payload: any) => {
            console.log("BOOKING UPDATED RECEIVED", payload);
            if (onBookingUpdated) onBookingUpdated(payload);
        };
        socket.on('booking.updated', handleBookingUpdated);

        return () => {
            socket.off('payment.updated', handlePaymentUpdated);
            socket.off('booking.updated', handleBookingUpdated);
        };
    }, [userId, onBookingUpdated, onPaymentUpdated]);
}