(globalThis["webpackChunkverso"] = globalThis["webpackChunkverso"] || []).push([[6667],{

/***/ 93977:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const { useIntl } = __webpack_require__(46984);
const { TrackComponentChannel } = __webpack_require__(78788);
const { HiddenCheckbox, Overlay, Title, Text, Logo, DefaultLogo, AgeGateButton: Button } = __webpack_require__(6591);
const { AGE_GATE_ACCEPT, AGE_GATE_COOKIE_KEY } = __webpack_require__(90511);
const { hasContentWarnings, acceptAgeGatePrompt } = __webpack_require__(97288);
const { getCookie } = __webpack_require__(56892);
const translations = (__webpack_require__(67385)/* ["default"] */ .A);
const handleAcceptClick = (setShowAgeGate, cookieExpirationInDays) => {
    setShowAgeGate(false);
    acceptAgeGatePrompt(cookieExpirationInDays);
};
/**
 * AgeGate component
 *
 * @param {string} props.hed - Overlay title
 * @param {string} props.dek - Overlay text
 * @param {string} props.acceptLabel - Accept button label
 * @param {string} props.declineLabel - Decline button label
 * @param {number} props.cookieExpirationInDays - Time to live for age gate cookie (in days)
 * @param {object} props.content - Content item: article, gallery, etc
 * @param {Array} props.content.contentWarnings - List of content warning categories on the current piece of content
 * @param {Array} props.brandContentWarnings - List of content warning slugs for the current brand which should trigger Age Gate
 *
 * @returns {ReactElement} <div>
 */
const AgeGate = ({ hed, dek, acceptLabel, declineLabel, logo, content, cookieExpirationInDays, brandContentWarnings = [
    'sexual_content',
    'drug_content',
    'death_content',
    'alcohol_content'
] }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'AgeGate'
        });
    }, []);
    const { useState, useEffect } = React;
    const { formatMessage } = useIntl();
    const [showAgeGate, setShowAgeGate] = useState(false);
    useEffect(() => {
        const hasUserAcceptedPrompt = getCookie(AGE_GATE_COOKIE_KEY) === AGE_GATE_ACCEPT;
        const shouldShowAgeGate = !hasUserAcceptedPrompt &&
            hasContentWarnings({
                content,
                brandContentWarnings
            });
        setShowAgeGate(shouldShowAgeGate);
    }, [content, brandContentWarnings]);
    if (!showAgeGate) {
        return null;
    }
    const dekText = dek ?? formatMessage(translations.ageGateDekText);
    return (React.createElement(React.Fragment, null,
        React.createElement(HiddenCheckbox, { id: "age-gate-check" }),
        React.createElement(Overlay, { id: "age-gate-overlay", role: "dialog", "aria-labelledby": "age-gate-title", "aria-describedby": "age-gate-description" },
            logo ? React.createElement(Logo, { src: logo, alt: hed }) : React.createElement(DefaultLogo, null),
            React.createElement(Title, { as: "h2", id: "age-gate-title" }, hed ?? formatMessage(translations.ageGateHedText)),
            dekText && React.createElement(Text, { id: "age-gate-description" }, dekText),
            React.createElement("label", { htmlFor: "age-gate-check", key: "age-gate-label-accept" },
                React.createElement(Button, { inputKind: "link", onClickHandler: () => handleAcceptClick(setShowAgeGate, cookieExpirationInDays), key: "age-gate-button-accept", dataAttrs: { 'data-test-id': `age-gate-button-accept` }, label: acceptLabel || formatMessage(translations.ageGateAcceptLabel) })),
            React.createElement(Button, { href: "/", inputKind: "link", key: "age-gate-button-decline", dataAttrs: { 'data-test-id': `age-gate-button-decline` }, label: declineLabel || formatMessage(translations.ageGateDeclineLabel) }))));
};
AgeGate.displayName = 'AgeGate';
AgeGate.propTypes = {
    acceptLabel: PropTypes.string,
    brandContentWarnings: PropTypes.array,
    content: PropTypes.object.isRequired,
    cookieExpirationInDays: PropTypes.number,
    declineLabel: PropTypes.string,
    dek: PropTypes.string,
    hed: PropTypes.string,
    logo: PropTypes.string
};
module.exports = AgeGate;
//# sourceMappingURL=AgeGate.js.map

/***/ }),

/***/ 90511:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AGE_GATE_COOKIE_EXPIRATION_IN_DAYS = exports.AGE_GATE_COOKIE_KEY = exports.AGE_GATE_ACCEPT = void 0;
exports.AGE_GATE_ACCEPT = 'accept';
exports.AGE_GATE_COOKIE_KEY = 'ageGate';
exports.AGE_GATE_COOKIE_EXPIRATION_IN_DAYS = 28;
//# sourceMappingURL=config.js.map

/***/ }),

/***/ 92989:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { asConfiguredComponent } = __webpack_require__(12892);
const AgeGate = __webpack_require__(93977);
module.exports = asConfiguredComponent(AgeGate, 'AgeGate');
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 6591:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AgeGateButton = exports.Text = exports.Title = exports.Logo = exports.DefaultLogo = exports.Overlay = exports.HiddenCheckbox = void 0;
const styled_components_1 = __importDefault(__webpack_require__(92168));
const breakpoints_1 = __webpack_require__(99906);
const utils_1 = __webpack_require__(26865);
const standard_1 = __importDefault(__webpack_require__(97504));
const base_1 = __webpack_require__(76955);
const button_1 = __importDefault(__webpack_require__(73730));
exports.HiddenCheckbox = styled_components_1.default.input.withConfig({
    displayName: 'AgeGateCheckbox'
}) ``;
exports.HiddenCheckbox.defaultProps = {
    hidden: true,
    type: 'checkbox'
};
exports.Overlay = styled_components_1.default.div.withConfig({ displayName: 'AgeGateOverlay' }) `
  display: flex;
  position: fixed;
  top: 0;
  left: 0;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  background: ${(0, utils_1.getColorToken)('colors.consumption.lead.inverted.background')};
  padding: 0 1rem;
  width: 100%;
  height: 100%;
  text-align: center;

  ${exports.HiddenCheckbox}:checked ~ & {
    display: none;
  }

  @media (min-width: ${breakpoints_1.minThresholds.lg}px) {
    padding: 0 10rem;
  }

  @media (min-width: ${breakpoints_1.minThresholds.xl}px) {
    padding: 0 20rem;
  }
`;
exports.DefaultLogo = (0, styled_components_1.default)(standard_1.default.AgeGate).withConfig({
    displayName: 'AgeGateDefaultLogo'
}) `
  margin: 0 0 ${(0, utils_1.calculateSpacing)(3)};
  fill: ${({ theme }) => (0, utils_1.getColorToken)(theme, 'colors.consumption.lead.inverted.heading')};
  width: 96px;
  height: 96px;

  path:first-of-type {
    fill: ${({ theme }) => (0, utils_1.getColorToken)(theme, 'colors.consumption.lead.inverted.accent')};
  }
`;
exports.Logo = styled_components_1.default.img.withConfig({ displayName: 'AgeGateLogo' }) `
  margin: 0 0 ${(0, utils_1.calculateSpacing)(3)};
  width: 96px;
  height: 96px;
`;
exports.Title = (0, styled_components_1.default)(base_1.BaseText).withConfig({
    displayName: 'AgeGateTitle'
}) `
  margin: 0 0 ${(0, utils_1.calculateSpacing)(2)};

  & + label,
  & + button {
    margin-top: ${(0, utils_1.calculateSpacing)(2)};
  }
`;
exports.Title.defaultProps = {
    colorToken: 'colors.consumption.lead.inverted.heading',
    typeIdentity: 'typography.definitions.consumptionEditorial.hed-bulletin'
};
exports.Text = (0, styled_components_1.default)(base_1.BaseText).withConfig({ displayName: 'AgeGateText' }) `
  margin: 0 0 ${(0, utils_1.calculateSpacing)(4)};
`;
exports.Text.defaultProps = {
    colorToken: 'colors.consumption.lead.inverted.heading',
    typeIdentity: 'typography.definitions.consumptionEditorial.description-core'
};
/**
 * @type {Button}
 */
