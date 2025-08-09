(globalThis["webpackChunkverso"] = globalThis["webpackChunkverso"] || []).push([[4721],{

/***/ 75430:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const ConsumerMarketingUnit = __webpack_require__(71284);
const { PaywallInlineBarrierWrapper } = __webpack_require__(55838);
const { TrackComponentChannel } = __webpack_require__(78788);
/**
 * PaywallInlineBarrier component
 *
 * @param {object} props - React props
 * @param {string} [props.className] - optional class name
 * @param {string} [props.position] - consumer marketing unit position
 *
 * @returns {ReactElement} <aside>
 */
const PaywallInlineBarrier = function (props) {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'PaywallInlineBarrier'
        });
    }, []);
    const { position = 'paywall-inline-barrier', className } = props;
    return (React.createElement(PaywallInlineBarrierWrapper, { className: className, "data-testid": "PaywallInlineBarrierWrapper" },
        React.createElement(ConsumerMarketingUnit, { position: position, aria: {
                'aria-live': 'polite'
            } })));
};
PaywallInlineBarrier.propTypes = {
    className: PropTypes.string,
    position: PropTypes.string
};
module.exports = PaywallInlineBarrier;
//# sourceMappingURL=PaywallInlineBarrier.js.map

/***/ }),

/***/ 36898:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(75430);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 55838:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { default: styled } = __webpack_require__(92168);
const PaywallInlineBarrierWrapper = styled.aside.withConfig({
    displayName: 'PaywallInlineBarrierWrapper'
}) `
  width: auto;
  height: auto;

  @media print {
    display: none;
  }
`;
module.exports = {
    PaywallInlineBarrierWrapper
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 79744:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const { useIntl } = __webpack_require__(46984);
const SummaryItem = __webpack_require__(74992);
const SectionTitle = __webpack_require__(35864);
const { connector } = __webpack_require__(57744);
const { useResizeObserver } = __webpack_require__(70251);
const { trackNavigationEvent, extractStrategyFromURL } = __webpack_require__(14307);
const { checkIsSmallScreen, getSubjectVersion } = __webpack_require__(49380);
const { MidRecircWrapper } = __webpack_require__(6472);
const translations = (__webpack_require__(4149)/* ["default"] */ .A);
/**
 *
 * @param {object} props - component props
 * @param {string} [props.brandName] - The brand name of the site
 * @param {Array} props.items - Recirc list
 * @param {boolean} [props.hideMidRecirc] - To hide Mid-Article recirc unit
 * @param {boolean} [props.shouldHideRubric] - Hide the summary item rubric
 * @param {string} [props.bylineVariation] - Variation for Byline
 */
const MidRecirc = ({ bylineVariation, brandName, items = [], hideMidRecirc = true, shouldHideRubric = true }) => {
    const [isSmallScreen, setIsSmallScreen] = React.useState(false);
    // Update device type on window resize
    useResizeObserver(() => setIsSmallScreen(checkIsSmallScreen()));
    // Update device type on initial component mount
    React.useEffect(() => {
        setIsSmallScreen(checkIsSmallScreen());
    }, []);
    const { formatMessage } = useIntl();
    const subjectVersion = getSubjectVersion(isSmallScreen);
    const title = formatMessage(translations.alsoOn, {
        brandName
    });
    const callSnowplowEvent = (item, index, totalItems) => {
        const recircItemData = {
            type: 'click',
            label: title,
            subject: 'recirc_unit',
            strategy: extractStrategyFromURL(item.url),
            placement: 'mid_article_recirc',
            subject_version: subjectVersion,
            items: [
                {
                    content_id: item.contentId,
                    content_title: item.dangerousHed,
                    content_type: item.contentType.toLowerCase(),
                    content_url: item.url
                }
            ],
            index,
            total_index: totalItems
        };
        trackNavigationEvent(recircItemData);
    };
    if (hideMidRecirc || items.length === 0) {
        return null;
    }
    return (React.createElement(MidRecircWrapper, { "data-test-id": "MidRecirc" },
        React.createElement(SectionTitle, { dangerousHed: title }),
        items.map((recirc, index) => {
            const eachRecirc = {
                ...recirc,
                clickHandler: () => callSnowplowEvent(recirc, index, items.length)
            };
            return (React.createElement(SummaryItem.SideBySideDense, { key: index, ...eachRecirc, bylineVariation: bylineVariation, hideRubricItemSummary: shouldHideRubric, isRecircListItem: true, recircPlacement: "mid_article_recirc", recircId: index + 1, totalItems: items.length, sectionTitleLabel: title, subjectVersion: subjectVersion }));
        })));
};
MidRecirc.propTypes = {
    brandName: PropTypes.string,
    bylineVariation: PropTypes.string,
    hideMidRecirc: PropTypes.bool,
    items: PropTypes.array,
    shouldHideRubric: PropTypes.bool
};
module.exports = connector(MidRecirc, {
    keysToPluck: ['brandName']
});
//# sourceMappingURL=MidRecircList.js.map

/***/ }),

/***/ 63820:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const MidRecirc = __webpack_require__(79744);
const { asConfiguredComponent } = __webpack_require__(12892);
module.exports = asConfiguredComponent(MidRecirc, 'MidRecirc');
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6472:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const styled = (__webpack_require__(92168)["default"]);
const { SummaryItemHedLink, SummaryItemDek, SummaryItemContent, SummaryItemWrapper, SummaryItemAssetContainer } = __webpack_require__(68116);
const { SummaryItemHedBase } = __webpack_require__(36211);
const { SectionTitleRoot, SectionTitleHed } = __webpack_require__(33500);
const { calculateSpacing, getColorStyles, minScreen, getTypographyStyles, maxScreen } = __webpack_require__(26865);
const { BREAKPOINTS } = __webpack_require__(96472);
const MidRecircWrapper = styled.div.withConfig({
    displayName: 'MidRecircWrapper'
}) `
  &&& {
    ${SummaryItemContent} {
      ${SummaryItemHedLink} {
        text-decoration: none;
      }
      ${SummaryItemDek} {
        display: none;
      }
    }

    ${SummaryItemHedBase} {
      ${minScreen(BREAKPOINTS.sm)} {
        margin-bottom: ${calculateSpacing(1)};
      }
    }
  }
  padding: ${calculateSpacing(2)} 0 ${calculateSpacing(4)} 0;
  ${maxScreen(BREAKPOINTS.md)} {
    padding-top: 0;
  }

  ${SummaryItemHedBase} {
    ${getTypographyStyles('typography.definitions.discovery.hed-bulletin-primary')}
    ${({ theme }) => getColorStyles(theme, 'color', 'colors.discovery.body.white.heading')}
  }
  ${SummaryItemWrapper} {
    display: block;
    border-bottom: 1px solid;
    padding-top: ${calculateSpacing(2)};
    ${({ theme }) => getColorStyles(theme, 'border-bottom-color', 'colors.discovery.body.white.border')}
  }

  ${SummaryItemContent} {
    padding: 0;
  }

  ${SummaryItemAssetContainer} {
    width: ${calculateSpacing(12)};

    ${minScreen(BREAKPOINTS.sm)} {
      display: block;
      float: right;
      margin: 0 0 ${calculateSpacing(2)} ${calculateSpacing(2)};
    }
  }

  ${SectionTitleRoot} {
    border-top: 1px solid;
    padding-top: ${calculateSpacing(2)};
    ${({ theme }) => getColorStyles(theme, 'border-top-color', 'colors.discovery.body.white.border')}
  }
  ${SectionTitleHed} {
    margin-top: 0;
    margin-bottom: ${calculateSpacing(2)};
    ${getTypographyStyles('typography.definitions.discovery.subhed-section-tertiary')}

    ${minScreen(BREAKPOINTS.lg)} {
      justify-self: start;
    }
  }
`;
module.exports = {
    MidRecircWrapper
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 72987:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const { useState } = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const Ad = __webpack_require__(31850);
const { PaymentGateway } = __webpack_require__(92807);
const { asConfiguredComponent } = __webpack_require__(12892);
const { StickyMidContentAdWrapper } = __webpack_require__(36185);
const connect = __webpack_require__(34967);
// Maps wrapper height based on ad size
const STICKY_SIZES = {
    '300x250': 500,
    '320x100': 500,
    '300x50': 500,
    '320x50': 500
};
const StickyMidContent = (props) => {
    const { isNoAds } = props;
    const isStickyEnabled = props.config.adsConfig.enableStickyMidContent || false;
    const [slotStateSize, setSlotStateSize] = useState();
    const handleAdSizeChange = (sizeArray) => {
        setSlotStateSize(sizeArray);
    };
    const adSize = isStickyEnabled && slotStateSize && slotStateSize.length === 2
        ? `${slotStateSize[0]}x${slotStateSize[1]}`
        : '0x0';
    if (isNoAds) {
        return null;
    }
    return (React.createElement(StickyMidContentAdWrapper, { height: STICKY_SIZES[adSize] || null, className: "ad-stickymidcontent" },
        React.createElement(PaymentGateway, { group: "ads" },
            React.createElement(Ad, { position: "mid-content", handleAdSizeChange: handleAdSizeChange, shouldDisplayLabel: true, ...props }))));
};
StickyMidContent.propTypes = {
    config: PropTypes.object,
    isNoAds: PropTypes.bool
};
StickyMidContent.displayName = 'StickyMidContent';
module.exports = connect(asConfiguredComponent(StickyMidContent, 'StickyMidContent'), {
    keysToPluck: ['isNoAds']
});
//# sourceMappingURL=StickyMidContent.js.map

/***/ }),

