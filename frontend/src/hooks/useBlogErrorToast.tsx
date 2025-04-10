import React, { useEffect, useRef } from 'react';

import { useToast } from '@edifice.io/react';
import { odeServices } from '@edifice.io/client';
import { useTranslation } from 'react-i18next';

import { BlogLayer, IBlogError } from '~/utils/BlogEvent';

/** Listen for BlogErrors and trigger toasts to notify the user about them. */
export const useBlogErrorToast = () => {
  const message = useRef<string>();
  const toast = useToast();
  const { t } = useTranslation('common');

  useEffect(() => {
    const subscription = odeServices
      .notify()
      .events()
      .subscribe(BlogLayer, (event: { data?: IBlogError }) => {
        message.current = t(event?.data?.text ?? 'e400');
        toast.error(
          React.createElement('div', { children: [message.current] }),
        );
      });

    return () => subscription.revoke();
  }, [t, toast]);

  return message.current;
};