exports.AgeGateButton = (0, styled_components_1.default)(button_1.default.Primary).withConfig({
    as: 'a',
    displayName: 'AgeGateButton'
}) `
  margin: 0 0 ${(0, utils_1.calculateSpacing)(2)};
`;
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 67385:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    ageGateHedText: {
        id: 'AgeGate.HedText',
        defaultMessage: 'Are you 18 or over?',
        description: 'Age Gate title'
    },
    ageGateDekText: {
        id: 'AgeGate.DekText',
        defaultMessage: 'This material is intended for people over the age of 18',
        description: 'Age Gate description'
    },
    ageGateAcceptLabel: {
        id: 'AgeGate.AcceptLabel',
        defaultMessage: 'I am 18+',
        description: 'Age Gate accept button label'
    },
    ageGateDeclineLabel: {
        id: 'AgeGate.DeclineLabel',
        defaultMessage: "I'm under 18",
        description: 'Age Gate decline button label'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 97288:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.acceptAgeGatePrompt = exports.hasContentWarnings = void 0;
const config_1 = __webpack_require__(90511);
const { createCookie } = __webpack_require__(56892);
const MS_IN_A_DAY = 1000 * 60 * 60 * 24;
const hasContentWarnings = ({ content, brandContentWarnings } = {}) => {
    const { contentWarnings } = content || {};
    const hasContentWarning = brandContentWarnings?.some((brandContentWarning) => contentWarnings?.some((contentWarning) => contentWarning.slug === brandContentWarning));
    return Boolean(hasContentWarning);
};
exports.hasContentWarnings = hasContentWarnings;
const acceptAgeGatePrompt = (cookieExpirationInDays) => {
    document.cookie = createCookie(config_1.AGE_GATE_COOKIE_KEY, config_1.AGE_GATE_ACCEPT, {
        expirationInMs: (cookieExpirationInDays || config_1.AGE_GATE_COOKIE_EXPIRATION_IN_DAYS) *
            MS_IN_A_DAY,
        path: '/'
    });
};
exports.acceptAgeGatePrompt = acceptAgeGatePrompt;
//# sourceMappingURL=utils.js.map

/***/ }),

/***/ 56828:
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
exports.OneCover = void 0;
const react_1 = __importStar(__webpack_require__(96540));
const styled_components_1 = __webpack_require__(92168);
const error_boundary_1 = __importDefault(__webpack_require__(48496));
const styles_1 = __webpack_require__(56178);
const map_sources_to_segmented_sources_1 = __webpack_require__(52009);
const hooks_1 = __webpack_require__(43098);
const enums_1 = __webpack_require__(87692);
const types_1 = __webpack_require__(76066);
// eslint-disable-next-line complexity
const OneCover = ({ oneCoverContent, oneCoverConfig }) => {
    const { dangerousHed: hed, dangerousDek: dek, lede = {
        altText: '',
        caption: '',
        credit: '',
        sources: {}
    }, rubric, publishDate, contributors } = oneCoverContent ?? {};
    const { controls, alignment = types_1.Alignment, variation = enums_1.OneCoverVariation.ASSET_TOP, fullBleed } = oneCoverConfig ?? {};
    const usedVariation = lede ? variation : enums_1.OneCoverVariation.NO_ASSET;
    const { hideRubric = false, hideHed = false, hideDek = false, hideBylines = false, hidePublishDate = false } = controls ?? {};
    const oneCoverRef = (0, react_1.useRef)(null);
    (0, hooks_1.useSetOneCoverHeight)(oneCoverRef, usedVariation);
    // segmentedSources are required renditions to display the lede image by ResponsiveAsset
    const segmentedSources = lede?.sources
        ? (0, map_sources_to_segmented_sources_1.mapSourcesToSegmentedSources)(lede.sources)
        : null;
    // Check if caption has content to prevent layout shift
    const hasCaptionContent = Boolean(lede && (lede.caption || lede.credit));
    const hasImage = Boolean(lede && usedVariation !== enums_1.OneCoverVariation.NO_ASSET);
    try {
        return (react_1.default.createElement(error_boundary_1.default, null,
            react_1.default.createElement(styled_components_1.ThemeProvider, { theme: { oneCoverTheme: getOneCoverTheme(variation) } },
                react_1.default.createElement(styles_1.OneCoverWrapper, { ref: oneCoverRef, variation: usedVariation, alignment: alignment, fullBleed: fullBleed },
                    react_1.default.createElement(styles_1.OneCoverTextWrapper, null,
                        !hideRubric && rubric && (react_1.default.createElement(styles_1.OneCoverRubric, { dangerouslySetInnerHTML: { __html: rubric.name || '' } })),
                        !hideHed && hed && (react_1.default.createElement(styles_1.OneCoverHed, { dangerouslySetInnerHTML: { __html: hed } })),
                        !hideDek && dek && (react_1.default.createElement(styles_1.OneCoverDek, { dangerouslySetInnerHTML: { __html: dek } })),
                        !hideBylines && (react_1.default.createElement(styles_1.OneCoverBylines, { contributors: contributors, bylineVariation: usedVariation === enums_1.OneCoverVariation.ASSET_OVERLAY
                                ? 'Inverted'
                                : undefined })),
                        !hidePublishDate && publishDate && (react_1.default.createElement(styles_1.OneCoverPublishDate, null, publishDate))),
                    hasImage && lede && (react_1.default.createElement(react_1.default.Fragment, null,
                        react_1.default.createElement(styles_1.OneCoverLedeWrapper, null,
                            react_1.default.createElement(styles_1.OneCoverLede, { segmentedSources: segmentedSources, ...lede })),
                        hasCaptionContent && (react_1.default.createElement(styles_1.OneCoverCaptionWrapper, null,
                            lede.caption && (react_1.default.createElement(styles_1.OneCoverLedeCaptionText, { dangerouslySetInnerHTML: { __html: lede.caption } })),
                            lede.credit && (react_1.default.createElement(styles_1.OneCoverLedeCaptionCredit, { dangerouslySetInnerHTML: { __html: lede.credit } }))))))))));
    }
    catch (error) {
        console.error('[OneCover] Caught error:', error);
        return react_1.default.createElement(react_1.default.Fragment, null);
    }
};
exports.OneCover = OneCover;
function getOneCoverTheme(variation) {
    switch (variation) {
        case enums_1.OneCoverVariation.ASSET_OVERLAY:
            return enums_1.OneCoverTheme.INVERTED;
        default:
            return enums_1.OneCoverTheme.STANDARD;
    }
}
//# sourceMappingURL=OneCover.js.map

/***/ }),

