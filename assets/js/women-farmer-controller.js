// ============================================================================
// GURU JI VISION — WOMEN FARMER ZONE & DISCUSSION BOARD CONTROLLER (PHASE 6)
// ============================================================================
// Modular controller keeping app.js clean and zero-flicker:
// - Manages Women Farmer Zone state (subTab, bilingual lang, scheme filters,
//   discussion category/search, expanded post threads, comments, likes, edit/reply)
// - Subscribes to per-post comments & likes via FirebaseService on demand
// - Connects directly to Phase 5 Scheme Detail view (zero duplicate scheme pages)
// - Preserves caret focus during bilingual search input typing
// ============================================================================

import { firebaseService } from "./firebase-service.js";
import { filterWomenDiscussions } from "./women-farmer-data.js";

export function createInitialWomenFarmerState() {
  return {
    subTab: "dashboard", // "dashboard" | "schemes" | "discussion" | "rights"
    lang: "", // "" inherits app lang, or explicit "EN" | "BN"
    schemeMode: "ALL", // "ALL" | "WOMEN_DEDICATED" | "GENERAL_ELIGIBLE"
    schemeState: "ALL",
    schemeCategory: "ALL",
    schemeSearch: "",
    discussionCategory: "ALL",
    discussionSearch: "",
    editingPostId: "",
    editingComment: null, // { postId, commentId }
    replyingTo: null, // { postId, commentId, authorName }
    expandedPostIds: {}, // { [postId]: true }
    commentsByPost: {}, // { [postId]: Array<Comment> }
    likesByPost: {} // { [postId]: Array<Like> }
  };
}

export function clearWomenFarmerTransientState(state) {
  if (!state.womenFarmer) return;
  state.womenFarmer.editingPostId = "";
  state.womenFarmer.editingComment = null;
  state.womenFarmer.replyingTo = null;
  state.womenFarmer.expandedPostIds = {};
  state.womenFarmer.commentsByPost = {};
  state.womenFarmer.likesByPost = {};
}

