(globalThis["webpackChunkverso"] = globalThis["webpackChunkverso"] || []).push([[1063],{

/***/ 39252:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Commenting = void 0;
const prop_types_1 = __importDefault(__webpack_require__(5556));
const react_1 = __importStar(__webpack_require__(96540));
const react_intl_1 = __webpack_require__(46984);
const utils_1 = __webpack_require__(67116);
const Ad_1 = __importDefault(__webpack_require__(31850));
const message_banner_1 = __importDefault(__webpack_require__(62282));
const payment_gateway_1 = __webpack_require__(92807);
const styles_1 = __webpack_require__(16631);
const sticky_box_1 = __importDefault(__webpack_require__(28433));
const track_component_1 = __webpack_require__(78788);
const screen_1 = __webpack_require__(55030);
const grid_1 = __importDefault(__webpack_require__(86659));
const ReviewListContainer_1 = __importDefault(__webpack_require__(24300));
const review_notes_1 = __importDefault(__webpack_require__(76584));
const user_name_modal_1 = __importDefault(__webpack_require__(64837));
const translations_1 = __importDefault(__webpack_require__(92867));
const utils_2 = __webpack_require__(85554);
const CommentingMessageBanner_1 = __importDefault(__webpack_require__(392));
const tracking_1 = __webpack_require__(75454);
const MESSAGE_BANNER_DELAY = 3000;
const REVIEW_LIST_TITLE = 'ReviewListTitle';
const COMMENTING_SECTION_CLASS = 'CommentingMainContent';
const DEFAULT_TAGS = [
    {
        active: false,
        description: 'Includes a tip',
        label: 'Tip',
        // slug should match with TAG type of coral
        slug: 'TIP'
    },
    {
        active: false,
        description: 'Includes a question',
        label: 'Question',
        // slug should match with TAG type of coral
        slug: 'QUESTION'
    }
];
/**
 * Commenting component
 *
 * @param {object} props - React props
 * @param {string} props.brandName - The brand name of the site
 * @param {string} props.closeCommentStreamMessage - Optional message to display when comment stream is closed
 * @param {number} props.commentCount - The number of comments
 * @param {string} props.commentingUrl - URL for the API where comments are stored
 * @param {object} props.communityExperience - Object containing attributes needed for community experience, configured in interfaces
 * @param {string} props.communityExperience.commentsOrderBy - Value to set comments ordering
 * @param {string} props.communityExperience.repliesOrderBy - Value to set replies ordering
 * @param {boolean} props.communityExperience.disableCommentStream - flag to disable adding comment
 * @param {boolean} props.communityExperience.enableMultipleComments - flag to enable multiple comments
 * @param {boolean} props.communityExperience.enableMultipleRatings - flag to enable multiple ratings
 * @param {boolean} props.communityExperience.enableRatings - flag to enable ratings
 * @param {boolean} props.communityExperience.enableReplies - flag to enable replies
 * @param {boolean} props.communityExperience.enableTags - Optional flag to enable tags in comments
 * @param {boolean} props.communityExperience.enableUpvotes - flag to enable upvotes
 * @param {boolean} props.communityExperience.hasHideCommunityFunctionalTag - flag to enable reviews
 * @param {string} props.communityExperience.noCommentsYetIcon - SVG icon string displayed when there are no comments yet
 * @param {string} props.communityExperience.joinCommunityIcon - SVG icon string displayed for join community message when user is logged out
 * @param {string} props.communityExperience.commentSubmittedIcon - SVG icon string displayed when a comment is successfully submitted
 * @param {string} props.communityExperience.commentsClosedIcon - SVG icon string displayed when comments are disabled/closed
 * @param {string} props.communityUrl - path of guidelines
 * @param {Element} [props.ContentWrapper] - content wrapper component
 * @param {number} props.defaultReplyLimit - the number of replies
 * @param {object} props.noCommentsMsgConf - Optional object that has empty comment message hed, dek etc.
 * @param {string} props.hed - content hed
 * @param {boolean} props.hasImageUpload - flag to enable image upload in comments
 * @param {string} props.id - content id
 * @param {boolean} props.isCommentLoading - Flag to check if the get commentsAPI call is in progress
 * @param {object} [props.imageUpload] - props for imageUpload
 * @param {object} [props.imageUpload.spectraUrl] - spectraUrl for image display
 * @param {object} [props.communityLogo] - brand logo for pinned comments
 * @param {number} props.initialReviewLimit - number of reviews to fetch
 * @param {string} props.likeActionErrorMessage - error message when liking a message
 * @param {string} props.organizationId - Organization ID of the domain
 * @param {Array} props.commentingRestrictedTo - Optional array of membership, allowed where commenting will be displayed
 * @param {number} props.replyLimit - Limit for the number of replies
 * @param {string} props.reviewerBadges - Array of role and badge for the reviewer badge
 * @param {number} props.reviewLimit - Limit for the number of reviews
 * @param {object} props.reviewModalProps - Object containing props for the review modal
 * @param {boolean} props.reviewNotesFormSignInURL - sign in url for the review notes form
 * @param {Array} props.reviewNoteTags - Array of tags for the comment section
 * @param {string} props.reviewerInfoText - Text for the reviewer info alert
 * @param {string} props.reviewsSectionTitle - Text for the comment section title
 * @param {boolean} props.isBookmarkingEnabled - If the message banner bookmark button should be shown
 * @param {string} props.showMoreButtonLabel - Label for the show more button
 * @param {string} props.signInHed - Hed for the sign in modal
 * @param {string} props.signInHedSpanTag - Hed span tag on sign in modal
 * @param {string} props.signInMessage - Message for the sign in modal
 * @param {string} props.tenantID - ID of the tenant
 * @param {string} props.unlikeActionErrorMessage - error message when unliking a message
 * @param {object} props.user - User information
 * @param {string} props.signUpMessageBannerHed - Optional text to sign Up
 * @param {object} props.savedCommentConf - Optional object that has saved comment message hed, dek, subcontent and trail
 * @param {object} props.usernameModalConf - Create username modal config
 * @param {bool} [props.shouldUseFullOpacity] - Optional flag to increase opacity if brands backrgound.brand token is light
 * @param {bool} [props.shouldUseAlternateColorToken] - Optional flag to change font color if token is light
 * @param {bool} [props.shouldUseDarkPinnedTheme] - Optional flag to use dark theme (black colors) for pinned comments section instead of brand colors

 * @returns {ReactElement} <div>
 */
// eslint-disable-next-line complexity
const Commenting = ({ brandName, closeCommentStreamMessage, commentCount, commentingRestrictedTo, commentingUrl, communityExperience: { commentsOrderBy, repliesOrderBy, disableCommentStream, enableMultipleComments, enableMultipleRatings, enableRatings, enableReplies, enableTags, enableUpvotes, hasHideCommunityFunctionalTag, noCommentsYetIcon, joinCommunityIcon, commentSubmittedIcon, commentsClosedIcon }, communityUrl = '/info/community-guidelines', ContentWrapper = grid_1.default.ContentWithAdRailNarrow, defaultReplyLimit = 1, hed, hasImageUpload = false, id, imageUpload: { spectraUrl } = {}, isCommentLoading = true, initialReviewLimit = 7, likeActionErrorMessage, communityLogo, noCommentsMsgConf, organizationId, replyLimit = 10, reviewerBadges, reviewerInfoText, reviewLimit = 10, reviewModalProps, reviewNotesFormSignInURL, reviewNoteTags = DEFAULT_TAGS, reviewsSectionTitle, isBookmarkingEnabled, savedCommentConf, shouldUseAlternateColorToken = false, shouldUseFullOpacity = false, shouldUseDarkPinnedTheme = false, showMoreButtonLabel, signInHed, signInHedSpanTag, signInMessage, signUpMessageBannerHed, tenantID, unlikeActionErrorMessage, user, usernameModalConf }) => {
    react_1.default.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(track_component_1.TrackComponentChannel.RENDER, {
            name: 'Commenting'
        });
    }, []);
    const [siteUserName, setSiteUserName] = (0, react_1.useState)();
    const [showMessageBanner, setShowMessageBanner] = (0, react_1.useState)(false);
    const [toastMessage, setToastMessage] = (0, react_1.useState)(null);
    const [showCommentSavedMessage, setShowCommentSavedMessage] = (0, react_1.useState)(false);
    (0, utils_2.useScrollToCommenting)(COMMENTING_SECTION_CLASS);
    const { header, description, showSignInButton, subContent, commentMessageBannerIcon } = (0, utils_2.useCommentBannerContent)({
        noCommentsMsgConf,
        disableCommentStream,
        closeCommentStreamMessage,
        showCommentSavedMessage,
        communityUrl,
        isCommentLoading,
        commentCount,
        user,
        signUpMessageBannerHed,
        brandName,
        savedCommentConf,
        noCommentsYetIcon,
        joinCommunityIcon,
        commentSubmittedIcon,
        commentsClosedIcon
    });
    const userIsLoggedIn = user.isAuthenticated && user.amguuid && organizationId;
    const isEntitled = (0, utils_2.hasAccessToCommenting)(commentingRestrictedTo);
    (0, react_1.useEffect)(() => {
        async function checkIfUsernameExists() {
            try {
                const response = await (0, utils_1.checkUsername)(user.amguuid, organizationId, commentingUrl);
                setSiteUserName(response);
            }
            catch (error) {
                console.warn(error);
                throw error;
            }
        }
        userIsLoggedIn && checkIfUsernameExists();
    }, [userIsLoggedIn, commentingUrl, user.amguuid, organizationId]);
    (0, screen_1.useViewportObserver)(`.${REVIEW_LIST_TITLE}`, undefined, (isInViewport) => {
        if (isInViewport && commentCount) {
            (0, tracking_1.trackCommunityCommentsImpression)(commentCount, 'community');
        }
    }, [commentCount]);
    const { formatMessage } = (0, react_intl_1.useIntl)();
    if (hasHideCommunityFunctionalTag)
        return null;
    if (!isEntitled)
        return null;
    const handleUsernameChange = (newValue) => {
        setSiteUserName(newValue);
    };
    const showMessageBannerHandler = (message) => {
        setToastMessage(message);
        setShowMessageBanner(true);
        setTimeout(() => {
            setShowMessageBanner(false);
        }, MESSAGE_BANNER_DELAY);
    };
    const showCommentSavedMessageHandler = (val) => {
        setShowCommentSavedMessage(val);
    };
    return (react_1.default.createElement(ContentWrapper, null,
        react_1.default.createElement("div", { className: COMMENTING_SECTION_CLASS, "data-journey-hook": "page-footer" },
            react_1.default.createElement(styles_1.ReviewListTitleWrapper, null,
                react_1.default.createElement(styles_1.ReviewListTitle, { className: REVIEW_LIST_TITLE }, (0, utils_2.formatReviewListTitle)(commentCount, reviewsSectionTitle)),
                react_1.default.createElement(styles_1.ReviewListUtilityLink, { href: "#main-content" },
                    formatMessage(translations_1.default.utilityLabel),
                    react_1.default.createElement(styles_1.ReviewListCarat, null))),
            user.isAuthenticated && (react_1.default.createElement(user_name_modal_1.default, { organizationId: organizationId, userId: user.amguuid, userApiUrl: commentingUrl, showMessageBannerHandler: showMessageBannerHandler, usernameModalConf: usernameModalConf })),
            (header || description) && (react_1.default.createElement(CommentingMessageBanner_1.default, { hed: header, dek: description, showSignInButton: showSignInButton, signInURL: reviewNotesFormSignInURL, isBookmarkingEnabled: isBookmarkingEnabled, subContentDek: subContent, showCommentSavedMessage: showCommentSavedMessage, commentMessageBannerIcon: commentMessageBannerIcon })),
            !disableCommentStream && (react_1.default.createElement(review_notes_1.default, { commentingUrl: commentingUrl, contentId: id, handleUsernameChange: handleUsernameChange, hed: hed, organizationId: organizationId, reviewerInfoText: reviewerInfoText, reviewNoteTags: reviewNoteTags, shouldEnableMultipleComments: enableMultipleComments, shouldEnableMultipleRatings: enableMultipleRatings, shouldEnableRatings: enableRatings, shouldEnableTags: enableTags, hasImageUpload: hasImageUpload, showMessageBannerHandler: showMessageBannerHandler, showSavedRecipeNotes: showCommentSavedMessageHandler, signInURL: reviewNotesFormSignInURL, siteUserName: siteUserName, tenantID: tenantID, userId: user.isAuthenticated ? user.amguuid : null, usernameSignInDek: usernameModalConf?.dek, contentTitle: hed, shouldUseFullOpacity: shouldUseFullOpacity })),
            react_1.default.createElement(ReviewListContainer_1.default, { shouldUseAlternateColorToken: shouldUseAlternateColorToken, shouldUseFullOpacity: shouldUseFullOpacity, shouldUseDarkPinnedTheme: shouldUseDarkPinnedTheme, commentingUrl: commentingUrl, defaultReplyLimit: defaultReplyLimit, entityId: id, handleUsernameChange: handleUsernameChange, id: "reviews", initialReviewLimit: initialReviewLimit, likeActionErrorMessage: likeActionErrorMessage, replyLimit: replyLimit, commentsOrderBy: commentsOrderBy, repliesOrderBy: repliesOrderBy, reviewerBadges: reviewerBadges, reviewLimit: reviewLimit, shouldEnableRatings: enableRatings, shouldEnableReply: enableReplies, communityLogo: communityLogo, shouldEnableTags: enableTags, shouldEnableUpvotes: enableUpvotes, showMessageBannerHandler: showMessageBannerHandler, showMoreButtonLabel: showMoreButtonLabel, signInHed: signInHed || formatMessage(translations_1.default.signInModalHed), signInHedSpanTag: signInHedSpanTag ||
                    formatMessage(translations_1.default.signInModalHedSpanTag, {
                        brandName
                    }), signInMessage: signInMessage || formatMessage(translations_1.default.signInModalMessage), reviewModalProps: reviewModalProps || {
                    hed: formatMessage(translations_1.default.replyDiscardModalHed)
                }, reviewNoteTags: reviewNoteTags, siteUserName: siteUserName, unlikeActionErrorMessage: unlikeActionErrorMessage, user: user, usernameSignInDek: usernameModalConf?.dek, organizationId: organizationId, contentTitle: hed, hasImageUpload: hasImageUpload, spectraUrl: spectraUrl })),
        react_1.default.createElement(sticky_box_1.default, null,
            react_1.default.createElement("aside", { "data-testid": "ReviewFeedbackAside" },
                react_1.default.createElement(payment_gateway_1.PaymentGateway, { group: "ads" },
                    react_1.default.createElement(Ad_1.default, { position: "rail" })))),
        showMessageBanner && (react_1.default.createElement(message_banner_1.default, { contentAlign: "center", isFixed: true, position: "top-centre", shouldShowCloseButton: true, isDisclaimer: true, delayDuration: MESSAGE_BANNER_DELAY },
            react_1.default.createElement("p", null, toastMessage)))));
};
exports.Commenting = Commenting;
exports.Commenting.propTypes = {
    brandName: prop_types_1.default.string,
    closeCommentStreamMessage: prop_types_1.default.string,
    commentCount: prop_types_1.default.number,
    commentingRestrictedTo: prop_types_1.default.arrayOf(prop_types_1.default.string),
    commentingUrl: prop_types_1.default.string.isRequired,
    communityExperience: prop_types_1.default.shape({
        commentsOrderBy: prop_types_1.default.string,
        repliesOrderBy: prop_types_1.default.string,
        disableCommentStream: prop_types_1.default.bool,
        enableMultipleComments: prop_types_1.default.bool,
        enableMultipleRatings: prop_types_1.default.bool,
        enableRatings: prop_types_1.default.bool,
        enableReplies: prop_types_1.default.bool,
        enableTags: prop_types_1.default.bool,
        enableUpvotes: prop_types_1.default.bool,
        hasHideCommunityFunctionalTag: prop_types_1.default.bool,
        noCommentsYetIcon: prop_types_1.default.string,
        joinCommunityIcon: prop_types_1.default.string,
        commentSubmittedIcon: prop_types_1.default.string,
        commentsClosedIcon: prop_types_1.default.string
    }),
    communityLogo: prop_types_1.default.object,
    communityUrl: prop_types_1.default.string,
    ContentWrapper: prop_types_1.default.elementType,
    defaultReplyLimit: prop_types_1.default.number,
    hasImageUpload: prop_types_1.default.bool,
    hed: prop_types_1.default.string.isRequired,
    id: prop_types_1.default.string.isRequired,
    imageUpload: prop_types_1.default.shape({
        spectraUrl: prop_types_1.default.string
    }),
    initialReviewLimit: prop_types_1.default.number,
    isBookmarkingEnabled: prop_types_1.default.bool,
    isCommentLoading: prop_types_1.default.bool,
    likeActionErrorMessage: prop_types_1.default.string,
    noCommentsMsgConf: prop_types_1.default.object,
    organizationId: prop_types_1.default.string.isRequired,
    replyLimit: prop_types_1.default.number,
    reviewerBadges: prop_types_1.default.arrayOf(prop_types_1.default.shape({
        role: prop_types_1.default.string,
        badge: prop_types_1.default.string
    })),
    reviewerInfoText: prop_types_1.default.string,
    reviewLimit: prop_types_1.default.number,
    reviewModalProps: prop_types_1.default.object,
    reviewNotesFormSignInURL: prop_types_1.default.string,
    reviewNoteTags: prop_types_1.default.arrayOf(prop_types_1.default.shape({
        active: prop_types_1.default.bool,
        description: prop_types_1.default.string,
        label: prop_types_1.default.string,
        // slug should match with TAG type of coral
        slug: prop_types_1.default.string
    })),
    reviewsSectionTitle: prop_types_1.default.string,
    savedCommentConf: prop_types_1.default.object,
    shouldUseAlternateColorToken: prop_types_1.default.bool,
    shouldUseDarkPinnedTheme: prop_types_1.default.bool,
    shouldUseFullOpacity: prop_types_1.default.bool,
    showMoreButtonLabel: prop_types_1.default.string,
    signInHed: prop_types_1.default.string,
    signInHedSpanTag: prop_types_1.default.string,
    signInMessage: prop_types_1.default.string,
    signUpMessageBannerHed: prop_types_1.default.string,
    tenantID: prop_types_1.default.string.isRequired,
    unlikeActionErrorMessage: prop_types_1.default.string,
    user: prop_types_1.default.shape({
        isAuthenticated: prop_types_1.default.bool.isRequired,
        amguuid: prop_types_1.default.string
    }).isRequired,
    usernameModalConf: prop_types_1.default.object
};
//# sourceMappingURL=Commenting.js.map

/***/ }),

/***/ 392:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const prop_types_1 = __importDefault(__webpack_require__(5556));
const react_1 = __importDefault(__webpack_require__(96540));
const react_intl_1 = __webpack_require__(46984);
const button_1 = __importDefault(__webpack_require__(73730));
const snowplow_tracking_1 = __webpack_require__(14307);
const styles_1 = __webpack_require__(22761);
const translations_1 = __importDefault(__webpack_require__(92867));
const BookmarkIcon_1 = __webpack_require__(72964);
/**
 * CommentingMessageBanner component
 *
 * @param {object} props - React props
 * @param {string} props.hed - Header/title for the banner
 * @param {string} props.dek - Description for the banner
 * @param {boolean} props.isBookmarkingEnabled - Flag to tell if bookmarking is enabled
 * @param {string} props.subContentDek - Optional sub description for banner
 * @param {boolean} props.showCommentSavedMessage - Flag to show comment is saved
 * @param {string} props.signInURL - sign in url for user
 * @param {boolean} props.showSignInButton - Flag to show Signin button
 * @param {string} props.commentMessageBannerIcon - Icons for different community messages
 * @returns {ReactElement} <div>
 */
// eslint-disable-next-line complexity
const CommentingMessageBanner = ({ dek, hed, isBookmarkingEnabled, subContentDek, showCommentSavedMessage, showSignInButton, signInURL, commentMessageBannerIcon }) => {
    const { formatMessage } = (0, react_intl_1.useIntl)();
    return (react_1.default.createElement(styles_1.CommentMessageWrapper, { hasSideBorder: showCommentSavedMessage },
        commentMessageBannerIcon && (react_1.default.createElement(styles_1.CommentMessageBannerIconWrapper, { className: "comment-message-banner-icon", dangerouslySetInnerHTML: { __html: commentMessageBannerIcon } })),
        react_1.default.createElement(styles_1.CommentInfoHed, null, hed),
        dek && react_1.default.createElement(styles_1.CommentInfoDek, { dangerouslySetInnerHTML: { __html: dek } }),
        showCommentSavedMessage && (react_1.default.createElement(styles_1.CommentInfoDek, { dangerouslySetInnerHTML: {
                __html: subContentDek
            } })),
        showSignInButton && (react_1.default.createElement(button_1.default.Primary, { href: signInURL, inputKind: "link", label: formatMessage(translations_1.default.signInButtonLabel), target: "_self", rel: "nofollow noreferrer", onClickHandler: (e) => {
                const eventData = {
                    type: 'login',
                    label: e.target.innerText,
                    subject: 'community',
                    placement: 'interstitial',
                    state: 'focused',
                    paywall_source: 'COMMUNITY_LOGIN'
                };
                (0, snowplow_tracking_1.trackMessageUnitEvent)(eventData);
            } })),
        showCommentSavedMessage && isBookmarkingEnabled && (react_1.default.createElement(styles_1.MessageBannerBookmarkWrapper, { "data-testid": "message-banner-bookmark-wrapper" },
            react_1.default.createElement(BookmarkIcon_1.BookmarkIcon, { link: {
                    label: formatMessage(translations_1.default.saveStory),
                    url: '#',
                    network: 'bookmark',
                    behavior: 'bookmark'
                }, theme: "standard", type: "standard", isUrlBookmark: true, isBookmarkButton: true })))));
};
CommentingMessageBanner.propTypes = {
    commentMessageBannerIcon: prop_types_1.default.string,
    dek: prop_types_1.default.string,
    hed: prop_types_1.default.string,
    isBookmarkingEnabled: prop_types_1.default.bool,
    showCommentSavedMessage: prop_types_1.default.bool,
    showSignInButton: prop_types_1.default.bool,
    signInURL: prop_types_1.default.string,
    subContentDek: prop_types_1.default.string
};
CommentingMessageBanner.displayName = 'CommentingMessageBanner';
exports["default"] = CommentingMessageBanner;
//# sourceMappingURL=CommentingMessageBanner.js.map

/***/ }),