/***/ 87692:
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OneCoverTheme = exports.JustifyContent = exports.TextAlign = exports.OneCoverVariation = void 0;
var OneCoverVariation;
(function (OneCoverVariation) {
    OneCoverVariation["ASSET_TOP"] = "AssetTop";
    OneCoverVariation["ASSET_BOTTOM"] = "AssetBottom";
    OneCoverVariation["ASSET_LEFT"] = "AssetLeft";
    OneCoverVariation["ASSET_RIGHT"] = "AssetRight";
    OneCoverVariation["ASSET_OVERLAY"] = "AssetOverlay";
    OneCoverVariation["NO_ASSET"] = "NoAsset";
})(OneCoverVariation = exports.OneCoverVariation || (exports.OneCoverVariation = {}));
var TextAlign;
(function (TextAlign) {
    TextAlign["LEFT"] = "left";
    TextAlign["CENTER"] = "center";
    TextAlign["RIGHT"] = "right";
})(TextAlign = exports.TextAlign || (exports.TextAlign = {}));
var JustifyContent;
(function (JustifyContent) {
    JustifyContent["TOP"] = "start";
    JustifyContent["MIDDLE"] = "center";
    JustifyContent["BOTTOM"] = "end";
})(JustifyContent = exports.JustifyContent || (exports.JustifyContent = {}));
var OneCoverTheme;
(function (OneCoverTheme) {
    OneCoverTheme["STANDARD"] = "standard";
    OneCoverTheme["INVERTED"] = "inverted";
})(OneCoverTheme = exports.OneCoverTheme || (exports.OneCoverTheme = {}));
//# sourceMappingURL=enums.js.map

/***/ }),

/***/ 43098:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.useSetOneCoverHeight = void 0;
const react_1 = __webpack_require__(96540);
const breakpoints_1 = __importDefault(__webpack_require__(55058));
const useSetOneCoverHeight = (coverRef, variation) => {
    (0, react_1.useLayoutEffect)(() => {
        const isClient = "object" !== 'undefined';
        if (!isClient)
            return () => { };
        if (!coverRef.current)
            return () => { };
        const isLargeScreen = window.innerWidth >= breakpoints_1.default.minThresholds.xl;
        if (!isLargeScreen)
            return () => { };
        const validVariation = ['AssetLeft', 'AssetRight'].includes(variation);
        if (!validVariation)
            return () => { };
        const calculateHeight = () => {
            const navElement = document.querySelector('header');
            if (navElement && coverRef.current) {
                const height = window.innerHeight - navElement.getBoundingClientRect().height;
                coverRef.current.style.height = `${height}px`;
            }
        };
        // Initial sizing
        calculateHeight();
        // Resize handler
        const handleResize = () => {
            if (window.innerWidth >= breakpoints_1.default.minThresholds.xl) {
                calculateHeight();
            }
        };
        window.addEventListener('resize', handleResize);
        // Cleanup function
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [variation, coverRef]);
};
exports.useSetOneCoverHeight = useSetOneCoverHeight;
//# sourceMappingURL=hooks.js.map

/***/ }),

/***/ 69630:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OneCover = void 0;
var OneCover_1 = __webpack_require__(56828);
Object.defineProperty(exports, "OneCover", ({ enumerable: true, get: function () { return OneCover_1.OneCover; } }));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 56178:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OneCoverBylines = exports.OneCoverLedeCaptionCredit = exports.OneCoverLedeCaptionText = exports.OneCoverLede = exports.OneCoverLedeWrapper = exports.OneCoverRubric = exports.OneCoverDek = exports.OneCoverHed = exports.OneCoverPublishDate = exports.OneCoverCaptionWrapper = exports.OneCoverTextWrapper = exports.OneCoverWrapper = void 0;
const styled_components_1 = __importDefault(__webpack_require__(92168));
const responsive_asset_1 = __importDefault(__webpack_require__(73275));
const utils_1 = __webpack_require__(26865);
const constants_1 = __webpack_require__(96472);
const bylines_1 = __importDefault(__webpack_require__(52540));
const styles_1 = __webpack_require__(7228);
const variations_1 = __webpack_require__(18470);
const { getTypographyStyles, getColorToken, calculateSpacing } = __webpack_require__(26865);
exports.OneCoverWrapper = styled_components_1.default.div.withConfig({
    displayName: 'OneCoverWrapper'
}) `
  a {
    color: ${({ theme }) => getColorToken(`colors.consumption.lead.${theme.oneCoverTheme}.link`)};
  }
  a:hover {
    color: ${({ theme }) => getColorToken(`colors.consumption.lead.${theme.oneCoverTheme}.link-hover`)};
  }

  text-align: center;

  /* CLS fix: Prevent layout containment */
  contain: layout;

  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.xl)} {
    display: grid;
    width: 100%;
  }
  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.lg)} {
    height: 100vh;
  }
  min-height: fit-content;
  max-height: fit-content;

  ${(props) => variations_1.VARIATION_MAP[props.variation] &&
    variations_1.VARIATION_MAP[props.variation]({
        alignment: props.alignment,
        fullBleed: props.fullBleed
    })};
`;
exports.OneCoverTextWrapper = styled_components_1.default.div.withConfig({
    displayName: 'OneCoverTextWrapper'
}) `
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: ${calculateSpacing(3)};

  grid-area: text-wrapper;

  /* CLS fix: Prevent layout shifts */
  contain: layout;

  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.xl)} {
    padding: 3rem;
  }
`;
exports.OneCoverCaptionWrapper = styled_components_1.default.div.withConfig({
    displayName: 'OneCoverCaptionWrapper'
}) `
  grid-area: caption-wrapper;
  text-align: left;
  padding: 1rem 1.5rem 0 1.5rem;
  border-top: 1px solid
    ${getColorToken('colors.consumption.lead.standard.divider')};

  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.lg)} {
    padding: 1rem 3rem 0 3rem;
  }
`;
exports.OneCoverPublishDate = styled_components_1.default.time.withConfig({
    displayName: 'OneCoverPublishDate'
}) `
  width: 100%;

  ${getTypographyStyles('typography.definitions.globalEditorial.context-tertiary')}
`;
exports.OneCoverHed = styled_components_1.default.h1.withConfig({
    displayName: 'OneCoverHed'
}) `
  padding: 1rem 0;
  margin: 0;
  width: 100%;

  ${getTypographyStyles('typography.definitions.consumptionEditorial.hed-standard')}

  color: ${({ theme }) => getColorToken(`colors.consumption.lead.${theme.oneCoverTheme}.heading`)};
`;
exports.OneCoverDek = styled_components_1.default.p.withConfig({
    displayName: 'OneCoverDek'
}) `
  padding-bottom: 1rem;
  margin: 0;
  width: 100%;

  ${getTypographyStyles('typography.definitions.consumptionEditorial.description-core')}

  color: ${({ theme }) => getColorToken(`colors.consumption.lead.${theme.oneCoverTheme}.description`)};
`;
exports.OneCoverRubric = styled_components_1.default.span.withConfig({
    displayName: 'OneCoverRubric'
}) `
  width: 100%;

  ${getTypographyStyles('typography.definitions.globalEditorial.context-primary')}

  color: ${({ theme }) => getColorToken(`colors.consumption.lead.${theme.oneCoverTheme}.context-signature`)};
`;
exports.OneCoverLedeWrapper = styled_components_1.default.div.withConfig({
    displayName: 'OneCoverLedeWrapper'
}) `
  grid-area: lede-wrapper;
`;
exports.OneCoverLede = (0, styled_components_1.default)(responsive_asset_1.default).withConfig({
    displayName: 'OneCoverLede'
}) `
  img {
    width: 100%;
  }
  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.lg)} {
    height: 100%;
    ${styles_1.ResponsiveImageContainer} {
      height: 100%;
      object-fit: cover;
    }
  }
`;
exports.OneCoverLedeCaptionText = styled_components_1.default.div.withConfig({
    displayName: 'OneCoverCaptionText'
}) `
  ${getTypographyStyles('typography.definitions.globalEditorial.context-secondary')}
`;
exports.OneCoverLedeCaptionCredit = styled_components_1.default.div.withConfig({
    displayName: 'OneCoverCaptionCredit'
}) `
  ${getTypographyStyles('typography.definitions.globalEditorial.context-tertiary')}

  color: ${({ theme }) => getColorToken(`colors.consumption.body.${theme.oneCoverTheme}.body-deemphasized`)};
`;
exports.OneCoverBylines = (0, styled_components_1.default)(bylines_1.default).withConfig({
    displayName: 'OneCoverBylines'
}) `
  padding-bottom: 0.5rem;
  width: 100%;
`;
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 49299:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OneCoverPropTypes = exports.OneCoverContentPropTypes = exports.OneCoverConfigPropTypes = void 0;
const prop_types_1 = __importDefault(__webpack_require__(5556));
exports.OneCoverConfigPropTypes = prop_types_1.default.shape({
    variation: prop_types_1.default.string,
    alignment: prop_types_1.default.object,
    controls: prop_types_1.default.shape({
        hideRubric: prop_types_1.default.bool,
        hideHed: prop_types_1.default.bool,
        hideDek: prop_types_1.default.bool,
        hideBylines: prop_types_1.default.bool,
        hidePublishDate: prop_types_1.default.bool
    }),
    fullBleed: prop_types_1.default.bool
});
exports.OneCoverContentPropTypes = prop_types_1.default.object;
exports.OneCoverPropTypes = {
    oneCoverContent: exports.OneCoverContentPropTypes,
    oneCoverConfig: exports.OneCoverConfigPropTypes
};
//# sourceMappingURL=types.js.map

