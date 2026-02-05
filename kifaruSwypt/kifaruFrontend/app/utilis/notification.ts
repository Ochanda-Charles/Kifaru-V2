// utils/notifications.ts
import { notification } from 'antd';

export const openNotification = (message: string, type: 'success' | 'error', description?: string) => {
  notification[type]({
    message,
    description,
    placement: 'topRight',
    duration: 3, // in seconds
    className: 'custom-notification', // custom class

  });
};
