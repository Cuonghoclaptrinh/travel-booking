import { useEffect } from 'react';
import { socket } from '../socket';

export function useDepartureSocket(
    departureId?: number | null,
    onSlotsUpdated?: (payload: any) => void // callback khi slots thay đổi
) {
    useEffect(() => {
        if (!departureId) return;

        // 1. Join room cho departure
        socket.emit('join_departure_room', { departureId });

        // 2. Listen event từ server
        const handleSlotsUpdated = (payload: any) => {
            if (onSlotsUpdated) onSlotsUpdated(payload);
        };

        socket.on('departure.slots_updated', handleSlotsUpdated);

        // 3. Cleanup khi unmount hoặc departureId thay đổi
        return () => {
            socket.off('departure.slots_updated', handleSlotsUpdated);
        };
    }, [departureId, onSlotsUpdated]);
}