/***/ }),

/***/ 18470:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VARIATION_MAP = exports.AssetOverlay = exports.AssetRight = exports.AssetLeft = exports.AssetBottom = exports.NoAsset = exports.AssetTop = void 0;
const styled_components_1 = __webpack_require__(92168);
const utils_1 = __webpack_require__(26865);
const constants_1 = __webpack_require__(96472);
const styles_1 = __webpack_require__(56178);
const styles_2 = __webpack_require__(15384);
const styles_3 = __webpack_require__(74423);
const enums_1 = __webpack_require__(87692);
// helper functions
const forceLeft = () => (0, styled_components_1.css) `
  text-align: left;

  ${styles_1.OneCoverBylines} {
    > * {
      text-align: left;
    }
  }

  ${styles_3.BylineWrapper} {
    text-align: left;
  }

  ${styles_2.BylinesWrapper} {
    text-align: left;
  }

  ${styles_1.OneCoverPublishDate}, ${styles_1.OneCoverRubric} {
    text-align: left;
  }
`;
const forceRight = () => (0, styled_components_1.css) `
  text-align: right;

  ${styles_1.OneCoverBylines} {
    text-align: right;

    > * {
      text-align: right;
    }
  }

  ${styles_3.BylineWrapper} {
    text-align: right;
  }

  ${styles_2.BylinesWrapper} {
    text-align: right;
  }

  ${styles_1.OneCoverPublishDate}, ${styles_1.OneCoverRubric} {
    text-align: right;

    > * {
      text-align: right;
    }
  }
`;
// variations
const textAlign = (textAlign) => {
    switch (textAlign) {
        case 'right':
            return forceRight();
        case 'left':
            return forceLeft();
        case 'center':
            return 'text-align: center;';
        default:
            return '';
    }
};
const mdCenter = (alignment) => alignment.textAlign === 'center'
    ? (0, styled_components_1.css) `
        ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.md)} {
          ${styles_1.OneCoverTextWrapper} {
            max-width: calc((100% / 12) * 6);
            margin-left: auto;
            margin-right: auto;
          }
        }
      `
    : '';
const AssetTop = (props) => (0, styled_components_1.css) `
  ${textAlign(props.alignment.textAlign)}
  ${mdCenter(props.alignment)}

  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.xl)} {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      'lede-wrapper'
      'caption-wrapper'
      'text-wrapper';

    ${styles_1.OneCoverTextWrapper} {
      padding: 2.5rem 3rem 0 3rem;
    }

    ${styles_1.OneCoverLedeWrapper} {
      height: auto;
    }
  }
`;
exports.AssetTop = AssetTop;
const NoAsset = (props) => (0, styled_components_1.css) `
  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.lg)} {
    height: auto;
  }
  ${textAlign(props.alignment.textAlign)}
  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.xl)} {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas: 'text-wrapper';
    ${styles_1.OneCoverTextWrapper} {
      padding: 2.5rem 3rem 0 3rem;
    }
  }
`;
exports.NoAsset = NoAsset;
const AssetBottom = (props) => (0, styled_components_1.css) `
  ${textAlign(props.alignment.textAlign)}
  ${mdCenter(props.alignment)}

  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.xl)} {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    grid-template-areas:
      'text-wrapper'
      'lede-wrapper'
      'caption-wrapper';

    ${styles_1.OneCoverTextWrapper} {
      padding: 0 3rem 2.5rem 3rem;
    }

    ${styles_1.OneCoverLedeWrapper} {
      height: auto;
      padding: 0;
    }
  }
`;
exports.AssetBottom = AssetBottom;
const AssetLeft = (props) => (0, styled_components_1.css) `
  ${textAlign(props.alignment.textAlign)}
  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.xl)} {
    ${({ fullBleed }) => !fullBleed &&
    `
      ${styles_1.OneCoverLedeWrapper} {
        padding: 3rem 0 3rem 3rem;
      }
    `}

    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 1fr max-content;
    grid-template-areas:
      'lede-wrapper text-wrapper'
      'caption-wrapper caption-wrapper';

    ${styles_1.OneCoverTextWrapper} {
      justify-content: center;
    }
  }
`;
exports.AssetLeft = AssetLeft;
const AssetRight = (props) => (0, styled_components_1.css) `
  ${textAlign(props.alignment.textAlign)}
  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.xl)} {
    ${({ fullBleed }) => !fullBleed &&
    `
      ${styles_1.OneCoverLedeWrapper} {
        padding: 3rem 3rem 3rem 0;
      }
    `}

    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: 1fr max-content;
    grid-template-areas:
      'text-wrapper lede-wrapper'
      'caption-wrapper caption-wrapper';

    ${styles_1.OneCoverTextWrapper} {
      justify-content: center;
    }
  }
`;
exports.AssetRight = AssetRight;
const AssetOverlay = (props) => (0, styled_components_1.css) `
  ${textAlign(props.alignment.textAlign)}
  display: grid;
  grid-template-rows: auto auto auto;
  grid-template-columns: 1fr;

  ${styles_1.OneCoverLedeWrapper} {
    height: auto;
    grid-row: 1;
    grid-column: 1;
    text-align: center;
  }

  ${styles_1.OneCoverTextWrapper} {
    background: linear-gradient(
      ${({ alignment }) => getOverlayDirection(alignment.justifyContent)},
      rgba(0, 0, 0, 0.85) 0px,
      transparent 100%
    );
    justify-content: ${props.alignment.justifyContent ?? enums_1.JustifyContent.MIDDLE};
    grid-row: 1;
    grid-column: 1;
    z-index: 10;
  }

  ${styles_1.OneCoverCaptionWrapper} {
    grid-row: 2;
    grid-column: 1;
  }
`;
exports.AssetOverlay = AssetOverlay;
function getOverlayDirection(justifyContent) {
    switch (justifyContent) {
        case enums_1.JustifyContent.BOTTOM:
        case enums_1.JustifyContent.MIDDLE:
            return 'to top';
        case enums_1.JustifyContent.TOP:
            return 'to bottom';
        default:
            return '';
    }
}
// variation mapping
exports.VARIATION_MAP = {
    AssetTop: exports.AssetTop,
    AssetBottom: exports.AssetBottom,
    AssetLeft: exports.AssetLeft,
    AssetRight: exports.AssetRight,
    AssetOverlay: exports.AssetOverlay,
    NoAsset: exports.NoAsset
};
//# sourceMappingURL=variations.js.map