/***/ 24300:
/***/ ((module, exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const isEmpty = __webpack_require__(62193);
const { connect } = __webpack_require__(67851);
const { useState, useEffect, useCallback } = __webpack_require__(96540);
const { useIntl } = __webpack_require__(46984);
const ReviewList = __webpack_require__(47125);
const { formatReviewListItems } = __webpack_require__(39311);
const ResponsiveAsset = __webpack_require__(73275);
const { requestGraphService, getCommentsExcludingFeatured } = __webpack_require__(60711);
const { createCommentReaction, removeCommentReaction } = __webpack_require__(22914);
const signInModalActions = __webpack_require__(22509);
const { default: translations } = __webpack_require__(92867);
const { Circle: Loader } = __webpack_require__(62930);
const { ReviewListLoaderWrapper } = __webpack_require__(22761);
const { useViewportObserver } = __webpack_require__(55030);
const { commentingAction, getParamsAsObjectFromURL, getRelativeURLWithoutParams, getRelativeURLWithSearchAndHash, setUserReactionsReplyReducer, updatedUserReactionsForID, useFetchComments, useUpdateUserReactions } = __webpack_require__(85554);
const { PinnedCommentContainer, PinnedContainerHeading, PinnedTextLabel, CommunityBrandLogoImage } = __webpack_require__(16631);
const { trackCommunityCommentsImpression, getPlacementData, getFeaturedQueryParam } = __webpack_require__(75454);
const REMOVE_COMMENT_ACTION = 'removeCommentReaction';
const CREATE_COMMENT_ACTION = 'createCommentReaction';
exports.CREATE_COMMENT_ACTION = CREATE_COMMENT_ACTION;
const PINNED_COMMENT = 'pinned-comment';
const ReviewListContainer = ({ commentingUrl, contentTitle, defaultReplyLimit, entityId, handleUsernameChange, id, initialReviewLimit, likeActionErrorMessage, replyLimit, commentsOrderBy, repliesOrderBy, reviewLimit, reviewerBadges, reviewModalProps, reviewNoteTags, setCommentCount, setIsCommentLoading, shouldEnableRatings, shouldEnableReply, shouldEnableTags, shouldEnableUpvotes, shouldUseAlternateColorToken, shouldUseFullOpacity, shouldUseDarkPinnedTheme, showMessageBannerHandler, showMoreButtonLabel, signInHed, signInHedSpanTag, signInMessage, siteUserName, unlikeActionErrorMessage, user = {}, usernameSignInDek, communityLogo, hasImageUpload, spectraUrl }) => {
    const { formatMessage } = useIntl();
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState();
    const [items, setItems] = useState([]);
    const [featuredItems, setFeaturedItems] = useState([]);
    const [userReactions, setUserReactions] = useState({});
    const { isLoading, reviews, page, setPage, featuredReviews } = useFetchComments({
        commentingUrl,
        commentsOrderBy,
        defaultReplyLimit,
        entityId,
        initialReviewLimit,
        setCommentCount,
        setIsCommentLoading,
        repliesOrderBy
    });
    useEffect(() => {
        const formattedItems = formatReviewListItems(reviews, formatMessage, reviewNoteTags).map((item) => ({
            ...item,
            isFeatured: false
        }));
        setItems(formattedItems);
        const formattedFeaturedItems = formatReviewListItems(featuredReviews, formatMessage, reviewNoteTags).map((item) => ({
            ...item,
            isFeatured: true
        }));
        setFeaturedItems(formattedFeaturedItems);
    }, [reviews, featuredReviews, formatMessage, reviewNoteTags]);
    useUpdateUserReactions(items, setUserReactions);
    useUpdateUserReactions(featuredItems, setUserReactions);
    const commentReactionHandler = useCallback(async ({ item }) => {
        if (!user.isAuthenticated) {
            const source = 'COMMUNITY_LIKE_CLICK_NOTE';
            const isFeatured = item.isFeatured || false;
            const eventData = {
                type: 'login',
                source_type: source,
                ...getPlacementData(isFeatured)
            };
            const featured = getFeaturedQueryParam(isFeatured);
            const queryParams = {
                action: CREATE_COMMENT_ACTION,
                commentId: item.commentId,
                commentRevisionId: item.revisionId,
                featured,
                source
            };
            const redirectURL = getRelativeURLWithSearchAndHash({
                href: window.location.href,
                hashValue: commentingAction.LIKE_COMMENT,
                queryParams
            });
            signInModalActions.doDisplayModal({
                dangerousHed: signInHed,
                dangerousHedSpanTag: signInHedSpanTag,
                dangerousDek: signInMessage,
                redirectURL,
                analyticsType: 'comment reaction',
                shouldHideIllustration: true,
                source,
                snowplowData: eventData
            });
            return;
        }
        const { commentId, revisionId } = item;
        setUserReactions((prevUserReactions) => updatedUserReactionsForID({
            reactions: prevUserReactions,
            id: commentId
        }));
        const { viewerActionPresence } = userReactions[commentId] || {};
        const operationName = viewerActionPresence
            ? REMOVE_COMMENT_ACTION
            : CREATE_COMMENT_ACTION;
        const input = {
            commentID: commentId,
            commentRevisionID: revisionId,
            clientMutationId: '0'
        };
        const isCreateCommentAction = operationName === CREATE_COMMENT_ACTION;
        const options = {
            operationName,
            query: isCreateCommentAction
                ? createCommentReaction
                : removeCommentReaction,
            variables: {
                input
            }
        };
        try {
            await requestGraphService(commentingUrl, options);
        }
        catch (error) {
            // Revert user reaction state if API request fails
            setUserReactions((prevUserReactions) => updatedUserReactionsForID({
                reactions: prevUserReactions,
                id: commentId
            }));
            const errMsg = isCreateCommentAction
                ? likeActionErrorMessage ||
                    formatMessage(translations.likeActionErrorMessage)
                : unlikeActionErrorMessage ||
                    formatMessage(translations.unlikeActionErrorMessage);
            showMessageBannerHandler(errMsg);
        }
    }, [
        user,
        userReactions,
        commentingUrl,
        signInHed,
        signInHedSpanTag,
        signInMessage,
        formatMessage,
        showMessageBannerHandler,
        likeActionErrorMessage,
        unlikeActionErrorMessage
    ]);
    const updateUserReactions = (items) => {
        setUserReactions((prevUserReaction) => {
            const updatedUserReactions = items.reduce(setUserReactionsReplyReducer, {
                ...prevUserReaction
            });
            return updatedUserReactions;
        });
    };
    const pinnedCommentCount = featuredItems?.length;
    useViewportObserver(`.${PINNED_COMMENT}`, undefined, (isInViewport) => {
        if (isInViewport && pinnedCommentCount) {
            trackCommunityCommentsImpression(pinnedCommentCount, 'community_pinned', 'pinned_comments');
        }
    }, [pinnedCommentCount]);
    useEffect(() => {
        // Wait for existing userReactions to be calculated before adding or removing one from after a log in
        if (!window.location || !user.isAuthenticated || isEmpty(userReactions)) {
            return;
        }
        const { action, commentId, commentRevisionId } = getParamsAsObjectFromURL({
            searchParams: window.location.search
        });
        if (action !== CREATE_COMMENT_ACTION) {
            return;
        }
        const reaction = userReactions[commentId];
        if (reaction && commentId && commentRevisionId) {
            const { viewerActionPresence } = reaction;
            // viewerActionPresence indicates a logged out user liked a comment they already liked so we don't need go through the action handler
            !viewerActionPresence &&
                commentReactionHandler({
                    item: {
                        commentId,
                        revisionId: commentRevisionId
                    }
                });
            // Remove the query params from the URL so the action only happens once
            window.history.replaceState({}, '', getRelativeURLWithoutParams({
                href: window.location.href,
                paramsToRemove: ['action', 'commentId', 'commentRevisionId']
            }));
        }
    }, [user.isAuthenticated, commentReactionHandler, userReactions]);
    const loadMoreCommentingReviews = async () => {
        setIsLoadingMore(true);
        setError();
        const nextCursor = page.endCursor;
        try {
            const { reviews, page } = await getCommentsExcludingFeatured({
                entityId,
                after: nextCursor,
                commentingUrl,
                commentsOrderBy,
                repliesOrderBy,
                reviewLimit
            });
            setPage(page);
            const newItems = formatReviewListItems(reviews, formatMessage, reviewNoteTags);
            setItems([...items, ...newItems]);
        }
        catch (error) {
            setError(true);
        }
        setIsLoadingMore(false);
    };
    if (isLoading) {
        return (React.createElement(ReviewListLoaderWrapper, null,
            React.createElement(Loader, null)));
    }
    if (!items.length && !featuredItems.length && !error) {
        return null;
    }
    const sharedReviewListProps = {
        commentingUrl,
        commentReactionHandler,
        handleUsernameChange,
        repliesOrderBy,
        replyLimit,
        reviewerBadges,
        reviewModalProps,
        shouldEnableRatings,
        shouldEnableReply,
        shouldEnableTags,
        shouldEnableUpvotes,
        shouldUseAlternateColorToken,
        shouldUseFullOpacity,
        showMessageBannerHandler,
        signInHed,
        signInHedSpanTag,
        signInMessage,
        siteUserName,
        updateUserReactions,
        user,
        usernameSignInDek,
        userReactions,
        contentTitle,
        hasImageUpload,
        spectraUrl
    };
    return (React.createElement(React.Fragment, null,
        !!featuredItems?.length && (React.createElement(PinnedCommentContainer, { className: PINNED_COMMENT, shouldUseFullOpacity: shouldUseFullOpacity, shouldUseDarkPinnedTheme: shouldUseDarkPinnedTheme },
            React.createElement(PinnedContainerHeading, { shouldUseFullOpacity: shouldUseFullOpacity, shouldUseDarkPinnedTheme: shouldUseDarkPinnedTheme },
                React.createElement(PinnedTextLabel, { shouldUseAlternateColorToken: shouldUseAlternateColorToken, shouldUseInvertedColor: shouldUseDarkPinnedTheme }, formatMessage(translations.pinnedReviewLabel)),
                communityLogo && React.createElement(CommunityBrandLogoImage, { ...communityLogo })),
            React.createElement(ReviewList, { ...sharedReviewListProps, id: `${id}-featured`, items: featuredItems }))),
        React.createElement(ReviewList, { ...sharedReviewListProps, id: id, items: items, isLoading: isLoadingMore, hasErrored: !!error, hasNextPage: page.hasNextPage, handleShowMore: loadMoreCommentingReviews, showMoreButtonLabel: showMoreButtonLabel })));
};
ReviewListContainer.propTypes = {
    commentingUrl: PropTypes.string.isRequired,
    commentsOrderBy: PropTypes.string,
    communityLogo: PropTypes.shape(ResponsiveAsset.propTypes),
    contentTitle: PropTypes.string,
    defaultReplyLimit: PropTypes.number,
    entityId: PropTypes.string.isRequired,
    handleUsernameChange: PropTypes.func,
    hasImageUpload: PropTypes.bool,
    id: PropTypes.string,
    initialReviewLimit: PropTypes.number,
    likeActionErrorMessage: PropTypes.string,
    repliesOrderBy: PropTypes.string,
    replyLimit: PropTypes.number,
    reviewerBadges: PropTypes.arrayOf(PropTypes.shape({
        role: PropTypes.string,
        badge: PropTypes.string
    })),
    reviewLimit: PropTypes.number,
    reviewModalProps: PropTypes.object,
    reviewNoteTags: PropTypes.array,
    setCommentCount: PropTypes.func.isRequired,
    setIsCommentLoading: PropTypes.func.isRequired,
    shouldEnableRatings: PropTypes.bool,
    shouldEnableReply: PropTypes.bool,
    shouldEnableTags: PropTypes.bool,
    shouldEnableUpvotes: PropTypes.bool,
    shouldUseAlternateColorToken: PropTypes.bool,
    shouldUseDarkPinnedTheme: PropTypes.bool,
    shouldUseFullOpacity: PropTypes.bool,
    showMessageBannerHandler: PropTypes.func,
    showMoreButtonLabel: PropTypes.string,
    signInHed: PropTypes.string,
    signInHedSpanTag: PropTypes.string,
    signInMessage: PropTypes.string,
    siteUserName: PropTypes.string,
    spectraUrl: PropTypes.string,
    unlikeActionErrorMessage: PropTypes.string,
    user: PropTypes.shape({
        amguuid: PropTypes.string,
        isAuthenticated: PropTypes.bool.isRequired
    }).isRequired,
    usernameSignInDek: PropTypes.string
};
const setCommentCount = (commentCount) => ({
    type: 'SET_KEY',
    key: 'comments.commentCount',
    value: commentCount
});
const setIsCommentLoading = (isCommentLoading) => ({
    type: 'SET_KEY',
    key: 'comments.isCommentLoading',
    value: isCommentLoading
});
module.exports = connect(null, { setCommentCount, setIsCommentLoading })(ReviewListContainer);
//# sourceMappingURL=ReviewListContainer.js.map

/***/ }),

/***/ 81063:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Commenting = void 0;
const configured_component_1 = __webpack_require__(12892);
const redux_1 = __webpack_require__(57744);
const Commenting_1 = __webpack_require__(39252);
const CommentingWithState = (0, redux_1.connector)(Commenting_1.Commenting, {
    keysToPluck: [
        'communityExperience',
        'brandName',
        'user',
        'communityLogo',
        'imageUpload'
    ],
    keysToSpread: ['commentAttributes', 'comments', 'recaptcha']
});
const Commenting = (0, configured_component_1.asConfiguredComponent)(CommentingWithState, 'Commenting');
exports.Commenting = Commenting;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 22761:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const styled = (__webpack_require__(92168)["default"]);
const { getTypographyStyles, maxScreen, getColorStyles, calculateSpacing } = __webpack_require__(26865);
const { BaseText } = __webpack_require__(76955);
const { BREAKPOINTS } = __webpack_require__(96472);
const ReviewListLoaderWrapper = styled.div.withConfig({
    displayName: 'ReviewListLoaderWrapper'
}) `
  display: flex;
  justify-content: center;
`;
const CommentMessageWrapper = styled.div.withConfig({
    displayName: 'CommentMessageWrapper'
}) `
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: ${calculateSpacing(3)};
  border: 1px solid;
  ${({ hasSideBorder }) => !hasSideBorder &&
    `
      border-right: none;
      border-left: none;
    `}
  ${getColorStyles('border-color', 'colors.consumption.body.standard.divider')};
  padding: ${calculateSpacing(3)} ${calculateSpacing(2)};
  text-align: center;
`;
const CommentInfoHed = styled(BaseText).withConfig({
    displayName: 'CommentInfoHed'
}) `
  ${getColorStyles('color', 'colors.consumption.lead.standard.heading')};
  ${getTypographyStyles('typography.definitions.consumptionEditorial.description-feature')}

  &:not(:last-child) {
    padding-bottom: ${calculateSpacing(2)};
  }
`;
const CommentInfoDek = styled(BaseText).withConfig({
    displayName: 'CommentInfoDek'
}) `
  ${getColorStyles('color', 'colors.consumption.lead.standard.context-tertiary')};
  ${getTypographyStyles('typography.definitions.utility.assistive-text')}

  &:not(:last-child) {
    padding-bottom: ${calculateSpacing(2)};
  }
`;
const CommentMessageBannerIconWrapper = styled.div.withConfig({
    displayName: 'CommentMessageBannerIconWrapper'
}) `
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${calculateSpacing(2)};

  svg {
    width: 64px;
    height: 64px;
  }
`;
const MessageBannerBookmarkWrapper = styled('div').withConfig({
    displayName: 'MessageBannerBookmarkWrapper'
}) `
  display: flex;
  flex-direction: column;
  width: 100%;

  button {
    margin-top: 0;
    margin-bottom: 0;
    ${maxScreen(BREAKPOINTS.md)} {
      margin-right: 16px;
      margin-left: 16px;
    }
    ${getColorStyles('background', 'colors.interactive.base.brand-primary')};

    &:hover,
    &:focus,
    &:active {
      ${getColorStyles('background-color', 'colors.interactive.base.brand-primary')};
    }
  }

  span {
    ${getColorStyles('color', 'colors.interactive.base.white')};
  }

  svg {
    width: 24px;
    height: 24px;

    path {
      ${getColorStyles('fill', 'colors.interactive.base.white')};
    }
  }
`;
module.exports = {
    CommentInfoDek,
    CommentInfoHed,
    CommentMessageWrapper,
    MessageBannerBookmarkWrapper,
    ReviewListLoaderWrapper,
    CommentMessageBannerIconWrapper
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 45771:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const { useIntl } = __webpack_require__(46984);
const CloseIcon = __webpack_require__(76399);
const translations = (__webpack_require__(96616)/* ["default"] */ .A);
const { asConfiguredComponent } = __webpack_require__(12892);
const { TrackComponentChannel } = __webpack_require__(78788);
const { ReviewNoteModalBaseWrapper, ReviewNoteModalCloseButton, ReviewNoteModalContinueButton, ReviewNoteDiscardSection, ReviewNoteModalDek, ReviewNoteModalHed } = __webpack_require__(49038);
/**
 * ReviewNoteModal component
 * @param {string} [props.className] - Optional top-level class to add
 * @param {Function} [props.confirmButtonCallback] - callback function to run when confirm button is clicked
 * @param {string} [props.modalProps] -  hed, dek, continueLabel and discardLabel props
 * @param {boolean} [props.isVisible] - show/hide Modal
 * @returns {ReactElement} <div>
 */
const ReviewNoteModal = ({ className, modalProps: { hed, dek, continueLabel, discardLabel } = {}, confirmButtonCallback, onClose, isVisible = false }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'ReviewNoteSubmitModal'
        });
    }, []);
    const onClickClosedHandler = () => {
        onClose();
    };
    const { formatMessage } = useIntl();
    return (React.createElement(ReviewNoteModalBaseWrapper, { className: className, closeTimeoutMS: 200, isOpen: isVisible },
        React.createElement(ReviewNoteModalCloseButton, { isIconButton: true, ariaLabel: formatMessage(translations.closeButtonAriaLabel), label: formatMessage(translations.closeButtonLabel), onClickHandler: onClickClosedHandler, role: "button", ButtonIcon: CloseIcon }),
        React.createElement(ReviewNoteModalHed, null, hed || formatMessage(translations.hed)),
        React.createElement(ReviewNoteModalDek, null, dek || formatMessage(translations.dek)),
        React.createElement(ReviewNoteModalContinueButton, { label: continueLabel || formatMessage(translations.continueLabel), onClickHandler: onClickClosedHandler }),
        React.createElement(ReviewNoteDiscardSection, { onClickHandler: confirmButtonCallback, label: discardLabel || formatMessage(translations.discardLabel), btnStyle: "text", inputKind: "link" })));
};
ReviewNoteModal.propTypes = {
    className: PropTypes.string,
    confirmButtonCallback: PropTypes.func,
    isVisible: PropTypes.bool,
    modalProps: PropTypes.object,
    onClose: PropTypes.func
};
ReviewNoteModal.displayName = 'ReviewNoteModal';
module.exports = asConfiguredComponent(ReviewNoteModal, 'ReviewNoteModal');
//# sourceMappingURL=ReviewNoteModal.js.map

/***/ }),

/***/ 49038:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const ReactModal = __webpack_require__(20312);
const PropTypes = __webpack_require__(5556);
const { default: styled } = __webpack_require__(92168);
const { BaseText } = __webpack_require__(76955);
const { calculateSpacing } = __webpack_require__(26865);
const { BREAKPOINTS, ZINDEX_MAP } = __webpack_require__(96472);
const Button = __webpack_require__(73730);
const { ButtonLabel } = __webpack_require__(18974);
const { getColorToken, getTypographyStyles } = __webpack_require__(26865);
const ReviewNoteModalHed = styled(BaseText).withConfig({
    displayName: 'ReviewNoteModalHed'
}) `
  margin-top: ${calculateSpacing(0)};
  padding: ${calculateSpacing(2.5)} ${calculateSpacing(1.25)};
  text-align: center;
`;
ReviewNoteModalHed.defaultProps = {
    as: 'div',
    colorToken: 'colors.interactive.base.brand-primary',
    topSpacing: 1,
    typeIdentity: 'typography.definitions.consumptionEditorial.display-large'
};
const ReviewNoteModalDek = styled.p.withConfig({
    displayName: 'ReviewNoteModalDek'
}) `
  ${getTypographyStyles('typography.definitions.consumptionEditorial.body-core')}
  margin-top: ${calculateSpacing(0)};
  margin-bottom: ${calculateSpacing(5)};
  text-align: center;
  color: ${getColorToken('colors.consumption.body.standard.body')};
  @media (max-width: ${BREAKPOINTS.md}) {
    margin-bottom: ${calculateSpacing(5)};
  }
`;
const ReviewNoteModalCloseButton = styled(Button.Utility).withConfig({
    displayName: 'ReviewNoteModalButtonPrimary'
}) `
  position: absolute;
  top: ${calculateSpacing(1)};
  right: ${calculateSpacing(1)};
  padding: 0;
  fill: ${getColorToken('colors.interactive.base.black')};

  .icon-close {
    padding: 6px;
  }

  &,
  &:focus,
  &:hover {
    border: 0;
    background-color: transparent;
  }
  width: 42px;
  height: 42px;
`;
const ReviewNoteModalContinueButton = styled(Button.Primary).withConfig({
    displayName: 'ReviewNoteModalContinueButton'
}) `
  display: flex;
  justify-content: center;
  margin-bottom: ${calculateSpacing(1)};
  padding: ${calculateSpacing(2)} ${calculateSpacing(0)};
  width: 100%;
  ${ButtonLabel} {
    padding: 0 ${calculateSpacing(2.5)};
  }
`;
const ReviewNoteDiscardSection = styled(Button.Primary).withConfig({
    displayName: 'ReviewNoteDiscardSection'
}) `
  display: flex;
  justify-content: center;
  padding: 17px ${calculateSpacing(0)};
  width: 100%;
  text-decoration: underline;
  ${ButtonLabel} {
    padding: 0 ${calculateSpacing(2.5)};
  }
`;
function ReactModalAdapter({ className, ...props }) {
    const contentClassName = `${className}__content`;
    const overlayClassName = `${className}__overlay`;
    return (React.createElement(ReactModal, { portalClassName: className, className: contentClassName, overlayClassName: overlayClassName, ...props }));
}
ReactModalAdapter.propTypes = {
    className: PropTypes.string
};
const ReviewNoteModalBaseWrapper = styled(ReactModalAdapter).withConfig({
    displayName: 'ReviewNoteModalBaseWrapper'
}) `
  &__overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: ${ZINDEX_MAP.interstitialLayer};

    background-color: rgba(
      ${getColorToken('colors.background.black', { rgbOnly: true })},
      0
    );

    &.ReactModal__Overlay--after-open {
      transition: background-color 500ms;
      opacity: 1;
      background-color: rgba(
        ${getColorToken('colors.background.black', { rgbOnly: true })},
        0.4
      );
    }

    &.ReactModal__Overlay--after-close {
      transition: background-color 500ms;
      background-color: rgba(
        ${getColorToken('colors.background.black', { rgbOnly: true })},
        0
      );
    }
  }

  &__content {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    border-radius: ${calculateSpacing(1)};
    box-shadow: 0 0 24px 0 rgba(0, 0, 0, 0.1);
    background-color: ${getColorToken('colors.background.white')};
    padding: ${calculateSpacing(6)} ${calculateSpacing(5)}
      ${calculateSpacing(5)} ${calculateSpacing(5)};
    width: ${calculateSpacing(57)};
    height: 368px;
    overflow-y: auto;
    @media (max-width: ${BREAKPOINTS.md}) {
      transform: translateY(-50%)
        translateX(calc(-50% - ${calculateSpacing(2, 'px')}));

      margin: 0 ${calculateSpacing(2, 'px')};
      padding: ${calculateSpacing(4)} ${calculateSpacing(5)}
        ${calculateSpacing(4)} ${calculateSpacing(5)};
      width: auto;
      min-width: ${calculateSpacing(38)};
      max-width: ${calculateSpacing(60)};
    }
  }
`;
module.exports = {
    ReviewNoteModalBaseWrapper,
    ReviewNoteModalCloseButton,
    ReviewNoteModalContinueButton,
    ReviewNoteDiscardSection,
    ReviewNoteModalDek,
    ReviewNoteModalHed
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 96616:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    closeButtonAriaLabel: {
        id: 'ReviewNoteModal.CloseButtonAriaLabel',
        defaultMessage: 'Close ReviewNoteModal Modal',
        description: 'ReviewNoteModal component close button aria label'
    },
    closeButtonLabel: {
        id: 'ReviewNoteModal.CloseButtonLabel',
        defaultMessage: 'close modal button label',
        description: 'ReviewNoteModal component close button label'
    },
    continueLabel: {
        id: 'ReviewNoteModal.continueLabel',
        defaultMessage: 'No, still writing',
        description: 'ReviewNoteModal component continue button text',
        isConfigurable: true
    },
    dek: {
        id: 'ReviewNoteModal.dek',
        defaultMessage: "Everything you've written will be lost",
        description: 'ReviewNoteModal component dek text',
        isConfigurable: true
    },
    discardLabel: {
        id: 'ReviewNoteModal.discardLabel',
        defaultMessage: 'Yes, discard it',
        description: 'ReviewNoteModal discard button text',
        isConfigurable: true
    },
    hed: {
        id: 'ReviewNoteModal.Hed',
        defaultMessage: 'Discard this comment?',
        description: 'ReviewNoteModal component hed text',
        isConfigurable: true
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 56425:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const { useState, useEffect } = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const ReviewNotesForm = __webpack_require__(45565);
const { addReview, validateAndAddStory } = __webpack_require__(60711);
const { trackContentEngagementEvent } = __webpack_require__(14307);
/**
 * ReviewNotes component
 *
 * @param {object} props - React props
 * @param {string} [props.commentingUrl] - Commenting API url where the reviews will be submitted
 * @param {string} [props.contentId] - Id of the content being commented on
 * @param {string} [props.contentTitle] - Tilte of the contentType( Recipe/Story/Gallery)
 * @param {Function} [props.handleUsernameChange] - Function to set user name
 * @param {string} [props.hed] - header of content
 * @param {boolean} [props.hasImageUpload] - Flag to enable image upload in comments
 * @param {string} [props.organizationId] - Organization ID of the domain
 * @param {Array} [props.reviewerInfoText] - Optional text for reviewer info alert icon.
 * @param {Array} [props.reviewNoteTags] - Optional prop to configure the review note toggle chips
 * @param {bool} [props.shouldEnableMultipleComments] - Flag used to enable the multiple comments for story/recipe
 * @param {bool} [props.shouldEnableMultipleRatings] - Flag used to enable the multiple ratings for story/recipe
 * @param {bool} [props.shouldEnableRatings] - flag to enable community rating
 * @param {bool} [props.shouldEnableTags] - flag to enable tags in comments
 *  @param {bool} [props.shouldUseFullOpacity] - Optional flag to increase opacity if brands backrgound.brand token is light
 * @param {func} [props.showMessageBannerHandler] - Optional function to showtoastMessage on success or failure
 * @param {Function} [props.showSavedRecipeNotes] - Function to set the state for saved recipe notes
 * @param {string} [props.signInURL] - Required URL for users to sign in
 * @param {string} [props.siteUserName] - Commenting user name
 * @param {string} [props.tenantID] - TenantID is the tenant/orginization id
 * @param {string} [props.userId] - Required user id to be included in form submission
 * @param {string} [props.usernameSignInDek] - Optional prop to use a custom username modal dek
 * @returns {ReactElement} <div>
 */
const ReviewNotes = ({ commentingUrl, contentId, contentTitle = '', handleUsernameChange, hasImageUpload = false, hed, organizationId, reviewerInfoText, reviewNoteTags, shouldEnableMultipleComments, shouldEnableMultipleRatings, shouldEnableRatings, shouldEnableTags, showMessageBannerHandler, showSavedRecipeNotes, signInURL, siteUserName, tenantID, userId, usernameSignInDek, shouldUseFullOpacity }) => {
    const [storyLink, setStoryLink] = useState('');
    useEffect(() => {
        // Get the URL without search parameters
        const storyLink = window.location.origin + window.location.pathname;
        setStoryLink(storyLink);
    }, []);
    const trackSubmitNoteEvent = (error, rating, features_list) => {
        if (true) {
            const eventData = {
                type: 'submit',
                label: 'add note',
                rating,
                subject: 'community_comment',
                features_list
            };
            if (error) {
                eventData.error = error;
            }
            trackContentEngagementEvent(eventData, { skipDuplicateEvent: false });
        }
    };
    const submitReview = async (body) => {
        let hasSucceeded;
        let error_info;
        const meta = {
            hed,
            storyLink
        };
        const { reviewNote, rating, userId: userID, toggleChip: tags, images } = body || {};
        const activeTags = tags?.filter((tag) => tag.slug && tag.active) || [];
        const reviewTags = activeTags.map((tag) => tag.slug);
        const features_list = activeTags.map((tag) => ({
            name: tag.label.toLowerCase(),
            index: 0,
            total_index: 1
        }));
        const input = {
            review: {
                storyID: contentId,
                siteID: organizationId,
                body: reviewNote,
                meta: JSON.stringify(meta),
                rating,
                ratingScale: 5,
                reviewTags,
                tenantID,
                ...(images && images.length > 0 && { images })
            },
            clientMutationId: '0',
            enableMultipleRatings: shouldEnableMultipleRatings,
            enableMultipleComments: shouldEnableMultipleComments
        };
        const coralUserID = userID;
        try {
            await validateAndAddStory({
                id: contentId,
                title: contentTitle,
                organizationId,
                commentingUrl,
                console
            });
            hasSucceeded = await addReview(input, coralUserID, commentingUrl, console);
            trackSubmitNoteEvent(null, rating, features_list);
        }
        catch (error) {
            error_info = error.message || '';
            trackSubmitNoteEvent(error_info, rating, features_list);
            console.warn(error);
        }
        return hasSucceeded;
    };
    return (React.createElement(ReviewNotesForm, { shouldUseFullOpacity: shouldUseFullOpacity, handleUsernameChange: handleUsernameChange, onSubmitHandler: submitReview, reviewerInfoText: reviewerInfoText, reviewNoteTags: reviewNoteTags, shouldEnableRatings: shouldEnableRatings, shouldEnableTags: shouldEnableTags, hasImageUpload: hasImageUpload, showMessageBannerHandler: showMessageBannerHandler, showSavedRecipeNotes: showSavedRecipeNotes, signInURL: signInURL, siteUserName: siteUserName, userId: userId, usernameSignInDek: usernameSignInDek }));
};
ReviewNotes.propTypes = {
    commentingUrl: PropTypes.string,
    contentId: PropTypes.string,
    contentTitle: PropTypes.string,
    handleUsernameChange: PropTypes.func.isRequired,
    hasImageUpload: PropTypes.bool,
    hed: PropTypes.string,
    organizationId: PropTypes.string,
    reviewerInfoText: PropTypes.string,
    reviewNoteTags: PropTypes.array,
    shouldEnableMultipleComments: PropTypes.bool,
    shouldEnableMultipleRatings: PropTypes.bool,
    shouldEnableRatings: PropTypes.bool,
    shouldEnableTags: PropTypes.bool,
    shouldUseFullOpacity: PropTypes.bool,
    showMessageBannerHandler: PropTypes.func,
    showSavedRecipeNotes: PropTypes.func.isRequired,
    signInURL: PropTypes.string,
    siteUserName: PropTypes.string,
    tenantID: PropTypes.string,
    userId: PropTypes.string,
    usernameSignInDek: PropTypes.string
};
module.exports = ReviewNotes;
//# sourceMappingURL=ReviewNotes.js.map

/***/ }),

