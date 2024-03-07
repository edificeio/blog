import React, { useEffect, useRef } from "react";

import { useToast } from "@edifice-ui/react";
import {
  ErrorCode,
  LayerName,
  ERROR_CODE,
  odeServices,
} from "edifice-ts-client";
import { useTranslation } from "react-i18next";

export interface IBlogError {
  code: ErrorCode;
  text: string;
}

/** Specialize a notification layer dedicated to this application. */
const BlogLayer = "blog" as LayerName;

/**  */
export const useBlogErrorToast = () => {
  const message = useRef<string>();
  const toast = useToast();
  const { t } = useTranslation("common");

  useEffect(() => {
    const subscription = odeServices
      .notify()
      .events()
      .subscribe(BlogLayer, (event: { data?: IBlogError }) => {
        message.current = t(event?.data?.text ?? "e400");
        toast.error(
          React.createElement("div", { children: [message.current] }),
        );
      });

    return () => subscription.revoke();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, toast]);

  return message.current;
};

/** Function to notify a blog error. */
export function notifyError(error: IBlogError) {
  odeServices.notify().events().publish(BlogLayer, {
    name: "error",
    data: error,
  });
}

export async function checkHttpError<T>(promise: Promise<T>) {
  // odeServices.http() methods return never-failing promises.
  // It is the responsability of the application to check for them.
  const result = await promise;
  if (!odeServices.http().isResponseError()) return result;

  notifyError({
    code: ERROR_CODE.TRANSPORT_ERROR,
    text: odeServices.http().latestResponse.statusText,
  });
  // Throw an error here. React Query will use it effectively.
  throw odeServices.http().latestResponse.statusText;
}
