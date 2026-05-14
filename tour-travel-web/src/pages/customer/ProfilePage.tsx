// import { useEffect, useRef, useState, ChangeEvent } from "react";
// import {
//     Alert,
//     Avatar,
//     Box,
//     Button,
//     Paper,
//     Stack,
//     TextField,
//     Typography,
// } from "@mui/material";
// import { useAuth } from "../../hooks/useAuth";
// import authService from "../../services/authService";

// export default function ProfilePage() {
//     const { user, fetchMe } = useAuth();
//     const fileInputRef = useRef<HTMLInputElement | null>(null);

//     const [form, setForm] = useState({
//         name: "",
//         email: "",
//         phone: "",
//     });

//     const [avatarPreview, setAvatarPreview] = useState<string>("");
//     const [savingProfile, setSavingProfile] = useState(false);
//     const [uploadingAvatar, setUploadingAvatar] = useState(false);
//     const [removingAvatar, setRemovingAvatar] = useState(false);
//     const [error, setError] = useState("");
//     const [success, setSuccess] = useState("");

//     useEffect(() => {
//         setForm({
//             name: user?.name || "",
//             email: user?.email || "",
//             phone: user?.phone || "",
//         });
//         setAvatarPreview(user?.avatarUrl || "");
//     }, [user]);

//     const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = event.target;
//         setForm((prev) => ({
//             ...prev,
//             [name]: value,
//         }));
//     };

//     const handleChooseAvatar = () => {
//         fileInputRef.current?.click();
//     };

//     const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
//         const file = event.target.files?.[0];
//         if (!file) return;

//         setError("");
//         setSuccess("");

//         const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
//         if (!allowedTypes.includes(file.type)) {
//             setError("Chỉ hỗ trợ file jpg, jpeg, png, webp");
//             return;
//         }

//         if (file.size > 2 * 1024 * 1024) {
//             setError("Ảnh tối đa 2MB");
//             return;
//         }

//         const localPreview = URL.createObjectURL(file);
//         setAvatarPreview(localPreview);
//         setUploadingAvatar(true);

//         try {
//             await authService.updateMyAvatar(file);
//             await fetchMe();
//             setSuccess("Cập nhật avatar thành công");
//         } catch (err: any) {
//             const message =
//                 err?.response?.data?.message || err?.message || "Cập nhật avatar thất bại";
//             setError(Array.isArray(message) ? message.join(", ") : message);
//         } finally {
//             setUploadingAvatar(false);
//         }
//     };

//     const handleRemoveAvatar = async () => {
//         setError("");
//         setSuccess("");
//         setRemovingAvatar(true);

//         try {
//             await authService.removeMyAvatar();
//             await fetchMe();
//             setAvatarPreview("");
//             setSuccess("Xóa avatar thành công");
//         } catch (err: any) {
//             const message =
//                 err?.response?.data?.message || err?.message || "Xóa avatar thất bại";
//             setError(Array.isArray(message) ? message.join(", ") : message);
//         } finally {
//             setRemovingAvatar(false);
//         }
//     };

//     const handleSaveProfile = async () => {
//         setError("");
//         setSuccess("");
//         setSavingProfile(true);

//         try {
//             const payload: { name?: string; phone?: string } = {
//                 name: form.name.trim(),
//             };

//             const trimmedPhone = form.phone.trim();
//             if (trimmedPhone) {
//                 payload.phone = trimmedPhone;
//             }

//             await authService.updateMe(payload);

//             await fetchMe();
//             setSuccess("Cập nhật hồ sơ thành công");
//         } catch (err: any) {
//             const message =
//                 err?.response?.data?.message || err?.message || "Cập nhật hồ sơ thất bại";
//             setError(Array.isArray(message) ? message.join(", ") : message);
//         } finally {
//             setSavingProfile(false);
//         }
//     };

//     const fallbackLetter = form.name?.charAt(0)?.toUpperCase() || "U";