/***/ 76584:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(56425);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 30488:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const { useState } = __webpack_require__(96540);
const { connect: connectToStore } = __webpack_require__(67851);
const { useIntl } = __webpack_require__(46984);
const translations = (__webpack_require__(62097)/* ["default"] */ .A);
const { createNewUsername, validate } = __webpack_require__(67116);
const CloseIcon = __webpack_require__(76399);
const { asConfiguredComponent } = __webpack_require__(12892);
const { TrackComponentChannel } = __webpack_require__(78788);
const { trackUserAccountEvent } = __webpack_require__(14307);
const { getPlacementData } = __webpack_require__(75454);
const { doCloseModal } = __webpack_require__(61057);
const { UserNameModalBaseWrapper, UserNameModalCloseButton, UserNameModalButtons, UserNameModalDek, UserNameModalHed, UserNameModalSubmit, UserNameModalTextFieldWrapper } = __webpack_require__(94823);
const mapStateToProps = (state) => {
    const { userNameModalConfig } = state;
    return {
        ...userNameModalConfig
    };
};
/**
 * UserNameModal component
 *
 * @param {object} props - React props
 * @param {string} [props.className] - Optional top-level class to add
 * @param {string} [props.dangerousHed] - Optional Hed for the user name modal
 * @param {string} [props.dangerousDek] - Optional Dek for the user name modal
 * @param {boolean} [props.isVisible] - Optional isVisible to show or hide component
 * @param {number} [props.maxLength] - Optional max length to allow for username
 * @param {number} [props.minLength] - Optional min length to allow for username
 * @param {string} [props.organizationId] - Organization id passsed from parent
 * @param {func} [props.showMessageBannerHandler] - Optional function to showtoastMessage on success or failure
 * @param {string} [props.submitButtonLabel] - Optional submit button label for user name modal
 * @param {func} [props.successCallback] - Optional function to call after username is saved successfully
 * @param {string} [props.userApiUrl] - URL to call for saving username
 * @param {string} [props.userId] - userID of the user who is logged-in
 * @param {object} [props.usernameModalConf] - username modal config
 * @returns {ReactElement} <div>
 */
const UserNameModal = ({ className, dangerousDek, dangerousHed, isVisible = false, maxLength = 23, minLength = 2, organizationId, showMessageBannerHandler, submitButtonLabel, successCallback, userApiUrl, userId, source, isFeatured, usernameModalConf }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'UserNameModal'
        });
    }, []);
    const USERNAME_ALREADY_TAKEN = 'already_taken';
    const { formatMessage } = useIntl();
    const [error, setError] = useState('');
    const [usernameValue, setUsernameValue] = useState('');
    const handleUsernameChange = (event) => {
        let { value } = event.target;
        if (value.length > maxLength) {
            value = value.slice(0, maxLength);
            event.target.value = value;
        }
        setUsernameValue(value);
    };
    const onClickClosedHandler = () => {
        doCloseModal();
        trackUserAccountEvent({
            type: 'exit',
            subject: 'username_modal',
            source_type: source,
            ...getPlacementData(isFeatured)
        });
        setError(null);
    };
    const errorMsgMap = {
        lengthError: formatMessage(translations.lengthError),
        specialCharError: formatMessage(translations.specialCharError)
    };
    const onClickSubmitHandler = async () => {
        let error_info;
        const errorType = validate(usernameValue, { minLength, maxLength });
        if (errorType) {
            const errorMessage = errorMsgMap[errorType] ?? '';
            setError(errorMessage);
            return; // Exit the function early if there's an error
        }
        let response;
        try {
            response = await createNewUsername({
                name: usernameValue,
                organizationId,
                userId,
                url: userApiUrl
            }, console);
            setUsernameValue(response);
            setError(null);
            showMessageBannerHandler &&
                showMessageBannerHandler(formatMessage(translations.successMessage));
            doCloseModal();
            successCallback && successCallback(response);
        }
        catch (error) {
            if (error?.message === USERNAME_ALREADY_TAKEN) {
                setError(formatMessage(translations.alreadyTakenError));
                error_info = error?.message;
            }
            else {
                showMessageBannerHandler &&
                    showMessageBannerHandler(formatMessage(translations.errorMessage));
                doCloseModal();
                error_info = translations.errorMessage.defaultMessage;
            }
        }
        const eventData = {
            type: 'submit',
            label: 'SAVE USERNAME',
            subject: 'username_modal',
            source_type: source,
            error: error_info,
            ...getPlacementData(isFeatured)
        };
        trackUserAccountEvent(eventData);
    };
    const getSubmitButtonLabel = () => {
        if (submitButtonLabel) {
            return submitButtonLabel;
        }
        if (source === 'community_comment') {
            if (usernameModalConf?.submitButtonLabel) {
                return usernameModalConf.submitButtonLabel;
            }
            return formatMessage(translations.submitButtonLabelComment);
        }
        if (source === 'community_reply') {
            return formatMessage(translations.submitButtonLabelReply);
        }
        return formatMessage(translations.submitButtonLabel);
    };
    return (React.createElement(UserNameModalBaseWrapper, { className: className, isOpen: isVisible },
        React.createElement(UserNameModalCloseButton, { isIconButton: true, ariaLabel: formatMessage(translations.closeButtonLabel), label: formatMessage(translations.closeButtonLabel), role: "button", onClickHandler: onClickClosedHandler, ButtonIcon: CloseIcon }),
        React.createElement(UserNameModalHed, null, dangerousHed || formatMessage(translations.hed)),
        React.createElement(UserNameModalDek, { dangerouslySetInnerHTML: {
                __html: dangerousDek || formatMessage(translations.dek)
            } }),
        React.createElement(UserNameModalTextFieldWrapper, { className: "user-name-modal", hasAutoFocus: true, shouldUseUppercase: true, name: "username", placeholder: "YOUR_USERNAME", type: "text", onInputChange: handleUsernameChange, errorText: error, isInvalid: !!error, formName: "username", errorPosition: "belowTextField", hideLabel: true, label: formatMessage(translations.hed), assistiveSubtext: formatMessage(translations.userNameModalAssistiveText) }),
        React.createElement(UserNameModalButtons, null,
            React.createElement(UserNameModalSubmit, { label: getSubmitButtonLabel(), inputKind: "submit", "data-testid": "UserNameModalSubmit", onClickHandler: onClickSubmitHandler }))));
};
UserNameModal.propTypes = {
    className: PropTypes.string,
    dangerousDek: PropTypes.string,
    dangerousHed: PropTypes.string,
    isFeatured: PropTypes.bool,
    isVisible: PropTypes.bool,
    maxLength: PropTypes.number,
    minLength: PropTypes.number,
    organizationId: PropTypes.string.isRequired,
    showMessageBannerHandler: PropTypes.func,
    source: PropTypes.string,
    submitButtonLabel: PropTypes.string,
    successCallback: PropTypes.func,
    userApiUrl: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    usernameModalConf: PropTypes.object
};
const ConfiguredUserNameModal = asConfiguredComponent(UserNameModal, 'UserNameModal');
module.exports = connectToStore(mapStateToProps)(ConfiguredUserNameModal);
//# sourceMappingURL=UserNameModal.js.map

/***/ }),

/***/ 64837:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(30488);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 94823:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const ReactModal = __webpack_require__(20312);
const PropTypes = __webpack_require__(5556);
const { default: styled } = __webpack_require__(92168);
const { BaseText } = __webpack_require__(76955);
const { calculateSpacing, getColorStyles } = __webpack_require__(26865);
const { ZINDEX_MAP, BREAKPOINTS } = __webpack_require__(96472);
const Button = __webpack_require__(73730);
const { getColorToken, getTypographyStyles } = __webpack_require__(26865);
const TextField = __webpack_require__(89662);
const { TextFieldControlInput } = __webpack_require__(60434);
const UserNameModalHed = styled(BaseText).withConfig({
    displayName: 'UserNameModalHed'
}) `
  padding-top: ${calculateSpacing(2.5)};
  padding-bottom: ${calculateSpacing(2.5)};
  text-align: center;
`;
UserNameModalHed.defaultProps = {
    as: 'div',
    colorToken: 'colors.discover.body.white.heading',
    topSpacing: 1,
    typeIdentity: 'typography.definitions.consumptionEditorial.display-small'
};
const UserNameModalDek = styled.p.withConfig({
    displayName: 'UserNameModalDek'
}) `
  ${getTypographyStyles('typography.definitions.consumptionEditorial.body-core')}
  margin: 0;
  text-align: center;
  color: ${getColorToken('colors.consumption.body.standard.body')};
`;
const UserNameModalCloseButton = styled(Button.Utility).withConfig({
    displayName: 'UserNameModalCloseButton'
}) `
  position: absolute;
  top: ${calculateSpacing(1)};
  right: ${calculateSpacing(1)};
  padding: 0;
  fill: ${getColorToken('colors.discovery.body.light.context-tertiary')};

  .icon-close {
    padding: 8px;
  }

  &,
  &:focus,
  &:hover {
    border: 0;
    background-color: transparent;
  }
`;
const UserNameModalSubmit = styled(Button.Primary).withConfig({
    displayName: 'UserNameModalSubmit'
}) `
  margin-top: 0;
  padding: 0;
`;
const UserNameModalButtons = styled.div.withConfig({
    displayName: 'UserNameModalButtons'
}) `
  display: flex;
  justify-content: center;
  margin-top: ${calculateSpacing(4)};
  @media (max-width: ${BREAKPOINTS.md}) {
    margin-top: ${calculateSpacing(3)};
  }
  width: 100%;

  ${UserNameModalSubmit} {
    padding: 0;
    width: 100%;
  }
`;
function ReactModalAdapter({ className, ...props }) {
    const contentClassName = `${className}__content`;
    const overlayClassName = `${className}__overlay`;
    return (React.createElement(ReactModal, { portalClassName: className, className: contentClassName, overlayClassName: overlayClassName, ...props }));
}
ReactModalAdapter.propTypes = {
    className: PropTypes.string
};
const UserNameModalBaseWrapper = styled(ReactModalAdapter).withConfig({
    displayName: 'UserNameModalBaseWrapper'
}) `
  &__overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: ${ZINDEX_MAP.interstitialLayer};

    background-color: rgba(
      ${getColorToken('colors.background.black', { rgbOnly: true })},
      0
    );

    &.ReactModal__Overlay--after-open {
      transition: background-color 750ms;
      opacity: 1;
      background-color: rgba(
        ${getColorToken('colors.background.black', { rgbOnly: true })},
        0.4
      );
    }

    &.ReactModal__Overlay--after-close {
      transition: background-color 750ms;
      background-color: rgba(
        ${getColorToken('colors.background.black', { rgbOnly: true })},
        0
      );
    }
  }

  &__content {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
    border-radius: 8px;
    background-color: ${getColorToken('colors.background.white')};
    padding-top: ${calculateSpacing(12)};
    padding-right: ${calculateSpacing(6)};
    padding-bottom: ${calculateSpacing(7)};
    padding-left: ${calculateSpacing(6)};
    width: ${calculateSpacing(57)};
    min-height: ${calculateSpacing(62)};
    overflow-y: auto;
    @media (max-width: ${BREAKPOINTS.md}) {
      width: 90%;
    }
  }
`;
const UserNameModalTextFieldWrapper = styled(TextField.SingleLine).withConfig({
    displayName: 'UserNameModalTextFieldWrapper'
}) `
  ${TextFieldControlInput} {
    margin-top: ${calculateSpacing(6)};
    ${getTypographyStyles('typography.definitions.globalEditorial.accreditation-feature')};
    ${getColorStyles('color', 'colors.interactive.base.body')};
    @media (max-width: ${BREAKPOINTS.md}) {
      margin-top: ${calculateSpacing(4)};
    }
  }
`;
module.exports = {
    UserNameModalBaseWrapper,
    UserNameModalButtons,
    UserNameModalCloseButton,
    UserNameModalDek,
    UserNameModalHed,
    UserNameModalSubmit,
    UserNameModalTextFieldWrapper
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 62097:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    hed: {
        id: 'UserNameModal.Hed',
        defaultMessage: 'Create username',
        description: 'UserNameModal component hed text'
    },
    dek: {
        id: 'UserNameModal.Dek',
        defaultMessage: 'Your username will appear next to any comments and replies you add.',
        description: 'UserNameModal component description text'
    },
    submitButtonLabel: {
        id: 'UserNameModal.SubmitButtonLabel',
        defaultMessage: 'Save Username',
        description: 'UserNameModal component submit button label'
    },
    submitButtonLabelComment: {
        id: 'UserNameModal.SubmitButtonLabelComment',
        defaultMessage: 'Save and add comment',
        description: 'UserNameModal component submit button label for comment'
    },
    submitButtonLabelReply: {
        id: 'UserNameModal.SubmitButtonLabelReply',
        defaultMessage: 'Save and add reply',
        description: 'UserNameModal component submit button label for reply'
    },
    closeButtonLabel: {
        id: 'UserNameModal.CloseButtonLabel',
        defaultMessage: 'Close User Name',
        description: 'UserNameModal component close button label'
    },
    lengthError: {
        id: 'UserNameModal.lengthError',
        defaultMessage: 'Usernames must be between 2 and 23 characters.',
        description: 'UserNameModal component length error'
    },
    specialCharError: {
        id: 'UserNameModal.specialCharError',
        defaultMessage: 'Usernames can only include letters, numbers and underscores (_).',
        description: 'UserNameModal component special chars validation error'
    },
    alreadyTakenError: {
        id: 'UserNameModal.alreadyTakenError',
        defaultMessage: 'This username is already taken',
        description: 'UserName already taken error'
    },
    userNameModalAssistiveText: {
        id: 'UserNameModal.UserNameModalAssistiveText',
        defaultMessage: 'Usernames must be between 2 and 23 characters and can only include letters, numbers and underscores (_).',
        description: 'UserNameModal Assistive Text'
    },
    errorMessage: {
        id: 'UserNameModal.ErrorMessage',
        defaultMessage: 'Unable to save username. Please try again.',
        description: 'UserNameModal default error message'
    },
    successMessage: {
        id: 'UserNameModal.SuccessMessage',
        defaultMessage: 'Username saved',
        description: 'UserNameModal success message'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 68467:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const { useState, useRef, useEffect } = __webpack_require__(96540);
const { ImageUploadWrapper, UploadedImageContainer, LoadingOverlay, LoadingOutline } = __webpack_require__(44741);
const { TrackComponentChannel } = __webpack_require__(78788);
const { imageUploadGenericIcon } = __webpack_require__(50565);
const { handlePixVaultUpload } = __webpack_require__(15782);
const Circle = __webpack_require__(32272);
const MAX_FILE_SIZE_MB = 30;
const MIN_FILE_SIZE_MB = 0.1;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
/**
 * Convert file size from bytes to MB
 * @param {number} bytes - File size in bytes
 * @returns {number} File size in MB
 */
const convertFileSizeToMB = (bytes) => {
    return bytes / (1024 * 1024);
};
/**
 * ImageUpload component
 *
 * @param {object} props - React props
 * @param {string} [props.buttonText] - text to display on upload button
 * @param {string} [props.allowedExtensions] - file types to accept
 * @param {Function} [props.onFileChange] - callback when file is selected
 * @param {Function} [props.onUploadStatusChange] - callback when upload status changes
 * @param {string} [props.placeholderImage] - placeholder image for the upload
 * @param {string} [props.id] - unique identifier for the upload input
 * @param {string} [props.brand] - brand for upload
 * @param {string} [props.product] - product for upload
 * @param {string} [props.expirationDate] - expiration date for upload
 * @param {object} [props.imageUpload] - configuration from set-image-upload transformer
 * @param {string} [props.imageUpload.brandSlug] - brand slug configuration from set-image-upload transformer
 * @param {string} [props.imageUpload.pixVaultUrl] - pixvault endpoints from set-image-upload transformer
 * @param {number} [props.minFileSize] - minimum file size in MB
 * @param {number} [props.maxFileSize] - maximum file size in MB
 * @returns {ReactElement} <div>
 */
const ImageUpload = ({ buttonText = 'Upload Image', allowedExtensions = ALLOWED_FILE_TYPES, onFileChange, onUploadStatusChange, brand, product, expirationDate, placeholderImage = imageUploadGenericIcon, id = 'image-upload', imageUpload: { brandSlug, pixVaultUrl } = {}, minFileSize = MIN_FILE_SIZE_MB, maxFileSize = MAX_FILE_SIZE_MB }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'ImageUpload'
        });
    }, []);
    const [image, setImage] = useState(placeholderImage);
    const [iconDimensions, setIconDimensions] = useState({ width: 0, height: 0 });
    const [isUploading, setIsUploading] = useState(false);
    const fileUploadRef = useRef(null);
    const placeholderRef = useRef(null);
    const validateFileSizeRange = (file) => {
        const fileSizeInMB = convertFileSizeToMB(file.size);
        if (fileSizeInMB < minFileSize || fileSizeInMB > maxFileSize) {
            return false;
        }
        return true;
    };
    const validateFileType = (file) => {
        if (!allowedExtensions.includes(file.type)) {
            return false;
        }
        return true;
    };
    const isImageBlob = image && image !== placeholderImage && image.startsWith('blob:');
    // Measure the SVG dimensions when component mounts or placeholder changes
    useEffect(() => {
        if (placeholderRef.current) {
            const svgElement = placeholderRef.current.querySelector('svg');
            if (svgElement) {
                const { width, height } = svgElement.getBoundingClientRect();
                setIconDimensions({ width, height });
            }
        }
    }, [placeholderImage]);
    // Clean up object URL when component unmounts
    useEffect(() => {
        return () => {
            if (isImageBlob) {
                URL.revokeObjectURL(image);
            }
        };
    }, [image, placeholderImage, isImageBlob]);
    const handleImageUpload = (e) => {
        e.preventDefault();
        fileUploadRef.current.click();
    };
    const handleImageChange = async () => {
        const uploadedFile = fileUploadRef.current.files[0];
        if (uploadedFile) {
            const isValidSize = validateFileSizeRange(uploadedFile);
            const isValidType = validateFileType(uploadedFile);
            if (!isValidSize || !isValidType) {
                fileUploadRef.current.value = '';
                console.error('Validation failed');
                return;
            }
            if (onFileChange) {
                setIsUploading(true);
                onUploadStatusChange && onUploadStatusChange(true);
                try {
                    // Use values from imageUpload if available, otherwise use props
                    const uploadBrand = brand || brandSlug;
                    const uploadProduct = product || 'test';
                    const response = await handlePixVaultUpload(uploadedFile, {
                        brand: uploadBrand,
                        product: uploadProduct,
                        expirationDate,
                        pixVaultUrl
                    });
                    if (isImageBlob) {
                        URL.revokeObjectURL(image);
                    }
                    if (response?.statusCode === 200 && response?.data?.[0]?.encodedURI) {
                        const cachedUrl = URL.createObjectURL(uploadedFile);
                        setImage(cachedUrl);
                    }
                    onFileChange(response);
                }
                catch (error) {
                    console.error('Error during image upload:', error);
                }
                finally {
                    setIsUploading(false);
                    onUploadStatusChange && onUploadStatusChange(false);
                }
            }
        }
    };
    return (React.createElement(ImageUploadWrapper, { iconWidth: iconDimensions.width, iconHeight: iconDimensions.height },
        React.createElement("form", { onSubmit: handleImageUpload, id: `${id}-form` },
            React.createElement("label", { htmlFor: id, className: "upload-container", "aria-label": buttonText },
                React.createElement("div", { className: "upload-content" },
                    !isUploading && image !== placeholderImage && (React.createElement(UploadedImageContainer, null,
                        React.createElement("img", { src: image, alt: buttonText }))),
                    isUploading && (React.createElement(LoadingOverlay, { isUploading: isUploading },
                        React.createElement(LoadingOutline, null,
                            React.createElement(Circle, { className: "image-upload-loader" })))),
                    !isUploading && image === placeholderImage && (React.createElement("div", { className: "placeholder-icon", dangerouslySetInnerHTML: { __html: image }, ref: placeholderRef })))),
            React.createElement("input", { type: "file", accept: allowedExtensions, onChange: handleImageChange, ref: fileUploadRef, hidden: true, id: id, name: id, disabled: isUploading }))));
};
ImageUpload.propTypes = {
    allowedExtensions: PropTypes.arrayOf(PropTypes.string),
    brand: PropTypes.string,
    buttonText: PropTypes.string,
    expirationDate: PropTypes.string,
    id: PropTypes.string,
    imageUpload: PropTypes.shape({
        pixVaultUrl: PropTypes.string,
        brandSlug: PropTypes.string,
        product: PropTypes.string,
        userAgentValue: PropTypes.string
    }),
    maxFileSize: PropTypes.number,
    minFileSize: PropTypes.number,
    onFileChange: PropTypes.func,
    onUploadStatusChange: PropTypes.func,
    placeholderImage: PropTypes.string,
    product: PropTypes.string
};
module.exports = ImageUpload;
//# sourceMappingURL=ImageUpload.js.map

/***/ }),

