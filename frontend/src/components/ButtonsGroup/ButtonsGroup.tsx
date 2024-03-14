import clsx from "clsx";

export interface ButtonsGroupProps {
  className?: string;
  children: Array<JSX.Element | false>;
  variant?: "reverse";
}

export const ButtonsGroup = ({
  className,
  variant,
  children,
}: ButtonsGroupProps) => {
  const classes = clsx(
    "d-flex flex-fill align-items-center justify-content-end",
    className,
    {
      "align-self-end flex-wrap-reverse": variant === "reverse",
    },
  );
  return <div className={classes}>{children}</div>;
};