/***/ }),

/***/ 97071:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const { useIntl } = __webpack_require__(46984);
const Button = __webpack_require__(73730);
const SummaryItem = __webpack_require__(74992);
const translations = (__webpack_require__(50518)/* ["default"] */ .A);
const { componentTracking } = __webpack_require__(90090);
const { useOnAdFilled } = __webpack_require__(1184);
const { asConfiguredComponent } = __webpack_require__(12892);
const { TrackComponentChannel } = __webpack_require__(78788);
const { SummaryCollectionSplitColumnsWrapper, SummaryCollectionSplitColumnsItems, SummaryCollectionSplitColumnsRecsWrapper, SummaryCollectionSplitColumnsItem } = __webpack_require__(35516);
/**
 * SummaryCollectionSplitColumns component
 *
 * @param {object} props - React props
 * @param {string} [props.className] - Optional top-level class to add
 * @param {string} [props.dangerousHed] - Optional hed for section title
 * @param {Array<SummaryItem.propTypes>} props.guideItem - Item that displays with a divider separating it from recommended items
 * @param {bool} [props.hasBackgroundColor] - Optional. Enable or disable background color
 * @param {bool} [props.hasBorderItem] - Optional. Enable or disable border under SummaryItem
 * @param {bool} [props.hasExtraRubricSpace] - Optional. Enable or disable the extra spacing b/w rubric and hed
 * @param {bool} [props.hasLessBottomSpace] - Optional. Enable or disable the bottom padding
 * @param {bool} [props.hasTighterBylineSpacing] - Optional. Enable or disable the extra spacing b/w dek and byline
 * @param {string} [props.itemHedTag] - Optional hed tag for item
 * @param {string} [props.location] - Optional string to determine location for view all button and guideItem dangerousHed
 * @param {object} props.recommendedItems - Items to display side by side with button clickout
 * @param {Array<SummaryItem.propTypes>} props.recommendedItems.items - Items to display side by side with button clickout
 * @param {string} props.recommendedItems.recommendedType - String to determine recommendation type (hotels, bars, etc)
 * @param {string} props.recommendedItems.recommendedClickout - String to determine clickout for viewAllButton
 * @param {number} [props.recommendedItemCount] - Optional integer to determine how many recommended items to display
 * @param {bool} [props.shouldHideBylines] - Optional boolean to hide bylines
 * @param {bool} [props.shouldHideDangerousDek] - Optional boolean to hide dangerousDek
 * @param {string} [props.shouldEnableBundleComponentAnalytics] - Optional feature flag to append data-section-title attribute for analytics
 * @param {bool} [props.shouldAppendReadMoreLinkForDek] - Optional boolean to append a 'Read More' link in dangerousDek
 * @param {string} [props.summaryItemRubricVariation] - Optional rubric variation to use for the SummaryItem
 * @param {string} [props.trackingNamespace] - Optional override the base namespace of data-section-title for component tracking
 * @param {string} [props.variations] - Variation properties used in rendering the component
 *
 * @returns {ReactElement} <div>
 */
const SummaryCollectionSplitColumns = ({ className, dangerousHed, guideItem, hasBackgroundColor = true, hasBorderItem = true, hasExtraRubricSpace = false, hasLessBottomSpace = false, hasTighterBylineSpacing = false, itemHedTag, location, recommendedItems, recommendedItemCount = 2, shouldHideDangerousDek = false, shouldAppendReadMoreLinkForDek = true, shouldHideBylines = true, shouldEnableBundleComponentAnalytics, summaryItemRubricVariation, trackingNamespace }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'SummaryCollectionSplitColumns'
        });
    }, []);
    const { formatMessage } = useIntl();
    const { items, recommendedType, recommendedClickout } = recommendedItems;
    const hedTag = itemHedTag || (dangerousHed ? 'h3' : 'h2');
    // only show trending ad slot once request is fulfilled by googletag
    const [shouldShowTrendingAd] = useOnAdFilled('trending-ad');
    return (React.createElement(SummaryCollectionSplitColumnsWrapper, { className: className, "data-testid": "SummaryCollectionSplitColumnsWrapper", hasBackgroundColor: hasBackgroundColor },
        React.createElement(SummaryCollectionSplitColumnsItems, { "data-testid": "SummaryCollectionSplitColumnsItems", showTrendingAd: shouldShowTrendingAd },
            React.createElement(SummaryCollectionSplitColumnsRecsWrapper, null,
                React.createElement("p", null, formatMessage(translations.recommendedTitle, {
                    recommendedType
                })),
                items.slice(0, recommendedItemCount).map((item, index) => {
                    const analyticsDataAttribute = componentTracking.addDataSectionTitleAttribute(shouldEnableBundleComponentAnalytics, trackingNamespace?.item, index);
                    return (React.createElement(React.Fragment, { key: index },
                        React.createElement(SummaryCollectionSplitColumnsItem, { ...item, analyticsDataAttribute: analyticsDataAttribute, variation: "TextBelowImageLeftHasRuleWithDek", hasBorder: hasBorderItem, hedTag: hedTag, key: index, rubricVariation: summaryItemRubricVariation, "data-testid": "SummaryCollectionSplitColumnsItem", shouldHideDangerousDek: shouldHideDangerousDek, shouldAppendReadMoreLinkForDek: shouldAppendReadMoreLinkForDek, shouldHideBylines: shouldHideBylines, hasLessBottomSpace: hasLessBottomSpace, hasExtraRubricSpace: hasExtraRubricSpace })));
                }),
                recommendedClickout && (React.createElement(Button.Utility, { label: formatMessage(translations.viewAllButton, {
                        location,
                        recommendedType
                    }), inputKind: "link", href: recommendedClickout }))),
            React.createElement(SummaryCollectionSplitColumnsItem, { ...guideItem[0], image: guideItem[0].lede, dangerousHed: location
                    ? formatMessage(translations.guideItemHed, { location })
                    : dangerousHed, variation: "TextBelowImageLeftHedAndDek", hasBorder: hasBorderItem, hedTag: hedTag, rubricVariation: summaryItemRubricVariation, "data-testid": "SummaryCollectionSplitColumnsItem", shouldHideBylines: shouldHideBylines, hasTighterBylineSpacing: hasTighterBylineSpacing, hasLessBottomSpace: hasLessBottomSpace, hasExtraRubricSpace: hasExtraRubricSpace }))));
};
SummaryCollectionSplitColumns.propTypes = {
    className: PropTypes.string,
    dangerousHed: PropTypes.string,
    guideItem: PropTypes.arrayOf(PropTypes.shape(SummaryItem.propTypes))
        .isRequired,
    hasBackgroundColor: PropTypes.bool,
    hasBorderItem: PropTypes.bool,
    hasExtraRubricSpace: PropTypes.bool,
    hasLessBottomSpace: PropTypes.bool,
    hasTighterBylineSpacing: PropTypes.bool,
    itemHedTag: PropTypes.string,
    location: PropTypes.string,
    recommendedItemCount: PropTypes.number,
    recommendedItems: PropTypes.shape({
        items: PropTypes.arrayOf(PropTypes.shape(SummaryItem.propTypes)),
        recommendedType: PropTypes.string,
        recommendedClickout: PropTypes.string
    }).isRequired,
    shouldAppendReadMoreLinkForDek: PropTypes.bool,
    shouldEnableBundleComponentAnalytics: PropTypes.bool,
    shouldHideBylines: PropTypes.bool,
    shouldHideDangerousDek: PropTypes.bool,
    summaryItemRubricVariation: PropTypes.string,
    trackingNamespace: PropTypes.object
};
SummaryCollectionSplitColumns.displayName = 'SummaryCollectionSplitColumns';
module.exports = asConfiguredComponent(SummaryCollectionSplitColumns, 'SummaryCollectionSplitColumns');
//# sourceMappingURL=SummaryCollectionSplitColumns.js.map