/***/ 50565:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.imageUploadGenericIcon = void 0;
const imageUploadGenericIcon = `<svg width="82" height="82" viewBox="0 0 82 82" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_6632_146663)">
<rect x="1.5" y="1.5" width="79" height="79" stroke="white"/>
<path d="M48.3724 32.5001C48.3508 32.5005 48.3291 32.5021 48.3076 32.5047C48.1567 32.5223 48.0177 32.5941 47.9173 32.7066C47.817 32.819 47.7624 32.964 47.764 33.1137V34.9411H45.9169C45.8993 34.9404 45.8816 34.9404 45.8639 34.9411C45.7063 34.9552 45.5602 35.0285 45.456 35.1459C45.3518 35.2633 45.2974 35.4157 45.3043 35.5716C45.3111 35.7274 45.3785 35.8747 45.4926 35.9828C45.6067 36.0909 45.7586 36.1516 45.9169 36.1523H47.764V37.9702C47.7634 38.0506 47.7789 38.1302 47.8097 38.2046C47.8405 38.279 47.886 38.3468 47.9434 38.4038C48.0009 38.4608 48.0692 38.5062 48.1445 38.5371C48.2198 38.5679 48.3006 38.5838 48.3821 38.5838C48.4637 38.5838 48.5444 38.5679 48.6197 38.5371C48.695 38.5062 48.7633 38.4608 48.8208 38.4038C48.8783 38.3468 48.9237 38.279 48.9545 38.2046C48.9853 38.1302 49.0008 38.0506 49.0002 37.9702V36.1523H50.8449C50.9289 36.1576 51.0131 36.1459 51.0924 36.1179C51.1716 36.0898 51.2441 36.046 51.3055 35.9892C51.3669 35.9325 51.4158 35.8639 51.4493 35.7878C51.4827 35.7117 51.5 35.6296 51.5 35.5466C51.5 35.4637 51.4827 35.3817 51.4493 35.3056C51.4158 35.2295 51.3669 35.1608 51.3055 35.1041C51.2441 35.0473 51.1716 35.0036 51.0924 34.9756C51.0131 34.9475 50.9289 34.9359 50.8449 34.9411H49.0002V33.1137C49.0012 33.0325 48.9856 32.9519 48.9543 32.8766C48.9231 32.8014 48.8768 32.7332 48.8182 32.6759C48.7597 32.6187 48.69 32.5736 48.6135 32.5434C48.5369 32.5131 48.4549 32.4985 48.3724 32.5001ZM44.7672 32.5138C44.7448 32.5134 44.7223 32.5142 44.6999 32.5162H41.7536C41.4904 32.5162 41.2235 32.5159 40.9624 32.5162C40.6464 32.5159 40.3626 32.5162 40.046 32.5162C39.4396 32.5162 38.9299 32.5072 38.4274 32.6159C37.9249 32.7237 37.4484 32.9703 37.0276 33.3861C37.0243 33.3891 37.021 33.3921 37.0178 33.3952C36.6389 33.7759 36.288 34.2047 35.9716 34.514C35.6552 34.8231 35.3925 34.9428 35.3463 34.9428H32.9989C31.6379 34.9428 30.5 36.0247 30.5 37.3722V47.0541C30.5 48.4016 31.6316 49.4965 32.9989 49.5H40.9814H48.9614C50.3307 49.5 51.4627 48.4016 51.4627 47.0541V38.3913C51.4633 38.311 51.4478 38.2312 51.417 38.1568C51.3862 38.0823 51.3408 38.0148 51.2833 37.9577C51.2258 37.9007 51.1575 37.8554 51.0822 37.8245C51.0069 37.7936 50.9262 37.7777 50.8446 37.7777C50.7631 37.7777 50.6823 37.7936 50.607 37.8245C50.5317 37.8554 50.4634 37.9007 50.4059 37.9577C50.3485 38.0148 50.303 38.0823 50.2722 38.1568C50.2415 38.2312 50.2259 38.311 50.2265 38.3913V47.0541C50.2265 47.7458 49.6734 48.2912 48.9614 48.2912H40.9816H32.9991C32.2853 48.2894 31.7365 47.7458 31.7365 47.0541V37.3721C31.7365 36.6803 32.279 36.1538 32.9991 36.1538H35.3465C36.0047 36.1538 36.454 35.7563 36.8449 35.3742C37.2358 34.9922 37.5869 34.5613 37.9007 34.2459C38.1843 33.9657 38.3796 33.862 38.6896 33.7955C38.9996 33.729 39.4396 33.7246 40.046 33.7246C40.3636 33.7246 40.6482 33.7242 40.9624 33.7246C41.2219 33.7243 41.4898 33.7245 41.7537 33.7246C41.8267 33.7246 44.6448 33.7246 44.6999 33.7246C44.7821 33.7317 44.865 33.7223 44.9436 33.6973C45.0221 33.6722 45.0947 33.6319 45.1571 33.5786C45.2195 33.5253 45.2704 33.4602 45.3067 33.3871C45.3431 33.314 45.3641 33.2345 45.3687 33.1532C45.3732 33.072 45.3611 32.9907 45.333 32.9141C45.305 32.8376 45.2617 32.7674 45.2056 32.7077C45.1495 32.648 45.0817 32.6 45.0064 32.5666C44.9311 32.5332 44.8498 32.5156 44.7672 32.5138ZM41.0009 38.5814C39.308 38.5814 37.9272 39.9492 37.9272 41.6175C37.9272 43.2857 39.308 44.6465 41.0009 44.6465C42.6938 44.6465 44.0818 43.2857 44.0818 41.6175C44.0818 39.9492 42.6938 38.5814 41.0009 38.5814ZM41.0009 39.7996C42.0283 39.7996 42.8552 40.605 42.8552 41.6175C42.8552 42.6299 42.0283 43.4354 41.0009 43.4354C39.9735 43.4354 39.1538 42.6299 39.1538 41.6175C39.1538 40.605 39.9735 39.7996 41.0009 39.7996Z" fill="#333333"/>
</g>
<rect x="0.5" y="0.5" width="81" height="81" rx="4.5" stroke="#C9C9C9"/>
<defs>
<clipPath id="clip0_6632_146663">
<rect x="1" y="1" width="80" height="80" rx="4" fill="white"/>
</clipPath>
</defs>
</svg>
`;
exports.imageUploadGenericIcon = imageUploadGenericIcon;
//# sourceMappingURL=ImageUploadIcons.js.map

/***/ }),

/***/ 72667:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { asConfiguredComponent } = __webpack_require__(12892);
const { connector } = __webpack_require__(57744);
const ImageUpload = __webpack_require__(68467);
const ImageUploadWithState = connector(ImageUpload, {
    keysToPluck: ['imageUpload']
});
const ConfiguredImageUpload = asConfiguredComponent(ImageUploadWithState, 'ImageUpload');
module.exports = ConfiguredImageUpload;
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 44741:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { default: styled } = __webpack_require__(92168);
const { calculateSpacing, getColorToken } = __webpack_require__(26865);
const ImageUploadWrapper = styled.div.withConfig({
    displayName: 'ImageUploadWrapper'
}) `
  --icon-width: ${({ iconWidth }) => iconWidth ? `${iconWidth}px` : calculateSpacing(10)};
  --icon-height: ${({ iconHeight }) => iconHeight ? `${iconHeight}px` : calculateSpacing(10)};

  .upload-container {
    cursor: pointer;
  }

  .upload-content {
    position: relative;
    width: var(--icon-width);
    height: var(--icon-height);
  }
`;
const UploadedImageContainer = styled.div.withConfig({
    displayName: 'UploadedImageContainer'
}) `
  width: var(--icon-width);
  height: var(--icon-height);
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
const LoadingOverlay = styled.div.withConfig({
    displayName: 'LoadingOverlay'
}) `
  display: flex;
  position: absolute;
  align-items: center;
  justify-content: center;
  transition: opacity 0.5s ease-in-out;
  opacity: 0;
  inset: 0;
  pointer-events: none;
  ${({ isUploading }) => isUploading &&
    `
    opacity: 1;
    pointer-events: auto;
    `}

  .image-upload-loader {
    width: ${calculateSpacing(4)};
    height: ${calculateSpacing(4)};
  }
`;
const LoadingOutline = styled.div.withConfig({
    displayName: 'LoadingOutline'
}) `
  display: flex;
  align-items: center;
  justify-content: center;
  border: ${calculateSpacing(0.125)} solid
    ${({ theme }) => getColorToken(theme, 'colors.interactive.base.black')};
  border-radius: ${calculateSpacing(0.5)};
  width: var(--icon-width);
  height: var(--icon-height);
`;
module.exports = {
    ImageUploadWrapper,
    UploadedImageContainer,
    LoadingOverlay,
    LoadingOutline
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 15782:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { uploadImage } = __webpack_require__(76661);
/**
 * Handles image upload to pixVault service
 *
 * @param {File} file - The file to upload
 * @param {object} options - Upload options

 */
const handlePixVaultUpload = async (file, options = {}) => {
    if (!file) {
        return null;
    }
    try {
        const response = await uploadImage({
            file,
            ...options
        });
        return response;
    }
    catch (error) {
        console.error('Error uploading image to pixVault:', error);
        throw error;
    }
};
module.exports = {
    handlePixVaultUpload
};
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 8101:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const { useIntl } = __webpack_require__(46984);
const { useState, useCallback } = __webpack_require__(96540);
const { TrackComponentChannel } = __webpack_require__(78788);
const Rating = __webpack_require__(21093);
const ReviewReplyNote = __webpack_require__(71001);
const { useViewportObserver } = __webpack_require__(55030);
const { trackShowMoreCommentsImpression, trackShowMoreCommentsClick } = __webpack_require__(16963);
const { getPreviewUrl } = __webpack_require__(26576);
const { ReviewReplyComment } = __webpack_require__(32844);
const { ReviewListWrapper, ReviewListItems, ReviewListRatingStars, ReviewListButton, ReviewListError, ReviewText, ReviewerUserName, ReviewListTimeStamp, ReviewLikeCount, ReviewReplyLabel, ReviewListMetaInfo, ReviewItem, ReviewImage, ReviewMetaGrid, ReviewListReactionButton, ReviewReplyWrapper, UserBadgeWrapper } = __webpack_require__(16631);
const { Comment, Like, LikeFilled } = __webpack_require__(24695);
const { Dot } = __webpack_require__(91470);
const ToggleChip = __webpack_require__(27517);
const signInModalActions = __webpack_require__(22509);
const userNameModalActions = __webpack_require__(61057);
const ReviewerBadge = __webpack_require__(50787);
const { trackContentEngagementEvent, trackUserAccountEvent } = __webpack_require__(14307);
const { commentingAction } = __webpack_require__(85554);
const translations = (__webpack_require__(74657)/* ["default"] */ .A);
const { getPlacementData, getFeaturedQueryParam } = __webpack_require__(75454);
/**
 * ReviewList component
 * @param {object} props - ReviewList props
 * @param {Function} [props.commentReactionHandler] - Function to handle the user reactions on the primary comments
 * @param {string} [props.commentingUrl] - URL for the coral API where comments are stored
 * @param {string} [props.spectraUrl] - spectra url for image display
 * @param {string} [props.contentTitle] - Tilte of the contentType( Recipe/Story/Gallery)
 * @param {object} [props.logo] - brand logo for pinned comments
 * @param {id} [props.id] - Id passed as the id to ReviewListWrapper
 * @param {object} [props.items] - Primary Comments
 * @param {object} [props.featuredItems] - Featured Comments
 * @param {bool} [props.hasErrored] - Flag to check if there are errors in the API call
 * @param {bool} [props.hasNextPage] - Flag to check if there are more items
 * @param {bool} [props.isLoading] - Flag to check if the API call is in progress
 * @param {object} [props.user] - User information
 * @param {string} props.reviewerBadges - Array of role and badge for the reviewer badge
 * @param {object}  props.reviewModalProps - Contains hed, dek, continueLabel and discard label props
 * @param {object} [props.userReactions] - User reaction information
 * @param {string} [props.usernameSignInDek] - Optional prop to use a custom username modal dek
 * @param {string} [props.signInHed] - Header on signin alert shown to user
 * @param {string} [props.signInHedSpanTag] - Hed span tag on signin alert shown to user
 * @param {string} [props.signInMessage] - Message on signin alert shown to user
 * @param {string} [props.shouldEnableReply] - Flag to enable replying on comments
 * @param {number} props.replyLimit - number of replies to show per request when clicked on show more replies label
 * @param {Function} [props.updateUserReactions] - function to update state values of load more replies in ReviewListContainer component
 * @param {bool} [props.shouldEnableRatings] - flag to enable community rating
 * @param {bool} [props.shouldEnableUpvotes] - flag to enable community likes or upvotes
 * @param {bool} [props.shouldEnableTags] - flag to enable tags in comments
 * @param {string} [props.showMoreButtonLabel] - optional label for the show more button
 * @param {bool} [props.shouldUseAlternateColorToken] - Optional flag to change font color if token is light
 * @param {bool} [props.shouldUseFullOpacity] - optional flag to increase opacity if brands backrgound.brand token is light
 * @param {func} [props.handleShowMore] - handler for the show more button click
 *
 * @returns {ReactElement} <ReviewList>
 */
/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable complexity */
const ReviewList = ({ className, commentingUrl, commentReactionHandler, contentTitle, handleShowMore, handleUsernameChange, hasErrored = false, hasImageUpload = false, hasNextPage = false, id, isLoading = false, items, replyLimit, reviewerBadges, repliesOrderBy, reviewModalProps, shouldEnableRatings, shouldEnableReply, shouldEnableTags = false, shouldEnableUpvotes, shouldUseAlternateColorToken, shouldUseFullOpacity, showMessageBannerHandler, showMoreButtonLabel, signInHed, signInHedSpanTag, signInMessage, siteUserName, updateUserReactions, user, usernameSignInDek, userReactions, spectraUrl }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'ReviewList'
        });
    }, []);
    const [replyNote, setReplyNote] = useState({});
    const [commentIDs, setCommentIDs] = useState([]);
    const { formatMessage } = useIntl();
    const REVIEW_LIST_BUTTON = 'ReviewListButton';
    const handleReplyEvent = useCallback((commentId, isFeatured) => {
        if (!user?.isAuthenticated) {
            const source = 'COMMUNITY_REPLY_TO_COMMENT';
            const featured = getFeaturedQueryParam(isFeatured);
            const redirectURL = new URL(window.location);
            redirectURL.hash = commentingAction.LEAVE_REPLY;
            redirectURL.searchParams.set('featured', featured);
            redirectURL.searchParams.set('source', source);
            const eventData = {
                subject: 'community_comment',
                label: 'Reply',
                source_type: source,
                type: 'login',
                ...getPlacementData(isFeatured)
            };
            signInModalActions.doDisplayModal({
                dangerousDek: signInMessage,
                dangerousHed: signInHed,
                dangerousHedSpanTag: signInHedSpanTag,
                redirectURL: redirectURL.href,
                shouldHideIllustration: true,
                source,
                snowplowData: eventData
            });
        }
        else if (siteUserName) {
            setCommentIDs((prevCommentIDs) => [...prevCommentIDs, commentId]);
            setReplyNote((prevReplyNote) => ({
                ...prevReplyNote,
                [commentId]: true
            }));
        }
        else if (siteUserName !== undefined) {
            userNameModalActions.doDisplayModal({
                dangerousDek: usernameSignInDek,
                successCallback: (result) => {
                    handleUsernameChange(result);
                    setCommentIDs((prevCommentIDs) => [...prevCommentIDs, commentId]);
                    setReplyNote((prevReplyNote) => ({
                        ...prevReplyNote,
                        [commentId]: true
                    }));
                },
                source: 'community_reply',
                isFeatured
            });
            const eventData = {
                type: 'impression',
                subject: 'username_modal',
                label: 'Create Username',
                source_type: 'community_reply',
                ...getPlacementData(isFeatured)
            };
            trackUserAccountEvent(eventData);
        }
        const eventData = {
            type: 'attempt',
            subject: 'community_comment',
            label: 'reply',
            items: [
                {
                    content_id: commentId
                }
            ],
            ...getPlacementData(isFeatured)
        };
        trackContentEngagementEvent(eventData, { skipDuplicateEvent: false });
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [siteUserName]);
    const handleCommentReaction = ({ item }) => {
        const eventType = userReactions[item.commentId]?.viewerActionPresence
            ? 'unlike'
            : 'like';
        if (true) {
            const eventData = {
                type: eventType,
                subject: 'community_comment',
                ...getPlacementData(item.isFeatured)
            };
            trackContentEngagementEvent(eventData, { skipDuplicateEvent: false });
        }
        commentReactionHandler({ item });
    };
    const handleCloseReply = (commentId) => {
        setReplyNote((prevReplyNote) => ({
            ...prevReplyNote,
            [commentId]: false
        }));
    };
    const ctaLabel = showMoreButtonLabel ?? formatMessage(translations.showMoreButtonLabel);
    useViewportObserver(`.${REVIEW_LIST_BUTTON}`, undefined, (isInViewport) => {
        if (isInViewport) {
            trackShowMoreCommentsImpression(ctaLabel);
        }
    });
    return (React.createElement(ReviewListWrapper, { className: className, id: id, tabIndex: "-1" },
        !!items?.length && (React.createElement(ReviewListItems, null, items.map((item) => {
            const { id: itemId, commentId, text, username, date, rating, replies, replyPageInfo, recipeId, revisionId, role, tags, storyURL, images = [], isFeatured } = item || {};
            const existingReaction = userReactions[commentId] || {};
            const { viewerActionPresence = false, reactionCount = 0 } = existingReaction;
            const showTags = shouldEnableTags && !!tags?.length;
            const { badge: badgeText } = reviewerBadges?.find((item) => item.role === role) || {};
            const ratingContent = shouldEnableRatings && rating && (React.createElement(ReviewListRatingStars, { as: "div" },
                React.createElement(Rating, { averageRatingCount: rating })));
            return (React.createElement(ReviewItem, { key: [itemId, text, username, date].join('-'), shouldUseFullOpacity: shouldUseFullOpacity },
                React.createElement(ReviewMetaGrid, { badgeText: badgeText },
                    React.createElement(UserBadgeWrapper, { badgeText: badgeText },
                        username && (React.createElement(ReviewerUserName, null, username)),
                        badgeText && (React.createElement(ReviewerBadge, { badgeText: badgeText, shouldUseAlternateColorToken: shouldUseAlternateColorToken }))),
                    ratingContent),
                React.createElement(ReviewListMetaInfo, null,
                    showTags && (React.createElement(React.Fragment, null,
                        tags.map((tag) => (React.createElement(ToggleChip, { key: tag }, tag))),
                        React.createElement(Dot, null))),
                    React.createElement(ReviewListTimeStamp, null, date)),
                React.createElement(ReviewListMetaInfo, null, text && (React.createElement(ReviewText, { dangerouslySetInnerHTML: { __html: text } }))),
                React.createElement(ReviewListMetaInfo, null, hasImageUpload &&
                    images.map((image, index) => (React.createElement(ReviewImage, { key: index, src: getPreviewUrl(image?.url, spectraUrl) })))),
                React.createElement(ReviewListMetaInfo, null,
                    shouldEnableUpvotes && (React.createElement(ReviewListReactionButton, { isIconButton: true, name: "comment-reaction", label: "Reaction", onClickHandler: () => handleCommentReaction({ item }), ButtonIcon: viewerActionPresence ? LikeFilled : Like })),
                    shouldEnableUpvotes && (React.createElement(ReviewLikeCount, null, reactionCount)),
                    shouldEnableReply && (React.createElement(ReviewReplyWrapper, { onClick: () => handleReplyEvent(commentId, isFeatured) },
                        React.createElement(Comment, null),
                        React.createElement(ReviewReplyLabel, null, formatMessage(translations.reviewReplyLabel))))),
                replyNote[commentId] &&
                    commentIDs.includes(commentId) &&
                    user?.isAuthenticated && (React.createElement(ReviewReplyNote, { commentId: commentId, username: username, contentId: recipeId, revisionId: revisionId, commentingUrl: commentingUrl, closeReply: () => handleCloseReply(commentId), reviewModalProps: reviewModalProps, showMessageBannerHandler: showMessageBannerHandler, source: "community_comment", contentTitle: contentTitle, storyURL: storyURL, isFeatured: isFeatured, hasImageUpload: hasImageUpload })),
                replies && replies.length > 0 && (React.createElement(ReviewReplyComment, { shouldUseAlternateColorToken: shouldUseAlternateColorToken, reviewerBadges: reviewerBadges, username: username, replies: replies, replyPageInfo: replyPageInfo, reviewModalProps: reviewModalProps, repliesOrderBy: repliesOrderBy, commentReactionHandler: commentReactionHandler, user: user, userReactions: userReactions, updateUserReactions: updateUserReactions, usernameSignInDek: usernameSignInDek, signInHed: signInHed, signInHedSpanTag: signInHedSpanTag, signInMessage: signInMessage, shouldEnableReply: shouldEnableReply, commentId: commentId, replyLimit: replyLimit, siteUserName: siteUserName, handleUsernameChange: handleUsernameChange, contentId: recipeId, showMessageBannerHandler: showMessageBannerHandler, commentingUrl: commentingUrl, shouldEnableUpvotes: shouldEnableUpvotes, isFeatured: isFeatured, hasImageUpload: hasImageUpload, spectraUrl: spectraUrl }))));
        }))),
        !hasErrored && hasNextPage && (React.createElement(ReviewListButton, { className: REVIEW_LIST_BUTTON, inputKind: "button", onClickHandler: () => {
                handleShowMore();
                trackShowMoreCommentsClick(ctaLabel);
            }, label: isLoading ? formatMessage(translations.loading) : ctaLabel, isDisabled: isLoading })),
        hasErrored ? (React.createElement(ReviewListError, null, formatMessage(translations.reviewListError, {
            br: React.createElement("br", null)
        }))) : null));
};
ReviewList.propTypes = {
    className: PropTypes.string,
    commentingUrl: PropTypes.string.isRequired,
    commentReactionHandler: PropTypes.func,
    contentTitle: PropTypes.string,
    handleShowMore: PropTypes.func,
    handleUsernameChange: PropTypes.func,
    hasErrored: PropTypes.bool,
    hasImageUpload: PropTypes.bool,
    hasNextPage: PropTypes.bool,
    id: PropTypes.string,
    isLoading: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number,
        text: PropTypes.string,
        username: PropTypes.string,
        date: PropTypes.string,
        revisionId: PropTypes.string.isRequired,
        commentId: PropTypes.string.isRequired,
        viewerActionPresence: PropTypes.bool,
        reactionCount: PropTypes.number,
        isFeatured: PropTypes.bool
    })),
    repliesOrderBy: PropTypes.string,
    replyLimit: PropTypes.number,
    reviewerBadges: PropTypes.arrayOf(PropTypes.shape({
        role: PropTypes.string,
        badge: PropTypes.string
    })),
    reviewModalProps: PropTypes.object,
    shouldEnableRatings: PropTypes.bool,
    shouldEnableReply: PropTypes.bool,
    shouldEnableTags: PropTypes.bool,
    shouldEnableUpvotes: PropTypes.bool,
    shouldUseAlternateColorToken: PropTypes.bool,
    shouldUseFullOpacity: PropTypes.bool,
    showMessageBannerHandler: PropTypes.func,
    showMoreButtonLabel: PropTypes.string,
    signInHed: PropTypes.string,
    signInHedSpanTag: PropTypes.string,
    signInMessage: PropTypes.string,
    siteUserName: PropTypes.string,
    spectraUrl: PropTypes.string,
    updateUserReactions: PropTypes.func,
    user: PropTypes.shape({
        amguuid: PropTypes.string,
        isAuthenticated: PropTypes.bool.isRequired
    }).isRequired,
    usernameSignInDek: PropTypes.string,
    userReactions: PropTypes.objectOf(PropTypes.shape({
        viewerActionPresence: PropTypes.bool.isRequired,
        reactionCount: PropTypes.number.isRequired
    }).isRequired)
};
module.exports = ReviewList;
//# sourceMappingURL=ReviewList.js.map

/***/ }),

/***/ 47125:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(8101);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 16631:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const styled = (__webpack_require__(92168)["default"]);
const { BaseLink, BaseText } = __webpack_require__(76955);
const { calculateSpacing, getColorStyles, getColorToken, getTypographyStyles, maxScreen, minScreen } = __webpack_require__(26865);
const { BREAKPOINTS } = __webpack_require__(96472);
const TriangleIcon = __webpack_require__(43438);
const ResponsiveAsset = __webpack_require__(73275);
const Button = __webpack_require__(73730);
const { ToggleButton } = __webpack_require__(18161);
const { RatingWrapper, RatingStarHalf, RatingStar, RatingLabel, RatingInput } = __webpack_require__(97927);
const ReviewListButton = styled(Button.Primary).withConfig({
    displayName: 'ReviewListButton'
}) `
  align-self: center;
  margin-top: ${calculateSpacing(4)};
  margin-bottom: ${calculateSpacing(4)};
