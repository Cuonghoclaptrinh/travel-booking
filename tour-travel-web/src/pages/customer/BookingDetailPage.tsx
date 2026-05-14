import { useEffect, useState } from 'react';
import { message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import bookingService from '../../services/public/bookingService';
import { Booking } from '../../types/booking';
import { useAuth } from '../../hooks/useAuth';
import { useUserSocket } from '../../hooks/useUserSocket';
import './BookingDetailPage.scss';

// ── Helpers ────────────────────────────────────────────────────────────────
const formatMoney = (value?: string | number) =>
    Number(value || 0).toLocaleString('vi-VN');

const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleString('vi-VN') : '—';

// ── Icons (inline SVG – no extra dependency) ───────────────────────────────
const IconArrowLeft = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

const IconClock = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

// ── Badge helpers ──────────────────────────────────────────────────────────
const bookingStatusLabel: Record<string, string> = {
    pending_payment: 'Chờ thanh toán',
    confirmed: 'Đã xác nhận',
    cancelled: 'Đã huỷ',
};

const paymentStatusLabel: Record<string, string> = {
    unpaid: 'Chưa thanh toán',
    paid: 'Đã thanh toán',
};

const bookingBadgeClass = (status: string) =>
    status === 'confirmed' ? 'bk-badge--booking-confirmed' : 'bk-badge--booking-pending';

const paymentBadgeClass = (status: string) =>
    status === 'paid' ? 'bk-badge--payment-paid' : 'bk-badge--payment-unpaid';

// ── Sub-components ─────────────────────────────────────────────────────────
interface RowProps { label: string; children: React.ReactNode; strong?: boolean }

const Row = ({ label, children, strong }: RowProps) => (
    <div className="bk-row">
        <div className="bk-row__label">{label}</div>
        <div className={`bk-row__value${strong ? ' bk-row__value--strong' : ''}`}>
            {children}
        </div>
    </div>
);

// ── Main component ─────────────────────────────────────────────────────────
const BookingDetailPage = () => {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState<Booking | null>(null);
    const [vnpayLoading, setVnpayLoading] = useState(false);
    const [mockPayosLoading, setMockPayosLoading] = useState(false);
    const [payosLoading, setPayosLoading] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchDetail = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const response = await bookingService.getMyBookingById(Number(id));
            setBooking(response);
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không tải được chi tiết booking');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetail(); }, [id]);

    useUserSocket(
        Number(user?.id),
        (payload) => { // booking update
            if (!booking) return;

            if (booking.id === payload.bookingId) {
                setBooking({
                    ...booking,
                    bookingStatus: payload.bookingStatus,
                    paymentStatus: payload.paymentStatus,
                });
            }
        },
        (payload) => { // payment update
            if (!booking) return;

            if (booking.id === payload.bookingId) {
                setBooking({
                    ...booking,
                    paymentStatus: payload.paymentStatus,
                    paidAt: payload.paidAt,
                    totalAmount: payload.paidAmount,
                });
            }
        }
    );


    const handleCancel = async () => {
        if (!booking) return;
        try {
            setCancelling(true);
            await bookingService.cancelMyBooking(booking.id);
            message.success('Huỷ booking thành công');
            fetchDetail();
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Huỷ booking thất bại');
        } finally {
            setCancelling(false);
        }
    };

    const handlePayWithVnpay = async () => {
        if (!booking) return;
        try {
            setVnpayLoading(true);
            const result = await bookingService.createVnpayPaymentUrl(booking.id, { language: 'vn' });
            window.location.href = result.paymentUrl;
        } catch (error: any) {
            message.error(error?.response?.data?.message || 'Không tạo được URL thanh toán VNPay');
        } finally {
            setVnpayLoading(false);
        }
    };

    const handlePayWithMockPayos = async () => {
        if (!booking) return;

        try {
            setMockPayosLoading(true);

            const result = await bookingService.createMockPayosPaymentUrl(
                Number(booking.id),
            );

            window.location.href = result.checkoutUrl;
        } catch (error: any) {
            message.error(
                error?.response?.data?.message ||
                'Không tạo được thanh toán PayOS Demo',
            );
        } finally {
            setMockPayosLoading(false);
        }
    };

    const handlePayWithPayos = async () => {
        if (!booking) return;

        try {
            setPayosLoading(true);

            const result = await bookingService.createPayosPaymentUrl(
                Number(booking.id),
            );

            if (!result.checkoutUrl) {
                message.error('Không nhận được link thanh toán PayOS');
                return;
            }

            window.location.href = result.checkoutUrl;
        } catch (error: any) {
            message.error(
                error?.response?.data?.message ||
                'Không tạo được link thanh toán PayOS',
            );
        } finally {
            setPayosLoading(false);
        }
    };

    // ── Empty state ──────────────────────────────────────────────────────
    if (!loading && !booking) {
        return (
            <div className="bk-page">
                <button className="bk-back-btn" onClick={() => navigate(-1)}>
                    <IconArrowLeft /> Quay lại
                </button>
                <div className="bk-card" style={{ padding: '48px', textAlign: 'center', color: '#9aa5b4' }}>
                    Không tìm thấy booking.
                </div>
            </div>
        );
    }

    const canPay =
        booking?.bookingStatus === 'pending_payment' &&
        booking?.paymentStatus === 'unpaid';

    // ── Skeleton ─────────────────────────────────────────────────────────
    if (loading && !booking) {
        return (
            <div className="bk-page">
                <button className="bk-back-btn" onClick={() => navigate(-1)}>
                    <IconArrowLeft /> Quay lại
                </button>
                <div className="bk-card" style={{ padding: '32px' }}>
                    <div style={{ color: '#9aa5b4', textAlign: 'center', padding: '48px 0' }}>
                        Đang tải...
                    </div>
                </div>
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────
    return (
        <div className="bk-page">
            {/* Back */}
            <button className="bk-back-btn" onClick={() => navigate(-1)}>
                <IconArrowLeft /> Quay lại
            </button>

            <div className="bk-card">

                {/* ── Header ─────────────────────────────────────────── */}
                <div className="bk-card-header">
                    <div className="bk-title-group">
                        <span className="bk-label">Booking</span>
                        <h1 className="bk-title">{booking?.code}</h1>
                    </div>

                    <div className="bk-badges">
                        {booking?.bookingStatus && (
                            <span className={`bk-badge ${bookingBadgeClass(booking.bookingStatus)}`}>
                                {bookingStatusLabel[booking.bookingStatus] ?? booking.bookingStatus}
                            </span>
                        )}
                        {booking?.paymentStatus && (
                            <span className={`bk-badge ${paymentBadgeClass(booking.paymentStatus)}`}>
                                {paymentStatusLabel[booking.paymentStatus] ?? booking.paymentStatus}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Body ───────────────────────────────────────────── */}
                <div className="bk-card-body">

                    {/* Thông tin tour */}
                    <div className="bk-section">
                        <div className="bk-section__title">Thông tin tour</div>
                        <div className="bk-rows">
                            <Row label="Tour">
                                {booking?.tour?.name || booking?.tour?.title || `Tour #${booking?.tourId}`}
                            </Row>
                            <Row label="Gói tour">
                                {booking?.tourPackage?.name || booking?.tourPackage?.title || `Package #${booking?.packageId}`}
                            </Row>
                            <Row label="Option khởi hành">
                                {booking?.departureOption?.name || booking?.departureOption?.title || `Option #${booking?.optionId}`}
                            </Row>
                        </div>
                    </div>

                    {/* Thông tin liên hệ & số lượng */}
                    <div className="bk-section">
                        <div className="bk-section__title">Khách hàng</div>
                        <div className="bk-rows">
                            <Row label="Liên hệ">
                                {booking?.contactName} · {booking?.contactEmail}
                                {booking?.contactPhone ? ` · ${booking.contactPhone}` : ''}
                            </Row>
                            <Row label="Số lượng">
                                {booking?.adultCount} người lớn &nbsp;/&nbsp; {booking?.childCount} trẻ em
                            </Row>
                        </div>
                    </div>

                    {/* Chi phí */}
                    <div className="bk-section">
                        <div className="bk-section__title">Chi tiết giá</div>
                        <div className="bk-price-summary">
                            <div className="bk-price-row">
                                <span className="bk-price-row__label">Đơn giá người lớn</span>
                                <span className="bk-price-row__value">{formatMoney(booking?.unitPriceAdult)} đ</span>
                            </div>
                            <div className="bk-price-row">
                                <span className="bk-price-row__label">Đơn giá trẻ em</span>
                                <span className="bk-price-row__value">{formatMoney(booking?.unitPriceChild)} đ</span>
                            </div>
                            <div className="bk-price-row">
                                <span className="bk-price-row__label">Phụ thu ngày khởi hành</span>
                                <span className="bk-price-row__value">+ {formatMoney(booking?.departurePriceAdjustment)} đ</span>
                            </div>
                            <div className="bk-price-row">
                                <span className="bk-price-row__label">Phụ thu option</span>
                                <span className="bk-price-row__value">+ {formatMoney(booking?.optionExtraPrice)} đ</span>
                            </div>
                            <div className="bk-price-row">
                                <span className="bk-price-row__label">Phụ thu HDV riêng</span>
                                <span className="bk-price-row__value">+ {formatMoney(booking?.guideExtraPrice)} đ</span>
                            </div>
                            <div className="bk-price-row bk-price-row--divider">
                                <span className="bk-price-row__label">Tổng tiền</span>
                                <span className="bk-price-row__value">{formatMoney(booking?.totalAmount)} đ</span>
                            </div>
                        </div>

                        {booking?.expiresAt && (
                            <div className="bk-expiry" style={{ marginTop: 12 }}>
                                <span className="bk-expiry__icon"><IconClock /></span>
                                <span className="bk-expiry__text">
                                    Hết hạn thanh toán: <strong>{formatDate(booking.expiresAt)}</strong>
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Ghi chú */}
                    {booking?.notes && (
                        <div className="bk-section">
                            <div className="bk-section__title">Ghi chú</div>
                            <div className="bk-notes">{booking.notes}</div>
                        </div>
                    )}

                </div>

                {/* ── Actions ────────────────────────────────────────── */}
                {(canPay || booking?.paymentStatus === 'paid') && (
                    <div className="bk-actions">
                        {canPay && (
                            <>
                                <button
                                    className="bk-btn bk-btn--primary"
                                    onClick={handlePayWithPayos}
                                    disabled={mockPayosLoading || vnpayLoading || cancelling}
                                >
                                    {mockPayosLoading && <span className="bk-btn__spinner" />}
                                    Thanh toán PayOS
                                </button>
                                <button
                                    className="bk-btn bk-btn--primary"
                                    onClick={handlePayWithMockPayos}
                                    disabled={mockPayosLoading || vnpayLoading || cancelling}
                                >
                                    {mockPayosLoading && <span className="bk-btn__spinner" />}
                                    Thanh toán PayOS Demo
                                </button>
                                <button
                                    className="bk-btn bk-btn--primary"
                                    onClick={handlePayWithVnpay}
                                    disabled={vnpayLoading}
                                >
                                    {vnpayLoading && <span className="bk-btn__spinner" />}
                                    Thanh toán VNPay
                                </button>

                                <button
                                    className="bk-btn bk-btn--danger"
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                >
                                    {cancelling && <span className="bk-btn__spinner" style={{ borderColor: 'rgba(184,48,58,0.3)', borderTopColor: '#b8303a' }} />}
                                    Huỷ booking
                                </button>
                            </>
                        )}

                        {booking?.paymentStatus === 'paid' && (
                            <button
                                className="bk-btn bk-btn--ghost"
                                onClick={() => navigate('/my-bookings')}
                            >
                                Quay lại danh sách booking
                            </button>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default BookingDetailPage;