/***/ }),

/***/ 94136:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(27612);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 35516:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const { default: styled } = __webpack_require__(92168);
const { BylineWrapper, BylinePreamble, BylineName, BylineLink } = __webpack_require__(74423);
const SummaryItem = __webpack_require__(74992);
const { GridItem } = __webpack_require__(40653);
const Grid = __webpack_require__(86659);
const { calculateSpacing, getColorToken, getColorStyles, getTypographyStyles, minScreen, styledProperty } = __webpack_require__(26865);
const { BREAKPOINTS } = __webpack_require__(96472);
const SummaryCollectionSplitColumnsWrapper = styled.div.withConfig({
    displayName: 'SummaryCollectionSplitColumnsWrapper'
}) `
  margin: ${calculateSpacing(4)} 0;
  background-color: ${({ hasBackgroundColor }) => hasBackgroundColor
    ? getColorToken('colors.discovery.body.light.background')
    : 'transparent'};
`;
const disabledBorderSpaceStyling = `
  &:last-child {
    padding-bottom: 0;
    
    ${minScreen(BREAKPOINTS.md)}{
      padding-bottom: ${calculateSpacing(2)};
    }
  }
`;
const SummaryCollectionSplitColumnsItem = styled(({ columnAmount, variation, shouldHideDangerousDek, hasExtraRubricSpace, hasLessBottomSpace, hasTighterBylineSpacing, ...rest }) => {
    const SummaryItemComponent = SummaryItem[variation];
    return React.createElement(SummaryItemComponent, { ...rest });
}).withConfig({ displayName: 'SummaryCollectionSplitColumnsItem' }) `
  ${SummaryCollectionSplitColumnsWrapper} & {
    padding-bottom: ${calculateSpacing(2)};

    ${minScreen(BREAKPOINTS.md)} {
      border-bottom: 0;
    }

    .summary-item__rubric {
      ${getTypographyStyles('typography.definitions.globalEditorial.context-primary')}
      display: block;
      color: ${getColorToken('colors.discovery.body.light.context-signature')};

      ${minScreen(BREAKPOINTS.md)} {
        margin-bottom: ${({ hasExtraRubricSpace }) => hasExtraRubricSpace ? calculateSpacing(1) : calculateSpacing(0.5)};
      }
    }

    .summary-item__hed-link {
      color: ${getColorToken('colors.discovery.body.light.heading')};

      &::after {
        display: none;
      }
    }

    .summary-item__hed {
      ${getTypographyStyles('typography.definitions.discovery.hed-bulletin-primary')}
      margin-bottom: 0;
    }

    .summary-item__dek {
      ${getTypographyStyles('typography.definitions.discovery.description-page')}
      display: ${({ shouldHideDangerousDek }) => shouldHideDangerousDek ? `none` : `block`};
      margin: ${calculateSpacing(2)} 0 ${calculateSpacing(1)};
      color: ${getColorToken('colors.discovery.body.white.description')};
    }

    .summary-item__content {
      padding-bottom: ${({ hasLessBottomSpace }) => hasLessBottomSpace ? calculateSpacing(0) : ''};
    }

    .summary-item__byline {
      margin-top: ${({ hasTighterBylineSpacing }) => hasTighterBylineSpacing ? calculateSpacing(1) : calculateSpacing(2)};

      ${BylineWrapper},
      ${BylinePreamble},
      ${BylineName},
      ${BylineLink} {
        ${getTypographyStyles('typography.definitions.globalEditorial.accreditation-core')}
        color: ${getColorToken('colors.discovery.body.light.accreditation')};
      }

      ${BylineLink}:link {
        color: ${getColorToken('colors.discovery.body.light.accreditation')};
      }
    }

    .summary-item__metadata-secondary {
      margin: ${calculateSpacing(2)} 0 0 0;
    }

    ${styledProperty('hasBorder', false, disabledBorderSpaceStyling)};
  }
`;
const SummaryCollectionSplitColumnsItems = styled(Grid.ThreeUp).withConfig({
    displayName: 'SummaryCollectionSplitColumnsItems'
}) `
  ${GridItem} {
    grid-column: 1 / -1;
    margin-top: ${calculateSpacing(2)};
  }
  ${GridItem}:first-of-type {
    margin: ${calculateSpacing(3)} 0;
    ${minScreen(BREAKPOINTS.md)} {
      grid-column: span 7;
    }
  }
  ${GridItem}:last-of-type {
    ${minScreen(BREAKPOINTS.md)} {
      grid-column: span 5;
      margin: ${calculateSpacing(3)} 0;
    }
  }
`;
const SummaryCollectionSplitColumnsRecsWrapper = styled('div').withConfig({
    displayName: 'SummaryCollectionSplitColumnsRecsWrapper'
}) `
  display: grid;
  grid-column-gap: ${calculateSpacing(3)};
  grid-template-columns: repeat(6, 1fr);
  grid-row-gap: ${calculateSpacing(2)};
  height: 100%;

  ${minScreen(BREAKPOINTS.md)} {
    display: grid;
    grid-template-rows: 5% 75% 20%;
    grid-row-gap: ${calculateSpacing(1)};
    border-right: 1px solid;
    border-color: ${({ theme }) => getColorStyles(theme, 'border-color', 'colors.consumption.body.standard.divider')};
    padding-right: ${calculateSpacing(3)};
  }

  p {
    grid-column: span 6;
    grid-row: 1 / 1;
    align-self: center;
    margin: 0;
    ${({ theme }) => getTypographyStyles(theme, 'typography.definitions.foundation.link-primary')}
  }

  .summary-item {
    display: grid;
    grid-column-gap: 1rem;
    grid-column: span 6;
    grid-template-columns: 40% 60%;
    align-items: center;

    ${minScreen(BREAKPOINTS.sm)} {
      grid-template-columns: 1fr 1fr;
    }

    ${minScreen(BREAKPOINTS.md)} {
      display: unset;
      grid-column: span 3;
      grid-row: 2 / 2;
    }
  }

  .button {
    grid-column: span 6;
    max-height: ${calculateSpacing(6)};
    ${minScreen(BREAKPOINTS.md)} {
      grid-column: 2 / span 4;
      grid-row: 3;
    }
    ${minScreen(BREAKPOINTS.lg)} {
      justify-self: center;
      padding: 0 ${calculateSpacing(6)};
    }
  }
`;
module.exports = {
    SummaryCollectionSplitColumnsWrapper,
    SummaryCollectionSplitColumnsItems,
    SummaryCollectionSplitColumnsRecsWrapper,
    SummaryCollectionSplitColumnsItem
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 50518:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    viewAllButton: {
        id: 'SummaryCollectionSplitColumns.ViewAllButton',
        defaultMessage: `View All {location} {recommendedType}`,
        description: 'button label for view all button'
    },
    guideItemHed: {
        id: 'SummaryCollectionSplitColumns.GuideItemHed',
        defaultMessage: '{location} Travel Guide',
        description: 'dangerousHed for guideItem'
    },
    recommendedTitle: {
        id: 'SummaryCollectionSplitColumns.RecommendedTitle',
        defaultMessage: `Recommended {recommendedType}`,
        description: 'recommended title for recircs'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 27612:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const SummaryCollectionSplitColumns = __webpack_require__(97071);
module.exports = SummaryCollectionSplitColumns;
//# sourceMappingURL=variations.js.map

/***/ }),

