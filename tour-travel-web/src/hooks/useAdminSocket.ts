// useAdminSocket.ts
import { useEffect } from 'react';
import { socket } from '../socket';

export function useAdminSocket(
    departureId?: number | null,
    onDepartureUpdated?: () => void, // callback khi booking/departure thay đổi
    onBookingCreated?: () => void
) {
    useEffect(() => {
        // 1. Join room admin
        socket.emit('join_admin_room');

        // 2. Join departure room nếu có
        if (departureId !== null && departureId !== undefined) {
            socket.emit('join_departure_room', { departureId });
        }

        // 3. Lắng nghe booking mới tạo
        const handleBookingCreated = (payload: any) => {
            console.log('Booking created:', payload);
            if (onBookingCreated) onBookingCreated();
        };
        socket.on('booking.created', handleBookingCreated);

        // 4. Lắng nghe thay đổi slots cho departure
        const handleSlotsUpdated = (payload: any) => {
            console.log('Departure slots updated:', payload);
            if (onDepartureUpdated) onDepartureUpdated();
        };
        socket.on('departure.slots_updated', handleSlotsUpdated);


        // Cleanup khi component unmount
        return () => {
            socket.off('booking.created', handleBookingCreated);
            socket.off('departure.slots_updated', handleSlotsUpdated);
        };
    }, [departureId, onDepartureUpdated, onBookingCreated]);
}