//     return (
//         <Paper sx={{ maxWidth: 760, mx: "auto", p: 4 }}>
//             <Typography variant="h4" gutterBottom>
//                 Hồ sơ cá nhân
//             </Typography>

//             <Stack
//                 direction={{ xs: "column", sm: "row" }}
//                 spacing={3}
//                 alignItems="center"
//                 mb={4}
//             >
//                 <Avatar
//                     src={avatarPreview || undefined}
//                     sx={{ width: 96, height: 96, fontSize: 32 }}
//                 >
//                     {!avatarPreview && fallbackLetter}
//                 </Avatar>

//                 <Box display="flex" gap={1} flexWrap="wrap">
//                     <Button
//                         variant="outlined"
//                         onClick={handleChooseAvatar}
//                         disabled={uploadingAvatar}
//                     >
//                         {uploadingAvatar ? "Đang tải ảnh..." : "Đổi avatar"}
//                     </Button>

//                     <Button
//                         variant="text"
//                         color="error"
//                         onClick={handleRemoveAvatar}
//                         disabled={removingAvatar}
//                     >
//                         {removingAvatar ? "Đang xóa..." : "Xóa avatar"}
//                     </Button>

//                     <input
//                         ref={fileInputRef}
//                         type="file"
//                         accept="image/png,image/jpeg,image/jpg,image/webp"
//                         hidden
//                         onChange={handleAvatarChange}
//                     />
//                 </Box>
//             </Stack>

//             <Stack spacing={2}>
//                 <TextField
//                     label="Họ tên"
//                     name="name"
//                     value={form.name}
//                     onChange={handleChange}
//                     fullWidth
//                 />

//                 <TextField
//                     label="Email"
//                     name="email"
//                     value={form.email}
//                     fullWidth
//                     disabled
//                 />

//                 <TextField
//                     label="Số điện thoại"
//                     name="phone"
//                     value={form.phone}
//                     onChange={handleChange}
//                     fullWidth
//                 />

//                 {error && <Alert severity="error">{error}</Alert>}
//                 {success && <Alert severity="success">{success}</Alert>}

//                 <Button
//                     variant="contained"
//                     onClick={handleSaveProfile}
//                     disabled={savingProfile}
//                 >
//                     {savingProfile ? "Đang lưu..." : "Lưu thay đổi"}
//                 </Button>
//             </Stack>
//         </Paper>
//     );
// }

import { useEffect, useRef, useState, ChangeEvent } from 'react';
import { useAuth } from '../../hooks/useAuth';
import authService from '../../services/authService';
import './ProfilePage.scss';

// ── Inline icons ───────────────────────────────────────────────────────────
const IconCamera = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const IconCheck = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconX = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

