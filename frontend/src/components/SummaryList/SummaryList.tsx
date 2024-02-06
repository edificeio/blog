/* eslint-disable jsx-a11y/click-events-have-key-events */
import { useOdeClient } from "@edifice-ui/react";

import { dayjs } from "~/utils/dayjs";

// TODO Move to edifice-ui (don't forget css) css

export type SummaryListProps = {
  /**
   * Items to display
   */
  list: SummaryListObject[];

  /**
   * Action on click
   */
  onClick?: (item: SummaryListObject) => void;
};

export type SummaryListObject = {
  id: string;
  title: string;
  date: string;
};

export const SummaryList = ({ list, onClick }: SummaryListProps) => {
  const { currentLanguage } = useOdeClient();
  const displayDate = (date: string) => {
    return dayjs(date)
      .locale(currentLanguage as string)
      .format("D MMM YYYY");
  };

  const handleOnClick = (item: SummaryListObject) => {
    onClick?.(item);
  };

  return (
    <div className="pt-8">
      {list.map((item /*, index*/) => (
        <div
          className="pb-8 d-flex summary-list-item"
          key={item.id}
          onClick={() => {
            handleOnClick(item);
          }}
          role="button"
          tabIndex={0}
        >
          <div className="summary-list-item-symbole text-primary">
            <div className="summary-list-item-symbole-circle"></div>
          </div>
          <div className="flex-fill">
            <div>{item.title}</div>
            <em className="small text-gray-700">
              {item.date && displayDate(item.date)}
            </em>
          </div>
        </div>
      ))}
    </div>
  );
};
