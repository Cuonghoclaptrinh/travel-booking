// import { useState } from 'react';
// import { message } from 'antd';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import bookingService from '../../services/public/bookingService';
// import './MockPayosPage.scss';

// const MockPayosPage = () => {
//     const navigate = useNavigate();
//     const [searchParams] = useSearchParams();

//     const transactionRef = searchParams.get('transactionRef') || '';
//     const [confirming, setConfirming] = useState(false);

//     const handleConfirmPayment = async () => {
//         if (!transactionRef) {
//             message.error('Thiếu mã giao dịch');
//             return;
//         }

//         try {
//             setConfirming(true);

//             const result = await bookingService.confirmMockPayosPayment(
//                 transactionRef,
//             );

//             message.success('Thanh toán PayOS Demo thành công');

//             navigate(`/my-bookings/${result.bookingId}`, {
//                 replace: true,
//             });
//         } catch (error: any) {
//             message.error(
//                 error?.response?.data?.message ||
//                 'Xác nhận thanh toán thất bại',
//             );
//         } finally {
//             setConfirming(false);
//         }
//     };

//     return (
//         <div className="mock-payos-page">
//             <div className="mock-payos-card">
//                 <div className="mock-payos-logo">payOS Demo</div>

//                 <h1>Thanh toán QR mô phỏng</h1>

//                 <p className="mock-payos-desc">
//                     Đây là trang thanh toán giả lập dùng cho môi trường demo.
//                     Khi bấm xác nhận, hệ thống sẽ cập nhật booking sang trạng
//                     thái đã thanh toán và gửi email xác nhận.
//                 </p>

//                 <div className="mock-payos-qr">
//                     <div className="mock-payos-qr__box">
//                         <span>QR</span>
//                     </div>
//                 </div>

//                 <div className="mock-payos-info">
//                     <div>
//                         <span>Mã giao dịch</span>
//                         <strong>{transactionRef || 'Không có'}</strong>
//                     </div>
//                     <div>
//                         <span>Nhà cung cấp</span>
//                         <strong>PayOS Demo</strong>
//                     </div>
//                     <div>
//                         <span>Trạng thái</span>
//                         <strong>Chờ thanh toán</strong>
//                     </div>
//                 </div>

//                 <div className="mock-payos-actions">
//                     <button
//                         className="mock-payos-btn mock-payos-btn--primary"
//                         onClick={handleConfirmPayment}
//                         disabled={confirming || !transactionRef}
//                     >
//                         {confirming ? 'Đang xác nhận...' : 'Mô phỏng thanh toán thành công'}
//                     </button>

//                     <button
//                         className="mock-payos-btn mock-payos-btn--ghost"
//                         onClick={() => navigate('/my-bookings')}
//                         disabled={confirming}
//                     >
//                         Hủy và quay lại
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default MockPayosPage;

import { useState } from 'react';
import { message, Result } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import bookingService from '../../services/public/bookingService';
import './MockPayosPage.scss';

const MockPayosPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const transactionRef = searchParams.get('transactionRef') || '';

    const [confirming, setConfirming] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [bookingId, setBookingId] = useState<number | string | null>(null);

    const handleConfirmPayment = async () => {
        if (!transactionRef) {
            message.error('Thiếu mã giao dịch');
            return;
        }

        try {
            setConfirming(true);

            const result = await bookingService.confirmMockPayosPayment(
                transactionRef,
            );

            setBookingId(result.bookingId);
            setPaymentSuccess(true);

            message.success('Thanh toán PayOS thành công');
        } catch (error: any) {
            message.error(
                error?.response?.data?.message ||
                'Xác nhận thanh toán thất bại',
            );
        } finally {
            setConfirming(false);
        }
    };

    if (paymentSuccess) {
        return (
            <div className="mock-payos-page">
                <div className="mock-payos-card mock-payos-success-card">
                    <Result
                        status="success"
                        title="Giao dịch thành công"
                        subTitle={`Thanh toán PayOS đã được xác nhận thành công. Mã giao dịch: ${transactionRef}`}
                        extra={[
                            <button
                                key="detail"
                                className="mock-payos-btn mock-payos-btn--primary"
                                onClick={() => navigate(`/my-bookings/${bookingId}`, { replace: true })}
                            >
                                Xem chi tiết đơn đặt tour
                            </button>,
                            <button
                                key="list"
                                className="mock-payos-btn mock-payos-btn--ghost"
                                onClick={() => navigate('/my-bookings', { replace: true })}
                            >
                                Quay lại danh sách booking
                            </button>,
                        ]}
                    />

                    <div className="mock-payos-info mock-payos-success-info">
                        <div>
                            <span>Mã giao dịch</span>
                            <strong>{transactionRef}</strong>
                        </div>
                        <div>
                            <span>Nhà cung cấp</span>
                            <strong>PayOS </strong>
                        </div>
                        <div>
                            <span>Trạng thái</span>
                            <strong className="mock-payos-status-success">
                                Đã thanh toán
                            </strong>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mock-payos-page">
            <div className="mock-payos-card">
                <div className="mock-payos-logo">payOS Demo</div>

                <h1>Thanh toán QR mô phỏng</h1>

                <p className="mock-payos-desc">
                    Đây là trang thanh toán giả lập dùng cho môi trường demo.
                    Khi bấm xác nhận, hệ thống sẽ cập nhật booking sang trạng
                    thái đã thanh toán và gửi email xác nhận.
                </p>

                <div className="mock-payos-qr">
                    <div className="mock-payos-qr__box">
                        <span>QR</span>
                    </div>
                </div>

                <div className="mock-payos-info">
                    <div>
                        <span>Mã giao dịch</span>
                        <strong>{transactionRef || 'Không có'}</strong>
                    </div>
                    <div>
                        <span>Nhà cung cấp</span>
                        <strong>PayOS</strong>
                    </div>
                    <div>
                        <span>Trạng thái</span>
                        <strong>Chờ thanh toán</strong>
                    </div>
                </div>

                <div className="mock-payos-actions">
                    <button
                        className="mock-payos-btn mock-payos-btn--primary"
                        onClick={handleConfirmPayment}
                        disabled={confirming || !transactionRef}
                    >
                        {confirming
                            ? 'Đang xác nhận...'
                            : 'Mô phỏng thanh toán thành công'}
                    </button>

                    <button
                        className="mock-payos-btn mock-payos-btn--ghost"
                        onClick={() => navigate('/my-bookings')}
                        disabled={confirming}
                    >
                        Hủy và quay lại
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MockPayosPage;