// ── Component ──────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const { user, fetchMe } = useAuth();
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [avatarPreview, setAvatarPreview] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [removingAvatar, setRemovingAvatar] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        setForm({
            name: user?.name || '',
            email: user?.email || '',
            phone: user?.phone || '',
        });
        setAvatarPreview(user?.avatarUrl || '');
    }, [user]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const clearMessages = () => { setError(''); setSuccess(''); };

    // ── Avatar handlers ──────────────────────────────────────────────────
    const handleChooseAvatar = () => fileInputRef.current?.click();

    const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        clearMessages();

        const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowed.includes(file.type)) { setError('Chỉ hỗ trợ file jpg, jpeg, png, webp'); return; }
        if (file.size > 2 * 1024 * 1024) { setError('Ảnh tối đa 2MB'); return; }

        setAvatarPreview(URL.createObjectURL(file));
        setUploadingAvatar(true);

        try {
            await authService.updateMyAvatar(file);
            await fetchMe();
            setSuccess('Cập nhật avatar thành công');
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Cập nhật avatar thất bại';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        clearMessages();
        setRemovingAvatar(true);
        try {
            await authService.removeMyAvatar();
            await fetchMe();
            setAvatarPreview('');
            setSuccess('Xóa avatar thành công');
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Xóa avatar thất bại';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setRemovingAvatar(false);
        }
    };

    // ── Profile save ─────────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        clearMessages();
        setSavingProfile(true);
        try {
            const payload: { name?: string; phone?: string } = { name: form.name.trim() };
            const phone = form.phone.trim();
            if (phone) payload.phone = phone;

            await authService.updateMe(payload);
            await fetchMe();
            setSuccess('Cập nhật hồ sơ thành công');
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || 'Cập nhật hồ sơ thất bại';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        } finally {
            setSavingProfile(false);
        }
    };

    const fallback = form.name?.charAt(0)?.toUpperCase() || 'U';

    return (
        <div className="pf-page">
            <div className="pf-card">

                {/* ── Header ── */}
                <div className="pf-card-header">
                    <div className="pf-header-label">Tài khoản</div>
                    <h1 className="pf-header-title">Hồ sơ cá nhân</h1>
                </div>

                {/* ── Avatar section ── */}
                <div className="pf-avatar-section">
                    {/* Avatar */}
                    <div className="pf-avatar-wrap" onClick={handleChooseAvatar} title="Đổi avatar">
                        {avatarPreview
                            ? <img src={avatarPreview} alt="avatar" className="pf-avatar" />
                            : <div className="pf-avatar-fallback">{fallback}</div>
                        }
                        <div className="pf-avatar-overlay">
                            <IconCamera />
                        </div>
                    </div>

                    {/* Name + email + avatar buttons */}
                    <div>
                        {form.name && <div className="pf-avatar-name">{form.name}</div>}
                        {form.email && <div className="pf-avatar-email">{form.email}</div>}

                        <div className="pf-avatar-actions" style={{ flexDirection: 'row' }}>
                            <button
                                className="pf-btn pf-btn--outlined"
                                onClick={handleChooseAvatar}
                                disabled={uploadingAvatar}
                            >
                                {uploadingAvatar
                                    ? <><span className="pf-btn__spinner pf-btn__spinner--dark" />Đang tải...</>
                                    : 'Đổi avatar'
                                }
                            </button>

                            {avatarPreview && (
                                <button
                                    className="pf-btn pf-btn--danger-ghost"
                                    onClick={handleRemoveAvatar}
                                    disabled={removingAvatar}
                                >
                                    {removingAvatar
                                        ? <><span className="pf-btn__spinner pf-btn__spinner--dark" />Đang xóa...</>
                                        : 'Xóa avatar'
                                    }
                                </button>
                            )}
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        hidden
                        onChange={handleAvatarChange}
                    />
                </div>

                {/* ── Form ── */}
                <div className="pf-form">

                    <div className="pf-field">
                        <label className="pf-field__label">Họ tên</label>
                        <input
                            className="pf-field__input"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Nhập họ tên của bạn"
                        />
                    </div>

                    <div className="pf-field">
                        <label className="pf-field__label">Email</label>
                        <input
                            className="pf-field__input"
                            name="email"
                            value={form.email}
                            disabled
                            placeholder="Email"
                        />
                        <span className="pf-field__hint">Email không thể thay đổi</span>
                    </div>

                    <div className="pf-field">
                        <label className="pf-field__label">Số điện thoại</label>
                        <input
                            className="pf-field__input"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="Nhập số điện thoại"
                        />
                    </div>

                    {/* Alerts */}
                    {error && (
                        <div className="pf-alert pf-alert--error">
                            <span className="pf-alert__icon"><IconX /></span>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="pf-alert pf-alert--success">
                            <span className="pf-alert__icon"><IconCheck /></span>
                            {success}
                        </div>
                    )}

                    {/* Save */}
                    <div className="pf-form-footer">
                        <button
                            className="pf-btn pf-btn--primary"
                            onClick={handleSaveProfile}
                            disabled={savingProfile}
                            style={{ padding: '11px 32px' }}
                        >
                            {savingProfile
                                ? <><span className="pf-btn__spinner" />Đang lưu...</>
                                : 'Lưu thay đổi'
                            }
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}