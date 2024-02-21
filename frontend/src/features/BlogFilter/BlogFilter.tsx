import { useEffect, useState } from "react";

import {
  Badge,
  SearchBar,
  Toolbar,
  ToolbarItem,
  useDebounce,
} from "@edifice-ui/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { useActionDefinitions } from "../ActionBar/useActionDefinitions";
import { PostState } from "~/models/post";
import { PostsFilters } from "~/models/postFilter";
import { useBlogCounter } from "~/services/queries";

export const BlogFilter = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [localPostsFilters, setLocalPostsFilter] = useState<PostsFilters>({
    state: (searchParams.get("state") as PostState) || PostState.PUBLISHED,
    search: searchParams.get("search") || "",
  });
  const debouncePostsFilters = useDebounce(localPostsFilters, 600);

  const { counters } = useBlogCounter();
  const { contrib, manager, creator } = useActionDefinitions([]);

  const handlerSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setLocalPostsFilter({ ...localPostsFilters, search: newText.toString() });
  };

  const handleFilter = (filterState: PostState) => {
    setLocalPostsFilter({
      ...localPostsFilters,
      state: filterState,
    });
  };

  useEffect(() => {
    setSearchParams(debouncePostsFilters, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncePostsFilters]);

  const filterToolbar: ToolbarItem[] = [
    {
      type: "button",
      name: "published",
      props: {
        className: clsx("fw-normal", {
          "bg-primary-200 fw-bold":
            localPostsFilters.state === PostState.PUBLISHED,
        }),
        children: (
          <span>
            <span>{t("Publiés")} </span>
            {counters?.countPublished}
          </span>
        ),
        onClick: () => {
          handleFilter(PostState.PUBLISHED);
        },
      },
    },
    {
      type: "button",
      name: "submitted",
      props: {
        className: clsx("fw-normal", {
          "bg-primary-200 fw-bold":
            localPostsFilters.state === PostState.SUBMITTED,
        }),
        children: (
          <>
            <span>{t(creator || manager ? "À valider" : "Envoyés")} </span>
            {counters?.countSubmitted ? (
              <Badge
                variant={{
                  level: "warning",
                  type: "notification",
                }}
              >
                {counters.countSubmitted}
              </Badge>
            ) : (
              0
            )}
          </>
        ),
        onClick: () => {
          handleFilter(PostState.SUBMITTED);
        },
      },
    },
    {
      type: "button",
      name: "draft",
      props: {
        className: clsx("fw-normal", {
          "bg-primary-200 fw-bold": localPostsFilters.state === PostState.DRAFT,
        }),
        children: (
          <>
            <span>{t("Brouillons")} </span>
            {counters?.countDraft}
          </>
        ),
        onClick: () => {
          handleFilter(PostState.DRAFT);
        },
      },
    },
  ];
  return (
    <div className="d-flex pb-16">
      <SearchBar
        isVariant
        className="d-none d-md-flex flex-fill"
        onChange={handlerSearch}
        placeholder={t("Rechercher un billet ou un auteur")}
        size="md"
      />
      {(manager || creator || contrib) && (
        <Toolbar
          variant="no-shadow"
          className="ps-4 py-2 ms-md-16 border border-primary-200 rounded-3 blog-filter-toolbar"
          items={filterToolbar}
        ></Toolbar>
      )}
    </div>
  );
};