export function bindWomenFarmerEvents({
  state,
  renderActiveView,
  showToast,
  withBusySubmit,
  openAuthModal,
  navigateTo
}) {
  const subscribedLikePostIds = new Set();

  const ensureWfState = () => {
    if (!state.womenFarmer) state.womenFarmer = createInitialWomenFarmerState();
    return state.womenFarmer;
  };

  const renderSearchPreservingFocus = (inputId, selectionStart, selectionEnd) => {
    renderActiveView();
    const el = document.getElementById(inputId);
    if (el) {
      el.focus();
      if (typeof selectionStart === "number" && typeof selectionEnd === "number") {
        try {
          el.setSelectionRange(selectionStart, selectionEnd);
        } catch (_) {}
      }
    }
  };

  const unsubscribeAllVisiblePostLikes = () => {
    for (const postId of subscribedLikePostIds) {
      firebaseService.unsubscribePostLikes(postId);
    }
    subscribedLikePostIds.clear();
  };

  const subscribeVisiblePostLikes = () => {
    const wf = ensureWfState();
    if (state.route !== "women-farmer" || wf.subTab !== "discussion") {
      unsubscribeAllVisiblePostLikes();
      return;
    }
    const posts = filterWomenDiscussions(
      state.communityPosts || [],
      { category: wf.discussionCategory, search: wf.discussionSearch },
      Boolean(state.isAdmin)
    ).slice(0, 25);

    const visibleIds = new Set(posts.map((p) => p.id));
    for (const postId of Array.from(subscribedLikePostIds)) {
      if (!visibleIds.has(postId) && !wf.expandedPostIds?.[postId]) {
        firebaseService.unsubscribePostLikes(postId);
        subscribedLikePostIds.delete(postId);
      }
    }

    posts.forEach((p) => {
      if (subscribedLikePostIds.has(p.id)) return;
      subscribedLikePostIds.add(p.id);
      firebaseService.subscribePostLikes(p.id, (likes) => {
        wf.likesByPost[p.id] = likes;
        if (state.route === "women-farmer" && wf.subTab === "discussion") {
          renderActiveView({ fromLiveUpdate: true });
        }
      });
    });
  };

  const openPostComments = (postId) => {
    const wf = ensureWfState();
    wf.expandedPostIds[postId] = true;
    firebaseService.subscribePostComments(postId, Boolean(state.isAdmin), (comments) => {
      wf.commentsByPost[postId] = comments;
      if (state.route === "women-farmer" && wf.subTab === "discussion") {
        renderActiveView({ fromLiveUpdate: true });
      }
    });
    subscribedLikePostIds.add(postId);
    firebaseService.subscribePostLikes(postId, (likes) => {
      wf.likesByPost[postId] = likes;
      if (state.route === "women-farmer" && wf.subTab === "discussion") {
        renderActiveView({ fromLiveUpdate: true });
      }
    });
  };

  // CLICK EVENTS
  document.addEventListener("click", async (e) => {
    const target = e.target.closest(
      "[data-wf-lang], [data-wf-tab], [data-wf-area-action], [data-wf-scheme-mode], " +
      "[data-wf-reset-scheme-filters], [data-wf-open-scheme-detail], [data-wf-disc-cat], " +
      "[data-wf-like-post], [data-wf-toggle-comments], [data-wf-edit-post], [data-wf-cancel-edit-post], " +
      "[data-wf-del-post], [data-wf-mod-post], [data-wf-report-post], [data-wf-reply-comment], " +
      "[data-wf-cancel-reply], [data-wf-edit-comment], [data-wf-cancel-edit-comment], " +
      "[data-wf-del-comment], [data-wf-mod-comment], [data-wf-report-comment]"
    );
    if (!target) return;
    const wf = ensureWfState();

    // 1. Bilingual EN / BN switcher
    if (target.dataset.wfLang) {
      wf.lang = target.dataset.wfLang === "BN" ? "BN" : "EN";
      renderActiveView();
      return;
    }

    // 2. Sub-tab switcher
    if (target.dataset.wfTab) {
      wf.subTab = target.dataset.wfTab;
      renderActiveView();
      if (wf.subTab === "discussion") subscribeVisiblePostLikes();
      else unsubscribeAllVisiblePostLikes();
      return;
    }

    // 3. Dashboard 15-area action routing
    if (target.dataset.wfAreaAction) {
      const action = target.dataset.wfAreaAction;
      const val = target.dataset.wfAreaValue || "";
      if (action === "wf-schemes") {
        wf.subTab = "schemes";
        wf.schemeMode = val || "ALL";
        wf.schemeCategory = "ALL";
        unsubscribeAllVisiblePostLikes();
        renderActiveView();
      } else if (action === "wf-scheme-cat") {
        wf.subTab = "schemes";
        wf.schemeMode = "ALL";
        wf.schemeCategory = val || "ALL";
        unsubscribeAllVisiblePostLikes();
        renderActiveView();
      } else if (action === "wf-scheme-detail") {
        if (state.farmerFinance) {
          state.farmerFinance.subTab = "schemes";
          state.farmerFinance.selectedSchemeId = val;
        }
        unsubscribeAllVisiblePostLikes();
        state.lastZone = "farmer-zone";
        navigateTo("farmer-finance");
      } else if (action === "wf-discussion") {
        wf.subTab = "discussion";
        wf.discussionCategory = val || "ALL";
        renderActiveView();
        subscribeVisiblePostLikes();
      } else if (action === "wf-rights") {
        wf.subTab = "rights";
        unsubscribeAllVisiblePostLikes();
        renderActiveView();
      } else if (action === "route" && val) {
        unsubscribeAllVisiblePostLikes();
        state.lastZone = "farmer-zone";
        navigateTo(val);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 4. Scheme mode & reset
    if (target.dataset.wfSchemeMode) {
      wf.schemeMode = target.dataset.wfSchemeMode;
      renderActiveView();
      return;
    }
    if (target.dataset.wfResetSchemeFilters) {
      wf.schemeMode = "ALL";
      wf.schemeState = "ALL";
      wf.schemeCategory = "ALL";
      wf.schemeSearch = "";
      renderActiveView();
      return;
    }

    // 5. Open full Phase 5 Scheme Detail Page directly (Zero Duplication!)
    if (target.dataset.wfOpenSchemeDetail) {
      const schemeId = target.dataset.wfOpenSchemeDetail;
      if (state.farmerFinance) {
        state.farmerFinance.subTab = "schemes";
        state.farmerFinance.selectedSchemeId = schemeId;
        if (wf.lang === "BN" || wf.lang === "EN") {
          state.farmerFinance.schemeLang = wf.lang;
        }
      }
      unsubscribeAllVisiblePostLikes();
      state.lastZone = "farmer-zone";
      navigateTo("farmer-finance");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // 6. Discussion category filter
    if (target.dataset.wfDiscCat) {
      wf.discussionCategory = target.dataset.wfDiscCat;
      renderActiveView();
      subscribeVisiblePostLikes();
      return;
    }

    // 7. Toggle per-user like / support on a post
    if (target.dataset.wfLikePost) {
      if (!state.user) {
        openAuthModal();
        return;
      }
      const postId = target.dataset.wfLikePost;
      const alreadyLiked = target.dataset.wfLiked === "1";
      try {
        await firebaseService.togglePostLike(postId, state.user.uid, alreadyLiked, "SUPPORT");
        firebaseService.subscribePostLikes(postId, (likes) => {
          wf.likesByPost[postId] = likes;
          if (state.route === "women-farmer") renderActiveView({ fromLiveUpdate: true });
        });
        showToast(alreadyLiked ? "Reaction removed." : "Marked helpful & supportive!");
      } catch (err) {
        showToast(err.message || "Unable to update reaction.", true);
      }
      return;
    }

    // 8. Expand / collapse threaded comments & replies
    if (target.dataset.wfToggleComments) {
      const postId = target.dataset.wfToggleComments;
      if (wf.expandedPostIds[postId]) {
        delete wf.expandedPostIds[postId];
        firebaseService.unsubscribePostComments(postId);
      } else {
        openPostComments(postId);
      }
      renderActiveView();
      return;
    }

    // 9. Edit own post
    if (target.dataset.wfEditPost) {
      const postId = target.dataset.wfEditPost;
      const post = (state.communityPosts || []).find((p) => p.id === postId);
      if (post && state.user && post.authorId === state.user.uid) {
        wf.editingPostId = post.id;
        renderActiveView();
        document.getElementById("wfPostForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    if (target.dataset.wfCancelEditPost) {
      wf.editingPostId = "";
      renderActiveView();
      return;
    }

    // 10. Delete own post (or Admin delete)
    if (target.dataset.wfDelPost) {
      if (!state.user) { openAuthModal(); return; }
      const postId = target.dataset.wfDelPost;
      if (!confirm("Delete this discussion post permanently?")) return;
      try {
        await firebaseService.deleteCommunityPost(postId);
        if (wf.editingPostId === postId) wf.editingPostId = "";
        delete wf.expandedPostIds[postId];
        delete wf.commentsByPost[postId];
        delete wf.likesByPost[postId];
        firebaseService.unsubscribePostComments(postId);
        firebaseService.unsubscribePostLikes(postId);
        showToast("Discussion post deleted.");
        renderActiveView();
      } catch (err) {
        showToast(err.message || "Unable to delete post.", true);
      }
      return;
    }

    // 11. Moderator Hide / Restore post (Admin only)
    if (target.dataset.wfModPost) {
      if (!state.isAdmin) return;
      try {
        await firebaseService.moderateCommunityPost(target.dataset.wfModPost, target.dataset.wfModStatus);
        showToast(target.dataset.wfModStatus === "HIDDEN" ? "Post hidden by moderator." : "Post restored.");
      } catch (err) {
        showToast(err.message || "Moderation failed.", true);
      }
      return;
    }

    // 12. Report inappropriate post
    if (target.dataset.wfReportPost) {
      if (!state.user) { openAuthModal(); return; }
      const post = (state.communityPosts || []).find((p) => p.id === target.dataset.wfReportPost);
      const reason = prompt("Why are you reporting this post? (Spam, abuse, misinformation, personal data, etc.)");
      if (post && reason && reason.trim().length >= 3) {
        try {
          await firebaseService.reportCommunityPost(
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Member",
            post,
            reason
          );
          showToast("Report submitted to Admin Moderation.");
        } catch (err) {
          showToast(err.message || "Unable to submit report.", true);
        }
      }
      return;
    }

    // 13. Reply to comment
    if (target.dataset.wfReplyComment) {
      if (!state.user) { openAuthModal(); return; }
      wf.replyingTo = {
        postId: target.dataset.wfReplyComment,
        commentId: target.dataset.wfParentId || "",
        authorName: target.dataset.wfParentAuthor || "Member"
      };
      openPostComments(wf.replyingTo.postId);
      renderActiveView();
      return;
    }
    if (target.dataset.wfCancelReply) {
      wf.replyingTo = null;
      renderActiveView();
      return;
    }

    // 14. Edit own comment
    if (target.dataset.wfEditComment) {
      if (!state.user) { openAuthModal(); return; }
      wf.editingComment = {
        postId: target.dataset.wfEditComment,
        commentId: target.dataset.wfCommentId || ""
      };
      renderActiveView();
      return;
    }
    if (target.dataset.wfCancelEditComment) {
      wf.editingComment = null;
      renderActiveView();
      return;
    }

    // 15. Delete own comment (or Admin delete)
    if (target.dataset.wfDelComment) {
      if (!state.user) { openAuthModal(); return; }
      const postId = target.dataset.wfDelComment;
      const commentId = target.dataset.wfCommentId;
      if (!confirm("Delete this comment?")) return;
      try {
        await firebaseService.deletePostComment(postId, commentId);
        if (wf.editingComment?.commentId === commentId) wf.editingComment = null;
        showToast("Comment deleted.");
      } catch (err) {
        showToast(err.message || "Unable to delete comment.", true);
      }
      return;
    }

    // 16. Moderator Hide / Restore comment (Admin only)
    if (target.dataset.wfModComment) {
      if (!state.isAdmin) return;
      try {
        await firebaseService.moderatePostComment(
          target.dataset.wfModComment,
          target.dataset.wfCommentId,
          target.dataset.wfModStatus
        );
        showToast(target.dataset.wfModStatus === "HIDDEN" ? "Comment hidden by moderator." : "Comment restored.");
      } catch (err) {
        showToast(err.message || "Unable to moderate comment.", true);
      }
      return;
    }

    // 17. Report inappropriate comment
    if (target.dataset.wfReportComment) {
      if (!state.user) { openAuthModal(); return; }
      const postId = target.dataset.wfReportComment;
      const commentId = target.dataset.wfCommentId;
      const comment = (wf.commentsByPost[postId] || []).find((c) => c.id === commentId);
      const reason = prompt("Why are you reporting this comment? (Spam, abuse, misinformation, etc.)");
      if (comment && reason && reason.trim().length >= 3) {
        try {
          await firebaseService.reportCommunityComment(
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Member",
            postId,
            comment,
            reason
          );
          showToast("Comment report submitted to Admin Moderation.");
        } catch (err) {
          showToast(err.message || "Unable to submit report.", true);
        }
      }
      return;
    }
  });

  // INPUT & CHANGE EVENTS (Caret-preserving bilingual search + State/Category dropdowns)
  document.addEventListener("input", (e) => {
    const wf = ensureWfState();
    if (e.target.id === "wfSchemeSearch") {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      wf.schemeSearch = e.target.value;
      renderSearchPreservingFocus("wfSchemeSearch", start, end);
      return;
    }
    if (e.target.id === "wfDiscussionSearch") {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      wf.discussionSearch = e.target.value;
      renderSearchPreservingFocus("wfDiscussionSearch", start, end);
      return;
    }
  });

  document.addEventListener("change", (e) => {
    const wf = ensureWfState();
    if (e.target.id === "wfSchemeState") {
      wf.schemeState = e.target.value || "ALL";
      renderActiveView();
      return;
    }
    if (e.target.id === "wfSchemeCategory") {
      wf.schemeCategory = e.target.value || "ALL";
      renderActiveView();
      return;
    }
  });

  // SUBMIT EVENTS (Create/Edit Post, Add Comment/Reply, Edit Comment)
  document.addEventListener("submit", async (e) => {
    const form = e.target;
    const wf = ensureWfState();

    // Create / Edit Women Farmer Discussion Post
    if (form.id === "wfPostForm") {
      e.preventDefault();
      if (!state.user) { openAuthModal(); return; }
      const editId = document.getElementById("wfPostEditId")?.value || "";
      const category = document.getElementById("wfPostCategory")?.value || "GENERAL";
      const district = document.getElementById("wfPostDistrict")?.value?.trim() || "";
      const title = document.getElementById("wfPostTitle")?.value?.trim() || "";
      const body = document.getElementById("wfPostBody")?.value?.trim() || "";
      if (title.length < 3 || body.length < 5) {
        showToast("Please enter a title (min 3 chars) and message (min 5 chars).", true);
        return;
      }

      await withBusySubmit(form, async () => {
        try {
          await firebaseService.saveCommunityPost(
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Women Farmer Member",
            {
              board: "WOMEN_FARMER",
              topic: "FARM_TALK",
              collegeGroup: "Women Farmer Zone",
              category,
              district,
              title,
              body
            },
            editId
          );
          wf.editingPostId = "";
          form.reset();
          showToast(editId ? "Discussion post updated!" : "Discussion published to Women Farmer Board!");
          renderActiveView();
        } catch (err) {
          showToast(err.message || "Unable to save discussion post.", true);
        }
      });
      return;
    }

    // Add Comment or Reply
    if (form.dataset.wfCommentForm) {
      e.preventDefault();
      if (!state.user) { openAuthModal(); return; }
      const postId = form.dataset.wfCommentForm;
      const bodyInput = form.querySelector("input[name='body'], textarea[name='body']");
      const parentInput = form.querySelector("input[name='parentCommentId']");
      const body = bodyInput?.value?.trim() || "";
      const parentCommentId = parentInput?.value?.trim() || "";
      if (!body) return;

      await withBusySubmit(form, async () => {
        try {
          await firebaseService.savePostComment(
            postId,
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Member",
            { body, parentCommentId },
            ""
          );
          wf.replyingTo = null;
          if (bodyInput) bodyInput.value = "";
          showToast(parentCommentId ? "Reply added!" : "Comment posted!");
        } catch (err) {
          showToast(err.message || "Unable to post comment.", true);
        }
      });
      return;
    }

    // Save Edited Comment
    if (form.dataset.wfEditCommentForm) {
      e.preventDefault();
      if (!state.user) { openAuthModal(); return; }
      const postId = form.dataset.wfEditCommentForm;
      const commentId = form.dataset.wfCommentId;
      const bodyInput = form.querySelector("textarea[name='body']");
      const body = bodyInput?.value?.trim() || "";
      if (!body) return;

      await withBusySubmit(form, async () => {
        try {
          await firebaseService.savePostComment(
            postId,
            state.user.uid,
            state.userProfile?.displayName || state.user.displayName || "Member",
            { body },
            commentId
          );
          wf.editingComment = null;
          showToast("Comment updated!");
          renderActiveView();
        } catch (err) {
          showToast(err.message || "Unable to update comment.", true);
        }
      });
      return;
    }
  });
}