`;
const ReviewListItems = styled.ul.withConfig({
    displayName: 'ReviewListItems'
}) `
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;
const ReviewListCarat = styled(TriangleIcon).withConfig({
    displayName: 'ReviewListCarat'
}) `
  margin-left: ${calculateSpacing(1)};
  width: ${calculateSpacing(1)};
  height: ${calculateSpacing(1)};
  ${({ theme }) => getColorStyles(theme, 'fill', 'colors.interactive.base.black')};

  path {
    transform: rotate(180deg);
    transform-origin: center;
  }
`;
const ReviewListUtilityLink = styled(BaseLink).withConfig({
    displayName: 'ReviewListUtilityLink'
}) ``;
ReviewListUtilityLink.defaultProps = {
    colorToken: 'colors.interactive.base.black',
    typeIdentity: 'typography.definitions.utility.button-bulletin'
};
const ReviewListTitle = styled(BaseText).withConfig({
    displayName: 'ReviewListTitle'
}) ``;
ReviewListTitle.defaultProps = {
    as: 'h2',
    colorToken: 'colors.consumption.body.standard.subhed',
    typeIdentity: 'typography.definitions.consumptionEditorial.subhed-aux-primary'
};
const ReviewListTitleWrapper = styled.div.withConfig({
    displayName: 'ReviewListTitleWrapper'
}) `
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: ${calculateSpacing(4)} 0 0;
  padding-bottom: ${calculateSpacing(4)};
`;
const ReviewListWrapper = styled.div.withConfig({
    displayName: 'ReviewListWrapper'
}) `
  display: flex;
  flex-direction: column;
  outline: none;
  ${maxScreen(BREAKPOINTS.md)} {
    margin-left: calc(-1 * var(--grid-margin));
    padding-right: var(--grid-margin);
    padding-left: var(--grid-margin);
    /* Full bleed effect */
    width: calc(100% + (2 * var(--grid-margin)));
  }
`;
const ReviewListError = styled(BaseText).withConfig({
    displayName: 'ReviewListError'
}) `
  margin: ${calculateSpacing(4)} 0;
  text-align: center;
`;
const ReviewItem = styled.li.withConfig({ displayName: 'ReviewItem' }) `
  margin-top: ${calculateSpacing(3)};
  border-width: 1px 0 0;
  border-style: solid;
  ${({ theme }) => getColorStyles(theme, 'border-color', 'colors.consumption.body.standard.divider')};
  padding-top: ${calculateSpacing(3)};

  :first-child {
    margin-top: ${calculateSpacing(4)};
    border-top: 0;
    padding-top: 0;
    ${maxScreen(BREAKPOINTS.md)} {
      margin-top: ${calculateSpacing(3)};
    }
  }

  .pinned-comment + & {
    margin-top: ${calculateSpacing(3)};
    border-top: 0;
    padding-top: 0;
  }

  :last-child {
    margin-bottom: ${calculateSpacing(3)};
    ${maxScreen(BREAKPOINTS.md)} {
      margin-bottom: ${calculateSpacing(3)};
    }
  }

  ${ToggleButton} {
    ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.foundation.link-utility')};

    background-color: rgba(
      ${getColorToken('colors.background.brand', { rgbOnly: true })},
      ${({ shouldUseFullOpacity }) => (shouldUseFullOpacity ? 1 : 0.2)}
    );
    ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.black')};

    &:not(:first-of-type) {
      margin-left: ${calculateSpacing(1)};
    }

    &[aria-checked='true'] {
      transition: none;
      text-decoration: none;
    }

    &:hover,
    &:focus {
      outline: 0;
      box-shadow: none;
      cursor: unset;
      text-decoration: none;
    }
  }
  ${RatingWrapper} {
    padding: 0;
  }
`;
const PinnedCommentContainer = styled.div.withConfig({
    displayName: 'PinnedCommentContainer'
}) `
  ${ReviewListItems} {
    padding: 0 ${calculateSpacing(3)};
  }
  margin-top: ${calculateSpacing(4)};
  border: 1px solid;
  border-color: ${({ shouldUseDarkPinnedTheme }) => getColorToken(shouldUseDarkPinnedTheme
    ? 'colors.background.black'
    : 'colors.background.brand')};
  width: 100%;
  ${ReviewItem} {
    margin-top: 0;
    margin-bottom: 0;
    padding: ${calculateSpacing(3)} 0;
  }
`;
const PinnedContainerHeading = styled.div.withConfig({
    displayName: 'PinnedContainerHeading'
}) `
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background-color: rgba(
    ${({ shouldUseDarkPinnedTheme }) => getColorToken(shouldUseDarkPinnedTheme
    ? 'colors.background.black'
    : 'colors.background.brand', { rgbOnly: true })},
    ${({ shouldUseFullOpacity }) => (shouldUseFullOpacity ? 1 : 0.1)}
  );
  padding: 10px;
  width: 100%;
  height: ${calculateSpacing(4.25)};
`;
const PinnedTextLabel = styled.div.withConfig({
    displayName: 'PinnedTextLabel'
}) `
  ${getTypographyStyles('typography.definitions.foundation.meta-secondary')}
  ${({ shouldUseAlternateColorToken, shouldUseInvertedColor }) => shouldUseAlternateColorToken
    ? getColorStyles('color', 'colors.interactive.social.primary')
    : getColorStyles('color', shouldUseInvertedColor
        ? 'colors.background.white'
        : 'colors.background.brand')};
  margin-right: 5px;
`;
const CommunityBrandLogoImage = styled(ResponsiveAsset).withConfig({
    displayName: 'CommunityBrandLogoImage'
}) `
  img {
    height: 16px;
    vertical-align: middle;
  }
`;
const ReviewerUserName = styled(BaseText).withConfig({
    displayName: 'ReviewerUserName'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.globalEditorial.accreditation-core')};
`;
const ReviewListTimeStamp = styled(BaseText).withConfig({
    displayName: 'ReviewListTimeStamp'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.dark')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.foundation.meta-secondary')};
`;
const ReviewText = styled(BaseText).withConfig({
    displayName: 'ReviewText'
}) `
  word-wrap: break-word;
  white-space: pre-wrap;

  a {
    overflow-wrap: break-word;
  }
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.consumptionEditorial.body-core')};
`;
const ReviewImage = styled.img.withConfig({
    displayName: 'ReviewImage'
}) `
  cursor: pointer;
  width: ${calculateSpacing(20.5)};
  max-width: 100%;
  height: ${calculateSpacing(20.5)};
  object-fit: cover;

  ${minScreen(BREAKPOINTS.md)} {
    width: ${calculateSpacing(15)};
    height: ${calculateSpacing(15)};
  }
`;
const ReviewListRatingStars = styled(BaseText).withConfig({
    displayName: 'ReviewListRatingStars'
}) `
  display: flex;
  flex-direction: row;
  align-items: center;

  &&& {
    ${RatingStarHalf} {
      left: 0;

      path {
        ${({ theme }) => getColorStyles(theme, 'fill', 'colors.consumption.body.special.accent')};
      }
    }
    ${RatingStar} {
      width: ${calculateSpacing(2.5)};
    }
    ${RatingInput} {
      &:disabled + ${RatingLabel} {
        cursor: unset;
      }
    }
  }
`;
const ReviewLikeCount = styled(BaseText).withConfig({
    displayName: 'ReviewLikeCount'
}) `
  padding-right: ${calculateSpacing(2)};
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.dark')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.foundation.link-secondary')};
`;
const ReviewReplyLabel = styled(BaseText).withConfig({
    displayName: 'ReviewReplyLabel'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.dark')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.foundation.link-secondary')};
  cursor: pointer;
  padding-right: ${calculateSpacing(0.5)};
`;
const ReviewReplyWrapper = styled.div.withConfig({
    displayName: 'ReviewReplyWrapper'
}) `
  display: flex;
  flex-direction: row;
`;
const ReviewListMetaInfo = styled.ul.withConfig({
    displayName: 'ReviewListMetaInfo'
}) `
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  margin-top: ${calculateSpacing(4)}, ${calculateSpacing(4)};
  padding: 0;
  list-style: none;

  :first-child {
    margin-bottom: 10px;
    ${maxScreen(BREAKPOINTS.md)} {
      margin-bottom: ${calculateSpacing(1)};
    }
  }

  &:not(:first-child) {
    margin-bottom: ${calculateSpacing(1.5)};
    ${maxScreen(BREAKPOINTS.md)} {
      margin-bottom: ${calculateSpacing(2)};
    }
  }

  :last-child {
    margin-top: ${calculateSpacing(1.5)};
    margin-bottom: ${calculateSpacing(1)};
    ${maxScreen(BREAKPOINTS.md)} {
      margin-top: ${calculateSpacing(2)};
      margin-bottom: 0;
    }
  }

  .icon-dots {
    padding-right: 6px;
    padding-left: 6px;

    ${({ theme }) => getColorStyles(theme, 'fill', 'colors.interactive.base.dark')};

    ${maxScreen(BREAKPOINTS.md)} {
      padding-right: ${calculateSpacing(0.5)};
      padding-left: ${calculateSpacing(0.5)};
    }
  }

  .icon-like,
  .icon-like-filled,
  .icon-comment {
    margin-top: 3px;
    cursor: pointer;
    width: ${calculateSpacing(4)};
    height: 18px;

    path {
      ${({ theme }) => getColorStyles(theme, 'fill', 'colors.interactive.base.dark')};
      ${({ theme }) => getColorStyles(theme, 'stroke', 'colors.interactive.base.dark')};
    }

    &:hover path {
      ${({ theme }) => getColorStyles(theme, 'fill', 'colors.interactive.base.black')};
      ${({ theme }) => getColorStyles(theme, 'stroke', 'colors.interactive.base.black')};
    }
  }

  .icon-like-filled {
    width: ${calculateSpacing(4)};
    height: 18px;

    path {
      ${({ theme }) => getColorStyles(theme, 'fill', 'colors.interactive.base.black')};
      ${({ theme }) => getColorStyles(theme, 'stroke', 'colors.interactive.base.black')};
    }
  }
`;
const ReviewListReactionButton = styled(Button.Utility).withConfig({
    displayName: 'ReviewListReactionButton'
}) `
  padding: 0;

  &,
  &:focus,
  &:hover {
    border: 0;
    background-color: transparent;
  }
`;
const ReviewMetaGrid = styled.div.withConfig({
    displayName: 'ReviewMetaGrid'
}) `
  display: grid;
  grid-template-columns: ${({ badgeText }) => badgeText ? 'repeat(1, max-content)' : 'repeat(2, max-content)'};
  align-items: center;
  column-gap: ${calculateSpacing(1.25)};
  margin-bottom: ${calculateSpacing(1.25)};
  justify-items: start;
`;
const UserBadgeWrapper = styled.div.withConfig({
    displayName: 'UserBadgeWrapper'
}) `
  display: grid;
  grid-template-columns: repeat(2, max-content);
  column-gap: ${({ badgeText }) => (badgeText ? calculateSpacing(1.25) : '0')};
`;
module.exports = {
    CommunityBrandLogoImage,
    PinnedCommentContainer,
    PinnedContainerHeading,
    PinnedTextLabel,
    ReviewListWrapper,
    ReviewListTitleWrapper,
    ReviewListTitle,
    ReviewListUtilityLink,
    ReviewListCarat,
    ReviewListItems,
    ReviewListReactionButton,
    ReviewListButton,
    ReviewListError,
    ReviewerUserName,
    ReviewListRatingStars,
    ReviewListTimeStamp,
    ReviewText,
    ReviewLikeCount,
    ReviewReplyLabel,
    ReviewListMetaInfo,
    ReviewItem,
    ReviewImage,
    ReviewMetaGrid,
    ReviewReplyWrapper,
    UserBadgeWrapper
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 16963:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.trackShowMoreCommentsClick = exports.trackShowMoreCommentsImpression = void 0;
const snowplow_tracking_1 = __webpack_require__(14307);
const trackShowMoreCommentsImpression = (ctaLabel) => {
    const entityData = {
        type: 'impression',
        label: ctaLabel,
        subject: 'community'
    };
    (0, snowplow_tracking_1.trackContentEngagementEvent)(entityData);
};
exports.trackShowMoreCommentsImpression = trackShowMoreCommentsImpression;
const trackShowMoreCommentsClick = (ctaLabel) => {
    if (true) {
        const eventData = {
            type: 'click',
            label: ctaLabel,
            subject: 'community'
        };
        (0, snowplow_tracking_1.trackContentEngagementEvent)(eventData, { skipDuplicateEvent: false });
    }
};
exports.trackShowMoreCommentsClick = trackShowMoreCommentsClick;
//# sourceMappingURL=tracking.js.map

/***/ }),

/***/ 74657:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    loading: {
        id: 'ReviewList.Loading',
        defaultMessage: 'Loading…',
        description: 'Button label while list loads'
    },
    reviewListError: {
        id: 'ReviewList.ReviewListError',
        defaultMessage: 'Sorry, more reviews can‘t be loaded right now. {br} Please try again later.',
        description: 'Error message while loading list'
    },
    reviewReplyLabel: {
        id: 'ReviewList.ReviewReplyLabel',
        defaultMessage: 'Reply',
        description: 'Reply Icon label'
    },
    showMoreButtonLabel: {
        id: 'ReviewList.showMoreButtonLabel',
        defaultMessage: 'Read more comments',
        description: 'Label for show more button'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 26576:
/***/ ((module) => {

const getPreviewUrl = (responseUrl, spectraUrl) => {
    const optimizationPrefix = `${spectraUrl}/eu-central-1/api/v2/optimize?format=type_jpeg&url=`;
    const previewUrl = optimizationPrefix + encodeURIComponent(responseUrl);
    return previewUrl;
};
module.exports = {
    getPreviewUrl
};
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 71549:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const { useTheme } = __webpack_require__(50435);
const { ReviewListBadgeText, ReviewerBadgeWrapper, VerificationBadgeIcon } = __webpack_require__(55917);
const { getColorToken } = __webpack_require__(26865);
const { asConfiguredComponent } = __webpack_require__(12892);
/**
 *
 * @returns {string} badge text
 */
/**
 * Reviewer Badge component
 *
 * @param {object} props - React props

 * @param {string} props.badgeText - Role of a reviewer
 * @param {boolean} props.shouldUseAlternateColorToken - Optional flag to use alternate color token from BI
 * @returns {ReactElement} <ReviewerBadge>
 */
const ReviewerBadge = ({ badgeText, shouldUseAlternateColorToken = false }) => {
    const theme = useTheme();
    const badgeColor = shouldUseAlternateColorToken
        ? getColorToken(theme, 'colors.interactive.social.primary')
        : getColorToken(theme, 'colors.background.brand');
    return (React.createElement(ReviewerBadgeWrapper, { "data-testid": "reviewer-badge" },
        React.createElement(VerificationBadgeIcon, { color: badgeColor }),
        React.createElement(ReviewListBadgeText, { shouldUseAlternateColorToken: shouldUseAlternateColorToken }, badgeText)));
};
ReviewerBadge.propTypes = {
    badgeText: PropTypes.string,
    shouldUseAlternateColorToken: PropTypes.bool
};
ReviewerBadge.displayName = 'ReviewerBadge';
module.exports = asConfiguredComponent(ReviewerBadge, 'ReviewerBadge');
//# sourceMappingURL=ReviewerBadge.js.map

/***/ }),

/***/ 50787:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(71549);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 55917:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const styled = (__webpack_require__(92168)["default"]);
const { BaseText, BaseWrap } = __webpack_require__(76955);
const { calculateSpacing, getColorStyles, getTypographyStyles } = __webpack_require__(26865);
const { VerificationBadge } = __webpack_require__(24695);
const ReviewerBadgeWrapper = styled(BaseWrap).withConfig({
    displayName: 'ReviewerBadgeWrapper'
}) `
  display: flex;
`;
const ReviewListBadgeText = styled(BaseText).withConfig({
    displayName: 'ReviewBadgeText'
}) `
  padding-left: ${calculateSpacing()};
  ${getTypographyStyles('typography.definitions.foundation.meta-secondary')}
  ${({ shouldUseAlternateColorToken }) => shouldUseAlternateColorToken
    ? getColorStyles('color', 'colors.interactive.social.primary')
    : getColorStyles('color', 'colors.background.brand')};
`;
const VerificationBadgeIcon = styled(VerificationBadge).withConfig({
    displayName: 'VerificationBadgeIcon'
}) ``;
module.exports = {
    ReviewerBadgeWrapper,
    ReviewListBadgeText,
    VerificationBadgeIcon
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 5697:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { getFromNowDateFormat } = __webpack_require__(45526);
module.exports = {
    getFromNowDateFormat
};
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 45526:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const translations = __webpack_require__(39965);
const DEFAULT_LOCALE = 'en-US';
/**
 * Get the publish date for live story
 *
 * @param {string} locale - optional: language to localise the date into.
 * @param {string} date - Publish Date
 * @param {any} formatMessage - Required for translations
 * @param {boolean} [includeHourAndMin] - Optional for including the hour and minutes
 *
 * @returns {string} - the formatted published timestamp
 */
const getFromNowDateFormat = ({ locale = DEFAULT_LOCALE, date, formatMessage, includeHourAndMin = false }) => {
    const rtf = new Intl.RelativeTimeFormat(locale, {
        localeMatcher: 'best fit',
        numeric: 'always',
        style: 'long'
    });
    const rtfTimeFormat = new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        localeMatcher: 'best fit'
    });
    const MS_SECOND = 1000;
    const MS_MINUTE = MS_SECOND * 60;
    const MS_HOUR = MS_MINUTE * 60;
    const MS_DAY = MS_HOUR * 24;
    const MS_MONTH = MS_DAY * 30;
    const MS_YEAR = MS_DAY * 365;
    const FROM_NOW_JUST_NOW = MS_SECOND * 44;
    const FROM_NOW_MINUTE = MS_SECOND * 89;
    const FROM_NOW_MINUTES = MS_MINUTE * 44;
    const FROM_NOW_HOUR = MS_MINUTE * 89;
    const FROM_NOW_HOURS = MS_HOUR * 21;
    const FROM_NOW_DAY = MS_HOUR * 35;
    const FROM_NOW_DAYS = MS_DAY * 25;
    const FROM_NOW_MONTH = MS_DAY * 45;
    const FROM_NOW_MONTHS = MS_DAY * 319;
    const FROM_NOW_YEAR = MS_DAY * 547;
    const fromNow = (value) => {
        const nowTick = new Date().getTime();
        const valueTick = new Date(value).getTime();
        const delta = nowTick - valueTick;
        if (delta <= FROM_NOW_JUST_NOW) {
            return formatMessage(translations.fewSecondsAgoLabel);
        }
        else if (delta <= FROM_NOW_MINUTE) {
            return formatMessage(translations.aMinAgoLabel);
        }
        else if (delta <= FROM_NOW_MINUTES) {
            return rtf.format(-Math.ceil(delta / MS_MINUTE), 'minute');
        }
        else if (delta <= FROM_NOW_HOUR) {
            return formatMessage(translations.anHourAgoLabel);
        }
        else if (delta <= FROM_NOW_HOURS) {
            return rtf.format(-Math.ceil(delta / MS_HOUR), 'hour');
        }
        else if (delta <= FROM_NOW_DAY) {
            return formatMessage(translations.aDayAgoLabel);
        }
        else if (delta <= FROM_NOW_DAYS) {
            return rtf.format(-Math.ceil(delta / MS_DAY), 'day');
        }
        else if (delta <= FROM_NOW_MONTH) {
            return formatMessage(translations.aMonthAgoLabel);
        }
        else if (delta <= FROM_NOW_MONTHS) {
            return rtf.format(-Math.ceil(delta / MS_MONTH), 'month');
        }
        else if (delta <= FROM_NOW_YEAR) {
            return formatMessage(translations.aYearAgoLabel);
        }
        return rtf.format(-Math.ceil(delta / MS_YEAR), 'year');
    };
    const getTheTimeFormat = (dateTime) => {
        if (dateTime) {
            const timeFromNow = fromNow(dateTime);
            const hourAndMin = rtfTimeFormat.format(new Date(dateTime));
            if (includeHourAndMin)
                return `${timeFromNow}, ${hourAndMin}`;
            return timeFromNow;
        }
        return null;
    };
    return getTheTimeFormat(date);
};
module.exports = { getFromNowDateFormat };
//# sourceMappingURL=publishDate.js.map

/***/ }),

/***/ 39965:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { defineMessages } = __webpack_require__(46984);
module.exports = defineMessages({
    fewSecondsAgoLabel: {
        id: 'LiveStory.feedFewSecondsAgoLabel',
        defaultMessage: 'a few seconds ago',
        description: ''
    },
    aMinAgoLabel: {
        id: 'LiveStory.feedAMinAgoLabel',
        defaultMessage: 'a minute ago',
        description: ''
    },
    anHourAgoLabel: {
        id: 'LiveStory.feedAnHourAgoLabel',
        defaultMessage: 'an hour ago',
        description: ''
    },
    aDayAgoLabel: {
        id: 'LiveStory.feedADayAgoLabel',
        defaultMessage: 'a day ago',
        description: ''
    },
    aMonthAgoLabel: {
        id: 'LiveStory.feedAMonthAgoLabel',
        defaultMessage: 'a month ago',
        description: ''
    },
    aYearAgoLabel: {
        id: 'LiveStory.feedAYearAgoLabel',
        defaultMessage: 'a year ago',
        description: ''
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 3890:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const { useIntl } = __webpack_require__(46984);
const { useEffect, useRef, useState } = __webpack_require__(96540);
const { TrackComponentChannel } = __webpack_require__(78788);
const { trackTagEvent } = __webpack_require__(55144);
const InformationIcon = __webpack_require__(25965);
const ToggleChip = __webpack_require__(15343);
const ToggleChipList = __webpack_require__(99244);
const translations = (__webpack_require__(39321)/* ["default"] */ .A);
const userNameModalActions = __webpack_require__(61057);
const ReviewNoteModal = __webpack_require__(45771);
const { trackUserAccountEvent } = __webpack_require__(14307);
const ImageUpload = __webpack_require__(72667);
const { AlertArrow, ReviewNoteFormWrapper, ReviewNoteSectionContainer, ReviewNoteUserInfo, ReviewerInfoLabel, ReviewerName, ReviewerInfoIconButtonWrapper, ReviewNoteRatingWrapper, RatingFormRating, ReviewNotesFormMinimised, ReviewerRatingLabel, ReviewerInfoAlertToolTip, ReveiwerInfoText, ReviewTagsInfoLabel, ReviewNotesToggleChipListWrapper, ReviewNotesFormActions, ReviewNotesFormCancelButton, ReviewNotesFormTextFieldErrorText, ReviewNotesFormSubmitButton, ReviewNoteTextField, ReviewNotesDivider, ReviewNotesImageUploadWrapper } = __webpack_require__(37887);
const TextField = __webpack_require__(89662);
const Button = __webpack_require__(73730);
const { trackContentEngagementEvent } = __webpack_require__(14307);
const { useOutsideClick } = __webpack_require__(87098);
const MinimisedNotesFormWrapper = ({ ariaLabel, children, onMinimise, usernameSignInDek, trackAddNoteEvent, handleUsernameChange, siteUserName }) => {
    const eventData = {
        type: 'impression',
        label: 'Create Username',
        subject: 'username_modal',
        source_type: 'community_comment'
    };
    const usernameCheck = (e) => {
        if (siteUserName) {
            onMinimise(e, siteUserName);
        }
        else if (siteUserName !== undefined) {
            trackUserAccountEvent(eventData);
            userNameModalActions.doDisplayModal({
                dangerousDek: usernameSignInDek,
                successCallback: (result) => {
                    handleUsernameChange(result);
                    onMinimise(e, result);
                },
                source: 'community_comment'
            });
        }
    };
    return (React.createElement(ReviewNotesFormMinimised, { role: "button", tabIndex: "0", onClick: (e) => {
            trackAddNoteEvent();
            usernameCheck(e);
        }, onKeyPress: onMinimise, "aria-label": ariaLabel }, children));
};
MinimisedNotesFormWrapper.propTypes = {
    ariaLabel: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    handleUsernameChange: PropTypes.func.isRequired,
    onMinimise: PropTypes.func.isRequired,
    siteUserName: PropTypes.string,
    trackAddNoteEvent: PropTypes.func,
    usernameSignInDek: PropTypes.string
};
/**
 * ReviewNotesForm component
 *
 * @param {object} props - React props
 * @param {string} [props.addNoteLabel] - Optional label when adding to notes
 * @param {string} [props.addNoteFailedToastMessage] - Optional message for failure to add comment
 * @param {string} [props.className] - Optional top-level class to add
 * @param {Function} [props.handleUsernameChange] - Function to set user name
 * @param {boolean} [props.hasImageUpload] - flag to enable image upload in comments
 * @param {bool} [props.isMinimised] - The initial view of the form is minimised
 * @param {string} [props.minimisedReviewNotesText] - The text on the initial fake input field
 * @param {string} [props.nonLoggedInErrorMessage] - Optional error message when not logged in
 * @param {string} [props.reviewerInfoFieldLabel] - Optional label for info field
 * @param {string} [props.reviewTagsLabel] - Optional label for tags
 * @param {object} [props.modalProps] - Optional props to show labels of Modal
 * @param {Function} [props.onSubmitHandler] - Function to call on submit
 * @param {string} [props.reviewerInfoText] - Optional text for reviewer info alert icon.
 * @param {string} [props.reviewerRatingLabel] - rating section title
 * @param {Array} [props.reviewNoteTags] - Optional prop to configure the review note toggle chips
 * @param {bool} [props.shouldEnableRatings] - flag to enable community rating
 * @param {bool} [props.shouldEnableTags] - flag to enable tags in comments
 * @param {boolean} [props.shouldUseInteractiveBrandColor] - Optional prop to override the color of the toggle chips
 * @param {bool} [props.shouldUseFullOpacity] - Optional flag to increase opacity if brands backrgound.brand token is light
 * @param {func} [props.showMessageBannerHandler] - Optional function to showtoastMessage on success or failure
 * @param {bool} [props.showTextFieldBoxShadow] -  Optional to add box-shadow property
 * @param {bool} [props.showTextFieldRoundedEdges] -  Optional to add border radius property
 * @param {Function} [props.showSavedRecipeNotes] - Function to set the state for saved recipe notes
 * @param {string} [props.signInURL] - Required URL for users to sign in
 * @param {string} [props.siteUserName] - Commenting user name
 * @param {string} [props.userId] - Required user id to be included in form submission
 * @param {string} [props.usernameSignInDek] - Optional prop to use a custom username modal dek
 * @param {object} [props.validations] - Checks for the form
 * @param {object} [props.validations.errorMessage] - Custom error messages
 * @param {number} [props.validations.max] - maxim number of characters for a comment
 * @param {number} [props.validations.min] - minimum number of characters for a comment
 * @param {number} [props.validations.remainingChar] - remaining character number at which to warn
 * @returns {ReactElement} <div>
 */
const ReviewNotesForm = ({ addNoteFailedToastMessage, addNoteLabel, className, shouldEnableTags = false, reviewNoteTags = [], reviewerRatingLabel, shouldUseInteractiveBrandColor = false, validations: { min = 5, max = 3000, remainingChar = 100, errorMessage = {} } = {}, usernameSignInDek, modalProps = {}, minimisedReviewNotesText, nonLoggedInErrorMessage, isMinimised = true, reviewerInfoText, signInURL, userId, handleUsernameChange, onSubmitHandler, reviewerInfoFieldLabel, reviewTagsLabel, siteUserName, showSavedRecipeNotes, shouldEnableRatings, showMessageBannerHandler, shouldUseFullOpacity, showTextFieldBoxShadow = false, showTextFieldRoundedEdges = false, hasImageUpload = false }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'ReviewNotesForm'
        });
    }, []);
    const formConfig = {
        reviewNote: '',
        toggleChip: [],
        ...(shouldEnableRatings && { rating: null })
    };
    const intl = useIntl();
    const [formData, setFormData] = useState(formConfig);
    const [errors, setErrors] = useState({});
    const [warningMessage, setWarningMessage] = useState('');
    const [shouldHideReviewerInfoAlert, setShouldHideReviewerInfoAlert] = useState(true);
    const [tags, setTags] = useState(reviewNoteTags);
    const [isReviewNoteModalOpen, setIsReviewNoteModalOpen] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const validationRules = {
        reviewNote: [
            {
                test: (value) => value.length >= min && value.length <= max,
                error: 'invalidReviewLength'
            }
        ],
        rating: [
            {
                test: (value) => value >= 1,
                error: 'requiredField'
            }
        ]
    };
    const [minimised, setMinimised] = React.useState(isMinimised);
    const [isSignedIn, setIsSignedIn] = React.useState(false);
    const [signInError, setSignInError] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    useEffect(() => {
        setIsSignedIn(!!userId);
    }, [userId]);
    const reviewNotesTextPlaceHolder = minimisedReviewNotesText ||
        intl.formatMessage(translations.defaultcommunityReviewText);
    const updateTagsStatus = (tagSlug) => {
        const updatedTags = tags.map((tag) => tag.slug === tagSlug ? { ...tag, active: !tag.active } : tag);
        setTags((prev) => {
            trackTagEvent(updatedTags, prev);
            return updatedTags;
        });
        return updatedTags;
    };
    const updateWarningMessage = (value) => {
        if (value.length >= max) {
            setWarningMessage(intl.formatMessage(translations.maxCharLimitMet).replace('_MAX_', max));
        }
        else if (max - value.length <= remainingChar) {
            setWarningMessage(intl
                .formatMessage(translations.remainingMaxCharLimit)
                .replace('_COUNT_', max - value.length)
                .replace('_MAX_', max));
        }
        else {
            setWarningMessage('');
        }
    };
    const validateField = (field, value) => {
        const rules = validationRules[field];
        if (!rules)
            return null;
        for (const rule of rules) {
            if (!rule.test(value)) {
                setErrors((prevErrors) => ({
                    ...prevErrors,
                    [field]: rule.error
                }));
                return rule.error;
            }
        }
        setErrors((prevErrors) => {
            const { [field]: removedError, ...restErrors } = prevErrors;
            return restErrors;
        });
        return null;
    };
    const validateFormOnSubmit = (formData) => {
        return Object.entries(formData).reduce((errors, [field, value]) => {
            const error = validateField(field, value);
            if (error) {
                errors[field] = error;
            }
            return errors;
        }, {});
    };
    const handleOnChange = (field) => (value) => {
        let newValue;
        switch (field) {
            case 'reviewNote':
                newValue = value.target.value.trim();
                updateWarningMessage(newValue);
                break;
            case 'toggleChip':
                newValue = updateTagsStatus(value);
                break;
            default:
                newValue = value;
                break;
        }
        setFormData({
            ...formData,
            [field]: newValue
        });
        // don't trigger validation when user start typing for first time
        if (field === 'reviewNote' && newValue.length < min) {
            return;
        }
        validateField(field, newValue);
    };
    const trackAddNoteEvent = () => {
        if (true) {
            const eventData = {
                type: 'attempt',
                subject: 'community_comment'
            };
            trackContentEngagementEvent(eventData, { skipDuplicateEvent: false });
        }
    };
    const ref = useRef(null);
    const signInRef = useRef(null);
    const reviewNoteRef = React.useRef(null);
    const handleClickOutside = (event) => {
        if (ref.current && !ref.current.contains(event.target)) {
            setShouldHideReviewerInfoAlert(true);
        }
        if (signInRef.current &&
            signInRef.current.id !== event.target?.firstChild.id) {
            setSignInError(false);
        }
    };
    const showForm = (e, userName) => {
        e.preventDefault();
        userName && setMinimised(false);
        showSavedRecipeNotes(false);
    };
    useOutsideClick(ref, (e) => handleClickOutside(e));
    useOutsideClick(signInRef, (e) => handleClickOutside(e));
    const toggle = (e) => {
        e.preventDefault();
        setShouldHideReviewerInfoAlert(!shouldHideReviewerInfoAlert);
    };
    const handleCancelClick = () => {
        const shouldShowModal = Object.values(formData).some((item) => {
            if (Array.isArray(item) && item.length === 0) {
                return false;
            }
            return Boolean(item);
        });
        if (shouldShowModal) {
            setIsReviewNoteModalOpen(true);
        }
        else {
            setMinimised(true);
            setErrors({});
        }
    };
    const toggleChips = () => {
        return tags.map(({ slug, active, description }) => (React.createElement(ToggleChip, { key: slug, isChecked: active, onChange: () => handleOnChange('toggleChip')(slug), shouldUrlRedirect: false, isDisabled: isSubmitting }, intl.formatMessage(translations.reviewTags, {
            reviewTag: description
        }))));
    };
    const { discardLabel = 'Yes, discard it' } = modalProps;
    const trackDiscardNoteEvent = () => {
        if (true) {
            const eventData = {
                type: 'discard',
                label: discardLabel.toUpperCase(),
                subject: 'community_comment'
            };
            trackContentEngagementEvent(eventData, { skipDuplicateEvent: false });
        }
    };
    const handleClearForm = () => {
        reviewNoteRef.current.value = '';
        setTags(reviewNoteTags);
        setFormData({ ...formConfig });
        setErrors({});
        setMinimised(true);
        setIsReviewNoteModalOpen(false);
        setWarningMessage('');
    };
    const handleSubmit = async () => {
        setIsSubmitting(true);
        const newErrors = validateFormOnSubmit(formData);
        if (Object.keys(newErrors).length === 0) {
            const data = { ...formData, userId };
            const resp = await onSubmitHandler(data);
            if (resp != null) {
                handleClearForm();
                showSavedRecipeNotes(true);
            }
            else {
                showMessageBannerHandler &&
                    showMessageBannerHandler(addNoteFailedToastMessage ||
                        intl.formatMessage(translations.AddNoteFailedToastMessage));
            }
        }
        setIsSubmitting(false);
    };
    const handleDiscardNote = () => {
        handleClearForm();
        trackDiscardNoteEvent();
    };
    const getErrorMessage = (errors, name) => {
        const errorItem = errors[name];
        if (!errorItem)
            return '';
        const customErrorMessage = errorMessage[errorItem];
        if (customErrorMessage)
            return customErrorMessage.replace('_MIN_', min);
        return intl.formatMessage(translations[errorItem], {
            min
        });
    };
    const invalidReview = getErrorMessage(errors, 'reviewNote');
    const hasWarning = warningMessage.length > 0;
    const handleImageUpload = (response) => {
        if (response?.data?.[0]?.filePath) {
            setFormData((prevData) => ({
                ...prevData,
                images: [
                    {
                        id: response?.data?.[0]?.filePath,
                        url: response?.data?.[0]?.encodedURI
                    }
                ]
            }));
        }
        else {
            console.error('Error uploading image:', response);
        }
    };
    const handleImageUploadStatusChange = (isUploading) => {
        setIsImageUploading(isUploading);
    };
    const productName = 'commenting';
    return (React.createElement(ReviewNoteFormWrapper, { className: className, "data-testid": "ReviewNotesForm" }, isSignedIn &&
        (minimised ? (React.createElement(MinimisedNotesFormWrapper, { ariaLabel: reviewNotesTextPlaceHolder, onMinimise: showForm, signInURL: signInURL, isSignedIn: isSignedIn, trackAddNoteEvent: trackAddNoteEvent, handleUsernameChange: handleUsernameChange, siteUserName: siteUserName, usernameSignInDek: usernameSignInDek },
            React.createElement(ReviewNoteTextField, { name: "isMinimised", formName: "isMinimised", label: intl.formatMessage(translations.textFieldLabel), placeholder: reviewNotesTextPlaceHolder, hasDynamicTextArea: true, hasBoxShadow: showTextFieldBoxShadow, hasRoundedEdges: showTextFieldRoundedEdges, tabIndex: "-1", "aria-hidden": true, customHeightMultiplier: 12, hideLabel: true, isInvalid: signInError, inputRef: signInRef, isDisabled: signInError }),
            signInError && (React.createElement(ReviewNotesFormTextFieldErrorText, null, nonLoggedInErrorMessage ||
                intl.formatMessage(translations.nonLoggedInErrorMessage))))) : (React.createElement(ReviewNoteSectionContainer, { hasError: !!invalidReview, hasWarning: hasWarning },
            React.createElement(TextField.MultiLine, { name: "reviewNoteText", placeholder: reviewNotesTextPlaceHolder, hideLabel: true, label: intl.formatMessage(translations.textFieldLabel), formName: "reviewNoteText", hasAutoFocus: true, hasBoxShadow: showTextFieldBoxShadow, hasRoundedEdges: showTextFieldRoundedEdges, inputRef: reviewNoteRef, errorText: invalidReview, onInputChange: handleOnChange('reviewNote'), max: max, errorPosition: "belowTextField", shouldDisableTypingAtMaxChar: true, isDisabled: isSubmitting }),
            hasWarning && (React.createElement(ReviewNotesFormTextFieldErrorText, null, warningMessage)),
            hasImageUpload && (React.createElement(ReviewNotesImageUploadWrapper, null,
                React.createElement(ImageUpload, { onFileChange: handleImageUpload, onUploadStatusChange: handleImageUploadStatusChange, id: "review-note-image-upload", product: productName }))),
            shouldEnableTags && (React.createElement(React.Fragment, null,
                React.createElement(ReviewTagsInfoLabel, null, reviewTagsLabel ||
                    intl.formatMessage(translations.reviewTagsLabel)),
                React.createElement(ReviewNotesToggleChipListWrapper, { shouldUseInteractiveBrandColor: shouldUseInteractiveBrandColor, shouldUseFullOpacity: shouldUseFullOpacity },
                    React.createElement(ToggleChipList, null, toggleChips())))),
            shouldEnableRatings && (React.createElement(ReviewNoteRatingWrapper, null,
                React.createElement(ReviewerRatingLabel, null, reviewerRatingLabel ??
                    intl.formatMessage(translations.reviewerRatingLabel)),
                React.createElement(RatingFormRating, { averageRatingCount: formData.rating, isRatingDisabled: false, onChange: handleOnChange('rating'), shouldShowOutline: false }),
                Object.keys(errors).length > 0 && (React.createElement(ReviewNotesFormTextFieldErrorText, null, getErrorMessage(errors, 'rating'))))),
            React.createElement(ReviewNoteUserInfo, null,
                React.createElement(ReviewerInfoLabel, null, reviewerInfoFieldLabel ||
                    intl.formatMessage(translations.reviewerInfoFieldLabel)),
                React.createElement(ReviewerName, null, siteUserName),
                React.createElement(ReviewerInfoIconButtonWrapper, { ref: ref },
                    React.createElement(Button.Utility, { isIconButton: true, ButtonIcon: InformationIcon, className: "review-note-user__info-button", onClickHandler: (e) => toggle(e), inputKind: "button", role: "button", label: intl.formatMessage(translations.reviewerInfoIconButtonLabel) }),
                    !shouldHideReviewerInfoAlert && (React.createElement(ReviewerInfoAlertToolTip, null,
                        React.createElement(AlertArrow, null),
                        React.createElement(ReveiwerInfoText, null, reviewerInfoText ??
                            intl.formatMessage(translations.reviewerFieldInfoIconText))))),
                React.createElement(ReviewNotesDivider, null)),
            React.createElement(ReviewNoteModal, { confirmButtonCallback: handleDiscardNote, modalProps: modalProps, onClose: () => setIsReviewNoteModalOpen(false), isVisible: isReviewNoteModalOpen }),
            React.createElement(ReviewNotesFormActions, { "data-testid": "ReviewNotesFormActions" },
                React.createElement(ReviewNotesFormSubmitButton, { isDisabled: isSubmitting ||
                        isImageUploading ||
                        Object.keys(errors).length > 0, inputKind: "button", label: addNoteLabel || intl.formatMessage(translations.addNoteLabel), onClickHandler: handleSubmit }),
                React.createElement(ReviewNotesFormCancelButton, { isDisabled: isSubmitting, btnStyle: "text", inputKind: "link", type: "button", label: intl.formatMessage(translations.cancelNoteLabel), onClickHandler: handleCancelClick })))))));
};
ReviewNotesForm.propTypes = {
    addNoteFailedToastMessage: PropTypes.string,
    addNoteLabel: PropTypes.string,
    className: PropTypes.string,
    handleUsernameChange: PropTypes.func,
    hasImageUpload: PropTypes.bool,
    isMinimised: PropTypes.bool,
    minimisedReviewNotesText: PropTypes.string,
    modalProps: PropTypes.object,
    nonLoggedInErrorMessage: PropTypes.string,
    onSubmitHandler: PropTypes.func,
    reviewerInfoFieldLabel: PropTypes.string,
    reviewerInfoText: PropTypes.string,
    reviewerRatingLabel: PropTypes.string,
    reviewNoteTags: PropTypes.array,
    reviewTagsLabel: PropTypes.string,
    shouldEnableRatings: PropTypes.bool,
    shouldEnableTags: PropTypes.bool,
    shouldUseFullOpacity: PropTypes.bool,
    shouldUseInteractiveBrandColor: PropTypes.bool,
    showMessageBannerHandler: PropTypes.func,
    showSavedRecipeNotes: PropTypes.func.isRequired,
    showTextFieldBoxShadow: PropTypes.bool,
    showTextFieldRoundedEdges: PropTypes.bool,
    signInURL: PropTypes.string.isRequired,
    siteUserName: PropTypes.string,
    userId: PropTypes.string,
    usernameSignInDek: PropTypes.string,
    validations: PropTypes.shape({
        min: PropTypes.number,
        max: PropTypes.number,
        remainingChar: PropTypes.number,
        errorMessage: PropTypes.shape({
            requiredField: PropTypes.string,
            invalidReviewLength: PropTypes.string
        })
    })
};
module.exports = ReviewNotesForm;
//# sourceMappingURL=ReviewNotesForm.js.map

/***/ }),

/***/ 45565:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { asConfiguredComponent } = __webpack_require__(12892);
const ReviewNotesForm = __webpack_require__(3890);
module.exports = asConfiguredComponent(ReviewNotesForm, 'ReviewNotesForm');
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 37887:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { css, default: styled } = __webpack_require__(92168);
const { BaseText, BaseLink } = __webpack_require__(76955);
const { calculateSpacing, getColorStyles, getColorToken, getTypographyStyles, maxScreen, minScreen } = __webpack_require__(26865);
const { BREAKPOINTS } = __webpack_require__(96472);
const Rating = __webpack_require__(62340);
const { RatingStar } = __webpack_require__(97927);
const { TextFieldControlTextarea, TextFieldWrapper } = __webpack_require__(60434);
const TextField = __webpack_require__(89662);
const { ListWrapper } = __webpack_require__(14952);
const { ToggleButton } = __webpack_require__(18161);
const Button = __webpack_require__(73730);
const { TextFieldErrorText } = __webpack_require__(60434);
const { ImageUploadWrapper } = __webpack_require__(44741);
const ReviewNoteTextField = styled(TextField.MultiLine).withConfig({
    displayName: 'ReviewNoteTextField'
}) `
  margin-bottom: 0;

  textarea:disabled {
    background-color: transparent;
  }
`;
const ReviewNoteFormWrapper = styled.div.withConfig({
    displayName: 'ReviewNoteFormWrapper'
}) ``;
const ReviewNoteSectionContainer = styled.div.withConfig({
    displayName: 'ReviewNoteSectionContainer'
}) `
  border: 1px solid;
  ${({ theme }) => getColorStyles(theme, 'border-color', 'colors.interactive.base.light')};
  padding: ${calculateSpacing(3)};
  ${TextFieldControlTextarea} {
    margin-top: 0;
    padding: ${calculateSpacing(2)} ${calculateSpacing(1.5)};
    ${({ theme, hasError }) => hasError
    ? getColorStyles(theme, 'border-color', 'colors.interactive.base.brand-secondary')
    : getColorStyles(theme, 'border-color', 'colors.interactive.base.black')};

    &[disabled] {
      ${({ theme }) => getColorStyles(theme, 'background', 'colors.interactive.base.white')};
      ${({ theme }) => getColorStyles(theme, 'border-color', 'colors.interactive.base.light')};
      ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.subhed')};
    }

    &::placeholder {
      ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.light')};
    }
  }
  ${TextFieldWrapper} {
    ${({ hasWarning }) => hasWarning && `margin-bottom: ${calculateSpacing(1)};`}
  }
`;
const ReviewNoteUserInfo = styled.div.withConfig({
    displayName: 'ReviewNoteUserInfo'
}) `
  margin-top: ${calculateSpacing(4)};
  margin-bottom: ${calculateSpacing(4)};
`;
const ReviewNoteRatingWrapper = styled.div.withConfig({
    displayName: 'ReviewNoteRatingWrapper'
}) `
  margin-top: ${calculateSpacing(1)};
  margin-bottom: ${calculateSpacing(4)};
`;
const ReviewerInfoLabel = styled.span.withConfig({
    displayName: 'ReviewerInfoLabel'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body-deemphasized')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.globalEditorial.accreditation-core')};
`;
const ReviewerRatingLabel = styled.span.withConfig({
    displayName: 'ReviewerRatingLabel'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.globalEditorial.accreditation-core')};
`;
const ReviewerName = styled.span.withConfig({
    displayName: 'ReviewerName'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.globalEditorial.accreditation-core')};
  padding-left: ${calculateSpacing(0.5)};
`;
const ReviewTagsInfoLabel = styled.span.withConfig({
    displayName: 'ReviewTagsInfoLabel'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.globalEditorial.accreditation-core')};
`;
const ReviewerInfoIconButtonWrapper = styled.div.withConfig({
    displayName: 'ReviewerInfoIconButtonWrapper'
}) `
  display: inline;

  svg {
    width: 24px;
    height: 24px;
    ${({ theme }) => getColorStyles(theme, 'fill', 'colors.consumption.lead.special.context-tertiary')};
  }

  .review-note-user__info-button {
    float: inline-end;
    margin: 0;
    border: 0;
    background-color: ${({ theme }) => getColorToken(theme, 'colors.interactive.base.white')};
    padding: 0;
    padding-left: 12px;

    &:hover,
    &:focus {
      border: 0;
      background: none;
    }
  }
`;
const ReviewNotesToggleChipListWrapper = styled.div.withConfig({
    displayName: 'ReviewNotesToggleChipListWrapper'
}) `
  ${ToggleButton} {
    ${getTypographyStyles('typography.definitions.foundation.link-utility')}

    &[aria-checked='false'] {
      ${({ shouldUseInteractiveBrandColor, shouldUseFullOpacity }) => {
    if (shouldUseInteractiveBrandColor) {
        const opacity = shouldUseFullOpacity ? 1 : 0.1;
        return css `
            background-color: rgba(
              ${getColorToken('colors.interactive.social.primary-hover', {
            rgbOnly: true
        })},
              ${opacity}
            );
          `;
    }
    return `${getColorStyles('color', 'colors.interactive.base.black')}`;
}}
    }

    &:focus {
      box-shadow: none;
    }

    &:hover {
      box-shadow: 0 0 0 1px ${getColorToken('colors.interactive.base.black')}
        inset;
    }

    ${maxScreen(BREAKPOINTS.md)} {
      &:focus,
      &:hover {
        box-shadow: none;
      }
    }

    &:disabled {
      box-shadow: none;
    }
  }
  ${ListWrapper} {
    padding-bottom: 8px;
    padding-left: 0;
  }
`;
const ReveiwerInfoText = styled(BaseText).withConfig({
    displayName: 'ReveiwerInfoText'
}) `
  position: absolute;
  left: calc(25% - 10px);
  float: inline-end;
  z-index: -1;
  border-radius: 8px;
  box-shadow: 0 0 20px 12px rgba(0, 0, 0, 0.1);
  background: white;
  padding: 17px 22px;
  width: 80%;
  box-sizing: border-box;

  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.dark')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.utility.input-core')};

  ${minScreen(BREAKPOINTS.sm)} {
    padding: 12px 13px;
  }
  ${minScreen(BREAKPOINTS.md)} {
    padding: 17px 22px;
  }
`;
const AlertArrow = styled.div.withConfig({
    displayName: 'AlertArrow'
}) `
  position: absolute;
  top: auto;
  bottom: 100%;
  left: calc(98% - 11px);
  border-width: 0 10px 13px;
  border-style: solid;
  border-color: rgb(254 254 254) transparent;
`;
const ReviewerInfoAlertToolTip = styled.div.withConfig({
    displayName: 'ReviewerInfoAlertToolTip'
}) `
  position: relative;
  z-index: 2;
  margin-top: 8px;
  background-color: ${getColorToken('colors.background.white')};

  ${minScreen(BREAKPOINTS.sm)} {
    ${ReveiwerInfoText} {
      left: calc(8% - 4px);
      width: 100%;
    }
    ${AlertArrow} {
      left: calc(98% - 14px);
      border-width: 0 8px 12px;
    }
  }

  ${minScreen(BREAKPOINTS.md)} {
    ${ReveiwerInfoText} {
      left: calc(25% - 10px);
      width: 80%;
    }
    ${AlertArrow} {
      left: calc(98% - 12px);
      border-width: 0 10px 13px;
    }
  }

  ${minScreen(BREAKPOINTS.lg)} {
    ${ReveiwerInfoText} {
      left: calc(7% - 10px);
      width: 100%;
    }
    ${AlertArrow} {
      left: calc(98% - 14px);
      border-width: 0 10px 13px;
    }
  }

  ${minScreen(BREAKPOINTS.xl)} {
    ${ReveiwerInfoText} {
      left: calc(25% - 10px);
      width: 80%;
    }
    ${AlertArrow} {
      left: calc(98% - 11px);
      border-width: 0 10px 13px;
    }
  }

  ${minScreen(BREAKPOINTS.xxl)} {
    ${ReveiwerInfoText} {
      left: calc(34% - 10px);
      width: 70%;
    }
    ${AlertArrow} {
      left: calc(98% - 8px);
      border-width: 0 10px 13px;
    }
  }
`;
const RatingFormRating = styled(Rating).withConfig({
    displayName: 'RatingFormRating'
}) `
  align-items: start;
  padding: ${calculateSpacing()} 0 ${calculateSpacing()};
  ${RatingStar} {
    transform: scale(1.78);
    margin: 0 ${calculateSpacing(1.25)};
  }
`;
const ReviewNotesFormActions = styled.div.withConfig({
    displayName: 'ReviewNotesFormActions'
}) `
  ${minScreen(BREAKPOINTS.lg)} {
    display: grid;
    grid-template-columns: repeat(2, auto);
    gap: 32px;
  }
  ${maxScreen(BREAKPOINTS.md)} {
    display: flex;
    flex-direction: column;
  }
`;
const ReviewNotesDivider = styled.div.withConfig({
    displayName: 'ReviewNotesDivider'
}) `
  margin-top: ${calculateSpacing(2)};
  border-bottom: 1px solid;
  ${getColorStyles('border-color', 'colors.consumption.body.standard.divider')};
`;
const ReviewNotesFormCancelButton = styled(Button.Primary).withConfig({
    displayName: 'ReviewFormSubmitButton'
}) `
  ${getTypographyStyles('typography.definitions.utility.button-core')}
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.brand-primary')};
  margin-top: 0.5rem;
  margin-bottom: 20px;
  padding: 15px 9px;
  width: 100%;
  max-width: 100%;
  text-decoration: underline;
`;
const ReviewNotesFormSubmitButton = styled(Button.Primary).withConfig({
    displayName: 'ReviewFormSubmitButton'
}) `
  display: block;
  margin-top: 0.5rem;
  margin-bottom: 20px;
  padding: 15px 9px;
  width: 100%;
  max-width: 100%;
  height: unset;
  text-align: center;

  &:active::before {
    top: 0;
    left: 0;
  }
`;
const ReviewNotesFormTextFieldErrorText = styled(TextFieldErrorText).withConfig({
    displayName: 'ReviewFormTextFieldErrorText'
}) ``;
const ReviewNotesFormSignin = styled(BaseLink).withConfig({
    displayName: 'ReviewNotesFormSignin'
}) ``;
const ReviewNotesFormMinimised = styled.div.withConfig({
    displayName: 'ReviewNotesFormMinimised'
}) `
  position: relative;

  input.text-field__control {
    cursor: pointer;
  }

  @media (max-width: 768px) {
    textarea.text-field__control {
      padding: ${calculateSpacing(2)};
    }
  }
  @media (min-width: 768px) {
    textarea.text-field__control {
      padding: ${calculateSpacing(2)} ${calculateSpacing(3)};
    }
  }

  textarea.text-field__control {
    cursor: pointer;
    overflow: auto;
    overflow-y: hidden;

    &::placeholder {
      ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.light')};
    }
  }

  ${ReviewNotesFormSignin} {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    color: transparent;
  }
`;
const ReviewNotesImageUploadWrapper = styled.div.withConfig({
    displayName: 'ReviewNotesImageUploadWrapper'
}) `
  ${ImageUploadWrapper} {
    ${maxScreen(BREAKPOINTS.lg)} {
      margin-top: ${calculateSpacing(2)};
      margin-bottom: ${calculateSpacing(0.5)};
    }

    ${minScreen(BREAKPOINTS.lg)} {
      margin-top: ${calculateSpacing(3)};
      margin-bottom: ${calculateSpacing(1.25)};
    }
  }
`;
module.exports = {
    AlertArrow,
    ReviewNoteFormWrapper,
    ReviewNoteSectionContainer,
    ReviewNoteUserInfo,
    ReviewerInfoLabel,
    ReviewerName,
    ReviewerInfoIconButtonWrapper,
    ReviewNoteRatingWrapper,
    RatingFormRating,
    ReviewerRatingLabel,
    ReviewNotesFormSignin,
    ReviewNotesFormMinimised,
    ReviewerInfoAlertToolTip,
    ReveiwerInfoText,
    ReviewTagsInfoLabel,
    ReviewNotesToggleChipListWrapper,
    ReviewNotesFormActions,
    ReviewNotesFormCancelButton,
    ReviewNotesFormSubmitButton,
    ReviewNotesFormTextFieldErrorText,
    ReviewNoteTextField,
    ReviewNotesDivider,
    ReviewNotesImageUploadWrapper
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 55144:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.trackTagEvent = void 0;
const snowplow_tracking_1 = __webpack_require__(14307);
const trackTagEvent = (updatedTags, prevTags) => {
    const activeTags = updatedTags.filter((tag) => tag.active);
    if (activeTags.length === 0) {
        return;
    }
    // Check if any tag changed from inactive to active
    const inactiveToActiveTags = prevTags.some((tag, i) => !tag.active && updatedTags[i].active);
    if (!inactiveToActiveTags) {
        return;
    }
    const label = activeTags.length === 1 ? activeTags[0].description : '';
    const features_list = activeTags.map(({ label }) => ({
        name: label.toLowerCase(),
        index: 0,
        total_index: 1
    }));
    (0, snowplow_tracking_1.trackContentEngagementEvent)({
        type: 'select',
        label,
        subject: 'community_comment',
        features_list
    }, { skipDuplicateEvent: false });
};
exports.trackTagEvent = trackTagEvent;
//# sourceMappingURL=tracking.js.map

/***/ }),

/***/ 39321:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    defaultcommunityReviewText: {
        id: 'ReviewNotesForm.defaultcommunityReviewText',
        defaultMessage: 'Ask a question or leave a helpful tip, suggestion or opinion that is relevant and respectful for the community.',
        description: 'Appears when the form is minimised or maximised and enableCommunityExperience is true'
    },
    nonLoggedInErrorMessage: {
        id: 'ReviewForm.nonLoggedInErrorMessage',
        defaultMessage: 'Sign in or create an account to add comment.',
        description: 'Message to display non logged in users'
    },
    textFieldLabel: {
        id: 'ReviewNotesForm.textFieldLabel',
        defaultMessage: 'Your Review',
        description: 'The label for the main review text field'
    },
    addNoteLabel: {
        id: 'ReviewNotesForm.addNoteLabel',
        defaultMessage: 'Add comment',
        description: 'The label for Add Comment submit button'
    },
    cancelNoteLabel: {
        id: 'ReviewNotesForm.cancelNoteLabel',
        defaultMessage: 'Discard',
        description: 'The label for cancel button'
    },
    reviewerInfoFieldLabel: {
        id: 'ReviewNotesForm.ReviewerInfoFieldLabel',
        defaultMessage: 'Commenting as:',
        description: 'The label for the reviewer name field'
    },
    reviewerRatingLabel: {
        id: 'ReviewNotesForm.ReviewerRatingLabel',
        defaultMessage: 'Rate this',
        description: 'The label for the reviewer rating field'
    },
    reviewerFieldInfoIconText: {
        id: 'ReviewNotesForm.reviewerFieldInfoIconText',
        defaultMessage: 'Your username appears next to your comments and replies. Change it anytime in your Account.',
        description: 'information text for user to change their user name'
    },
    reviewerInfoIconButtonLabel: {
        id: 'ReviewNotesForm.reviewerInfoIconButtonLabel',
        defaultMessage: 'user name update message',
        description: 'Label for reviewer user name update message icon'
    },
    reviewTagsLabel: {
        id: 'ReviewNotesForm.reviewTagsLabel',
        defaultMessage: 'TAG YOUR COMMENT (OPTIONAL)',
        description: 'Label for adding tags'
    },
    reviewTags: {
        id: 'FilterComponent.reviewTags',
        defaultMessage: '{reviewTag}',
        description: 'Value for the tag'
    },
    invalidReviewLength: {
        id: 'ReviewNotesForm.invalidReviewNoteLength',
        defaultMessage: 'Enter {min} characters or more to add a comment.',
        description: 'Error message for invalid review comment length'
    },
    requiredField: {
        id: 'ReviewNotesForm.requiredField',
        defaultMessage: 'Select a star rating to add a comment',
        description: 'Error message for required field'
    },
    maxCharLimitMet: {
        id: 'ReviewNotesForm.maxCharLimitMet',
        defaultMessage: '_MAX_ character limit met',
        description: 'Warning message for max review comment length'
    },
    remainingMaxCharLimit: {
        id: 'ReviewNotesForm.remainingMaxCharLimit',
        defaultMessage: '_COUNT_ of _MAX_ character limit remaining',
        description: 'Warning message for invalid review comment length'
    },
    buttonLabel: {
        id: 'ReviewNotesForm.buttonLabel',
        defaultMessage: 'Sign in or create account',
        description: 'Text for the sign in or create account button'
    },
    AddNoteFailedToastMessage: {
        id: 'ReviewNotes.AddNoteFailedToastMessage',
        defaultMessage: 'Unable to add your comment. Please try again.',
        description: 'Failure message to show on comment save'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 32844:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ReviewReplyComment = void 0;
const prop_types_1 = __importDefault(__webpack_require__(5556));
const react_1 = __importStar(__webpack_require__(96540));
const react_intl_1 = __webpack_require__(46984);
const cookies_1 = __importDefault(__webpack_require__(53788));
const utils_1 = __webpack_require__(60711);
const user_authentication_1 = __webpack_require__(20656);
const ReviewListContainer_1 = __webpack_require__(24300);
const utils_2 = __webpack_require__(85554);
const SignInModalActions_1 = __webpack_require__(22509);
const UserNameModalActions_1 = __webpack_require__(61057);
const thin_1 = __webpack_require__(91470);
const thinner_1 = __webpack_require__(24695);
const styles_1 = __webpack_require__(16631);
const snowplow_tracking_1 = __webpack_require__(14307);
const utils_3 = __webpack_require__(39311);
const ReviewReplyNote_1 = __importDefault(__webpack_require__(71001));
const styles_2 = __webpack_require__(10959);
const reviewer_badge_1 = __importDefault(__webpack_require__(50787));
const tracking_1 = __webpack_require__(75454);
const { oidcCookies } = cookies_1.default;
const translations_1 = __importDefault(__webpack_require__(20777));
const utils_js_1 = __webpack_require__(26576);
const formatReplyNotes = (replies, formatMessage, username) => {
    if (!replies)
        return [];
    return replies.map((reply) => {
        const { id, author: { orgRole: role } = {}, body: replyText, createdAt, siteUsername: siteUserObject, parent, actionCounts, viewerActionPresence, revision, story, images = [] } = reply;
        const parentCommentUserName = () => {
            let name = username;
            if (username === 'Anonymous') {
                name = username;
            }
            else if (parent?.siteUsername?.[0]?.name) {
                name = parent?.siteUsername?.[0]?.name;
            }
            return name;
        };
        return {
            role,
            replyId: id,
            replyText,
            replyDate: (0, utils_3.formatReviewDateAgo)(createdAt, formatMessage),
            replyAuthorName: siteUserObject?.[0]?.name,
            parentAuthorName: parentCommentUserName(),
            reactionCount: actionCounts?.reaction?.total || 0,
            viewerActionPresence,
            revisionId: revision?.id,
            storyURL: story?.url,
            images
        };
    });
};
/**
 *
 * ReviewReplyComment component
 * @param {object} props - ReviewReplyComment props
 * @param {Array} [props.replies] - Replies to a comment displayed as reply list
 * @param {string} [props.username] - Username which indicates the reviewer username
 * @param {number} [props.replyPageInfo] - PageInfo to help in pagination of replies
 * @param {string} [props.repliesOrderBy] - Value to set replies ordering
 * @param {string} [props.reviewModalProps] - Modal props to handle discard flow in reply note component
 * @param {string} [props.reviewerBadges] - Array of role and badge for the reviewer badge
 * @param {string} [props.usernameSignInDek] - Optional prop to use a custom username modal dek
 * @param {string} [props.signInHed] - Header on signin alert shown to user
 * @param {string} [props.signInHedSpanTag] - Hed span tag on signin alert shown to user
 * @param {string} [props.signInMessage] - Message on signin alert shown to user
 * @param {string} [props.shouldEnableReply] - Flag to enable replying on comments
 * @param {object} [props.user] - User information
 * @param {string} [props.commentId] - Comment id of the primary comment to which replies are fetched
 * @param {number} [props.replyLimit] - number of replies to show per request when clicked on show more replies label
 * @param {Function} [props.updateUserReactions] - function to update state values of load more replies in ReviewListContainer component
 * @param {Function} [props.commentReactionHandler] - function to handle to like action on replies
 * @param {string} [props.contentId] - content id
 * @param {Function} [props.showMessageBannerHandler] - handler function to show Message Banner
 * @param {object} [props.userReactions] - user reactions object
 * @param {string} [props.siteUserName] - site user name
 * @param {string} [props.handleUsernameChange] - function to handle user name change
 * @param {bool} [props.shouldEnableUpvotes] - flag to enable community likes or upvotes
 * @param {string} [props.commentingUrl] - URL for the coral API where comments are stored
 * @param {bool} [props.shouldUseAlternateColorToken] - Optional flag to change font color if token is light
 * @param {bool} [props.isFeatured] - Flag indicating a featured item
 * @param {bool} [props.hasImageUpload] - Flag to enable image upload functionality
 * @param {bool} [props.spectraUrl] - Spectra url for image display
 *
 * @returns {ReactElement} <ReviewReplyComment>
 */
const ReviewReplyComment = ({ commentingUrl, contentId, replies: defaultReplies, replyPageInfo, repliesOrderBy, username, reviewerBadges, reviewModalProps, commentReactionHandler, user = {}, signInHed, usernameSignInDek, signInHedSpanTag, signInMessage, commentId, replyLimit, shouldUseAlternateColorToken, showMessageBannerHandler, userReactions, updateUserReactions, siteUserName, handleUsernameChange, shouldEnableReply, shouldEnableUpvotes, isFeatured, spectraUrl, hasImageUpload }) => {
    const { formatMessage } = (0, react_intl_1.useIntl)();
    const [replyUserName, setReplyUsername] = (0, react_1.useState)(null);
    const [replyOpen, setReplyOpen] = (0, react_1.useState)(false);
    const [replyIDs, setReplyIDs] = (0, react_1.useState)([]);
    const [displayHideRepliesLabel, setDisplayHideRepliesLabel] = (0, react_1.useState)(false);
    const [displayShowRepliesLabel, setDisplayShowRepliesLabel] = (0, react_1.useState)(replyPageInfo.hasNextPage ?? false);
    const [repliesLabel, setRepliesLabel] = (0, react_1.useState)(replyPageInfo.hasNextPage
        ? formatMessage(translations_1.default.ShowMoreRepliesLabel)
        : '');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [hideReplies, setHideReplies] = (0, react_1.useState)(false);
    const [endCursor, setEndCursor] = (0, react_1.useState)(replyPageInfo.endCursor);
    const [hasMoreReplies, setHasMoreReplies] = (0, react_1.useState)(replyPageInfo.hasNextPage ?? false);
    const [nextReplies, setNextReplies] = (0, react_1.useState)([]);
    const COMMUNITY_REPLY = 'community_reply';
    const handleReplyEvent = (e, reply) => {
        e.preventDefault();
        if (!user.isAuthenticated) {
            const source = 'COMMUNITY_REPLY_TO_REPLY';
            const eventData = {
                subject: COMMUNITY_REPLY,
                label: 'Reply',
                source_type: source,
                type: 'login',
                ...(0, tracking_1.getPlacementData)(isFeatured)
            };
            const featured = (0, tracking_1.getFeaturedQueryParam)(isFeatured);
            const redirectURL = (0, utils_2.getRelativeURLWithSearchAndHash)({
                href: window.location.href,
                hash: utils_2.commentingAction.REPLY_TO_REPLY,
                queryParams: { featured, source }
            });
            (0, SignInModalActions_1.doDisplayModal)({
                dangerousDek: signInMessage,
                dangerousHed: signInHed,
                dangerousHedSpanTag: signInHedSpanTag,
                redirectURL,
                shouldHideIllustration: true,
                source,
                snowplowData: eventData
            });
        }
        else if (siteUserName) {
            setReplyUsername(reply?.replyAuthorName);
            setReplyIDs((prevReplyIDs) => [...prevReplyIDs, reply?.replyId]);
            setReplyOpen(true);
        }
        else {
            (0, UserNameModalActions_1.doDisplayModal)({
                dangerousDek: usernameSignInDek,
                successCallback: (result) => {
                    handleUsernameChange(result);
                    setReplyUsername(reply?.replyAuthorName);
                    setReplyIDs((prevReplyIDs) => [...prevReplyIDs, reply?.replyId]);
                    setReplyOpen(true);
                },
                source: COMMUNITY_REPLY,
                isFeatured
            });
            const eventData = {
                type: 'impression',
                subject: 'username_modal',
                label: 'Create Username',
                source_type: COMMUNITY_REPLY,
                ...(0, tracking_1.getPlacementData)(isFeatured)
            };
            (0, snowplow_tracking_1.trackUserAccountEvent)(eventData);
        }
        const eventData = {
            type: 'attempt',
            subject: COMMUNITY_REPLY,
            label: 'reply',
            items: [
                {
                    content_id: reply?.replyId
                }
            ],
            ...(0, tracking_1.getPlacementData)(isFeatured)
        };
        (0, snowplow_tracking_1.trackContentEngagementEvent)(eventData, { skipDuplicateEvent: false });
    };
    const replyLikeActionHandler = (item) => {
        if (!user.isAuthenticated) {
            const source = 'COMMUNITY_LIKE_CLICK_REPLY';
            const eventData = {
                type: 'login',
                source_type: source,
                ...(0, tracking_1.getPlacementData)(isFeatured)
            };
            const likeEventData = {
                type: 'like',
                subject: COMMUNITY_REPLY,
                ...(0, tracking_1.getPlacementData)(isFeatured)
            };
            const featured = (0, tracking_1.getFeaturedQueryParam)(isFeatured);
            (0, snowplow_tracking_1.trackContentEngagementEvent)(likeEventData, { skipDuplicateEvent: false });
            const queryParams = {
                action: ReviewListContainer_1.CREATE_COMMENT_ACTION,
                commentId: item.commentId,
                commentRevisionId: item.revisionId,
                featured,
                source
            };
            const redirectURL = (0, utils_2.getRelativeURLWithSearchAndHash)({
                href: window.location.href,
                hashValue: utils_2.commentingAction.LIKE_REPLY,
                queryParams
            });
            (0, SignInModalActions_1.doDisplayModal)({
                dangerousDek: signInMessage,
                dangerousHed: signInHed,
                dangerousHedSpanTag: signInHedSpanTag,
                redirectURL,
                shouldHideIllustration: true,
                snowplowData: eventData,
                source
            });
            return;
        }
        commentReactionHandler({
            item
        });
        const type = userReactions[item.commentId]?.viewerActionPresence
            ? 'unlike'
            : 'like';
        const eventData = {
            type,
            subject: COMMUNITY_REPLY,
            items: [
                {
                    content_id: item.commentId
                }
            ],
            ...(0, tracking_1.getPlacementData)(isFeatured)
        };
        (0, snowplow_tracking_1.trackContentEngagementEvent)(eventData, { skipDuplicateEvent: false });
    };
    const loadMoreReplies = async () => {
        let errorMessage;
        setHideReplies(false);
        if (nextReplies.length >= 1 && !hasMoreReplies) {
            setNextReplies([...nextReplies]);
            setDisplayHideRepliesLabel(true);
            setDisplayShowRepliesLabel(false);
        }
        else {
            setIsLoading(true);
            const nextCursor = endCursor ?? replyPageInfo.endCursor;
            try {
                const accessToken = user_authentication_1.UserAuthenticationClient.getCookieValue(oidcCookies.id);
                const { replies, page: { endCursor: newCursor, hasNextPage } } = await (0, utils_1.getRepliesByCommentId)({
                    commentId,
                    after: nextCursor,
                    commentingUrl,
                    logger: console,
                    accessToken,
                    replyLimit,
                    repliesOrderBy
                });
                setEndCursor(newCursor);
                setHasMoreReplies(hasNextPage);
                if (!hasNextPage) {
                    setDisplayHideRepliesLabel(true);
                }
                setDisplayShowRepliesLabel(hasNextPage);
                setNextReplies([...nextReplies, ...replies]);
                updateUserReactions(replies);
            }
            catch (error) {
                errorMessage = error?.message || '';
                console.warn(error);
            }
            setIsLoading(false);
        }
        const entityData = {
            type: 'show_more',
            label: 'Show more replies',
            subject: COMMUNITY_REPLY,
            error: errorMessage,
            ...(0, tracking_1.getPlacementData)(isFeatured)
        };
        (0, snowplow_tracking_1.trackContentEngagementEvent)(entityData, { skipDuplicateEvent: false });
    };
    const hideAllReplies = () => {
        setDisplayHideRepliesLabel(false);
        setHideReplies(true);
        setDisplayShowRepliesLabel(true);
    };
    (0, react_1.useEffect)(() => {
        if (isLoading) {
            setRepliesLabel(formatMessage(translations_1.default.LoadingRepliesLabel));
        }
        else if (displayShowRepliesLabel) {
            setRepliesLabel(formatMessage(translations_1.default.ShowMoreRepliesLabel));
        }
    }, [isLoading, displayShowRepliesLabel, formatMessage]);
    const replyNotes = (replies) => {
        const newReplies = formatReplyNotes(replies, formatMessage, username);
        return newReplies.map((reply) => {
            const { role, replyId, replyAuthorName, replyDate, replyText, parentAuthorName, revisionId, storyURL, images } = reply || {};
            const item = {
                commentId: replyId,
                revisionId
            };
            const { badge: badgeText } = reviewerBadges?.find((item) => item.role === role) || {};
            return (react_1.default.createElement(styles_2.ReplyCommentItem, { key: replyId },
                react_1.default.createElement(styles_1.ReviewMetaGrid, null, replyAuthorName && (react_1.default.createElement(react_1.default.Fragment, null,
                    react_1.default.createElement(styles_2.ReplierUserName, null, replyAuthorName),
                    badgeText && (react_1.default.createElement(reviewer_badge_1.default, { badgeText: badgeText, shouldUseAlternateColorToken: shouldUseAlternateColorToken }))))),
                react_1.default.createElement(styles_2.ReplyDataInfo, null,
                    react_1.default.createElement(styles_2.ReplyMetaData, null,
                        react_1.default.createElement(styles_2.ReplyInfoLabel, null, formatMessage(translations_1.default.ReviewReplyLabel)),
                        parentAuthorName && (react_1.default.createElement(styles_2.ReplyUserName, null, parentAuthorName)),
                        react_1.default.createElement(thin_1.Dot, null),
                        replyDate && react_1.default.createElement(styles_2.ReplyTimeStamp, null, replyDate))),
                replyText && (react_1.default.createElement(styles_2.ReplyText, { dangerouslySetInnerHTML: { __html: replyText } })),
                hasImageUpload &&
                    images.map((image, index) => (react_1.default.createElement(styles_2.ReplyImage, { key: index, src: (0, utils_js_1.getPreviewUrl)(image?.url, spectraUrl) }))),
                react_1.default.createElement(styles_2.ReplyDataInfo, null,
                    shouldEnableUpvotes && (react_1.default.createElement(styles_2.ReplyReactionButton, { isIconButton: true, name: "reply-reaction", label: "Reaction", onClickHandler: () => replyLikeActionHandler(item), ButtonIcon: userReactions[replyId]?.viewerActionPresence
                            ? thinner_1.LikeFilled
                            : thinner_1.Like })),
                    shouldEnableUpvotes && (react_1.default.createElement(styles_2.ReplyLikeCount, null, userReactions[replyId]?.reactionCount || 0)),
                    shouldEnableReply && (react_1.default.createElement(styles_1.ReviewReplyWrapper, { onClick: (e) => handleReplyEvent(e, reply) },
                        react_1.default.createElement(thinner_1.Comment, null),
                        react_1.default.createElement(styles_1.ReviewReplyLabel, null, formatMessage(translations_1.default.ReviewReplyCommentLabel))))),
                replyOpen &&
                    replyIDs.includes(replyId) &&
                    user.isAuthenticated &&
                    siteUserName && (react_1.default.createElement(ReviewReplyNote_1.default, { commentId: replyId, username: replyUserName, contentId: contentId, revisionId: revisionId, commentingUrl: commentingUrl, closeReply: () => {
                        setReplyOpen(false);
                    }, reviewModalProps: reviewModalProps, showMessageBannerHandler: showMessageBannerHandler, source: "community_reply", storyURL: storyURL, isFeatured: isFeatured, hasImageUpload: hasImageUpload }))));
        });
    };
    return (react_1.default.createElement(styles_2.ReplyCommentsListWrapper, null,
        replyNotes(defaultReplies),
        !hideReplies && replyNotes(nextReplies),
        react_1.default.createElement(styles_2.ReplyDataInfo, null,
            displayShowRepliesLabel && (react_1.default.createElement(styles_2.ShowOrHideRepliesLabel, { onClick: loadMoreReplies },
                react_1.default.createElement(styles_2.ShowOrHideRepliesLabelRule, null),
                repliesLabel)),
            displayHideRepliesLabel && (react_1.default.createElement(styles_2.ShowOrHideRepliesLabel, { onClick: hideAllReplies },
                react_1.default.createElement(styles_2.ShowOrHideRepliesLabelRule, null),
                formatMessage(translations_1.default.HideRepliesLabel))))));
};
exports.ReviewReplyComment = ReviewReplyComment;
exports.ReviewReplyComment.propTypes = {
    commentId: prop_types_1.default.string,
    commentingUrl: prop_types_1.default.string.isRequired,
    commentReactionHandler: prop_types_1.default.func,
    contentId: prop_types_1.default.string,
    handleUsernameChange: prop_types_1.default.func,
    hasImageUpload: prop_types_1.default.bool,
    isFeatured: prop_types_1.default.bool,
    replies: prop_types_1.default.array,
    repliesOrderBy: prop_types_1.default.string,
    replyLimit: prop_types_1.default.number,
    replyPageInfo: prop_types_1.default.object,
    reviewerBadges: prop_types_1.default.arrayOf(prop_types_1.default.shape({
        role: prop_types_1.default.string,
        badge: prop_types_1.default.string
    })),
    reviewModalProps: prop_types_1.default.object,
    shouldEnableReply: prop_types_1.default.bool,
    shouldEnableUpvotes: prop_types_1.default.bool,
    shouldUseAlternateColorToken: prop_types_1.default.bool,
    showMessageBannerHandler: prop_types_1.default.func,
    signInHed: prop_types_1.default.string,
    signInHedSpanTag: prop_types_1.default.string,
    signInMessage: prop_types_1.default.string,
    siteUserName: prop_types_1.default.string,
    spectraUrl: prop_types_1.default.string,
    updateUserReactions: prop_types_1.default.func,
    user: prop_types_1.default.shape({
        isAuthenticated: prop_types_1.default.bool.isRequired,
        amguuid: prop_types_1.default.string
    }).isRequired,
    username: prop_types_1.default.string,
    usernameSignInDek: prop_types_1.default.string,
    userReactions: prop_types_1.default.shape({
        reactionCount: prop_types_1.default.number.isRequired,
        viewerActionPresence: prop_types_1.default.bool
    }).isRequired
};
//# sourceMappingURL=ReviewReplyComment.js.map

/***/ }),

/***/ 10959:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const styled = (__webpack_require__(92168)["default"]);
const { getColorStyles, getTypographyStyles, minScreen, calculateSpacing } = __webpack_require__(26865);
const { ReviewListMetaInfo, ReviewerUserName, ReviewLikeCount, ReviewListTimeStamp, ReviewReplyLabel, ReviewText, ReviewListReactionButton, ReviewImage } = __webpack_require__(16631);
const { BREAKPOINTS } = __webpack_require__(96472);
const { BaseText } = __webpack_require__(76955);
const ReplyUserName = styled(BaseText).withConfig({
    displayName: 'ReplyUserName'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.dark')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.globalEditorial.accreditation-feature')};
`;
const ReplyDataInfo = styled(ReviewListMetaInfo).withConfig({
    displayName: 'ReplyDataInfo'
}) `
  &:first-child {
    margin-bottom: ${calculateSpacing(1)};
  }
`;
const ReplierUserName = styled(ReviewerUserName).withConfig({
    displayName: 'ReplierUserName'
}) ``;
const ReplyMetaData = styled.div.withConfig({
    displayName: 'ReplyMetaData'
}) `
  display: flex;
  flex-direction: row;
  align-items: center;
`;
const ReplyCommentsListWrapper = styled.div.withConfig({
    displayName: 'ReplyCommentsListWrapper'
}) `
  margin-top: ${calculateSpacing(1.25)};
  margin-left: ${calculateSpacing(6)};
  ${minScreen(BREAKPOINTS.md)} {
    margin-left: ${calculateSpacing(8)};
  }
`;
const ReplyCommentItem = styled.div.withConfig({
    displayName: 'ReplyCommentItem'
}) `
  margin-top: ${calculateSpacing(4)};

  &:first-child {
    margin-top: ${calculateSpacing(2)};
  }
`;
const ReplyLikeCount = styled(ReviewLikeCount).withConfig({
    displayName: 'ReplyLikeCount'
}) ``;
const ReplyTimeStamp = styled(ReviewListTimeStamp).withConfig({
    displayName: 'ReplyTimeStamp'
}) `
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.foundation.meta-secondary')}
`;
const ReplyInfoLabel = styled(ReviewReplyLabel).withConfig({
    displayName: 'ReplyInfoLabel'
}) `
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.foundation.meta-secondary')};
`;
const ReplyText = styled(ReviewText).withConfig({
    displayName: 'ReplyText'
}) ``;
const ReplyImage = styled(ReviewImage).withConfig({
    displayName: 'ReplyImage'
}) `
  margin-top: ${calculateSpacing(1)};
`;
const ReplyReactionButton = styled(ReviewListReactionButton).withConfig({
    displayName: 'ReplyReactionButton'
}) ``;
const ShowOrHideRepliesLabel = styled.div.withConfig({
    displayName: 'ShowOrHideRepliesLabel'
}) `
  display: flex;
  flex-direction: row;
  cursor: pointer;

  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.foundation.link-secondary')};

  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.dark')};
`;
const ShowOrHideRepliesLabelRule = styled.hr.withConfig({
    displayName: 'ShowOrHideRepliesLabelRule'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.discovery.body.dark.divider')};
  align-self: center;
  margin-right: ${calculateSpacing(1)};
  width: ${calculateSpacing(4)};
`;
module.exports = {
    ReplyUserName,
    ReplyDataInfo,
    ReplyCommentsListWrapper,
    ReplyCommentItem,
    ReplyMetaData,
    ReplierUserName,
    ReplyLikeCount,
    ReplyTimeStamp,
    ReplyInfoLabel,
    ReplyText,
    ReplyImage,
    ReplyReactionButton,
    ShowOrHideRepliesLabel,
    ShowOrHideRepliesLabelRule
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 20777:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const react_intl_1 = __webpack_require__(46984);
exports["default"] = (0, react_intl_1.defineMessages)({
    ReviewReplyLabel: {
        id: 'ReviewReplyComment.ReviewReplyLabel',
        defaultMessage: 'Replying to',
        description: 'The label for the reply comment field'
    },
    ShowMoreRepliesLabel: {
        id: 'ReviewReplyComment.ShowMoreRepliesLabel',
        defaultMessage: 'Show more replies',
        description: 'The label to show more replies'
    },
    ReviewReplyCommentLabel: {
        id: 'ReviewReplyComment.ReviewReplyCommentLabel',
        defaultMessage: 'Reply',
        description: 'The label to show reply icon'
    },
    HideRepliesLabel: {
        id: 'ReviewReplyComment.HideRepliesLabel',
        defaultMessage: 'Hide replies',
        description: 'The label to hide replies'
    },
    LoadingRepliesLabel: {
        id: 'ReviewReplyComment.LoadingRepliesLabel',
        defaultMessage: 'Loading…',
        description: 'The label to hide replies'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 71001:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const { useState, useRef } = __webpack_require__(96540);
const { useIntl } = __webpack_require__(46984);
const translations = (__webpack_require__(76833)/* ["default"] */ .A);
const { addReply, modifyStory } = __webpack_require__(60711);
const { getPlacementData } = __webpack_require__(75454);
const { ReviewReplyUsername, ReviewReplyNoteWrapper, ReviewReplyLabel, ReviewReplyCancelLink, ReviewReplyNoteInfo, ReviewReplyButton, ReviewReplyButtonWrapper, ReviewReplyMultilineTextField, ReviewReplyImageUploadWrapper } = __webpack_require__(73559);
const ReviewNoteModal = __webpack_require__(45771);
const ImageUpload = __webpack_require__(72667);
const { trackContentEngagementEvent } = __webpack_require__(14307);
const CHARACTER_LIMIT = 3000;
const ALERT_THRESHOLD = 2900;
const MIN_REPLY_LENGTH = 2;
const ReviewReplyNote = ({ commentId, contentId, contentTitle = '', username, revisionId, commentingUrl, closeReply, reviewModalProps, showMessageBannerHandler, storyURL, source, isFeatured, hasImageUpload }) => {
    const { formatMessage } = useIntl();
    const [isDisabled, setIsDisabled] = useState(true);
    const [charCount, setCharCount] = useState(0);
    const [isMinLengthError, setMinLengthError] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const replyRef = useRef(null);
    const [isReviewNoteModalOpen, setIsReviewNoteModalOpen] = useState(false);
    const discardReplyNote = (event) => {
        const eventData = {
            type: 'discard',
            label: 'YES, DISCARD IT',
            subject: source,
            ...getPlacementData(isFeatured)
        };
        event.preventDefault();
        closeReply();
        trackContentEngagementEvent(eventData, { skipDuplicateEvent: false });
    };
    const handleReplyTextChange = (e) => {
        const replyComments = e.target.value;
        setCharCount(replyComments.length);
        e.target.value = replyComments;
        setIsDisabled(replyComments.trim().length === 0);
        setMinLengthError(false);
    };
    const handleCancelClick = (e) => {
        if (replyRef.current && replyRef.current.value.trim().length > 0) {
            setIsReviewNoteModalOpen(true);
        }
        else {
            discardReplyNote(e);
        }
        replyRef.current.focus();
    };
    const handleImageUpload = (response) => {
        if (response?.data?.[0]?.filePath) {
            setUploadedImage({
                id: response.data[0].filePath,
                url: response.data[0].encodedURI
            });
        }
        else {
            console.error('Error uploading image:', response);
        }
    };
    const handleImageUploadStatusChange = (isUploading) => {
        setIsImageUploading(isUploading);
    };
    const handleReplySubmit = async (e) => {
        e.preventDefault();
        let error_info;
        const replyText = replyRef.current?.value?.trim();
        if (replyText.length < MIN_REPLY_LENGTH) {
            setMinLengthError(true);
            setIsDisabled(true);
        }
        else if (replyText.length > 0) {
            const input = {
                storyID: contentId,
                parentID: commentId,
                parentRevisionID: revisionId,
                body: replyText,
                ...(uploadedImage && { images: [uploadedImage] }),
                clientMutationId: '0'
            };
            try {
                // ff the url of the story is already feeded, its fine but if not we need to add the the url
                // for all new Comments, url will be passed, and story will always exist because reply is on a comment button
                // for all the old comments where story doesnt have the url, if we add the reply directoryUrl, we will need to update url
                // this code covers that scenario
                if (!storyURL) {
                    await modifyStory({
                        id: contentId,
                        title: contentTitle,
                        url: window.location.origin + window.location.pathname,
                        commentingUrl,
                        logger: console
                    });
                }
                const isReplySuccessFull = await addReply(commentingUrl, input);
                if (isReplySuccessFull) {
                    closeReply();
                    showMessageBannerHandler(formatMessage(translations.AddReplySuccessToastMessage));
                }
                else {
                    showMessageBannerHandler(formatMessage(translations.AddReplyFailedToastMessage));
                }
            }
            catch (err) {
                error_info = err?.message || '';
                console.error('Error while posting reply:', err);
                showMessageBannerHandler(formatMessage(translations.AddReplyFailedToastMessage));
            }
            const eventData = {
                type: 'submit',
                label: 'Reply',
                subject: 'community_reply',
                error: error_info,
                ...getPlacementData(isFeatured)
            };
            trackContentEngagementEvent(eventData, { skipDuplicateEvent: false });
        }
    };
    const getErrorText = () => {
        if (charCount > ALERT_THRESHOLD && charCount < CHARACTER_LIMIT) {
            return formatMessage(translations.ReviewFieldAlertLimitErrorText)
                .replace('_CHARACTER_LIMIT_CURRENT_', CHARACTER_LIMIT - charCount)
                .replace('_CHARACTER_LIMIT_', CHARACTER_LIMIT);
        }
        if (charCount === CHARACTER_LIMIT) {
            return formatMessage(translations.ReviewFieldMaxLimitErrorText).replace('_CHARACTER_LIMIT_', CHARACTER_LIMIT);
        }
        return '';
    };
    const errorMessageHandler = () => {
        if (isMinLengthError) {
            return formatMessage(translations.ReviewFieldMinLimitErrorText);
        }
        return getErrorText();
    };
    const handleCharCount = (count) => {
        setCharCount(count);
    };
    const productName = 'commenting';
    return (React.createElement(ReviewReplyNoteWrapper, null,
        React.createElement(ReviewReplyNoteInfo, null,
            React.createElement(ReviewReplyLabel, null, formatMessage(translations.ReviewReplyLabel)),
            React.createElement(ReviewReplyUsername, null, username)),
        React.createElement(ReviewReplyMultilineTextField, { name: "reviewReplyNoteText", formName: "reviewReplyNoteText", placeholder: formatMessage(translations.ReplyFieldPlaceHolder), hasAutoFocus: true, onInputChange: handleReplyTextChange, customHeightMultiplier: 10, label: formatMessage(translations.ReplyTextFieldLabel), hideLabel: true, errorPosition: "belowTextField", errorText: errorMessageHandler(), inputRef: replyRef, max: CHARACTER_LIMIT, charCountHandler: handleCharCount, shouldDisableTypingAtMaxChar: true }),
        hasImageUpload && (React.createElement(ReviewReplyImageUploadWrapper, null,
            React.createElement(ImageUpload, { onFileChange: handleImageUpload, onUploadStatusChange: handleImageUploadStatusChange, id: "review-reply-image-upload", product: productName }))),
        React.createElement(ReviewNoteModal, { modalProps: reviewModalProps, confirmButtonCallback: (e) => discardReplyNote(e), onClose: () => setIsReviewNoteModalOpen(false), isVisible: isReviewNoteModalOpen }),
        React.createElement(ReviewReplyButtonWrapper, null,
            React.createElement(ReviewReplyButton, { inputKind: "submit", isDisabled: isDisabled || isImageUploading, label: formatMessage(translations.ReplyButtonLabel), onClickHandler: handleReplySubmit }),
            React.createElement(ReviewReplyCancelLink, { btnStyle: "text", label: formatMessage(translations.CancelButtonLabel), onClickHandler: handleCancelClick }))));
};
ReviewReplyNote.propTypes = {
    closeReply: PropTypes.func,
    commentId: PropTypes.string,
    commentingUrl: PropTypes.string,
    contentId: PropTypes.string,
    contentTitle: PropTypes.string,
    hasImageUpload: PropTypes.bool,
    isFeatured: PropTypes.bool,
    reviewModalProps: PropTypes.object,
    revisionId: PropTypes.string,
    showMessageBannerHandler: PropTypes.func,
    source: PropTypes.string,
    storyURL: PropTypes.string,
    username: PropTypes.string
};
module.exports = ReviewReplyNote;
//# sourceMappingURL=ReviewReplyNote.js.map

/***/ }),

/***/ 73559:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const styled = (__webpack_require__(92168)["default"]);
const { getColorStyles, getColorToken, getTypographyStyles, maxScreen, minScreen, calculateSpacing } = __webpack_require__(26865);
const Button = __webpack_require__(73730);
const { BaseText } = __webpack_require__(76955);
const { BREAKPOINTS } = __webpack_require__(96472);
const TextField = __webpack_require__(89662);
const { ImageUploadWrapper } = __webpack_require__(44741);
const ReviewReplyUsername = styled(BaseText).withConfig({
    displayName: 'ReviewReplyUsername'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.globalEditorial.accreditation-core')};
  padding-left: ${calculateSpacing(0.5)};
`;
const ReviewReplyNoteWrapper = styled.div.withConfig({
    displayName: 'ReviewReplyNoteWrapper'
}) `
  border: 1px solid ${getColorToken('colors.foundation.menu.dividers')};
  padding: ${calculateSpacing(3)};
  gap: ${calculateSpacing(1.5)};
  ${maxScreen(BREAKPOINTS.md)} {
    margin-top: ${calculateSpacing(1.25)};
  }
`;
const ReviewReplyCancelLink = styled(Button.Primary).withConfig({
    displayName: 'ReviewReplyCancelLink'
}) `
  margin-top: ${calculateSpacing(1.25)};
  width: 100%;
  ${getTypographyStyles('typography.definitions.utility.button-core')}
  text-decoration: underline;
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.brand-primary')};
`;
const ReviewReplyMultilineTextField = styled(TextField.MultiLine).withConfig({
    displayName: 'ReviewReplyMultilineTextField'
}) `
  ${getTypographyStyles('typography.definitions.utility.input-core')}
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.interactive.base.light')};
`;
const ReviewReplyLabel = styled.span.withConfig({
    displayName: 'ReviewReplyLabel'
}) `
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body-deemphasized')};
  ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.globalEditorial.accreditation-core')};
`;
const ReviewReplyNoteInfo = styled.div.withConfig({
    displayName: 'ReviewReplyNoteInfo'
}) `
  display: flex;
`;
const ReviewReplyButton = styled(Button.Primary).withConfig({
    displayName: 'ReviewReplyButton'
}) `
  display: block;
  margin-top: 0.5rem;
  margin-bottom: 20px;
  padding: 15px 9px;
  width: 100%;
  max-width: 100%;
  height: unset;
  text-align: center;

  &:active::before {
    top: 0;
    left: 0;
  }
`;
const ReviewReplyButtonWrapper = styled.div.withConfig({
    displayName: 'ReviewReplyButtonWrapper'
}) `
  ${minScreen(BREAKPOINTS.lg)} {
    display: grid;
    grid-template-columns: repeat(2, auto);
    gap: 32px;
  }
  ${maxScreen(BREAKPOINTS.md)} {
    display: flex;
    flex-direction: column;
  }
`;
const ReviewReplyImageUploadWrapper = styled.div.withConfig({
    displayName: 'ReviewReplyImageUploadWrapper'
}) `
  ${ImageUploadWrapper} {
    margin-top: ${calculateSpacing(2)};
    margin-bottom: ${calculateSpacing(1)};

    ${minScreen(BREAKPOINTS.lg)} {
      margin-top: ${calculateSpacing(3)};
      margin-bottom: ${calculateSpacing(2)};
    }
  }
`;
module.exports = {
    ReviewReplyUsername,
    ReviewReplyNoteWrapper,
    ReviewReplyCancelLink,
    ReviewReplyLabel,
    ReviewReplyNoteInfo,
    ReviewReplyButton,
    ReviewReplyButtonWrapper,
    ReviewReplyMultilineTextField,
    ReviewReplyImageUploadWrapper
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 76833:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    ReviewReplyLabel: {
        id: 'ReviewReplyNote.ReviewReplyLabel',
        defaultMessage: 'Replying to:',
        description: 'The label for the reply note field'
    },
    ReplyFieldPlaceHolder: {
        id: 'ReviewReplyNote.ReplyFieldPlaceHolder',
        defaultMessage: 'Add your reply here...',
        description: 'The placeholder for the reply note text field'
    },
    ReplyButtonLabel: {
        id: 'ReviewReplyNote.ReplyButtonLabel',
        defaultMessage: 'Reply',
        description: 'The label for the reply button'
    },
    CancelButtonLabel: {
        id: 'ReviewReplyNote.CancelButtonLabel',
        defaultMessage: 'Discard',
        description: 'The label for the cancel button'
    },
    ReplyTextFieldLabel: {
        id: 'ReviewReplyNote.ReplyTextFieldLabel',
        defaultMessage: 'Your Reply',
        description: 'The label for the reply text field'
    },
    AddReplySuccessToastMessage: {
        id: 'ReviewReplyNote.AddReplySuccessToastMessage',
        defaultMessage: 'Reply added',
        description: 'Success message to show on reply save'
    },
    AddReplyFailedToastMessage: {
        id: 'ReviewReplyNote.AddReplyFailedToastMessage',
        defaultMessage: 'Unable to add your reply. Please try again.',
        description: 'Failure message to show on reply save'
    },
    ReviewFieldAlertLimitErrorText: {
        id: 'ReviewReplyNote.ReviewFieldAlertLimitErrorText',
        defaultMessage: '_CHARACTER_LIMIT_CURRENT_ of _CHARACTER_LIMIT_ character limit remaining.',
        description: 'The error message for the review field alert limit'
    },
    ReviewFieldMaxLimitErrorText: {
        id: 'ReviewReplyNote.ReviewFieldMaxLimitErrorText',
        defaultMessage: '_CHARACTER_LIMIT_ character limit met.',
        description: 'The error message for the review field max limit'
    },
    ReviewFieldMinLimitErrorText: {
        id: 'ReviewReplyNote.ReviewFieldMinLimitErrorText',
        defaultMessage: 'Enter 2 characters or more to add a reply.',
        description: 'The error message for the review field min limit'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 39311:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { fetchWithTimeout } = __webpack_require__(57743);
const { getFromNowDateFormat } = __webpack_require__(5697);
const isValidDate = (d) => d instanceof Date && !isNaN(d);
const fetchUserRecipeRating = async (recipeId, userId) => {
    if (!userId)
        return null;
    let response;
    try {
        response = await fetchWithTimeout(
        // pass ?verso=true to ensure API request is made to Verso not legacy site
        `/api/recipe/${recipeId}/review-ratings/${userId}?verso=true`, { method: 'GET' }, 5000);
    }
    catch (err) {
        console.error(err);
        return null;
    }
    if (response.status === 200) {
        const { reviews: originalReviews, error } = await response.json();
        if (error) {
            console.error(error);
        }
        else if (originalReviews && originalReviews.length > 0) {
            const reviews = originalReviews
                .filter((review) => {
                // Ignore any review that does not have a rating
                return Object.hasOwnProperty.call(review, 'rating');
            })
                .sort((reviewA, reviewB) => {
                const reviewADate = new Date(reviewA.updatedAt);
                const reviewBDate = new Date(reviewB.updatedAt);
                return reviewBDate - reviewADate;
            });
            return reviews[0]?.rating || null;
        }
    }
    return null;
};
const formatReviewDateAgo = (date, formatMessage) => {
    const itemDate = new Date(date);
    if (!isValidDate(itemDate)) {
        return date;
    }
    return getFromNowDateFormat({
        date: itemDate,
        formatMessage,
        includeHourAndMin: false
    });
};
const transformTags = (tags, tagsInfo) => {
    return tags.reduce((acc, tag) => {
        const tagInfo = tagsInfo.find((taginfo) => taginfo.slug === tag);
        if (tagInfo) {
            acc.push(tagInfo.label);
        }
        return acc;
    }, []);
};
const formatReviewListItems = (items, formatMessage, tagsInfo) => {
    if (!items)
        return [];
    return items.map((review, index) => {
        const { revisionId, viewerActionPresence, reactionCount, replyPageInfo, replies, role, storyURL, images } = review;
        const item = {
            id: index,
            revisionId,
            commentId: review._id,
            viewerActionPresence,
            reactionCount,
            replyPageInfo,
            replies,
            role,
            storyURL,
            images
        };
        if (review.reviewText)
            item.text = review.reviewText;
        if (review.location)
            item.location = review.location;
        const reviewerInfo = review.isAnonymous
            ? 'Anonymous'
            : review.siteUsername || review.reviewerInfo;
        if (reviewerInfo)
            item.username = reviewerInfo;
        if (review.rating)
            item.rating = review.rating;
        if (review.recipeId)
            item.recipeId = review.recipeId;
        if (review.updatedAt)
            item.date = formatReviewDateAgo(review.updatedAt, formatMessage);
        if (review.tags)
            item.tags = transformTags(review.tags, tagsInfo);
        if (review.images)
            item.images = review.images;
        return item;
    });
};
const INFO_SLICE_ITEMS_LABELS = {
    yield: 'Yield',
    totalTime: 'Total Time'
};
const formatInfoSliceItems = (times, formatMessage, translations) => {
    if (!times)
        return [];
    const items = [];
    Object.keys(times).forEach((key) => {
        if (times[key] && times[key].length && INFO_SLICE_ITEMS_LABELS[key]) {
            items.push({
                key: translations[INFO_SLICE_ITEMS_LABELS[key]]
                    ? formatMessage(translations[INFO_SLICE_ITEMS_LABELS[key]])
                    : INFO_SLICE_ITEMS_LABELS[key],
                value: times[key]
            });
        }
    });
    return items;
};
module.exports = {
    fetchUserRecipeRating,
    formatReviewListItems,
    formatInfoSliceItems,
    formatReviewDateAgo
};
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 76661:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.uploadImage = void 0;
const fetchWithTimeout_1 = __webpack_require__(57743);
const cookie_1 = __webpack_require__(56892);
const cookies_1 = __importDefault(__webpack_require__(53788));
const MAX_TIMEOUT = 180000;
const uploadImage = async (options) => {
    const { file, brand, product, expirationDate, pixVaultUrl } = options;
    try {
        const uploadUrl = `${pixVaultUrl}/upload`;
        const token = (0, cookie_1.getCookie)(cookies_1.default.oidcCookies.access);
        if (!token) {
            throw new Error('Authentication token not found');
        }
        const formData = new FormData();
        formData.append('files', file);
        formData.append('brand', brand);
        formData.append('product', product);
        if (expirationDate) {
            formData.append('expirationDate', expirationDate);
        }
        const response = await (0, fetchWithTimeout_1.fetchWithTimeout)(uploadUrl, {
            body: formData,
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        }, MAX_TIMEOUT);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server responded with status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    }
    catch (error) {
        console.error('Upload error details:', error);
        throw error;
    }
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=pixvault-service.js.map

/***/ }),

/***/ 76497:
/***/ ((module) => {

// mutation for create username
const createUsername = /* GraphQL */ `
  mutation createUsername($input: CreateSiteUsernameInput!) {
    createSiteUsername(input: $input) {
      siteUsername {
        name
        siteID
      }
    }
  }
`;
const updateUsername = /* GraphQL */ `
  mutation updateSiteUsername($input: UpdateSiteUsernameInput!) {
    updateSiteUsername(input: $input) {
      siteUsername {
        name
        siteID
      }
    }
  }
`;
// query to get username
const getUsername = /* GraphQL */ `
  query getSiteUsername($authorID: String!, $siteID: String) {
    siteUsername(authorID: $authorID, siteID: $siteID) {
      id
      name
      tenantID
      authorID
    }
  }
`;
module.exports = {
    getUsername,
    createUsername,
    updateUsername
};
//# sourceMappingURL=queries.js.map

/***/ }),

/***/ 67116:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.validate = exports.createNewUsername = exports.checkUsername = exports.requestGraphService = void 0;
const queries_1 = __webpack_require__(76497);
const Joi = __webpack_require__(16075);
const { GraphQLClient } = __webpack_require__(96497);
const { getCookie } = __webpack_require__(56892);
const cookies = (__webpack_require__(53788)["default"]);
const { oidcCookies } = cookies;
const LENGTH_ERROR = 'lengthError';
const SPECIAL_CHAR_ERROR = 'specialCharError';
const requestGraphService = (commentingUrl, options) => {
    const token = getCookie(oidcCookies.access);
    const client = new GraphQLClient(commentingUrl);
    const { query, variables } = options;
    const headers = {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        'User-Agent': 'verso-client',
        Authorization: `Bearer ${token}`
    };
    return client.request(query, variables, headers);
};
exports.requestGraphService = requestGraphService;
const checkUsername = async (authorID, siteID, commentingUrl) => {
    if (!commentingUrl) {
        console.error('A commenting url is required to check the username');
        return undefined;
    }
    const options = {
        operationName: 'getSiteUsername',
        query: queries_1.getUsername,
        variables: {
            authorID,
            siteID
        }
    };
    let siteUsername;
    try {
        const response = await (0, exports.requestGraphService)(commentingUrl, options);
        if (response?.siteUsername?.length === 0) {
            siteUsername = null;
        }
        else {
            siteUsername = response && response.siteUsername[0]?.name;
        }
    }
    catch (error) {
        console.log(`Error making GQL request in checkUsername: ${error.message}`);
    }
    return siteUsername;
};
exports.checkUsername = checkUsername;
const createNewUsername = async (params, logger) => {
    const { name, organizationId, userId: authorID, url, action } = params;
    const input = {
        siteUsername: {
            name,
            siteID: organizationId,
            authorID
        },
        clientMutationId: '0'
    };
    const options = {
        operationName: action === 'UPDATE' ? 'updateSiteUsername' : 'createSiteUsername',
        query: action === 'UPDATE' ? queries_1.updateUsername : queries_1.createUsername,
        variables: {
            input
        }
    };
    try {
        const response = await (0, exports.requestGraphService)(url, options);
        const newSiteUsername = response &&
            response[action === 'UPDATE' ? 'updateSiteUsername' : 'createSiteUsername']?.siteUsername?.name;
        return newSiteUsername;
    }
    catch (error) {
        // this error check should be replaced with the status code
        let errorCode;
        if ((error.response?.data === null &&
            error.response?.errors[0]?.message ===
                'InternalDevelopmentError: user or username already exists') ||
            error.response?.errors[0]?.message ===
                'InternalDevelopmentError: Duplicate Brand Username') {
            errorCode = 'already_taken';
        }
        logger.warn(`Error making GQL request in createNewUsername: ${error?.response?.errors[0]?.message}`);
        throw new Error(errorCode);
    }
};
exports.createNewUsername = createNewUsername;
const validate = (input, validationRules) => {
    const { minLength, maxLength } = validationRules;
    const lengthValidation = Joi.string()
        .min(minLength)
        .max(maxLength)
        .required();
    const specialCharValidation = Joi.string()
        .regex(/^[a-zA-Z0-9_]+$/)
        .required();
    // Validate length
    const lengthValidationResult = lengthValidation.validate(input);
    if (lengthValidationResult.error) {
        return LENGTH_ERROR; // Return error type
    }
    // Validate special characters
    const specialCharValidationResult = specialCharValidation.validate(input);
    if (specialCharValidationResult.error) {
        return SPECIAL_CHAR_ERROR; // Return error type
    }
    // If both validations pass, return null (indicating no error)
    return null;
};
exports.validate = validate;
//# sourceMappingURL=utils.js.map

/***/ })

}]);