/***/ 27256:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { showRecircMostPopular } = __webpack_require__(43766);
module.exports = {
    showRecircMostPopular
};
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 43766:
/***/ ((module) => {

const WORDS_TO_DISPLAY_MOST_POPULAR = 200;
const countWordsInStr = (str) => str.trim().replace(/\s+/gi, ' ').split(' ').length;
const countWordsInJSONML = (arr = []) => Array.isArray(arr) &&
    arr.reduce((acc, curr, index) => {
        if (Array.isArray(curr) && curr.length > 1) {
            return acc + countWordsInJSONML(curr);
        }
        else if (typeof curr === 'string' && index !== 0) {
            // first index is presumed to be an HTML tag
            return acc + countWordsInStr(curr);
        }
        return acc;
    }, 0);
const showRecircMostPopular = (articleBody, wordsToDisplay) => countWordsInJSONML(articleBody) >
    (wordsToDisplay || WORDS_TO_DISPLAY_MOST_POPULAR);
module.exports = { showRecircMostPopular };
//# sourceMappingURL=recirc-most-popular.js.map

/***/ }),

/***/ 92245:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const classnames = __webpack_require__(32485);
const ResponsiveCartoon = __webpack_require__(44597);
const RecircMostPopular = __webpack_require__(41160);
const { getVariationNames } = __webpack_require__(81372);
const Grid = __webpack_require__(86659);
const { PaymentGateway } = __webpack_require__(92807);
const Row = __webpack_require__(66657);
const PaywallInlineBarrier = __webpack_require__(36898);
const CNEInterludeEmbed = __webpack_require__(96303);
const Chunks = __webpack_require__(27186);
const { ArticlePageDisclaimer, ArticlePageChunksContent, ArticlePageChunks, ArticlePageDisclaimerGrid, PaywallInlineBarrierWithWrapperGrid } = __webpack_require__(54910);
/**
 * Chunked Article Body component
 *
 * @param {object} props - React Props
 * @param {Array} props.body - Required Array containing the parsed body content
 * @param {bool} [props.hasTopSpacing] - Optional value for specifing if the content well has top spacing
 * @param {bool} [props.hideRecircMostPopular] - Optional value to hide the recirc most popular
 * @param {Array} [props.recircMostPopular] - Optional prop recircMostPopular data
 * @param {object} [props.tagCloud] - Optional Object holding tagCloud properties
 * @param {object} [props.horizontalRuleStyle] - Optional divider style that should be used
 * @param {object} [props.interlude] - Optional props for interlude video component
 * @param {boolean} [props.isMobileDevice] - check is mobile device or not.
 * @param {string} [props.multiChunkRailStrategy] - Optional The strategy used to render ad rail content in multi chunk articles
 * @param {bool} [props.shouldBlurText] - Optional boolean for blurring truncated text
 * @param {boolean} [props.article.showFirstRailRecirc] - Optional prop denoting whether the first block in rail should contain recirc
 * @param {string} [props.singleChunkRailStrategy] - Optional The strategy used to render ad rail content in single chunk articles
 * @param {object} [props.variations] - Optional object for variations
 * @param {bool} [props.variations.adRail] - Optional boolean for toggling adRail
 * @param {bool} [props.variations.isNarrowContentWell] - Optional whether a narrow single column content container should be used
 * @param {object} [props.shouldUsePersistentAd] - Optional information chunking ad approach
 * @param {bool} [props.hasAdditionalDropcapStyling] - Optional value to add more styling to dropcap
 * @param {string} [props.recircMostPopularVariationOnMobile] - Optional recirc most popular variation to show in mobile
 * @param {string} [props.responsiveCartoonVariation] - Optional to select the cartoon variation
 * @param {boolean} [props.hasCartoonFullWidth] - Optional to decide if cartoon has full width
 * @param {string} [props.dividerColor] - Optional prop to get divider color for article page from copilot
 * @param {bool} [props.shouldEnableArticleBackground]
 * @param {bool} [props.shouldEnableFullArticleInverted] -  Optional prop to get full article in inverted theme
 * @param {Function} [props.setCartoonLinkedGalleries] - Set Cartoon related gallery items in Article Page
 * @param {ReactNode} [props.articleIssueDateComponent] - React component for Issue date
 * @param {string} [props.article.disclaimerPosition] - position of the disclaimer
 * @param {object} [props.midRecircItems] - Mid recirc items
 * @param {number} [props.minWordCountForMidRecirc] - Min threshold word count for showing mid article recirc unit
 *
 * @returns {ReactElement} <div>
 */
const ChunkedArticleContent = ({ body, config, linkList, isLinkStackEnabled, hasTopSpacing = true, horizontalRuleStyle, interlude, isMobileDevice, multiChunkRailStrategy, shouldBlurText = false, shouldUsePersistentAd, singleChunkRailStrategy, variations = {}, recircMostPopularVariationOnMobile, hideRecircMostPopular, dividerColor, shouldEnableArticleBackground = false, shouldEnableFullArticleInverted = false, pageBackgroundTheme, recircMostPopular, showFirstRailRecirc, hasAdditionalDropcapStyling = false, tagCloud, wordsToDisplay, responsiveCartoonVariation, hasCartoonFullWidth = false, hasBaseAds = true, setCartoonLinkedGalleries, articleIssueDateComponent, showDisclaimer, disclaimer, disclaimerPosition, midRecircItems, minWordCountForMidRecirc, shouldHideInlineRecirc, visualStoryBanner }) => {
    const adRail = variations && variations.adRail;
    const generalContentClasses = classnames('article__body', {
        'article__body--grid-margins': !adRail
    });
    const FullBleedContentWrapper = adRail
        ? Grid.NarrowContentWithWideAdRail
        : Row;
    const GeneralContentWrapper = adRail
        ? Grid.NarrowContentWithWideAdRail
        : Grid.WithMargins;
    const PaywallInlineBarrierWithWrapper = (props) => (React.createElement(PaywallInlineBarrierWithWrapperGrid, { adRail: adRail, as: GeneralContentWrapper },
        React.createElement("div", { className: classnames('body', 'body__inline-barrier', generalContentClasses) },
            React.createElement("div", { className: "container container--body" },
                React.createElement("div", { className: "container--body-inner" },
                    React.createElement(PaywallInlineBarrier, { ...props }))))));
    return (React.createElement(ArticlePageChunksContent, { isNarrowContentWell: variations.isNarrowContentWell, shouldBlurText: shouldBlurText, hasAdditionalDropcapStyling: hasAdditionalDropcapStyling },
        disclaimerPosition === 'middle' && showDisclaimer && (React.createElement(ArticlePageDisclaimerGrid, { adRail: adRail, as: GeneralContentWrapper, disclaimerPosition: disclaimerPosition },
            React.createElement(ArticlePageDisclaimer, { disclaimerHtml: disclaimer, disclaimerPosition: disclaimerPosition }))),
        React.createElement(ArticlePageChunks, { hasTopSpacing: hasTopSpacing, horizontalRuleStyle: horizontalRuleStyle, pageBackgroundTheme: pageBackgroundTheme, "data-testid": "ArticlePageChunks", adRail: adRail },
            React.createElement(Chunks, { tagCloud: tagCloud, jsonml: body, adRail: adRail, config: config, isMobileDevice: isMobileDevice, linkList: linkList, isLinkStackEnabled: isLinkStackEnabled, multiChunkRailStrategy: multiChunkRailStrategy, interlude: interlude, FullBleedContentWrapper: FullBleedContentWrapper, GeneralContentWrapper: GeneralContentWrapper, recircMostPopular: recircMostPopular, shouldUsePersistentAd: shouldUsePersistentAd, singleChunkRailStrategy: singleChunkRailStrategy, recircMostPopularVariationOnMobile: recircMostPopularVariationOnMobile, hideRecircMostPopular: hideRecircMostPopular, pageBackgroundTheme: pageBackgroundTheme, dividerColor: dividerColor, shouldEnableArticleBackground: shouldEnableArticleBackground, shouldEnableFullArticleInverted: shouldEnableFullArticleInverted, showFirstRailRecirc: showFirstRailRecirc, wordsToDisplay: wordsToDisplay, responsiveCartoonVariation: responsiveCartoonVariation, hasCartoonFullWidth: hasCartoonFullWidth, hasBaseAds: hasBaseAds, setCartoonLinkedGalleries: setCartoonLinkedGalleries, articleIssueDateComponent: articleIssueDateComponent, midRecircItems: midRecircItems, minWordCountForMidRecirc: minWordCountForMidRecirc, shouldHideInlineRecirc: shouldHideInlineRecirc, showDisclaimer: showDisclaimer, visualStoryBanner: visualStoryBanner })),
        React.createElement(PaymentGateway, { group: "paywall" },
            React.createElement(PaywallInlineBarrierWithWrapper, null))));
};
ChunkedArticleContent.propTypes = {
    articleIssueDateComponent: PropTypes.node,
    body: PropTypes.array.isRequired,
    config: PropTypes.object,
    disclaimer: PropTypes.string,
    disclaimerPosition: PropTypes.string,
    dividerColor: PropTypes.string,
    hasAdditionalDropcapStyling: PropTypes.bool,
    hasBaseAds: PropTypes.bool,
    hasCartoonFullWidth: PropTypes.bool,
    hasTopSpacing: PropTypes.bool,
    hideRecircMostPopular: PropTypes.bool,
    horizontalRuleStyle: PropTypes.oneOf(['thin']),
    interlude: PropTypes.shape({
        ...CNEInterludeEmbed.propTypes,
        isRailEligible: PropTypes.boolean
    }),
    isLinkStackEnabled: PropTypes.bool,
    isMobileDevice: PropTypes.bool,
    linkList: PropTypes.object,
    midRecircItems: PropTypes.array,
    minWordCountForMidRecirc: PropTypes.number,
    multiChunkRailStrategy: PropTypes.oneOf(['alternate']),
    pageBackgroundTheme: PropTypes.string,
    recircMostPopular: PropTypes.array,
    recircMostPopularVariationOnMobile: PropTypes.oneOf(getVariationNames(RecircMostPopular)),
    responsiveCartoonVariation: PropTypes.oneOf(getVariationNames(ResponsiveCartoon)),
    setCartoonLinkedGalleries: PropTypes.func,
    shouldBlurText: PropTypes.bool,
    shouldEnableArticleBackground: PropTypes.bool,
    shouldEnableFullArticleInverted: PropTypes.bool,
    shouldHideInlineRecirc: PropTypes.bool,
    shouldUsePersistentAd: PropTypes.bool,
    showDisclaimer: PropTypes.bool,
    showFirstRailRecirc: PropTypes.bool,
    singleChunkRailStrategy: PropTypes.oneOf(['split-in-three']),
    tagCloud: PropTypes.shape({
        tags: PropTypes.arrayOf(PropTypes.shape({
            tag: PropTypes.string.isRequired,
            url: PropTypes.string
        }))
    }),
    variations: PropTypes.shape({
        adRail: PropTypes.bool,
        isNarrowContentWell: PropTypes.bool
    }),
    visualStoryBanner: PropTypes.object,
    wordsToDisplay: PropTypes.number
};
ChunkedArticleContent.displayName = 'ChunkedArticleContent';
module.exports = ChunkedArticleContent;
//# sourceMappingURL=ChunkedArticleContent.js.map

