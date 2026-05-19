/**
 * Toast facade.
 *
 * Re-exports `sonner` so the rest of the app imports `@/lib/toast`
 * once and never depends on the toast library directly. If we ever
 * swap sonner for react-hot-toast or a custom implementation, only
 * this file changes.
 */

import { toast as sonnerToast } from "sonner";

export const toast = sonnerToast;

export const notifySuccess = (message, options = {}) =>
    sonnerToast.success(message, { duration: 3500, ...options });

export const notifyError = (message, options = {}) =>
    sonnerToast.error(message, { duration: 5000, ...options });

export const notifyInfo = (message, options = {}) =>
    sonnerToast.info(message, { duration: 3500, ...options });

export default toast;
