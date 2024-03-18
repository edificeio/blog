import { Button, EmptyScreen, usePaths } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";
import { useRouteError } from "react-router-dom";

export default function PublicPageError() {
  const error = useRouteError();
  console.error(error);

  const { t } = useTranslation();

  const [imagePath] = usePaths();

  return (
    <main className="container-fluid d-flex flex-column bg-white">
      <div className="d-flex flex-column gap-16 align-items-center mt-64">
        <EmptyScreen
          imageSrc={`${imagePath}/emptyscreen/illu-error.svg`}
          imageAlt={t("explorer.emptyScreen.error.alt")}
          title={t("oops")}
          text={t("notfound", {
            ns: "blog",
          })}
        />
        <Button
          color="primary"
          onClick={() => {
            window.location.href = "/blog";
          }}
        >
          {t("back")}
        </Button>
      </div>
    </main>
  );
}