/***/ 65315:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const { TrackComponentChannel } = __webpack_require__(78788);
const BeopScript = ({ accountId }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'BeopScript'
        });
    }, []);
    return (React.createElement(React.Fragment, null,
        React.createElement("script", { id: "beop-script", className: "optanon-category-C0004", type: "text/plain", "data-testid": "beop-script", dangerouslySetInnerHTML: {
                __html: `window.beOpAsyncInit = function () {
                      window.BeOpSDK.init({
                        account: '${accountId}'
                      });
                      window.BeOpSDK.watch();
                  };`
            } }),
        React.createElement("script", { id: "beop-sdk", async: true, src: "https://widget.beop.io/sdk.js" })));
};
BeopScript.propTypes = {
    accountId: PropTypes.string.isRequired
};
module.exports = BeopScript;
//# sourceMappingURL=BeopScript.js.map

/***/ }),

/***/ 85508:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const BeopScript = __webpack_require__(65315);
module.exports = {
    BeopScript
};
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 90713:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const ruleSets = __webpack_require__(9599);
const ruleEngine = __webpack_require__(45102);
const { TrackComponentChannel } = __webpack_require__(78788);
/**
 * PaywallCollaborator component - HOC that wraps components which
 * are not paywall components per se, but are components that must
 * collaborate with the paywall to determine their final behavior.
 *
 * @param {object} props - React props
 * @param {ReactElement} props.component - the child component
 * @param {string} props.name - child component name
 * @param {object} props.payment - payment object
 * @param {object} props.paywall - paywall object
 *
 * @returns {ReactElement} child components
 */
const PaywallCollaborator = (props) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'PaywallCollaborator'
        });
    }, []);
    const { component: Component, name, paywall, ...others } = props;
    const ruleSet = ruleSets[paywall.strategy];
    const isPaywallConfigured = paywall.strategy && ruleSet;
    const isComponentRecognized = ruleSet && ruleSet.names.includes(name);
    if (!isPaywallConfigured || !isComponentRecognized) {
        return React.createElement(Component, { ...others });
    }
    return React.createElement(Component, { ...ruleEngine.execute(ruleSet, props) });
};
PaywallCollaborator.propTypes = {
    component: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired,
    payment: PropTypes.object.isRequired,
    paywall: PropTypes.object.isRequired
};
module.exports = PaywallCollaborator;
//# sourceMappingURL=PaywallCollaborator.js.map

/***/ }),

/***/ 81427:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const flow = __webpack_require__(49870);
const PaywallCollaborator = __webpack_require__(90713);
const withArticleTruncation = __webpack_require__(32206);
const withGalleryTruncation = __webpack_require__(72274);
// Store helpers
const { connectDomain } = __webpack_require__(57744);
const { withIncognitoDetection } = __webpack_require__(15356);
const withUser = connectDomain('user');
const withPaywall = connectDomain('paywall');
const withPayment = connectDomain('payment');
const enhance = flow([
    withUser,
    withPayment,
    withPaywall,
    withIncognitoDetection
]);
module.exports = {
    PaywallCollaborator: enhance(PaywallCollaborator),
    withArticleTruncation,
    withGalleryTruncation
};
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 32206:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
/**
 * withArticleTruncation
 *
 * This higher-order component wraps another and truncates its content
 *
 * @param {ReactComponent} Component - Required wrapped component
 * @param {string} name - Required name of the property being passed to the wrapped component
 *
 * @returns {ReactElement} child components
 */
const withArticleTruncation = (Component, name) => {
    const componentName = Component.displayName || Component.name;
    const isAParagraph = (node) => typeof node === 'object' && node[0] === 'p';
    const preceedingParagraphs = (jsonml, index) => jsonml.slice(0, index).filter(isAParagraph).length;
    const truncate = (jsonml, paragraphLimit) => jsonml.filter((_, index) => preceedingParagraphs(jsonml, index) < paragraphLimit);
    /**
     * ArticleTruncation
     *
     * A component that truncates the content of a passed property
     *
     * @param {object} props - Required React Props
     * @param {Array} props.[name] - Required parameter that contains the content
     * @param {object} props.paywall - Required paywall configuration
     * @param {object} props.paywall.gateway - external gateway state for paywall
     * @param {object} props.paywall.gateway.paragraphLimit - number of paragraphs that should remain when an article is truncated
     * @param {bool} props.paywall.gateway.shouldTruncate - flag indicating if the content should be truncated
     * @param {object} props.paywall.paragraphLimit - Required number of paragraphs that should remain when an article is truncated
     * @param {bool} props.shouldTruncate - Required flag indicating if the content should be truncated
     *
     * @returns {ReactElement} child components
     */
    const ArticleTruncation = (props) => {
        const { [name]: content, shouldTruncate, paywall: { gateway = {}, paragraphLimit } = {} } = props;
        const execute = content &&
            (gateway.shouldTruncate || shouldTruncate) &&
            (gateway.paragraphLimit >= 0 || paragraphLimit >= 0);
        return (React.createElement(Component, { ...props, ...{
                [name]: execute
                    ? truncate(content, gateway.paragraphLimit || paragraphLimit)
                    : content
            } }));
    };
    ArticleTruncation.propTypes = {
        [name]: PropTypes.array.isRequired,
        paywall: PropTypes.shape({
            gateway: PropTypes.shape({
                paragraphLimit: PropTypes.number,
                shouldTruncate: PropTypes.bool
            }),
            paragraphLimit: PropTypes.number
        }),
        shouldTruncate: PropTypes.bool
    };
    ArticleTruncation.displayName = `withArticleTruncation(${componentName})`;
    return ArticleTruncation;
};
module.exports = withArticleTruncation;
//# sourceMappingURL=withArticleTruncation.js.map

/***/ }),

/***/ 72274:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
/**
 * withGalleryTruncation
 *
 * This higher-order component wraps another and truncates its content
 *
 * @param {ReactComponent} Component - Required wrapped component
 * @param {string} name - Required name of the property being passed to the wrapped component
 *
 * @returns {ReactElement} child components
 */
const withGalleryTruncation = (Component, name) => {
    const componentName = Component.displayName || Component.name;
    const preceedingSlides = (chunks, slide) => chunks.flat().indexOf(slide);
    const truncate = (chunks, gallerySlideLimit) => chunks
        .map((chunk) => chunk.filter((slide) => preceedingSlides(chunks, slide) < gallerySlideLimit))
        .filter((chunk, index) => chunk.length > 0 || index === 0);
    /**
     * GalleryTruncation
     *
     * A component that truncates the content of a passed property
     *
     * @param {object} props - Required React Props
     * @param {Array} props.[name] - Required parameter that contains the content
     * @param {object} props.paywall - Required paywall configuration
     * @param {object} props.paywall.gateway - external gateway state for paywall
     * @param {object} props.paywall.gateway.gallerySlideLimit - number of slides that should remain when an Gallery is truncated
     * @param {bool} props.paywall.gateway.shouldTruncate - flag indicating if the content should be truncated
     * @param {object} props.paywall.gallerySlideLimit - Required number of slides that should remain when an Gallery is truncated
     * @param {bool} props.shouldTruncate - Required flag indicating if the content should be truncated
     *
     * @returns {ReactElement} child components
     */
    const GalleryTruncation = (props) => {
        const { [name]: content, shouldTruncate, paywall: { gateway = {}, gallerySlideLimit } = {} } = props;
        const execute = content &&
            (gateway.shouldTruncate || shouldTruncate) &&
            (gateway.gallerySlideLimit >= 0 || gallerySlideLimit >= 0);
        return (React.createElement(Component, { ...props, ...{
                [name]: execute
                    ? truncate(content, gateway.gallerySlideLimit || gallerySlideLimit)
                    : content
            } }));
    };
    GalleryTruncation.propTypes = {
        [name]: PropTypes.array.isRequired,
        paywall: PropTypes.shape({
            gateway: PropTypes.shape({
                gallerySlideLimit: PropTypes.number,
                shouldTruncate: PropTypes.bool
            }),
            gallerySlideLimit: PropTypes.number
        }).isRequired,
        shouldTruncate: PropTypes.bool
    };
    GalleryTruncation.displayName = `withGalleryTruncation(${componentName})`;
    return GalleryTruncation;
};
module.exports = withGalleryTruncation;
//# sourceMappingURL=withGalleryTruncation.js.map