/***/ }),

/***/ 84721:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { asConfiguredComponent } = __webpack_require__(12892);
const { asVariation } = __webpack_require__(81372);
const ChunkedArticleContent = __webpack_require__(92245);
ChunkedArticleContent.WithAdRail = asVariation(ChunkedArticleContent, 'WithAdRail', {
    adRail: true
});
ChunkedArticleContent.OneColumn = asVariation(ChunkedArticleContent, 'OneColumn', {
    adRail: false
});
ChunkedArticleContent.OneColumnNarrow = asVariation(ChunkedArticleContent, 'OneColumnNarrow', {
    adRail: false,
    isNarrowContentWell: true
});
module.exports = asConfiguredComponent(ChunkedArticleContent, 'ChunkedArticleContent');
//# sourceMappingURL=ChunkedArticleContent.variations.js.map

/***/ }),

/***/ 27186:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const classnames = __webpack_require__(32485);
const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const isEqual = __webpack_require__(2404);
const { default: JsonmlToReact } = __webpack_require__(1165);
const { withRecircContextConsumer } = __webpack_require__(85207);
const ResponsiveCartoon = __webpack_require__(44597);
const { getVariationNames } = __webpack_require__(81372);
const Ad = __webpack_require__(19607);
const StickyMidContent = __webpack_require__(72987);
const { PaymentGateway } = __webpack_require__(92807);
const Row = __webpack_require__(66657);
const ConsumerMarketingUnit = __webpack_require__(71284);
const { InContent, InlineNewsletter, NewsletterExtraSlim, NewsletterExtraSlimWithActionSheet, NewsletterSlim, NewsletterVertical, NewsletterVerticalPullQuote, NewsletterOneClickSlim, InContentBarrier } = __webpack_require__(12501);
const StickyBox = __webpack_require__(28433);
const BlockquoteEmbed = __webpack_require__(57885);
const CNEInterludeEmbed = __webpack_require__(96303);
const ConnectedInlineRecirc = withRecircContextConsumer(__webpack_require__(71436));
const SlimNewsletterWrapper = __webpack_require__(72159);
const PersistentAside = __webpack_require__(40855);
const RecircMostPopular = __webpack_require__(41160);
const { showRecircMostPopular } = __webpack_require__(27256);
const mapInlineEmbeds = __webpack_require__(51009);
const { processLinks, processCeros, processTiktok, processSidebarHeadings } = __webpack_require__(74804);
const { connectDomain } = __webpack_require__(57744);
const connectPayment = connectDomain('payment');
const connectFeatureFlags = connectDomain('featureFlags');
const { shouldRenderNothing } = __webpack_require__(29670);
const Body = __webpack_require__(26066);
const { ArticlePageChunksGrid, MobileRecircMostPopular } = __webpack_require__(54910);
const VisualStoryCarousel = __webpack_require__(92229);
const { ArticlePageSplitAdRail, ArticlePageSplitAdRailContent, ArticlePageSplitAdRailTop, ArticlePageSplitAdRailMiddle, ArticlePageSplitAdRailBottom, ArticlePageBodyGridContainer, LinkStackArticlePage } = __webpack_require__(54910);
const BlueskyEmbed = __webpack_require__(49033);
const RedditEmbed = __webpack_require__(97883);
const MidRecirc = __webpack_require__(63820);
const { isDesktopBrowser } = __webpack_require__(72362);
// by default, insert inline recirc after every five paragraph
// when there are 10+ paragraphs
const RECIRC_THRESHOLD = 10;
const RECIRC_TARGET = 5;
const RECIRC_CHUNKED_TARGET = 8;
const MID_RECIRC_THRESHOLD = 2;
function areEqual(prevProps, nextProps) {
    return isEqual(prevProps, nextProps);
}
function InContentCMU() {
    return (React.createElement("div", null,
        React.createElement(ConsumerMarketingUnit, { position: "article-mid-content", secondPosition: "in-content" }),
        React.createElement(InContent, null)));
}
const jsonmlToReact = new JsonmlToReact({
    a: processLinks,
    blockquote: ({ props }) => ({ type: BlockquoteEmbed, props }),
    bluesky: ({ props }) => ({ type: BlueskyEmbed, props }),
    ceros: processCeros,
    h2: processSidebarHeadings,
    reddit: ({ meta, ...props }) => {
        return {
            type: RedditEmbed,
            props: {
                ...props,
                ...JSON.parse(decodeURIComponent(meta))
            }
        };
    },
    tiktok: processTiktok,
    'cm-unit': () => ({ type: InContentCMU }),
    'inline-embed': mapInlineEmbeds,
    'inline-recirc': (props) => (React.createElement(ConnectedInlineRecirc, { ...props, className: "article-inline-recirc-wrapper" })),
    'native-ad': (props) => (React.createElement(PaymentGateway, { group: "ads" },
        React.createElement(Ad, { ...props }))),
    'mid-recirc': (props) => React.createElement(MidRecirc, { items: props.midRecircs }),
    'inline-newsletter': (props) => {
        return (React.createElement("div", null,
            React.createElement(SlimNewsletterWrapper, { ...props, isArticlePage: true }),
            React.createElement(InlineNewsletter, null)));
    },
    'journey-extra-slim': () => React.createElement(NewsletterExtraSlim, null),
    'journey-extra-slim-with-action-sheet': () => (React.createElement(NewsletterExtraSlimWithActionSheet, null)),
    'journey-inline-newsletter': () => {
        return (React.createElement("div", null,
            React.createElement(NewsletterSlim, { className: "article-newsletter-slim-wrapper" }),
            React.createElement(NewsletterOneClickSlim, null),
            React.createElement(NewsletterVertical, null),
            React.createElement(NewsletterVerticalPullQuote, null)));
    }
});
function isJsonMLElement(node) {
    return Array.isArray(node) && typeof node[0] === 'string';
}
function getJsonMLChildren(node) {
    return isJsonMLElement(node) &&
        node[1] &&
        typeof node[1] === 'object' &&
        !Array.isArray(node[1])
        ? node.slice(2)
        : node.slice(1);
}
function isNodeFullSize(node) {
    const tagName = node[0];
    const props = node[1] || {};
    const isLargeFeatureCallout = tagName === 'inline-embed' && props.type === 'callout:feature-large';
    const isMediumFeatureCallout = tagName === 'inline-embed' && props.type === 'callout:feature-medium';
    const isMidContentAd = tagName === 'ad';
    return isLargeFeatureCallout || isMediumFeatureCallout || isMidContentAd;
}
// avoids eslint warnings and constructs key in consistent fashion
// there isn't much to key on with the JSONML other than index
function getKey(type, index) {
    return `${type}-${index}`;
}
class ChunkVisitor {
    constructor({ tagCloud, adRail, config, GeneralContentWrapper = () => null, FullBleedContentWrapper = () => null, interlude, isMobileDevice, multiChunkRailStrategy, recircMostPopular, shouldRenderMidContent, shouldShowMostPopular, shouldUsePersistentAd, singleChunkRailStrategy, recircMostPopularVariationOnMobile, dividerColor, shouldEnableArticleBackground, shouldEnableFullArticleInverted, pageBackgroundTheme, showFirstRailRecirc, linkList, isLinkStackEnabled, responsiveCartoonVariation, hasCartoonFullWidth, hasBaseAds, setCartoonLinkedGalleries, articleIssueDateComponent, midRecircItems, minWordCountForMidRecirc, shouldHideInlineRecirc, showDisclaimer, visualStoryBanner } = {}) {
        this.shouldLimitMidContent = (adInstance) => {
            const desktopLimit = this.config.adsConfig.maxMidContentAdsDesktop;
            const mobileLimit = this.config.adsConfig.maxMidContentAdsMobile;
            const desktopBrowser = isDesktopBrowser();
            if ((!desktopBrowser && mobileLimit <= 0) ||
                (desktopBrowser && desktopLimit <= 0)) {
                return false;
            }
            if ((!desktopBrowser && adInstance >= mobileLimit) ||
                (desktopBrowser && adInstance >= desktopLimit)) {
                return true;
            }
            return false;
        };
        this.isMobileDevice = isMobileDevice;
        this.tagCloud = tagCloud;
        this.isLinkStackEnabled = isLinkStackEnabled;
        this.linkList = linkList;
        this.adRail = adRail;
        this.config = config;
        this.multiChunkRailStrategy = multiChunkRailStrategy;
        this.chunkCount = 0;
        this.shouldRenderMidContent = shouldRenderMidContent;
        this.shouldUsePersistentAd = shouldUsePersistentAd;
        this.shouldEnableArticleBackground = shouldEnableArticleBackground;
        this.shouldEnableFullArticleInverted = shouldEnableFullArticleInverted;
        this.GeneralContentWrapper = GeneralContentWrapper;
        this.FullBleedContentWrapper = FullBleedContentWrapper;
        this.finalAdSet = false;
        this.isSingleChunk = false;
        this.singleChunkRailStrategy = singleChunkRailStrategy;
        this.pageBackgroundTheme = pageBackgroundTheme;
        this.interlude =
            interlude?.strategy?.enabled && // set in tenant config
                interlude.isRailEligible ? ( // set in tenant config
            React.createElement(CNEInterludeEmbed, { ...interlude, isRightRail: true })) : null;
        this.interludeSet = false;
        this.mostPopular = shouldShowMostPopular && (React.createElement(RecircMostPopular, { className: "article-recirc-most-popular-wrapper", items: recircMostPopular, dividerColor: dividerColor, categoriesMap: tagCloud?.tags }));
        this.mostPopularOnMobile = shouldShowMostPopular && (React.createElement(MobileRecircMostPopular, { className: "article-recirc-most-popular-wrapper", counterSuffix: "", items: recircMostPopular, dividerColor: dividerColor, categoriesMap: tagCloud?.tags, as: RecircMostPopular[recircMostPopularVariationOnMobile] }));
        this.hasRecircMostPopularOnMobile = !!recircMostPopularVariationOnMobile;
        this.showFirstRailRecirc = showFirstRailRecirc;
        this.responsiveCartoonVariation = responsiveCartoonVariation;
        this.hasCartoonFullWidth = hasCartoonFullWidth;
        this.setCartoonLinkedGalleries = setCartoonLinkedGalleries;
        this.articleIssueDateComponent = articleIssueDateComponent;
        this.hasBaseAds = hasBaseAds;
        this.midRecircItems = midRecircItems || [];
        this.minWordCountForMidRecirc = minWordCountForMidRecirc;
        this.shouldHideInlineRecirc = shouldHideInlineRecirc;
        this.showDisclaimer = showDisclaimer;
        this.visualStoryBanner = visualStoryBanner;
    }
    determineAd() {
        if (this.shouldUsePersistentAd) {
            this.interludeSet = true;
            return this.persistentAd();
        }
        const stickyAd = this.stickyAd(this.showFirstRailRecirc);
        this.interludeSet = true;
        return stickyAd;
    }
    showAds(allowRecirc) {
        if (this.chunkCount === 1) {
            return this.determineAd();
        }
        if (!this.finalAdSet) {
            const stickyAd = this.stickyAd(allowRecirc);
            this.interludeSet = true;
            return stickyAd;
        }
        return null;
    }
    getAdSlot(interlude) {
        return (React.createElement(React.Fragment, null,
            React.createElement(PaymentGateway, { group: "ads" },
                interlude,
                React.createElement(Ad, { position: "rail" })),
            React.createElement(PaymentGateway, { group: "consumer-marketing" },
                React.createElement(ConsumerMarketingUnit, { position: "display-rail" }))));
    }
    withStickyBox(content, stickyBoxProps = {}) {
        return content && React.createElement(StickyBox, { ...stickyBoxProps }, content);
    }
    renderSplitAdRail() {
        const topAd = this.withStickyBox(this.getAdSlot(null));
        const mostPopular = this.withStickyBox(this.mostPopular);
        const bottomAd = this.withStickyBox(this.getAdSlot(null));
        return (React.createElement(ArticlePageSplitAdRail, { anchorTop: {
                selector: "[data-testid='ContentHeaderLeadRailAnchor']"
            }, anchorBottom: {
                selector: '.content-bottom-anchor',
                edge: 'bottom'
            }, shouldRemoveAbsolute: true },
            React.createElement(ArticlePageSplitAdRailContent, { className: "split-ad-rail-content" },
                React.createElement(ArticlePageSplitAdRailTop, null, topAd),
                this.showFirstRailRecirc && (React.createElement(ArticlePageSplitAdRailMiddle, { className: "split-ad-rail-middle" }, mostPopular)),
                React.createElement(ArticlePageSplitAdRailBottom, { className: "split-ad-rail-bottom" }, bottomAd))));
    }
    renderAdRail(allowRecirc) {
        if (this.isSingleChunk &&
            this.singleChunkRailStrategy === 'split-in-three') {
            return this.renderSplitAdRail();
        }
        return this.showAds(allowRecirc);
    }
    closeSmallGroup(smallGroup, containers, index, isFirstChild) {
        if (smallGroup.length > 0) {
            ++this.chunkCount;
            const showMostPopularOnMobile = this.chunkCount === 2 && this.hasRecircMostPopularOnMobile;
            const Wrapper = this.GeneralContentWrapper;
            return containers.concat([
                React.createElement(ArticlePageChunksGrid, { adRail: this.adRail, as: Wrapper, key: getKey('small-group', index), pageBackgroundTheme: this.pageBackgroundTheme },
                    React.createElement(Body, { className: classnames('body__container article__body', {
                            'article-white-background': this.shouldEnableArticleBackground &&
                                this.pageBackgroundTheme &&
                                !this.shouldEnableFullArticleInverted
                        }), shouldEnableFullArticleInverted: this.shouldEnableFullArticleInverted },
                        showMostPopularOnMobile && this.mostPopularOnMobile,
                        isFirstChild && this.articleIssueDateComponent,
                        jsonmlToReact.convert([
                            'div',
                            { className: 'body__inner-container' },
                            ...smallGroup
                        ]),
                        isFirstChild && React.createElement(InContentBarrier, null),
                        index === 'final' && this.visualStoryBanner && (React.createElement(VisualStoryCarousel, { container: this.visualStoryBanner, className: "articleLayout" })),
                        index === 'final' && this.isLinkStackEnabled && this.linkList && (React.createElement(LinkStackArticlePage, { ...this.linkList }))),
                    this.adRail &&
                        isDesktopBrowser() &&
                        !this.isMobileDevice &&
                        this.renderAdRail(index !== 'final'))
            ]);
        }
        return containers;
    }
    isMultiChunkRailStrategyAlternate() {
        return this.multiChunkRailStrategy === 'alternate';
    }
    shouldRenderAd() {
        if (this.isMultiChunkRailStrategyAlternate()) {
            return this.chunkCount % 2 === 1;
        }
        return true;
    }
    shouldRenderMostPopular(allowRecirc) {
        if (this.isMultiChunkRailStrategyAlternate() && allowRecirc) {
            return this.chunkCount % 2 === 0;
        }
        return allowRecirc;
    }
    getChunkAdRailContent(interlude, allowRecirc) {
        return (React.createElement(React.Fragment, null,
            (this.shouldRenderAd() || !allowRecirc) && this.getAdSlot(interlude),
            this.shouldRenderMostPopular(allowRecirc) && this.mostPopular));
    }
    injectInlineRecirc(children) {
        let paragraphsSkipped = 0;
        let inlineIndex = 0;
        return children.reduce((result, item, index) => {
            if (!this.isParagraph(item)) {
                return result.concat([item]);
            }
            paragraphsSkipped++;
            if (this.isParagraph(children[index + 1]) &&
                this.shouldInsertRecirc(paragraphsSkipped, inlineIndex)) {
                paragraphsSkipped = 0;
                return result.concat([
                    item,
                    ['inline-recirc', { reelId: ++inlineIndex }]
                ]);
            }
            return result.concat([item]);
        }, []);
    }
    getTotalWordCount(itemList) {
        return itemList
            .filter((subList) => subList[0] === 'p')
            .reduce((total, subList) => {
            const wordCount = subList
                .filter((item) => typeof item === 'string')
                .reduce((count, text) => count + text.split(' ').length, 0);
            return total + wordCount;
        }, 0);
    }
    injectMidRecirc(children) {
        let adCounter = 0;
        let midRecircInjected = false;
        let previousTag = null;
        return children.reduce((result, item, index) => {
            const tagName = item[0] || '';
            if (adCounter < 1 && tagName === 'ad') {
                adCounter++;
            }
            if (adCounter >= 1 && !midRecircInjected) {
                const nextTag = index + 1 < children.length ? item[0] : null;
                if (previousTag === 'p' && nextTag === 'p') {
                    midRecircInjected = true;
                    result.push(['mid-recirc', { midRecircs: this.midRecircItems }]);
                }
            }
            previousTag = tagName;
            return result.concat([item]);
        }, []);
    }
    isInlineEmbedCNEAudio(node) {
        const tagName = node[0];
        const props = node[1] || {};
        const isInlineEmbed = tagName === 'inline-embed';
        const isCNEAudio = props?.type === 'cneaudio';
        return isInlineEmbed && isCNEAudio;
    }
    injectJourneyNewsletter(children, showDisclaimer) {
        const shouldHideNewsletter = showDisclaimer || this.isInlineEmbedCNEAudio(children[0]);
        if (shouldHideNewsletter)
            return [...children];
        return [
            ['journey-extra-slim'],
            ['journey-extra-slim-with-action-sheet'],
            ...children
        ];
    }
    isParagraph(node) {
        return node && node[0] === 'p';
    }
    persistentAd() {
        return (React.createElement(PersistentAside, { anchorTop: {
                selector: "[data-testid='ContentHeaderLeadRailAnchor']"
            }, anchorBottom: { edge: 'bottom' }, shouldRemoveAbsolute: true }, this.getChunkAdRailContent(this.interlude, this.showFirstRailRecirc)));
    }
    shouldInsertRecirc(paragraphsSkipped, inlineIndex) {
        return (paragraphsSkipped >=
            (inlineIndex === 0 ? RECIRC_TARGET : RECIRC_CHUNKED_TARGET));
    }
    stickyAd(allowRecirc) {
        const interlude = !this.interludeSet && this.interlude;
        const adContent = this.getChunkAdRailContent(interlude, allowRecirc);
        return React.createElement(React.Fragment, null, this.withStickyBox(adContent, { isExpanded: !!interlude }));
    }
    wrapInFullSizeContainer(node, containers, index) {
        const Wrapper = this.FullBleedContentWrapper;
        return containers.concat([
            React.createElement(Wrapper, { key: getKey('full', index) },
                React.createElement(ArticlePageBodyGridContainer, { className: "body__grid-container", as: Body, shouldDisableMaxWidth: true, shouldEnableDataJourneyHook: false, shouldEnableFullArticleInverted: this.shouldEnableFullArticleInverted }, jsonmlToReact.convert(node)))
        ]);
    }
    visit(node) {
        let children = getJsonMLChildren(node);
        let containers = [];
        let smallGroup = [];
        let adInstance = 0;
        this.isSingleChunk = !children.some((node) => node[0] === 'ad');
        this.finalAdSet = false;
        const paragraphCount = children.filter(this.isParagraph).length;
        const shouldInsertRecirc = !this.shouldHideInlineRecirc && paragraphCount > RECIRC_THRESHOLD;
        if (shouldInsertRecirc) {
            children = this.injectInlineRecirc(children);
        }
        // Insert Mid recirc to article body. Please don't re-use this. It is only for A/B experiment
        const shouldInsertMidRecirc = paragraphCount > MID_RECIRC_THRESHOLD;
        if (shouldInsertMidRecirc &&
            this.midRecircItems &&
            this.midRecircItems.length > 0) {
            const totalWordCount = this.getTotalWordCount(children);
            if (this.minWordCountForMidRecirc &&
                totalWordCount > this.minWordCountForMidRecirc) {
                children = this.injectMidRecirc(children);
            }
        }
        let cartoonPosition = 0;
        const totalNumberOfCartoons = children.reduce((total, node = []) => {
            const [nodeTagName, nodeProps = {}, element = []] = node;
            const { props: { childTypes = [], image: { contentType = '' } = {} } = {} } = nodeProps;
            if (nodeTagName === 'inline-embed' &&
                (childTypes.includes('cartoon') || contentType === 'cartoon') &&
                (node.length || element.length)) {
                return total + 1;
            }
            return total;
        }, 0);
        let isFirstChild = '';
        children = this.injectJourneyNewsletter(children, this.showDisclaimer);
        children.forEach((node, index) => {
            const [nodeTagName, nodeProps, element] = node;
            if (nodeTagName === 'ad') {
                isFirstChild = Boolean(isFirstChild === '');
                if (this.shouldRenderMidContent) {
                    containers = this.closeSmallGroup(smallGroup, containers, index, isFirstChild);
                    smallGroup = [];
                    if (this.hasBaseAds && !this.shouldLimitMidContent(adInstance)) {
                        adInstance++;
                        containers = containers.concat([
                            React.createElement(Row, { className: "full-bleed-ad row-mid-content-ad", key: getKey('ad', index) },
                                React.createElement(StickyMidContent, { shouldDisplayLabel: true, shouldHoldSpace: true }))
                        ]);
                    }
                }
                // else we don't render the 'ad' tag at all.
            }
            else if (!this.adRail && isNodeFullSize(node)) {
                isFirstChild = Boolean(isFirstChild === '');
                // We only have 1 column so these can be full size
                containers = this.closeSmallGroup(smallGroup, containers, index, isFirstChild);
                smallGroup = [];
                // Note: order is important! (full-size must come after small container closed)
                containers = this.wrapInFullSizeContainer(node, containers, index);
            }
            else if (nodeTagName === 'inline-embed' &&
                nodeProps?.props?.childTypes?.includes('cartoon') &&
                element?.length) {
                const elementProps = element[1];
                elementProps.props.image.responsiveCartoonVariation =
                    this.responsiveCartoonVariation;
                elementProps.props.image.setCartoonLinkedGalleries =
                    this.setCartoonLinkedGalleries;
                cartoonPosition += 1;
                elementProps.props.image.analyticsData = {
                    totalNumberOfCartoons,
                    cartoonPosition,
                    cartoonPlacement: 'inline'
                };
                if (this.hasCartoonFullWidth) {
                    smallGroup = smallGroup.concat([element]);
                }
                else {
                    smallGroup = smallGroup.concat([node]);
                }
            }
            else if (nodeTagName === 'inline-embed' &&
                nodeProps?.props?.image?.contentType === 'cartoon' &&
                node?.length) {
                const elementProps = node[1];
                elementProps.props.image.responsiveCartoonVariation =
                    this.responsiveCartoonVariation;
                elementProps.props.image.setCartoonLinkedGalleries =
                    this.setCartoonLinkedGalleries;
                cartoonPosition += 1;
                elementProps.props.image.analyticsData = {
                    totalNumberOfCartoons,
                    cartoonPosition,
                    cartoonPlacement: 'inline'
                };
                smallGroup = smallGroup.concat([node]);
            }
            else {
                smallGroup = smallGroup.concat([node]);
            }
        });
        isFirstChild = Boolean(isFirstChild === '');
        containers = this.closeSmallGroup(smallGroup, containers, 'final', isFirstChild);
        this.finalAdSet = true;
        return containers;
    }
}
function Chunks({ tagCloud, adRail, config = {
    adsConfig: {
        maxMidContentAdsDesktop: 0,
        maxMidContentAdsMobile: 0
    }
}, FullBleedContentWrapper, featureFlags, GeneralContentWrapper, interlude, isMobileDevice, jsonml, payment, recircMostPopular, shouldUsePersistentAd, hasRecircMostPopularOnMobile, recircMostPopularVariationOnMobile, hideRecircMostPopular, dividerColor, shouldEnableArticleBackground, shouldEnableFullArticleInverted, pageBackgroundTheme, showFirstRailRecirc, wordsToDisplay, linkList, isLinkStackEnabled, responsiveCartoonVariation, setCartoonLinkedGalleries, articleIssueDateComponent, hasBaseAds = true, hasCartoonFullWidth = false, multiChunkRailStrategy = 'default', singleChunkRailStrategy = 'default', midRecircItems, minWordCountForMidRecirc, shouldHideInlineRecirc, showDisclaimer, visualStoryBanner }) {
    React.useEffect(() => {
        const intersectionThreshold = 0.95;
        const adRailContent = document.querySelector('.split-ad-rail-content');
        const adRailMiddle = document.querySelector('.split-ad-rail-middle');
        const adRailBottom = document.querySelector('.split-ad-rail-bottom');
        const adRailOverflowCallback = (intersectionThreshold) => (entities) => {
            const [entity] = entities;
            if (entity.intersectionRatio < intersectionThreshold) {
                entity.target.remove();
            }
        };
        if (adRailContent && adRailMiddle && adRailBottom) {
            const interceptor = new IntersectionObserver(adRailOverflowCallback(intersectionThreshold), {
                root: adRailContent,
                threshold: intersectionThreshold
            });
            interceptor.observe(adRailMiddle);
            interceptor.observe(adRailBottom);
            return () => {
                interceptor.disconnect();
            };
        }
        return () => { };
    });
    const shouldRenderMidContent = !shouldRenderNothing('ads', payment, featureFlags);
    const shouldShowMostPopular = !hideRecircMostPopular && showRecircMostPopular(jsonml, wordsToDisplay);
    const chunker = new ChunkVisitor({
        tagCloud,
        adRail,
        config,
        FullBleedContentWrapper,
        GeneralContentWrapper,
        interlude,
        isMobileDevice,
        multiChunkRailStrategy,
        recircMostPopular,
        shouldRenderMidContent,
        linkList,
        isLinkStackEnabled,
        shouldShowMostPopular,
        shouldUsePersistentAd,
        singleChunkRailStrategy,
        hasRecircMostPopularOnMobile,
        recircMostPopularVariationOnMobile,
        pageBackgroundTheme,
        dividerColor,
        shouldEnableArticleBackground,
        shouldEnableFullArticleInverted,
        showFirstRailRecirc,
        responsiveCartoonVariation,
        hasCartoonFullWidth,
        hasBaseAds,
        setCartoonLinkedGalleries,
        articleIssueDateComponent,
        midRecircItems,
        minWordCountForMidRecirc,
        shouldHideInlineRecirc,
        showDisclaimer,
        visualStoryBanner
    });
    return chunker.visit(jsonml);
}
Chunks.propTypes = {
    adRail: PropTypes.bool,
    config: PropTypes.object,
    dividerColor: PropTypes.string,
    featureFlags: PropTypes.object,
    FullBleedContentWrapper: PropTypes.func,
    GeneralContentWrapper: PropTypes.func,
    hasBaseAds: PropTypes.bool,
    hasCartoonFullWidth: PropTypes.bool,
    hideRecircMostPopular: PropTypes.bool,
    interlude: PropTypes.shape({
        ...CNEInterludeEmbed.propTypes,
        isRailEligible: PropTypes.boolean
    }),
    jsonml: PropTypes.array.isRequired,
    minWordCountForMidRecirc: PropTypes.number,
    multiChunkRailStrategy: PropTypes.oneOf(['default', 'alternate']),
    pageBackgroundTheme: PropTypes.string,
    payment: PropTypes.object,
    recircMostPopular: PropTypes.array,
    recircMostPopularVariationOnMobile: PropTypes.oneOf(getVariationNames(RecircMostPopular)),
    responsiveCartoonVariation: PropTypes.oneOf(getVariationNames(ResponsiveCartoon)),
    shouldHideInlineRecirc: PropTypes.bool,
    shouldUsePersistentAd: PropTypes.bool,
    showDisclaimer: PropTypes.bool,
    showFirstRailRecirc: PropTypes.bool,
    singleChunkRailStrategy: PropTypes.oneOf(['default', 'split-in-three']),
    tagCloud: PropTypes.shape({
        tags: PropTypes.arrayOf(PropTypes.shape({
            tag: PropTypes.string.isRequired,
            url: PropTypes.string
        }))
    }),
    visualStoryBanner: PropTypes.object,
    wordsToDisplay: PropTypes.number
};
module.exports = React.memo(connectPayment(connectFeatureFlags(Chunks)), areEqual);
module.exports.Chunks = Chunks;
//# sourceMappingURL=Chunks.js.map

