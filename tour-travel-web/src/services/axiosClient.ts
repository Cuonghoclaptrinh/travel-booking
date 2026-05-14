
// import axios from "axios";

// const axiosClient = axios.create({
//     baseURL: import.meta.env.VITE_API_URL,
//     headers: {
//         "Content-Type": "application/json",
//     },
//     withCredentials: true,
// });

// let isRefreshing = false;
// let failedQueue: Array<{
//     resolve: (value?: unknown) => void;
//     reject: (reason?: any) => void;
// }> = [];

// const processQueue = (error: any, token: string | null = null) => {
//     failedQueue.forEach((promise) => {
//         if (error) {
//             promise.reject(error);
//         } else {
//             promise.resolve(token);
//         }
//     });

//     failedQueue = [];
// };

// axiosClient.interceptors.request.use(
//     (config) => {
//         const token = localStorage.getItem("accessToken");

//         if (token) {
//             config.headers.Authorization = `Bearer ${token}`;
//         }

//         return config;
//     },
//     (error) => Promise.reject(error)
// );

// axiosClient.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         const isAuthRoute =
//             originalRequest?.url?.includes("/auth/login") ||
//             originalRequest?.url?.includes("/auth/register") ||
//             originalRequest?.url?.includes("/auth/refresh");

//         if (error?.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
//             if (isRefreshing) {
//                 return new Promise((resolve, reject) => {
//                     failedQueue.push({ resolve, reject });
//                 }).then((token) => {
//                     if (token && originalRequest.headers) {
//                         originalRequest.headers.Authorization = `Bearer ${token}`;
//                     }
//                     return axiosClient(originalRequest);
//                 });
//             }

//             originalRequest._retry = true;
//             isRefreshing = true;

//             try {
//                 const response = await axios.post(
//                     `${import.meta.env.VITE_API_URL}/auth/refresh`,
//                     {},
//                     { withCredentials: true }
//                 );

//                 const newAccessToken = response.data.accessToken;
//                 localStorage.setItem("accessToken", newAccessToken);

//                 processQueue(null, newAccessToken);

//                 if (originalRequest.headers) {
//                     originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
//                 }

//                 return axiosClient(originalRequest);
//             } catch (refreshError) {
//                 processQueue(refreshError, null);

//                 localStorage.removeItem("accessToken");
//                 localStorage.removeItem("currentUser");

//                 if (!window.location.pathname.startsWith("/auth")) {
//                     window.location.href = "/auth/login";
//                 }

//                 return Promise.reject(refreshError);
//             } finally {
//                 isRefreshing = false;
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default axiosClient;

import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((promise) => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });

    failedQueue = [];
};

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isAuthRoute =
            originalRequest?.url?.includes("/auth/login") ||
            originalRequest?.url?.includes("/auth/register") ||
            originalRequest?.url?.includes("/auth/refresh");

        if (error?.response?.status === 401 && !originalRequest?._retry && !isAuthRoute) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    if (token && originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return axiosClient(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/auth/refresh`,
                    {},
                    { withCredentials: true }
                );

                const newAccessToken = response.data.accessToken;
                localStorage.setItem("accessToken", newAccessToken);

                processQueue(null, newAccessToken);

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                return axiosClient(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);

                localStorage.removeItem("accessToken");
                localStorage.removeItem("currentUser");

                if (!window.location.pathname.startsWith("/auth")) {
                    window.location.href = "/auth/login";
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;