/***/ }),

/***/ 70697:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExperimentPlaceholder = exports.renderHeaderOrPlaceholder = void 0;
const react_1 = __importDefault(__webpack_require__(96540));
const styled_components_1 = __importDefault(__webpack_require__(92168));
const loaders_1 = __webpack_require__(62930);
const constants_1 = __webpack_require__(96472);
const utils_1 = __webpack_require__(26865);
/**
 * Renders either the header or an experiment placeholder based on conditions
 * @param {object} props - Component props
 * @param {boolean} props.showExperimentPlaceholder - Controls whether to show experiment placeholder when GrowthBook is not initialized
 * @param {Function} props.renderHeader - Function to render the header component
 * @param {boolean} props.isGBInitialized - Whether GrowthBook is initialized

 */
function renderHeaderOrPlaceholder({ showExperimentPlaceholder, renderHeader, isGBInitialized }) {
    if (!showExperimentPlaceholder) {
        return renderHeader();
    }
    if (!isGBInitialized) {
        return (react_1.default.createElement(exports.ExperimentPlaceholder, null,
            react_1.default.createElement(loaders_1.Circle, null)));
    }
    return renderHeader();
}
exports.renderHeaderOrPlaceholder = renderHeaderOrPlaceholder;
const PlaceholderWrapper = styled_components_1.default.div.withConfig({
    displayName: 'PlaceholderWrapper'
}) `
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  min-height: ${(props) => props.minHeight}px;
  ${(0, utils_1.minScreen)(constants_1.BREAKPOINTS.lg)} {
    min-height: 90vh;
  }
`;
const ExperimentPlaceholder = ({ minHeight = '700', children = null }) => {
    return (react_1.default.createElement(PlaceholderWrapper, { minHeight: minHeight }, children));
};
exports.ExperimentPlaceholder = ExperimentPlaceholder;
//# sourceMappingURL=RenderHeaderOrPlaceholder.js.map

/***/ }),

/***/ 76449:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.renderHeader = void 0;
const react_1 = __importDefault(__webpack_require__(96540));
const one_cover_1 = __webpack_require__(69630);
const content_header_1 = __importDefault(__webpack_require__(69389));
const CONTENT_TYPES = {
    GALLERY: 'gallery',
    ARTICLE: 'article'
};
function renderHeader(headerComponent, props) {
    if (headerComponent === 'OneCover') {
        try {
            const { header, headerProps, oneCover } = props;
            // type gallery has it's content data in header, article in headerProps
            const oneCoverContent = header || headerProps;
            return (react_1.default.createElement(one_cover_1.OneCover, { oneCoverContent: oneCoverContent, oneCoverConfig: oneCover }));
        }
        catch (error) {
            console.error('[OneCover] Caught error:', error);
            return renderHeader('ContentHeader', props);
        }
    }
    const { type } = props;
    switch (type) {
        case CONTENT_TYPES.GALLERY: {
            const { header, itemsCount, socialMedia, hasNativeShareButton, shouldEnableNativeShareOnDesktop } = props;
            return renderHeaderGallery(header, itemsCount, socialMedia, hasNativeShareButton, shouldEnableNativeShareOnDesktop);
        }
        case CONTENT_TYPES.ARTICLE:
            return renderHeaderArticle(props);
        default:
            console.warn('Unknown header type::', type);
            return react_1.default.createElement("div", null, "Unknown header type");
    }
}
exports.renderHeader = renderHeader;
function renderHeaderGallery(header, itemsCount, socialMedia, hasNativeShareButton, shouldEnableNativeShareOnDesktop) {
    return (react_1.default.createElement(content_header_1.default, { ...header, className: header.className, itemsCount: itemsCount, socialMedia: socialMedia, stickySocialAnchorBottom: [
            { selector: '.recirc-list__container', edge: 'bottom' },
            {
                selector: '.content-bottom-anchor',
                edge: 'bottom'
            }
        ], stickySocialAnchorTop: {
            selector: '.sticky-box__gallery-anchor-top'
        }, hasNativeShareButton: hasNativeShareButton, shouldEnableNativeShareOnDesktop: shouldEnableNativeShareOnDesktop }));
}
function renderHeaderArticle(props) {
    const { headerProps, additionalHeaderProps, enableEnhancedArticleHeader, hasNativeShareButton, shouldEnableNativeShareOnDesktop, isFullBleedVideo, hasLightbox, interactiveOverride, metadataVideo, showBreadcrumbTrail } = props;
    return (react_1.default.createElement(content_header_1.default, { ...headerProps, ...additionalHeaderProps, showFullHeaderViewInMobile: enableEnhancedArticleHeader, hasNativeShareButton: hasNativeShareButton, shouldEnableNativeShareOnDesktop: shouldEnableNativeShareOnDesktop, isFullBleedVideo: isFullBleedVideo, className: "article__content-header", hasLightbox: hasLightbox, stickySocialAnchorBottom: {
            selector: '.content-bottom-anchor',
            edge: 'bottom'
        }, stickySocialAnchorTop: {
            selector: '.body',
            edge: 'top'
        }, interactiveOverride: interactiveOverride, metadataVideo: metadataVideo, showBreadCrumb: showBreadcrumbTrail }));
}
//# sourceMappingURL=RenderHeader.js.map

/***/ }),

/***/ 62265:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getContentFooterWrapper = void 0;
const get = __webpack_require__(58156);
const Grid = __webpack_require__(86659);
/*
 * Be aware:
 * getContentFooterWrapper needs a general refactoring so that the function can be used in all content types and thus replaces all special solutions.
 * The ticket for this: https://cnissues.atlassian.net/browse/LS4-924
 * */
const wrapperGallery = (showAdRail, gridColumns, ContentWrapper) => {
    if (showAdRail) {
        return Grid.ContentWithAdRailNarrow;
    }
    const { start, end } = gridColumns || {};
    if (start && end) {
        return Grid.DynamicGrid(gridColumns);
    }
    return ContentWrapper;
};
const wrapperArticle = (variation, ContentWrapper) => {
    return variation === 'WithAdRail'
        ? Grid.NarrowContentWithWideAdRail
        : ContentWrapper;
};
const getContentFooterWrapper = (componentConfig, props) => {
    let ContentWrapper = Grid.WithMargins;
    // legacy
    const { type, showAdRail, gridColumns } = props || {};
    // legacy / deprecated for galleries
    if (type === 'gallery') {
        ContentWrapper = wrapperGallery(showAdRail, gridColumns, ContentWrapper);
    }
    // legacy / deprecated for articles
    if (type === 'article') {
        ContentWrapper = wrapperArticle(get(componentConfig, 'ChunkedArticleContent.variation'), ContentWrapper);
    }
    // proper tenant config
    const variation = get(componentConfig, 'ContentWrapper.variation');
    ContentWrapper = variation ? Grid[variation] : ContentWrapper;
    return ContentWrapper;
};
exports.getContentFooterWrapper = getContentFooterWrapper;
//# sourceMappingURL=get-content-footer.js.map

/***/ })

}]);