/***/ }),

/***/ 54910:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { default: styled, createGlobalStyle, css } = __webpack_require__(92168);
const { BREAKPOINTS } = __webpack_require__(96472);
const { calculateSpacing, getColorStyles, getTypographyStyles, maxScreen, minScreen, minMaxScreen, getColorToken, getLinkStyles } = __webpack_require__(26865);
const { withRecircContextProvider } = __webpack_require__(85207);
const BasePage = withRecircContextProvider(__webpack_require__(30543));
const { getPattern } = __webpack_require__(30);
const Button = __webpack_require__(73730);
const { Disclaimer } = __webpack_require__(74307);
const { BodyWrapper } = __webpack_require__(29912);
const LinkStack = __webpack_require__(63401);
const { SectionTitleHed } = __webpack_require__(33500);
const { LinkStackContent } = __webpack_require__(15539);
const { GroupCalloutWrapper } = __webpack_require__(68426);
const { RecircMostPopularWrapper, RecircMostPopularHeading } = __webpack_require__(16302);
const { StickyBoxWrapper, StickyBoxPrimary } = __webpack_require__(77307);
const { IframeEmbedWrapper } = __webpack_require__(34980);
const { ResponsiveCartoonWrapper } = __webpack_require__(77527);
const { GalleryEmbedHr } = __webpack_require__(56082);
const { AssetEmbedAssetContainer } = __webpack_require__(41108);
const { GridItem, GridWrapper } = __webpack_require__(40653);
const PersistentAside = __webpack_require__(40855);
const { SocialIconsListItem } = __webpack_require__(51000);
const { ResponsiveCartoonCaption } = __webpack_require__(77527);
const { applyCustomBackgroundColor } = __webpack_require__(1123);
const { ConsumerMarketingUnitThemedWrapper } = __webpack_require__(43152);
const { BaseText } = __webpack_require__(76955);
const { CneVideoEmbedContainer } = __webpack_require__(25423);
const commonStyles = css `
  ${({ pageBackgroundTheme }) => {
    if (pageBackgroundTheme) {
        return css `
        ${applyCustomBackgroundColor(pageBackgroundTheme)};
      `;
    }
    return css `
      ${({ theme }) => getPattern(theme, 'page-background')};
    `;
}}
  .grid-layout__content {
    ${minScreen(BREAKPOINTS.md)} {
      grid-column: 3 / span 8;
    }

    ${minScreen(BREAKPOINTS.lg)} {
      grid-column: 2 / span 6;
    }

    ${minMaxScreen(BREAKPOINTS.sm, BREAKPOINTS.md)} {
      grid-column: 1 / -1;
    }
  }

  .grid-layout--adrail.narrow {
    .container--body-inner {
      ${minScreen(BREAKPOINTS.md)} {
        grid-column: 1 / -1;
      }
    }

    ${RecircMostPopularWrapper} {
      &:first-child {
        margin-top: 0;

        ${RecircMostPopularHeading} {
          margin-top: 0;
        }
      }
    }
  }

  .container--body {
    grid-gap: 20px;
  }

  inline-embed[name='align-right'] {
    text-align: right;
  }

  inline-embed[name='align-center'] {
    text-align: center;
  }
`;
const getHeaderTransform = (hideNav) => hideNav
    ? `
    header.site-navigation {
      margin-bottom: -7rem;
      transform: translateY(-150%);
      transition: all 1000ms ease;
    }
    `
    : `
    header.site-navigation {
      margin-bottom: -7rem;
      transition: all 500ms ease;
    }
`;
const ArticlePageBase = styled(BasePage).withConfig({
    displayName: 'ArticlePageBase'
}) `
  &&& {
    ${commonStyles}
    ${({ shouldHideBaseTopPadding }) => shouldHideBaseTopPadding && `padding-top : 0;`}
    ${({ hideNav, shouldPrioritizeSeriesPagination, hasContentHeaderLogo }) => !shouldPrioritizeSeriesPagination &&
    hasContentHeaderLogo &&
    getHeaderTransform(hideNav)}
  }
`;
const ArticlePageGlobalStyle = createGlobalStyle `
    .channel--body {
      ${commonStyles}
    }
    
    .body__container {
      grid-column: 1/ -1;
    
      ${minScreen(BREAKPOINTS.md)} {
        grid-column: 3 / span 8;
      }
    }
  
    /* 1. required to enforce proper alignment when text may be less than a full line
       2. remove extra top spacing added by default paragraph margins */
      .article__body {
        margin-bottom: ${calculateSpacing(2)};
        width: 100%; /* 1 */
  
        p:first-child:not(.callout--group-item):not(.upc-brandName) {
          margin-top: 0; /* 2 */
        }
  
        .small {
          font-variant: small-caps;
          text-transform: lowercase;
          font-style: normal;
        }
  
        .underline {
          text-decoration: underline;
          font-style: inherit;
        }

        .italic {
          font-style: italic;
        }

        ${ResponsiveCartoonCaption} .underline {
          font-style: inherit;
        }

        ${ResponsiveCartoonCaption} .italic {
          font-style: italic;
        }
      }

      .article-white-background {
        background-color: white;
        padding: 1rem;
      }
  
      .article__body > .body__inner-container > {
        & {
          ${maxScreen(BREAKPOINTS.md)} {
            .grid-items-3${GroupCalloutWrapper} {
              ${GridItem}{    
                margin-bottom: ${calculateSpacing(2.5)};
              }

              ${GridItem}:last-child:nth-child(odd) {    
                grid-column: 1 / 3;
              } 
            }
          }
          ${({ hideSideBySideViewOnMobile }) => hideSideBySideViewOnMobile &&
    `
            ${maxScreen(BREAKPOINTS.md)} {
              ${GroupCalloutWrapper} {
                ${GridItem} {
                  grid-column: 1 / -1;
                }
              }
            }
          `}
          
          ${({ isUpcEnabled }) => isUpcEnabled &&
    `
            ${minScreen(BREAKPOINTS.md)} {
              .grid-items-3${GroupCalloutWrapper} {
                grid-template-columns: repeat(3,1fr);
               }
               .grid-items-4${GroupCalloutWrapper} {
                grid-template-columns: repeat(4,1fr);
               }
              ${GroupCalloutWrapper} {
               grid-template-columns: repeat(2,1fr);
              }
            }
            ${maxScreen(BREAKPOINTS.md)} {
              .grid-items-3${GroupCalloutWrapper} {
              ${GridItem}{    
                margin-bottom: 0;
              }
            }
          `}
        }

        ${IframeEmbedWrapper}, .cne-video-embed {
            &:first-child {
              margin-top: 0;
            }
          }
  
          inline-embed:first-child ${IframeEmbedWrapper} {
            margin-top: 0;
          }
      }

      .article__body > .body__inner-container > figure.asset-embed {
        padding: 0;
      }


      .article__body--grid-margins {
        grid-column: 1 / -1;
      }

      /**
       1. have ad span more columns from the right panel
       to have a larger right margin
       2. have it span 3 which is intended in a 12 column grid
       */
       .grid-layout__aside {
         display: none;
     
         ${minScreen(BREAKPOINTS.lg)} {
           display: block;
           min-width: 300px;
     
           ${StickyBoxWrapper} {
             top: 90px;
           }
         }
     
         ${RecircMostPopularWrapper} {
           &:first-child {
             margin-top: 0;
     
             ${RecircMostPopularHeading} {
               margin-top: 0;
             }
           }
         }
       }
       ${BodyWrapper} {
        ${({ shouldEnableFullArticleInverted, theme }) => shouldEnableFullArticleInverted &&
    `color: ${getColorToken(theme, 'colors.consumption.body.inverted.body')}`}
}

        ${BodyWrapper} {
          ${({ dividerColor }) => dividerColor &&
    `
                .body__inner-container  > hr {
                    background: #${dividerColor};
                    height: 1px;
                }
              `}
       }

  `;
const PaywallInlineBarrierWithWrapperGrid = styled('div').withConfig({
    displayName: 'PaywallInlineBarrierWithWrapperGrid'
}) `
  ${({ adRail }) => !adRail &&
    `
    > ${GridItem} {
      grid-column: 1 / -1;
    }`}
`;
const ArticlePageLedeBackground = styled('div').withConfig({
    displayName: 'ArticlePageLedeBackground'
}) `
  ${({ theme }) => getPattern(theme, 'lede-background')};
`;
const ArticlePageContentBackGround = styled('div').withConfig({
    displayName: 'ArticlePageContentBackGround'
}) `
  ${({ theme }) => getPattern(theme, 'lede-background')}
  padding-top: ${calculateSpacing(2)};

  @media (min-width: 1208px) {
    padding-top: ${calculateSpacing(4)};
  }

  ${({ togglePaddingTop, hasReducedBackgroundSpacing }) => togglePaddingTop === 'large' &&
    `padding-top: ${calculateSpacing(4)};
       ${minScreen(BREAKPOINTS.md)} { 
        padding-top: ${hasReducedBackgroundSpacing
        ? calculateSpacing(4)
        : calculateSpacing(6)};
       }
  `}

  ${({ enableActionBar }) => enableActionBar &&
    `
    ${maxScreen(BREAKPOINTS.xxl)}{
      padding-top: ${calculateSpacing(6)};
    }
    ${minScreen(BREAKPOINTS.lg)} {
      position: relative;
    }
  `}

  ${({ togglePaddingTop }) => togglePaddingTop === 'xlarge' &&
    `${minScreen(BREAKPOINTS.lg)} {  padding-top: ${calculateSpacing(8)}; }`}
  
    ${({ isMobileTruncated }) => isMobileTruncated &&
    `
          position: relative;
          height: 890px;
          overflow: hidden;
  
          &::before {
            display: block;
            position: absolute;
            bottom: 0;
            z-index: 1;
            background: linear-gradient(
              0deg,
              rgba(255, 255, 255, 1) 20%,
              rgba(255, 255, 255, 0) 100%
            );
            width: 100%;
            height: 192px;
            content: '';
          }
  
          ${minScreen(BREAKPOINTS.md)} {
            height: auto;
            overflow: visible;
  
            &::before {
              display: none;
            }
          }
        `}

  ${({ cartoonVariation }) => cartoonVariation === 'card' &&
    css `
      ${ResponsiveCartoonWrapper}::before, ${ResponsiveCartoonWrapper}::after {
        border: none;
      }

      ${ResponsiveCartoonWrapper} {
        ${getColorStyles('background-color', 'colors.background.brand')};
        border: none;
        padding: ${calculateSpacing(3)} ${calculateSpacing(6)};

        ${minScreen(BREAKPOINTS.lg)} {
          ${SocialIconsListItem} a {
            width: ${calculateSpacing(5)};
          }
        }
      }
    `}
`;
const MobileRecircMostPopular = styled('div').withConfig({
    displayName: 'MobileRecircMostPopular'
}) ``;
const ArticlePageChunks = styled('div').withConfig({
    displayName: 'ArticlePageChunks'
}) `
  ${({ adRail }) => adRail &&
    `
    ${CneVideoEmbedContainer} {
      margin-right: auto;
      margin-left: auto;
      width: auto;
    }`}

  .grid:last-child {
    .body__container > .body__inner-container > *:last-child {
      ${GalleryEmbedHr}:last-child {
        display: none;
      }
    }
  }

  ${({ horizontalRuleStyle }) => horizontalRuleStyle === 'thin' &&
    `
        .body__container {
          .callout--has-top-border {
            border-top-width: 1px;
          }

          hr {
            height: 1px;
          }
        }
      `}

  ${({ hasTopSpacing }) => !hasTopSpacing &&
    `
        .inset-embedded-lede {
          @media (min-width: 0px) and (max-width: calc(${BREAKPOINTS.md} - 1px)) {
            ${AssetEmbedAssetContainer} {
              transform: translateX(-50%);  /* 1 */
              margin-left: 50%;
              width: 100vw;
            }
          }
        }

        ${minScreen(BREAKPOINTS.md)} {
          .body__container {
            p:first-of-type {
              margin-top: 0;
            }

            .inset-embedded-lede {
              margin-top: 0;
            }
          }
        }
    `}

  @media print {
    ${GridWrapper} {
      display: block;
    }

    ${GridWrapper} > p {
      font-size: 17px;
    }
  }

  ${({ pageBackgroundTheme }) => pageBackgroundTheme &&
    `.ad.ad--mid-content {
      .ad-label {
        color: #1A1A1A;
      }
    }`}
`;
const ArticlePageBodyMobileTruncatedBtn = styled(Button.Utility).withConfig({
    displayName: 'ArticlePageBodyMobileTruncatedBtn'
}) `
  position: absolute;
  bottom: 0;
  left: 50%;
  z-index: 2;
  margin-left: -100px;
  width: 200px;

  ${minScreen(BREAKPOINTS.md)} {
    display: none;
  }
`;
const ArticlePageDisclaimer = styled(Disclaimer).withConfig({
    displayName: 'ArticlePageDisclaimer'
}) `
  ${getTypographyStyles('typography.definitions.discovery.subhed-section-collection')}
  ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body')};
  ${minScreen(BREAKPOINTS.md)} {
    .grid-layout--adrail & {
      grid-column: 1 / -1;
    }
  }

  span {
    font-style: normal;
  }
`;
const ArticlePageChunksContent = styled('div').withConfig({
    displayName: 'ArticlePageChunksContent'
}) `
  ${({ isNarrowContentWell }) => isNarrowContentWell &&
    `
        .grid > *:first-child,
        .body__container {
          grid-column: 1 / -1;

          ${minScreen(BREAKPOINTS.lg)} {
            grid-column: 4 / span 6;
          }
        }

        ${ResponsiveCartoonWrapper} {
          .grid--item {
            grid-column: 1 / -1;
          }
        }
      `}

  ${({ shouldBlurText }) => {
    shouldBlurText &&
        css `
        .grid:first-of-type .body__container p.has-dropcap::first-letter {
          color: transparent;
        }
        ${BodyWrapper} {
          * {
            text-shadow: 0 0 20px
              rgba(
                ${getColorToken('colors.consumption.body.standard.body')},
                0.5
              );
            color: transparent;
          }

          a:not(.button) {
            ${({ theme }) => getLinkStyles(theme, 'colors.consumption.body.standard.link', 'colors.consumption.body.standard.link-hover')};
            text-shadow: 0 0 20px
              rgba(
                ${getColorToken('colors.consumption.body.standard.link')},
                0.5
              );
          }
        }
      `;
}}

  ${({ hasAdditionalDropcapStyling, theme }) => hasAdditionalDropcapStyling &&
    `
      .body__container p.has-dropcap::first-letter {
        ${getTypographyStyles(theme, 'typography.definitions.consumptionEditorial.display-large')};
        color: ${getColorToken(theme, 'colors.consumption.body.standard.accent')};
        font-size: 80px;
        padding: ${calculateSpacing(2)} ${calculateSpacing(2)} 0;
        margin: 0;
      }
    `}
`;
const ArticlePageMainContent = styled('article').withConfig({
    displayName: 'ArticlePageMainContent'
}) `
  ${({ shouldBlurText }) => shouldBlurText &&
    `
        .grid {
          .body__container {
            p.has-dropcap,
            p.has-dropcap__lead-standard-heading {
              &::first-letter {
                color: inherit;
              }
            }
          }
        }
      `}
`;
const ArticlePageSplitAdRail = styled(PersistentAside).withConfig({
    displayName: 'ArticlePageSplitAdRail'
}) `
  ${StickyBoxWrapper},
  ${StickyBoxWrapper} > ${StickyBoxPrimary} {
    height: 100%;
  }

  > aside > ${StickyBoxWrapper} {
    position: static;
  }
`;
const ArticlePageSplitAdRailContent = styled('div').withConfig({
    displayName: 'ArticlePageSplitAdRailContent'
}) `
  display: flex;
  flex-direction: column;
  height: 100%;

  ${StickyBoxWrapper} {
    margin-bottom: 0;
  }

  > div {
    flex: 1;
  }
`;
const ArticlePageSplitAdRailTop = styled('div').withConfig({
    displayName: 'ArticlePageSplitAdRailTop'
}) ``;
const ArticlePageSplitAdRailMiddle = styled('div').withConfig({
    displayName: 'ArticlePageSplitAdRailMiddle'
}) `
  margin-top: 40px;
`;
const ArticlePageSplitAdRailBottom = styled('div').withConfig({
    displayName: 'ArticlePageSplitAdRailBottom'
}) `
  margin-top: 40px;
`;
const ArticlePageBodyGridContainer = styled('div').withConfig({
    displayName: 'ArticlePageBodyGridContainer'
}) `
  width: 100%;
`;
const ArticlePageChunksGrid = styled.div.withConfig({
    displayName: 'ArticlePageChunksGrid'
}) `
  ${BodyWrapper} > ${RecircMostPopularWrapper} {
    width: unset;

    ul,
    li {
      margin: unset;
    }
    ${minScreen(BREAKPOINTS.lg)} {
      display: none;
    }
  }
  ${({ adRail }) => !adRail &&
    `
     > ${GridItem} {
      grid-column: 1/ -1;
      ${minScreen(BREAKPOINTS.md)} {
        grid-column: 3 / span 8;
      }
    }`}
  > ${GridItem} {
    margin-bottom: ${calculateSpacing(2)};
  }

  ${({ pageBackgroundTheme }) => pageBackgroundTheme &&
    ` .ad.ad--in-content {
        display: none;
      }
      ${ConsumerMarketingUnitThemedWrapper} {
        margin-top: 2rem;
      }  
    `}
`;
const ArticlePageContentFooterGrid = styled.div.withConfig({
    displayName: 'ArticlePageContentFooterGrid'
}) `
  ${GridItem} {
    grid-column: 1 / -1;
    ${minScreen(BREAKPOINTS.md)} {
      grid-column: 3 / span 8;
    }
    ${({ isNarrow }) => isNarrow &&
    `
         ${minScreen(BREAKPOINTS.md)} {
            grid-column: 4 / span 6;
          }
         `}
  }
`;
const ArticlePageDisclaimerGrid = styled.div.withConfig({
    displayName: 'ArticlePageDisclaimerGrid'
}) `
  ${({ disclaimerPosition }) => disclaimerPosition === 'bottom' &&
    `
      .disclaimer {
        border: none;
      }
    `}
  ${({ adRail }) => !adRail &&
    `
    > ${GridItem} {
      grid-column: 1/ -1;
      ${minScreen(BREAKPOINTS.md)} {
        grid-column: 3 / span 8;
      }
    }`}
`;
const ContentWrapperGrid = styled.div.withConfig({
    displayName: 'ContentWrapperGrid'
}) `
  ${({ isadRail }) => !isadRail &&
    `
    > ${GridItem} {
      grid-column: 1/ -1;
      ${minScreen(BREAKPOINTS.md)} {
        grid-column: 3 / span 8;
      }
    }`}
`;
const LinkStackArticlePage = styled(LinkStack).withConfig({
    displayName: 'LinkStackArticlePage'
}) `
  margin: 48px 0;
  padding-bottom: 0;

  ${SectionTitleHed} {
    margin: 0;
  }

  ${LinkStackContent} > ul {
    margin-left: 0;
    padding-left: 0;
  }
`;
const ArticlePageIssueDate = styled(BaseText).withConfig({
    displayName: 'ArticlePageIssueDate'
}) `
  display: flex;
  justify-content: center;
  padding-bottom: ${calculateSpacing(4)};
  text-align: center;
`;
ArticlePageIssueDate.defaultProps = {
    as: 'span',
    colorToken: 'colors.consumption.body.standard.body-deemphasized',
    typeIdentity: 'typography.definitions.consumptionEditorial.description-feature'
};
module.exports = {
    ArticlePageBase,
    ArticlePageGlobalStyle,
    ArticlePageLedeBackground,
    ArticlePageContentBackGround,
    ArticlePageChunks,
    ArticlePageBodyMobileTruncatedBtn,
    ArticlePageChunksContent,
    ArticlePageMainContent,
    ArticlePageDisclaimer,
    ArticlePageSplitAdRail,
    ArticlePageSplitAdRailContent,
    ArticlePageSplitAdRailTop,
    ArticlePageSplitAdRailMiddle,
    ArticlePageSplitAdRailBottom,
    ArticlePageBodyGridContainer,
    ArticlePageChunksGrid,
    ArticlePageContentFooterGrid,
    ArticlePageDisclaimerGrid,
    ArticlePageIssueDate,
    ContentWrapperGrid,
    LinkStackArticlePage,
    MobileRecircMostPopular,
    PaywallInlineBarrierWithWrapperGrid
};
//# sourceMappingURL=styles.js.map

/***/ })

}]);