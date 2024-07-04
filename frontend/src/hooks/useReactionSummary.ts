import { useCallback, useEffect, useState } from "react";

import { useReactions } from "@edifice-ui/react";
import { ReactionSummaryData } from "edifice-ts-client";

import { useBlogState } from "~/store";

function useReactionSummary(
  postId: string,
  initialSummary?: ReactionSummaryData,
) {
  const { postsReactionsSummary } = useBlogState();
  const [reactionSummary, setReactionSummary] = useState<
    ReactionSummaryData | undefined
  >(initialSummary);
  const {
    availableReactions,
    loadReactionSummaries,
    loadReactionDetails,
    applyReaction,
  } = useReactions("blog", "post");

  const loadReactions = useCallback(async () => {
    const summary = await loadReactionSummaries([postId]);
    setReactionSummary(summary[postId]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setUserReactionChoice = useCallback(
    async (newReaction: any) => {
      if (reactionSummary) {
        const oldReaction = reactionSummary.userReaction ?? null;
        const change = await applyReaction(postId, newReaction, oldReaction);
        const newSummary = { ...reactionSummary };
        switch (change) {
          case "-":
            newSummary.totalReactionsCounter--;
            newSummary.userReaction = null;
            break;
          case "+":
            newSummary.totalReactionsCounter++;
            newSummary.userReaction = newReaction;
            break;
          case "=":
            newSummary.userReaction = newReaction;
        }
        setReactionSummary(newSummary);
      }
    },
    [applyReaction, postId, reactionSummary],
  );

  useEffect(() => {
    if (!reactionSummary && postsReactionsSummary[postId]) {
      setReactionSummary(postsReactionsSummary[postId]);
    }
  }, [postId, postsReactionsSummary, reactionSummary]);

  return {
    availableReactions,
    reactionSummary,
    setReactionSummary,
    loadReactions,
    loadReactionSummaries,
    loadReactionDetails,
    setUserReactionChoice,
  };
}

export default useReactionSummary;
