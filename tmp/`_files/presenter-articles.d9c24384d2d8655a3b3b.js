/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 10071:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const { useIntl } = __webpack_require__(46984);
const { useInView } = __webpack_require__(26855);
const { connector } = __webpack_require__(57744);
const ResponsiveAsset = __webpack_require__(73275);
const Grid = __webpack_require__(86659);
const translations = (__webpack_require__(6028)/* ["default"] */ .A);
const { TrackComponentChannel } = __webpack_require__(78788);
const { googleAnalytics } = __webpack_require__(90090);
const { SeriesRecircAsset, SeriesRecircContainer, SeriesRecircContent, SeriesRecircDek, SeriesPromoHed, SeriesRecircReadMoreCta, SeriesRecircReadMoreCtaMobile, SeriesRecircTextContainer } = __webpack_require__(14794);
const READ_MORE_TEXT_DEFAULT = 'Read more';
const TEXT_TRANSLATIONS = {
    [READ_MORE_TEXT_DEFAULT]: translations.readMoreDefault,
    'Read next': translations.readNext
};
const getNextPublishedItem = ({ links }) => {
    let nextPublishedItem;
    for (let i = 0; i < links.length; i++) {
        const { isCurrent } = links[i];
        if (isCurrent) {
            for (let j = i + 1; j < links.length; j++) {
                const { isExternal, isPublished } = links[j] || {};
                if (isPublished && !isExternal) {
                    nextPublishedItem = links[j];
                    break;
                }
            }
            break;
        }
    }
    return nextPublishedItem;
};
/**
 * SeriesRecirc component
 *
 * This component uses an article's promoHed and falls back to the hed
 * set on the curated list (which may be different from the hed set on
 * the article itself)
 *
 * @param {object} props - props for the component
 * @param {Element} props.ContentWrapper - content wrapper component
 * @param {string} [props.readMoreCTA] - optional call to action - defaults to 'Read more'
 * @param {object} [props.seriesData] - optional data on the current series
 *
 * @returns {ReactElement} <div>
 */
const SeriesRecirc = ({ ContentWrapper = Grid.NarrowContentWithWideAdRail, readMoreCTA = READ_MORE_TEXT_DEFAULT, seriesData = null }) => {
    const { formatMessage } = useIntl();
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'SeriesRecirc'
        });
    }, []);
    const links = seriesData?.links || [];
    const nextPublishedItem = getNextPublishedItem({ links });
    const trackingStoryClickEvent = (title) => {
        googleAnalytics.emitGoogleTrackingEvent('seriesrecirc', {
            title
        });
    };
    const trackingImpressionEvent = () => {
        googleAnalytics.emitUniqueGoogleTrackingEvent('series-inview', {
            title: nextPublishedItem?.promoHed
        });
    };
    const [ref, inView] = useInView();
    React.useEffect(() => {
        if (inView) {
            trackingImpressionEvent();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inView]);
    if (!seriesData) {
        return null;
    }
    if (!nextPublishedItem) {
        return null;
    }
    const { dek = '', hed = '', image = null, promoHed = '', url = '' } = nextPublishedItem;
    const imageSources = image && (image.segmentedSources || image.sources);
    const media = imageSources && {
        ...image
    };
    return (React.createElement(ContentWrapper, null, nextPublishedItem && (React.createElement(SeriesRecircContainer, { ref: ref },
        React.createElement(SeriesRecircContent, null,
            React.createElement(SeriesRecircReadMoreCtaMobile, null, formatMessage(TEXT_TRANSLATIONS[readMoreCTA])),
            React.createElement(SeriesRecircAsset, null, media && (React.createElement("a", { href: url, onClick: () => trackingStoryClickEvent(promoHed || hed) },
                React.createElement(ResponsiveAsset, { ...media, isLazy: true })))),
            React.createElement(SeriesRecircTextContainer, null,
                React.createElement(SeriesRecircReadMoreCta, null, formatMessage(TEXT_TRANSLATIONS[readMoreCTA])),
                (hed || promoHed) && (React.createElement(SeriesPromoHed, null,
                    React.createElement("a", { href: url, onClick: () => trackingStoryClickEvent(promoHed || hed) },
                        React.createElement("span", { dangerouslySetInnerHTML: { __html: promoHed || hed } })))),
                dek && (React.createElement(SeriesRecircDek, null,
                    React.createElement("span", { dangerouslySetInnerHTML: { __html: dek } })))))))));
};
SeriesRecirc.propTypes = {
    ContentWrapper: PropTypes.elementType,
    readMoreCTA: PropTypes.string,
    seriesData: PropTypes.shape({
        hed: PropTypes.string,
        dek: PropTypes.string,
        image: PropTypes.object,
        links: PropTypes.arrayOf(PropTypes.shape({
            hed: PropTypes.string,
            dek: PropTypes.string,
            image: PropTypes.object,
            isCurrent: PropTypes.bool,
            isExternal: PropTypes.bool,
            isPublished: PropTypes.bool,
            promoDek: PropTypes.string,
            promoHed: PropTypes.string,
            url: PropTypes.string
        }))
    })
};
SeriesRecirc.displayName = 'SeriesRecirc';
module.exports = connector(SeriesRecirc, {
    keysToPluck: ['seriesData']
});
//# sourceMappingURL=SeriesRecirc.js.map

/***/ }),

/***/ 87446:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { asConfiguredComponent } = __webpack_require__(12892);
const SeriesRecirc = __webpack_require__(10071);
module.exports = asConfiguredComponent(SeriesRecirc, 'SeriesRecirc');
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 14794:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const styled = (__webpack_require__(92168)["default"]);
const { BaseText } = __webpack_require__(76955);
const { calculateSpacing, getColorToken } = __webpack_require__(26865);
const { BREAKPOINTS } = __webpack_require__(96472);
const SeriesRecircAsset = styled.div.withConfig({
    displayName: 'SeriesRecircAsset'
}) `
  grid-column: 1/5;

  @media (max-width: ${BREAKPOINTS.md}) {
    grid-column: 1/-1;
  }
`;
const SeriesRecircContainer = styled.div.withConfig({
    displayName: 'SeriesRecircContainer'
}) `
  margin-top: ${calculateSpacing(4)};
  margin-bottom: ${calculateSpacing(5)};
  border-top: 2px solid
    ${({ theme }) => getColorToken(theme, 'colors.discovery.body.white.heading')};
  padding-top: ${calculateSpacing(2)};
`;
const SeriesRecircContent = styled.figure.withConfig({
    displayName: 'SeriesRecircContent'
}) `
  margin-right: 0;
  margin-left: 0;

  @media (min-width: ${BREAKPOINTS.md}) {
    display: grid;
    grid-column-gap: ${calculateSpacing(3)};
    grid-template-columns: repeat(10, 1fr);
  }

  @media (max-width: ${BREAKPOINTS.md}) {
    display: block;
  }
`;
const SeriesRecircDek = styled(BaseText).withConfig({
    displayName: 'SeriesRecircDek'
}) `
  @media (min-width: ${BREAKPOINTS.md}) {
    grid-column: 1/-1;
  }
`;
SeriesRecircDek.defaultProps = {
    as: 'div',
    typeIdentity: 'typography.definitions.consumptionEditorial.description-embed'
};
SeriesRecircDek.displayName = 'SeriesRecircDek';
const SeriesPromoHed = styled(BaseText).withConfig({
    displayName: 'SeriesPromoHed'
}) `
  a {
    text-decoration: none;
    color: inherit;

    &:hover {
      text-decoration: underline;
    }
  }

  @media (min-width: ${BREAKPOINTS.md}) {
    grid-column: 1/-1;
  }
`;
SeriesPromoHed.defaultProps = {
    as: 'h2',
    bottomSpacing: 0.625,
    topSpacing: 1,
    typeIdentity: 'typography.definitions.discovery.subhed-section-tertiary'
};
const SeriesRecircReadMoreCta = styled(BaseText).withConfig({
    displayName: 'SeriesRecircReadMoreCta'
}) `
  @media (max-width: ${BREAKPOINTS.md}) {
    display: none;
  }
`;
SeriesRecircReadMoreCta.defaultProps = {
    typeIdentity: 'typography.definitions.discovery.subhed-section-primary'
};
const SeriesRecircReadMoreCtaMobile = styled(SeriesRecircReadMoreCta).withConfig({ displayName: 'SeriesRecircReadMoreCtaMobile' }) `
  display: none;

  @media (max-width: ${BREAKPOINTS.md}) {
    display: block;
    grid-column: 1/-1;
    margin-bottom: 1em;
  }
`;
const SeriesRecircTextContainer = styled.div.withConfig({
    displayName: 'SeriesRecircTextContainer'
}) `
  @media (min-width: ${BREAKPOINTS.md}) {
    grid-column: 5/-1;
  }
`;
module.exports = {
    SeriesRecircAsset,
    SeriesRecircContainer,
    SeriesRecircContent,
    SeriesRecircDek,
    SeriesPromoHed,
    SeriesRecircReadMoreCta,
    SeriesRecircReadMoreCtaMobile,
    SeriesRecircTextContainer
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 6028:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    readMoreDefault: {
        id: 'ReadMore.SeriesRecirc',
        defaultMessage: 'Read more',
        description: 'SeriesRecirc component Read more text'
    },
    readNext: {
        id: 'ReadNext.SeriesRecirc',
        defaultMessage: 'Read next',
        description: 'SeriesRecirc component Read next text'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 90085:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const { asConfiguredComponent } = __webpack_require__(12892);
const { googleAnalytics } = __webpack_require__(90090);
const { TrackComponentChannel } = __webpack_require__(78788);
const { ChannelCloudContainer, ChannelCloudContainerWrapper, ChannelCloudHeaderContainer, ChannelCloudHeaderLink, ChannelCloudHeaderImage, ChannelCloudSubChannelContainer, ChannelCloudSubChannelLink, ChannelCloudSubChannelLinkText, ChannelCloudSubChannelText } = __webpack_require__(46975);
/**
 * ChannelCloud component
 *
 * @param {object} props - React props
 * @param {object} props.channels - required props object containing channels and sub-channels
 * @param {string} [props.headerLink] -  prop to have the header link
 * @param {string} [props.headerLogo] -  prop to have the header image
 * @param {string} props.sectionHeader -  prop section header
 *
 * @returns {ReactElement} <div>
 */
const ChannelCloud = ({ channels, headerLogo, headerLink, sectionHeader }) => {
    React.useEffect(() => {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'ChannelCloud'
        });
    }, []);
    return (React.createElement(ChannelCloudContainerWrapper, null,
        sectionHeader && (React.createElement(ChannelCloudHeaderContainer, null,
            headerLogo && (React.createElement(ChannelCloudHeaderImage, { src: headerLogo, alt: "logo" })),
            React.createElement(ChannelCloudHeaderLink, { href: headerLink, hasLogo: Boolean(headerLogo), dangerouslySetInnerHTML: { __html: sectionHeader } }))),
        channels && (React.createElement(ChannelCloudContainer, null, channels.map((channel) => (React.createElement(ChannelCloudSubChannelContainer, { key: channel.id },
            React.createElement(ChannelCloudSubChannelText, { dangerouslySetInnerHTML: { __html: channel.text } }),
            channel.sub.map((sub) => (React.createElement(ChannelCloudSubChannelLink, { key: sub.id, href: sub.url, onClick: () => googleAnalytics.emitGoogleTrackingEvent('channelCloud', sub) },
                React.createElement(ChannelCloudSubChannelLinkText, { dangerouslySetInnerHTML: { __html: sub.text } })))))))))));
};
ChannelCloud.propTypes = {
    channels: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        text: PropTypes.string,
        originalText: PropTypes.string,
        sub: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
            text: PropTypes.string,
            url: PropTypes.string
        }))
    })).isRequired,
    headerLink: PropTypes.string,
    headerLogo: PropTypes.string,
    sectionHeader: PropTypes.string.isRequired
};
ChannelCloud.displayName = 'ChannelCloud';
module.exports = asConfiguredComponent(ChannelCloud, 'ChannelCloud');
//# sourceMappingURL=ChannelCloud.js.map

/***/ }),

/***/ 46975:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const styled = (__webpack_require__(92168)["default"]);
const { BaseText, BaseLink } = __webpack_require__(76955);
const { calculateSpacing, getColorStyles } = __webpack_require__(26865);
const getBaseFlexSettings = `
  display: flex;
  align-items: center;
`;
const ChannelCloudContainerWrapper = styled.div.withConfig({
    displayName: 'ChannelCloudContainerWrapper'
}) ``;
const ChannelCloudHeaderContainer = styled.div.withConfig({
    displayName: 'ChannelCloudHeaderContainer'
}) `
  ${getBaseFlexSettings};

  border-width: 0 0 ${calculateSpacing(0.25)};
  border-style: solid;
  padding: ${calculateSpacing(1)} ${calculateSpacing(3)} ${calculateSpacing(2)}
    0;

  ${({ theme }) => getColorStyles(theme, 'border-color', 'colors.interactive.base.black')};
`;
const ChannelCloudHeaderImage = styled.img.withConfig({
    displayName: 'ChannelCloudHeaderImage'
}) `
  width: 25px;
  height: 30px;
`;
const ChannelCloudHeaderLink = styled(BaseLink).withConfig({
    displayName: 'ChannelCloudHeaderLink'
}) `
  position: relative;
  top: ${calculateSpacing(0.3)};
  padding-left: ${({ hasLogo }) => (hasLogo ? calculateSpacing(1.3) : 0)};
`;
ChannelCloudHeaderLink.defaultProps = {
    colorToken: 'colors.interactive.base.black',
    typeIdentity: 'typography.definitions.discovery.hed-bulletin-secondary'
};
const ChannelCloudContainer = styled.div.withConfig({
    displayName: 'ChannelCloudContainer'
}) `
  display: flex;
  flex-wrap: wrap;
  padding: ${calculateSpacing(2.4)} ${calculateSpacing(6)}
    ${calculateSpacing(1)} 0;
`;
const ChannelCloudSubChannelContainer = styled.div.withConfig({
    displayName: 'ChannelCloudSubChannelContainer'
}) `
  ${getBaseFlexSettings}
  flex-wrap: wrap;
  margin-bottom: ${calculateSpacing(2)};
  padding-right: ${calculateSpacing(2)};
`;
const ChannelCloudSubChannelText = styled(BaseText).withConfig({
    displayName: 'ChannelCloudSubChannelText'
}) `
  padding-right: ${calculateSpacing(1)};

  &::after {
    content: ':';
  }
`;
ChannelCloudSubChannelText.defaultProps = {
    colorToken: 'colors.interactive.base.black',
    typeIdentity: 'typography.definitions.globalEditorial.context-primary'
};
const ChannelCloudSubChannelLink = styled(BaseLink).withConfig({
    displayName: 'ChannelCloudSubChannelLink'
}) `
  ${getBaseFlexSettings}
  padding-right: ${calculateSpacing(1)};

  svg {
    ${({ theme }) => getColorStyles(theme, 'fill', 'colors.consumption.body.standard.body-deemphasized')};

    position: relative;
    top: 2px;
    right: 2px;
    transform: rotate(-45deg);
    width: 12px;
    height: 12px;
    vertical-align: bottom;
  }

  &::after {
    ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.body-deemphasized')};

    position: relative;
    right: ${({ hasIcon }) => (hasIcon ? calculateSpacing(0.4) : 0)};
    line-height: 0;
    content: ',';
  }

  &:last-child {
    &::after {
      content: '';
    }
  }
`;
const ChannelCloudSubChannelLinkText = styled(BaseText).withConfig({
    displayName: 'ChannelCloudSubChannelLinkText'
}) `
  line-height: 1.7em;

  &:hover {
    ${({ theme }) => getColorStyles(theme, 'color', 'colors.consumption.body.standard.link-hover')};
    text-decoration: underline;
    ${({ theme }) => getColorStyles(theme, 'text-decoration-color', 'colors.consumption.body.standard.link-hover')};
  }
`;
ChannelCloudSubChannelLinkText.defaultProps = {
    colorToken: 'colors.consumption.body.standard.body-deemphasized',
    typeIdentity: 'typography.definitions.globalEditorial.context-primary'
};
module.exports = {
    ChannelCloudContainer,
    ChannelCloudContainerWrapper,
    ChannelCloudHeaderContainer,
    ChannelCloudHeaderLink,
    ChannelCloudHeaderImage,
    ChannelCloudSubChannelContainer,
    ChannelCloudSubChannelLink,
    ChannelCloudSubChannelLinkText,
    ChannelCloudSubChannelText
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 92140:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__(70006);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 70006:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const { TrackComponentChannel } = __webpack_require__(78788);
/**
 * Resource Hint Link component
 *
 * @param {object} props - React props
 * @param {string} props.as - resource hint link "as" attribute value
 * @param {string} props.hint - resource hint link rel value
 * @param {string} props.href - resource hint link href value
 * @returns {ReactElement} <ResourceHint>
 */
class ResourceHint extends React.PureComponent {
    constructor() {
        super(...arguments);
        /**
         * Append Resoure Hint Link to document head
         *
         * @param {object} props - React props
         * @param {string} props.as - html link "as" attribute value
         * @param {string} props.hint - html link rel value
         * @param {string} props.href - html link href value
         * @returns {undefined} undefined
         */
        this.writeResourceHintLink = (props) => {
            const { as, hint, href } = props;
            const link = document.createElement('link');
            link.as = as;
            link.href = href;
            link.rel = hint;
            document.head.appendChild(link);
        };
    }
    componentDidMount() {
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'ResourceHint'
        });
        if ( true && this.props) {
            this.writeResourceHintLink(this.props);
        }
    }
    render() {
        return React.createElement(React.Fragment, null);
    }
}
module.exports = ResourceHint;
//# sourceMappingURL=resource-hint.js.map

/***/ }),

/***/ 33620:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const React = __webpack_require__(96540);
const PropTypes = __webpack_require__(5556);
const { connect: connectToStore } = __webpack_require__(67851);
const ReactModal = __webpack_require__(20312);
const modalActions = __webpack_require__(59319);
const Icons = __webpack_require__(97504);
const { minThresholds } = __webpack_require__(99906);
const { GlobalStyle, CloseModalButtonDesktop, CloseModalButtonMobile, ModalContentWrapper } = __webpack_require__(12456);
/**
 * GenericModal component
 *
 * @param {string | ReactElement | HTMLElement} children - Modal content
 * @param {string} [closeModalText] - Text to display along with the close button
 * @param {boolean} isModalOpen - Flag to open/close Modal
 * @param {number} [modalTransitionTime] - Fade In/Out transition time for modal
 * @param {Function} [onAfterOpen] - Optional function called after modal opens
 * @param {Function} [onClose] - Optional function called before modal close
 * @param {Function} openModal - Redux action to open/close Modal
 * @param {object} [props.variations] - Optional variation properties used in rendering the component
 * @param {string} [props.variations.windowed] - [`true` or `false`]. Provides an overlay around the modal if the value passed is true
 * @returns {ReactElement} - Returns React Modal
 */
const GenericModal = ({ children, onClose, isModalOpen, modalTransitionTime = 300, closeModalText = '', onAfterOpen, openModal, showHeader = false, variations = {
    isBottom: false,
    isWindowed: false
} }) => {
    const { isWindowed, isBottom } = variations;
    const shouldShowTextIconBtn = !isBottom && !isWindowed;
    const shouldShowOverlay = isBottom || isWindowed;
    React.useEffect(() => {
        ReactModal.setAppElement('#app-root');
    }, []);
    // Calculating the header height for both large and small screens.
    // Modal height = viewport height - height of site header.
    const siteHeaderHeight = React.useMemo(() => {
        if (!showHeader || !isModalOpen || !document) {
            return 0;
        }
        const viewportWidth = window?.innerWidth;
        const scrolledLinkBanner = document.getElementsByClassName('visual-link-banner--is-scrolled');
        const siteNavigator = document.getElementsByClassName('site-navigation');
        if (viewportWidth < minThresholds.xl &&
            scrolledLinkBanner.length &&
            scrolledLinkBanner[0]) {
            // for small screens when scrolling down
            return scrolledLinkBanner[0].offsetHeight;
        }
        else if (!siteNavigator || !siteNavigator.length) {
            return 0;
        }
        return siteNavigator[0]?.offsetHeight || 0;
    }, [isModalOpen, showHeader]);
    const handleClose = () => {
        if (onClose) {
            onClose();
        }
        openModal(false);
    };
    const handleAfterOpen = () => {
        if (onAfterOpen) {
            onAfterOpen();
        }
    };
    return (React.createElement(ReactModal, { isOpen: isModalOpen, className: "genericModal", overlayClassName: {
            base: 'genericModalOverlay',
            afterOpen: 'genericModalOverlayAfterOpen',
            beforeClose: 'genericModalOverlayBeforeClose'
        }, bodyOpenClassName: "genericModalBodyOpen", htmlOpenClassName: "genericModalHtmlOpen", shouldCloseOnEsc: true, closeTimeoutMS: modalTransitionTime, onRequestClose: handleClose, onAfterOpen: handleAfterOpen },
        shouldShowTextIconBtn && (React.createElement(CloseModalButtonDesktop, { btnStyle: "text", iconPosition: "before", hasEnableIcon: true, onClickHandler: handleClose, ButtonIcon: Icons.Close, label: closeModalText })),
        React.createElement(CloseModalButtonMobile, { ButtonIcon: Icons.Close, onClickHandler: handleClose, onTouchStart: handleClose, btnStyle: "outlined", isIconButton: true, hasEnableIcon: true, cornerRadius: "FullyRoundedCorner", size: "small", label: closeModalText, isWindowed: isWindowed, isBottom: isBottom }),
        React.createElement(ModalContentWrapper, null, children),
        React.createElement(GlobalStyle, { siteHeaderHeight: siteHeaderHeight, modalTransitionTime: modalTransitionTime, isWindowed: isWindowed, isBottom: isBottom, shouldShowOverlay: shouldShowOverlay })));
};
const mapStateToProps = (state) => {
    return {
        isModalOpen: state.isModalOpen || false
    };
};
const mapDispatchToProps = (dispatch) => {
    const { openModal } = modalActions(dispatch);
    return {
        openModal
    };
};
GenericModal.propTypes = {
    children: PropTypes.node.isRequired,
    closeModalText: PropTypes.string,
    isModalOpen: PropTypes.bool.isRequired,
    modalTransitionTime: PropTypes.number,
    onAfterOpen: PropTypes.func,
    onClose: PropTypes.func,
    openModal: PropTypes.func.isRequired,
    showHeader: PropTypes.bool,
    variations: PropTypes.shape({
        isBottom: PropTypes.bool,
        isWindowed: PropTypes.bool
    })
};
module.exports = connectToStore(mapStateToProps, mapDispatchToProps)(GenericModal);
//# sourceMappingURL=GenericModal.js.map

/***/ }),

/***/ 75084:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GenericModal = __webpack_require__(57440);
const { asConfiguredComponent } = __webpack_require__(12892);
const { asThemedComponent } = __webpack_require__(20223);
module.exports = asThemedComponent(asConfiguredComponent(GenericModal, 'GenericModal'));
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 12456:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { default: styled, createGlobalStyle, css } = __webpack_require__(92168);
const Button = __webpack_require__(73730);
const { ButtonLabel, ButtonIconWrapper } = __webpack_require__(18974);
const { maxScreen, minScreen, getColorToken, getColorStyles, calculateSpacing, getZIndex } = __webpack_require__(26865);
const { maxThresholds } = __webpack_require__(99906);
const { BREAKPOINTS } = __webpack_require__(96472);
const CloseModalButton = styled(Button.Utility).withConfig({
    displayName: 'CloseModalButton'
}) `
  position: absolute;
  color: ${({ theme }) => getColorToken(theme, 'colors.interactive.base.dark')};

  svg {
    fill: ${({ theme }) => getColorToken(theme, 'colors.interactive.base.dark')};
  }

  &:hover {
    color: ${({ theme }) => getColorToken(theme, 'colors.interactive.base.dark')};
  }

  ${ButtonIconWrapper} {
    display: flex;
  }
`;
const CloseModalButtonDesktop = styled(CloseModalButton).withConfig({
    displayName: 'CloseModalButtonDesktop'
}) `
  left: 0;

  &:hover {
    text-decoration: underline;
    text-decoration-color: ${getColorToken('colors.interactive.base.primary')};
  }

  ${maxScreen(`${maxThresholds.lg}px`)} {
    display: none;
  }

  ${ButtonLabel} {
    padding: 0;
  }
`;
const CloseModalButtonMobile = styled(CloseModalButton).withConfig({
    displayName: 'CloseModalButtonRight'
}) `
  top: ${calculateSpacing(2.5)};
  right: ${calculateSpacing(3)};
  left: unset;
  z-index: ${getZIndex('skipLink')};
  border: 1px solid ${getColorToken('colors.interactive.base.light')};
  width: ${calculateSpacing(5)};
  height: ${calculateSpacing(5)};

  &:hover {
    border: 1px solid ${getColorToken('colors.interactive.base.light')};
    background: ${getColorToken('colors.interactive.base.light')};
  }

  svg {
    vertical-align: bottom;
  }

  ${({ isWindowed, isBottom }) => {
    if (isWindowed) {
        return css `
        display: flex;
      `;
    }
    if (isBottom) {
        return css `
        top: ${calculateSpacing(1)};
        right: ${calculateSpacing(1)};
        border: none;
        width: ${calculateSpacing(4)};
        height: ${calculateSpacing(4)};

        &:hover {
          border: none;
          background: unset;
        }
      `;
    }
    return css `
      ${minScreen(BREAKPOINTS.lg)} {
        display: none;
      }
    `;
}}
`;
const ModalContentWrapper = styled.div.withConfig({
    displayName: 'ModalContentWrapper'
}) `
  padding: 0;
  height: 100%;
`;
const modalOverlayStyles = () => css `
  .genericModalOverlay {
    display: flex;
    position: fixed;
    align-items: center;
    justify-content: center;
    background-color: rgba(
      ${getColorToken('colors.background.dark', {
    rgbOnly: true
})},
      0.4
    );
    overflow: hidden;
    justify-items: center;
  }

  .genericModal {
    position: relative;
    outline: none;
    ${getColorStyles('background-color', 'colors.interactive.base.white')};
  }
`;
const modalWindowedStyles = () => css `
  .genericModal {
    display: flex;
    border-radius: ${calculateSpacing(1)};
    padding: ${calculateSpacing(6)} 0;
    width: auto;
    max-height: 100%;

    ${getColorStyles('background-color', 'colors.interactive.base.white')};

    ${minScreen(BREAKPOINTS.md)} {
      padding: ${calculateSpacing(6)} 0;
    }

    svg {
      ${getColorStyles('fill', 'colors.interactive.base.deemphasized')};
    }
  }

  ${ModalContentWrapper} {
    display: flex;
    flex: 1;
    height: unset;
  }
`;
const modalBottomStyles = () => css `
  .genericModalOverlay {
    align-items: end;

    ${minScreen(BREAKPOINTS.xl)} {
      align-items: center;
    }
  }

  .genericModal {
    display: flex;
    border-radius: ${calculateSpacing(1)};
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    padding-top: ${calculateSpacing(5)};
    width: 100%;
    max-height: calc(100% - ${calculateSpacing(4)});

    ${minScreen(BREAKPOINTS.md)} {
      height: unset;
    }

    ${minScreen(BREAKPOINTS.xl)} {
      border-bottom-left-radius: ${calculateSpacing(1)};
      border-bottom-right-radius: ${calculateSpacing(1)};
      max-width: ${calculateSpacing(104.125)};
    }
  }

  ${ModalContentWrapper} {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: unset;
    justify-items: center;
  }
`;
const GlobalStyle = createGlobalStyle `

  .genericModalHtmlOpen {
    overflow: hidden;
  }

  .genericModalBodyOpen {
    @media (hover: none) {
      overflow-y: hidden;
    }
  }

  ${({ siteHeaderHeight, modalTransitionTime }) => css `
      .genericModalOverlay {
        position: fixed;
        top: ${siteHeaderHeight}px;
        left: 0;
        opacity: 0;
        z-index: ${getZIndex('hyperstitialLayer')};
        width: 100%;
        height: calc(100% - ${siteHeaderHeight}px);

        ${modalTransitionTime &&
    css `
          transition: opacity ${modalTransitionTime}ms ease-in-out;
        `};
      }
    `};

  .genericModalOverlayAfterOpen {
    opacity: 1;
  }

  .genericModalOverlayBeforeClose {
    opacity: 0;
  }

  ${({ shouldShowOverlay }) => shouldShowOverlay
    ? modalOverlayStyles()
    : css `
          .genericModal {
            width: 100%;
            height: 100%;
            overflow-y: auto;

            ${getColorStyles('background-color', 'colors.interactive.base.white')};
          }
        `};

  ${({ isWindowed }) => isWindowed && modalWindowedStyles()};
  ${({ isBottom }) => isBottom && modalBottomStyles()};
`;
module.exports = {
    GlobalStyle,
    CloseModalButtonDesktop,
    CloseModalButtonMobile,
    ModalContentWrapper
};
//# sourceMappingURL=styles.js.map

/***/ }),

/***/ 57440:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { asVariation } = __webpack_require__(81372);
const GenericModal = __webpack_require__(33620);
GenericModal.Default = asVariation(GenericModal, 'Default', {});
GenericModal.Windowed = asVariation(GenericModal, 'Windowed', {
    isWindowed: true
});
GenericModal.Bottom = asVariation(GenericModal, 'Bottom', {
    isBottom: true
});
module.exports = GenericModal;
//# sourceMappingURL=variations.js.map

/***/ }),

/***/ 70935:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const classnames = __webpack_require__(32485);
const set = __webpack_require__(63560);
const get = __webpack_require__(58156);
const PropTypes = __webpack_require__(5556);
const React = __webpack_require__(96540);
const { injectIntl } = __webpack_require__(46984);
const translations = (__webpack_require__(17848)/* ["default"] */ .A);
const ResponsiveCartoon = __webpack_require__(44597);
const RecircMostPopular = __webpack_require__(41160);
const { getVariationNames } = __webpack_require__(81372);
const { I18nProvider } = __webpack_require__(20539);
const AgeGate = __webpack_require__(92989);
const BreadcrumbTrail = __webpack_require__(6538);
const ResourceHint = __webpack_require__(92140);
const ChunkedArticleContent = __webpack_require__(84721);
const { connector } = __webpack_require__(57744);
const ContentFooter = __webpack_require__(61127);
const ContentHeader = __webpack_require__(69389);
const { renderHeaderOrPlaceholder } = __webpack_require__(70697);
const { renderHeader } = __webpack_require__(76449);
const { OneCoverConfigPropTypes } = __webpack_require__(49299);
const { googleAnalytics } = __webpack_require__(90090);
const Grid = __webpack_require__(86659);
const { PaywallCollaborator, withArticleTruncation } = __webpack_require__(81427);
const { InlineBarrier } = __webpack_require__(12501);
const SeriesRecirc = __webpack_require__(87446);
const SponsoredContentHeader = __webpack_require__(31411);
const CNEInterludeEmbed = __webpack_require__(96303);
const { withLightbox } = __webpack_require__(83726);
const Row = __webpack_require__(66657);
const { Disclaimer } = __webpack_require__(74307);
const { BeopScript } = __webpack_require__(85508);
const { TrackComponentChannel } = __webpack_require__(78788);
const { getContentFooterWrapper } = __webpack_require__(62265);
const SeriesNavigation = __webpack_require__(78118);
const ChannelNavigation = __webpack_require__(71656);
const SignInModal = __webpack_require__(14935);
const ConnectedNewsletterSubscribeForm = __webpack_require__(577);
const ChannelCloud = __webpack_require__(90085);
const { asConfiguredComponent } = __webpack_require__(12892);
const RecircList = __webpack_require__(98531);
const SummaryCollectionSplitColumns = __webpack_require__(94136);
const ConnectedErrorBoundary = __webpack_require__(48496);
const { getNewsletterSubscriptions } = __webpack_require__(29727);
const VersoFilterableSummaryList = __webpack_require__(10220);
const { MultiPackageRow } = __webpack_require__(67275);
const { getOverrideBehaviour } = __webpack_require__(68089);
const GenericModal = __webpack_require__(75084);
const GalleryCarousel = __webpack_require__(87963);
const ActionBarWrapper = __webpack_require__(90532);
const ActionBar = __webpack_require__(72014);
const { storageFactory } = __webpack_require__(60663);
const { default: PhotoBookmarkingProvider } = __webpack_require__(56602);
const { GrowthBookReadyContext } = __webpack_require__(85878);
const localStore = storageFactory(() => window.sessionStorage);
const { WindowEventChannel } = __webpack_require__(51735);
const { ArticlePageBase, ArticlePageGlobalStyle, ArticlePageLedeBackground, ArticlePageContentBackGround, ArticlePageBodyMobileTruncatedBtn, ArticlePageContentFooterGrid, ArticlePageIssueDate, ContentWrapperGrid, ArticlePageDisclaimer, ArticlePageDisclaimerGrid } = __webpack_require__(54910);
const { Commenting } = __webpack_require__(81063);
const contentHeaderVariationsForACDC = [
    'TextAboveCenterSmallWithRule',
    'TextAboveCenterFullBleedNoContributor',
    'TextBelowCenterFullBleedNoContributor',
    'InlineImage',
    'SplitScreenImageRightFullBleed',
    'SplitScreenImageRightInset',
    'SplitScreenImageLeftInset',
    'SplitScreenImageLeftFullBleed',
    'TextAboveLeftSmallWithRule'
];
const contentHeaderTextOverlayVariations = [
    'TextOverlayContentHeader',
    'TextOverlayContentHeaderWithLogo',
    'TextOverlayCenterFullBleedGradient'
];
const isContentHeaderVariationInACDC = (contentHeaderVariation) => contentHeaderVariationsForACDC.includes(contentHeaderVariation);
const isContentHeaderTextOverlay = (contentHeaderVariation, showEnhancedTextOverlay) => Boolean(showEnhancedTextOverlay &&
    contentHeaderTextOverlayVariations.includes(contentHeaderVariation));
/**
 *
 * @param {boolean} enableEnhancedArticleHeader - Enable ACDC changes
 * @param {boolean} enableActionBar - Enabling Action bar
 * @param {string} contentHeaderVariation - Content Header variation
 * @param {object} additionalProps - Additional props required
 *
 * @returns {object} - headerProps
 */
const generateHeaderProps = (enableEnhancedArticleHeader, enableActionBar, contentHeaderVariation, additionalProps) => {
    let headerProps = {};
    const { showContributorImageOnMobile, showEnhancedTextOverlay } = additionalProps;
    if (enableEnhancedArticleHeader) {
        if (isContentHeaderVariationInACDC(contentHeaderVariation)) {
            headerProps = {
                shouldAlignCenterWhenNoCaption: true
            };
        }
        if (contentHeaderVariation === 'TextBelowCenterFullBleedNoContributor') {
            headerProps = {
                ...headerProps,
                isImagePositionBottomInSmallScreen: true
            };
        }
    }
    if (enableActionBar) {
        headerProps = {
            ...headerProps,
            hideSocialIcons: true,
            hideSocialIconsOnMobile: true,
            hasStickySocialIcons: false
        };
    }
    if (isContentHeaderVariationInACDC(contentHeaderVariation)) {
        headerProps = {
            ...headerProps,
            showContributorImageOnMobile
        };
    }
    else if (isContentHeaderTextOverlay(contentHeaderVariation, showEnhancedTextOverlay)) {
        headerProps = {
            ...headerProps,
            showContributorImage: false,
            hideShareButtons: true,
            showTextOverlayDek: true,
            isDekInverted: true,
            isReducedBottomMargin: true,
            isStandardCaption: true,
            isRubricInverted: true,
            hasDekMarginReduced: true,
            shouldLimitContentWidth: true,
            showEnhancedPublishDate: true
        };
    }
    return headerProps;
};
/**
 * Article Page component
 *
 * @param {object} props - React props
 * @param {object} props.article - Object containing the body and header properties
 * @param {Array} [props.article.body] - Optional array containing the parsed body content
 * @param {boolean} [props.article.hasAffiliateLinks] - Optional prop to to indicate whether the article has affiliate links
 * @param {string} [props.showExperimentPlaceholder] - Enables Placeholder for A/B test experiment,
 * @param {string} [props.headerComponent] - name of the header to use: OneCover | ContentHeader; default: ContentHeader
 * @param {string} [props.oneCover] - props for OneCover: controls and variation
 * @param {object} [props.article.channelMap] - Optional object containing map of channel names
 * @param {Array} [props.article.contentWarnings] - Optional array containing content-warnings associated with the article - e.g: [{ slug: 'alcohol_content'}]
 * @param {object} [props.article.hasEventBannerHidden] - Optional prop object to hide event banner
 * @param {boolean} [props.article.hasTruncationOnMobile] - Optional boolean for mobile body truncation
 * @param {object} [props.article.contributorSpotLightProps] - Optional Object holding contributorSpotLightProps configuration
 * @param {boolean} [props.article.hasNewsletterInBody] - Optional prop to to indicate whether there is a newsletter in the body
 * @param {boolean} [props.article.showWriterBio] - optional flag to show contributor as a writer
 * @param {boolean} [props.article.hideContributorBio] - Optional prop to hide contributor bio
 * @param {boolean} [props.article.showContributor] - Optional prop to show contributor component
 * @param {boolean} [props.article.showContributorSpotlight] - Optional prop to show contributor spotlight
 * @param {ContentHeader} props.article.headerProps - Object containing properties passed to ContentHeader
 * @param {object} [props.article.interlude] - props to pass down in case of right rail interlude placement
 * @param {object} props.article.isHeroAdVisible - Whether to show the hero ad
 * @param {Array} props.article.newsletterModules - List of all the newsletter modules configured in the tenant
 * @param {Array} [props.article.paddingTop] - Optional padding top size
 * @param {object} [props.article.relatedVideo] - Optional prop object to show related video
 * @param {object} [props.article.recircs] - Optional prop object recircs data
 * @param {Array} [props.article.recircMostPopular] - Optional prop recircMostPopular data
 * @param {Array} [props.article.cnCoupons] -Optional prop object savings united coupons data
 * @param {boolean} [props.article.shouldShowFooterNewsletter] - Optional prop to show the footer newsletter when the inline newsletter is also visible.
 * @param {object} [props.article.shouldUsePersistentAd] - Optional prop object use older persistent ad in chunks
 * @param {object} [props.article.signageConfig] - Optional prop object signage config
 * @param {object} [props.attributes] - Optional attributes to add top level i.e. aria-*, role, etc.
 * @param {string} [props.className] - Optional top-level class to add
 * @param {object} [props.article.tagCloud] - Optional Object holding tagCloud properties
 * @param {boolean} [props.cartoonVariation] - Optional Whether cartoon should have white background and padding
 * @param {object} props.communityExperience - Object containing attributes needed for community experience, configured in interfaces
 * @param {boolean} [props.communityExperience.enableCommunityExperience] - Optional flag to enable CommunityExperience
 * @param {object} [props.componentConfig] - Optional Object with components settings
 * @param {boolean} [props.hasRecircDriver] - Optional boolean to determine recircList element
 * @param {boolean} [props.hasChannelNavigation] - Optional boolean to use the ChannelNavigation type
 * @param {string} [props.recircMostPopularVariationOnMobile] - Optional recirc most popular variation to show in mobile
 * @param {boolean} [props.hasSlideShow] - Optional whether the lightbox slideshow is enabled
 * @param {boolean} [props.slideShowVariation] - Optional lightbox slideshow variation
 * @param {boolean} [props.hideSideBySideViewOnMobile] - Optional whether the side by side view need to be enabled on mobile
 * @param {Array} [props.recircRelated] - Optional list to show bottom recirc unit data
 * @param {Array<Related>} [props.related] - Array of related recirculated content types
 * @param {Array<Related>} [props.related] - Array of related recirculated content types, can be empty, in which case we request recommendations via the API on client side
 * @param {object} [props.metadataVideo] - Optional, CNE video metadata
 * @param {bool} [props.metadataVideo.isLive] - Optional, a flag to refer if video is live
 * @param {string} [props.metadataVideo.premiereDate] - a date when perticluar video will be available
 * @param {number} [props.metadataVideo.videoLength] - length of video
 * @param {number} [props.metadataVideo.premiereGap] - difference in days wrt to current date, will be negative for future premiered date
 * @param {object} [props.productCarousel] - Optional product carousel
 * @param {boolean} [props.article.showHotelRecirc] - Brandspecific props to render hotel recirc unit article pages
 * @param {boolean} [props.shouldHideBaseTopPadding] - optional to Hide BasePage top padding
 * @param {boolean} [props.shouldHideSeriesNavigation] - Optional prop to prevent series navigation component from rendering - defaults to true
 * @param {boolean} [props.shouldHideSeriesRecirc] - Optional prop to prevent series recirc component from rendering - defaults to true
 * @param {boolean} [props.shouldInheritDropcapColor] - Optional hack to force drop caps to inherit body color (defaults to false) - tech debt from TNY 2020 endorsement
 * @param {boolean} [props.showAgeGate] - Optional prop denoting whether an AgeGate coponent should be inserted
 * @param {boolean} [props.showGalleryCartoonPublishedDate] - To show/hide Gallery cartoon published date
 * @param {boolean} [props.showFirstRailRecirc] - Optional prop denoting whether the first block in rail should contain recirc
 * @param {boolean} [props.showLinkStackInsideContentBody] - Optional, moves the linkStack to show inside the content body container
 * @param {boolean} [props.xlargePaddingTop] - Optional prop
 * @param {boolean} [props.articleVariationForXlargePaddingTop] - Optional prop
 * @param {boolean} [props.hasDynamicNewsletterSignup] - prop denoting that Dynamic Newsletter signup unit will true only for TNY
 * @param {boolean} [props.hasDynamicDisclaimer] - Optional to show dynamic disclaimer in TNY
 * @param {boolean} [props.shouldPrioritizeSeriesPagination] - Optional to priortize series pagination
 * @param {string} [props.responsiveCartoonVariation] - Provides the cartoon variation to select
 * @param {boolean} [props.shouldEnableArticleBackground] - to enable article background color feature
 * @param {string} [props.pageBackgroundTheme] - Optional prop to get article page background color from copilot
 * @param {string} [props.dividerColor] - Optional prop to get divider color for article page from copilot
 * @param {boolean} [props.featureFlags.enableActionBar] - Feature flag for enabling ActionBar
 * @param {string} [props.actionBarLargeScreenVariation] - Desktop variation for the ActionBar component
 * @param {string} [props.actionBarMobileScreenVariation] - Mobile variation for the ActionBar component
 * @param {Array} [props.actionBarButtons] - List of buttons/actions for the ActionBar component
 * @param {boolean} [props.isActionBarStickyLargeScreen] - To make ActionBar sticky in large screen
 * @param {boolean} [props.isMobileDevice] - check is mobile device or not.
 * @param {boolean} [props.showContributorImageOnMobile] - Show/Hide contributor image in mobile
 * @param {boolean} [props.showIssueDateInArticle] - Show/Hide issue date in Article body
 * @param {boolean} [props.hasLinkbannerCrossSlideAnimation] - Enable/Disable cross slide animation for the header
 * @param {boolean} [props.showEnhancedTextOverlay] - Enable/Disable enhanced experienced in TextOverlay variations of ContentHeader
 * @param {string} [props.article.disclaimerPosition] - position of the disclaimer
 * @param {number} [props.minWordCountForMidRecirc] - Min threshold word count for showing mid article recirc unit
 * @param {boolean} [props.shouldShowMidArticleRecirc] - To enable mid recirc
 * @param {object} [props.midRecircItems] - Mid recirc data
 * @param {boolean} [props.shouldHideInlineRecirc] - To hide the inline recirc
 *
 * @returns {ReactElement} <div>
 */
class ArticlePage extends React.Component {
    constructor(props) {
        super(props);
        this.onHandleScroll = () => {
            const scrollTop = window.scrollY;
            const contentHeaderPosition = this.pageContentEl.current.offsetTop;
            const hideNav = scrollTop <= contentHeaderPosition + 100;
            if (hideNav !== this.state.hideNav) {
                this.setState({ hideNav });
            }
        };
        this.onResizeHandler = () => {
            this.implementActionBarHeight();
        };
        this.onScrollHandler = () => {
            this.implementActionBarHeight();
        };
        /**
         * Dismiss the mobile truncation
         *
         * @returns {undefined} undefined
         */
        this.onTruncationDismiss = () => {
            this.setState({
                isMobileTruncated: !this.state.isMobileTruncated
            });
            googleAnalytics.emitUniqueGoogleTrackingEvent(`article-read-more`);
        };
        this.setCartoonLinkedGalleries = (sliderData, callback) => {
            this.setState({ sliderData }, () => {
                callback();
            });
        };
        this.implementActionBarHeight = () => {
            if (this.props.featureFlags?.enableActionBar &&
                this.articleWrapperRef?.current?.offsetHeight !== this.state.articleLength) {
                this.state.articleLength = this.articleWrapperRef?.current?.offsetHeight; // eslint-disable-line react/no-direct-mutation-state
            }
        };
        this.fetchNewsletterSubscriptions = async (options) => {
            try {
                const result = await getNewsletterSubscriptions(options);
                if (result.status === 200) {
                    const newsletterIds = this.props.article.newsletterModules
                        .filter((newsletterModules) => newsletterModules.priority)
                        .sort((highPriority, lowPriority) => highPriority.priority - lowPriority.priority)
                        .map((newsletterList) => newsletterList.newsletterId);
                    const currentNewsletterId = this.props.article.newsletter.newsletterId;
                    const newsletterSubscriptionsList = result.newsletterSubscriptions.data
                        .filter((subscriptionData) => subscriptionData.attributes.status === 'SUBSCRIBED')
                        .map((newsletterIDs) => newsletterIDs.attributes.newsletterId);
                    if (newsletterSubscriptionsList.length) {
                        const newsletterUnsubscriptionsList = newsletterIds.filter((filteredList) => !newsletterSubscriptionsList.includes(filteredList));
                        const renderNewsletter = this.props.article.newsletterModules.find((newsletters) => newsletters.newsletterId === newsletterUnsubscriptionsList[0]);
                        if (newsletterSubscriptionsList.includes(currentNewsletterId)) {
                            this.setState({
                                newsletterData: {
                                    ...this.state.newsletterData,
                                    ...renderNewsletter
                                }
                            });
                        }
                    }
                }
            }
            catch (error) {
                console.log(error);
            }
            return {};
        };
        this.state = {
            articleLength: 0,
            hideNav: this.props.article.headerProps.hasContentHeaderLogo,
            isMobileTruncated: false,
            newsletterData: this.props.article.newsletter,
            sliderData: {}
        };
        this.pageContentEl = React.createRef();
        this.articleWrapperRef = React.createRef();
        const Chunked = props.hasLightbox
            ? withLightbox({
                Component: ChunkedArticleContent,
                slides: props.article.lightboxImages,
                hasSlideShow: props.hasSlideShow,
                slideShowVariation: props.slideShowVariation
            })
            : ChunkedArticleContent;
        // Define a single component instead of creating a new one on every
        // render operation. This avoids issues with interactive overrides,
        // like the crosswords, which are prone to loading errors if rendered
        // multiple times
        this.TruncatedChunkedArticleContent = withArticleTruncation(Chunked, 'body');
    }
    componentDidMount() {
        if (this.props.user.isAuthenticated &&
            this.props.hasDynamicNewsletterSignup &&
            this.props.article.newsletterModules?.length) {
            const newsletterIds = this.props.article.newsletterModules.map((newsletterList) => newsletterList.newsletterId);
            const newsletterIdsString = newsletterIds.toString();
            const options = {
                amgUUID: this.props.user.amguuid,
                newsletterIds: newsletterIdsString,
                userPlatformProxy: this.props.userPlatform.userPlatformProxy,
                provider: 'sailthru',
                xClientID: this.props.userPlatform.xClientID
            };
            this.fetchNewsletterSubscriptions(options);
        }
        const { hasTruncationOnMobile } = this.props.article;
        hasTruncationOnMobile
            ? this.setState({ isMobileTruncated: true })
            : this.setState({ isMobileTruncated: false });
        if (this.props.article.headerProps.hasContentHeaderLogo) {
            this.setState({ hideNav: true });
            this.scrollSubscription = window.Kendra.WINDOW_EVENT.on(WindowEventChannel.SCROLL_DEBOUNCE, this.onHandleScroll);
        }
        const isHeaderOverride = get(this.props.article.interactiveOverride, 'behavior') === 'header';
        const showNavWithHeaderOverride = get(this.props.componentConfig, 'BasePage.settings.showNavWithHeaderOverride');
        const isNavInvisible = isHeaderOverride && !showNavWithHeaderOverride;
        localStore.setItem('nav_invisible', isNavInvisible);
        if (window.cns) {
            window.cns.pageContext.content.pageStructure =
                this.props.article.pageStructure;
        }
        this.scrollHandlerSubscription = window.Kendra.WINDOW_EVENT.on(WindowEventChannel.SCROLL_DEBOUNCE, this.onScrollHandler);
        this.scrollHandlerSubscription = window.Kendra.WINDOW_EVENT.on(WindowEventChannel.RESIZE_DEBOUNCE, this.onResizeHandler);
        window.Kendra.TRACK_COMPONENT.broadcast(TrackComponentChannel.RENDER, {
            name: 'ArticlePage'
        });
    }
    componentWillUnmount() {
        if (this.scrollSubscription) {
            this.scrollSubscription.off();
        }
        if (this.scrollHandlerSubscription) {
            this.scrollHandlerSubscription.off();
        }
        if (this.resizeHandlerSubscription) {
            this.resizeHandlerSubscription.off();
        }
        localStore.removeItem('nav_invisible');
    }
    /* eslint-disable-next-line complexity */
    render() {
        const { article: { id, body, channelCloudData, contentWarnings, contributorSpotLightProps, hasAffiliateLinks, hasEventBannerHidden, hasInvertedHeadertheme, channelMap, hasNewsletterInBody, hasTruncationOnMobile, headerProps, hideContributorBio, hideRecircList, hideRecircMostPopular, hierarchy, shouldEnableVMG, interactiveOverride, isAffiliateLinksDisabled, lang, langTranslations, customHeading = {}, recircs = [], recircMostPopular, recircRelated, midRecircItems, relatedVideo, interlude, isHeroAdVisible, isLicensedPartner, licensedPartnerLink, magazineDisclaimer, paddingTop, tagCloud, newsletter, shouldUsePersistentAd, showAgeGate, showBookmark, showBreadcrumbTrail, showHotelRecirc, signageConfig, isUpcEnabled, isLinkStackEnabled, shouldShowFooterNewsletter, shouldPrioritizeSeriesPagination, cnCoupons = [], hasAffiliateLinkDisabled, showDisclaimer, disclaimerText, disclaimerPosition }, communityExperience, showWriterBio = false, showFirstRailRecirc, attributes, className, componentConfig, config, shouldHideBaseTopPadding, shouldHideSeriesNavigation = true, shouldHideSeriesRecirc = true, shouldShowSeriesNavigationInFooter, pageBackgroundTheme, dividerColor, shouldEnableArticleBackground = false, shouldEnableFullArticleInverted = false, shouldInheritDropcapColor = false, showLinkStackInsideContentBody = false, featureFlags, hasLightbox = false, hasChannelNavigation, hideSideBySideViewOnMobile, showContributor, showContributorSpotlight, cartoonVariation = 'default', hasRecircDriver, recircMostPopularVariationOnMobile, linkList, related = [], metadataVideo = {}, productCarousel = {}, user, hasNewsletterForABTest, intl, xlargePaddingTop, articleVariationForXlargePaddingTop, beOp, hasDynamicDisclaimer, responsiveCartoonVariation, showGalleryCartoonPublishedDate = true, actionBarLargeScreenVariation, actionBarMobileScreenVariation, isActionBarStickyLargeScreen, actionBarButtons, showContributorImageOnMobile = true, showIssueDateInArticle = false, hasLinkbannerCrossSlideAnimation, showEnhancedTextOverlay, minWordCountForMidRecirc, shouldShowMidArticleRecirc, shouldHideInlineRecirc, isMobileDevice, showExperimentPlaceholder = false, headerComponent = 'ContentHeader', oneCover, visualStoryBanner } = this.props;
        const { enableCommunityExperience } = communityExperience;
        const bookmark = config?.account?.bookmark;
        const enableBookmarkDrawers = bookmark?.enableBookmarkDrawers || false;
        const disclaimer = disclaimerText || intl.formatMessage(translations.defaultDisclaimer);
        const pageBackgroundColor = shouldEnableArticleBackground
            ? pageBackgroundTheme
            : undefined;
        const borderColorTheme = shouldEnableArticleBackground
            ? dividerColor
            : undefined;
        const { hideNav, articleLength } = this.state;
        // if the newsletter for the A/B test is present, hide the newsletter in the footer
        // if not, go off of hasNewsletterInBody
        const shouldHideNewsletter = hasNewsletterForABTest
            ? true
            : hasNewsletterInBody;
        // function to change content header variation to `TextOverlayWithLogo`
        const setContentHeaderLogoVariationWithLogo = () => {
            const contentHeaderSettings = get(componentConfig, 'ContentHeader.settings');
            const additionalContentHeaderSettings = {
                showLogo: true,
                hideContributors: false,
                hidePublishDate: true,
                hideRubric: false,
                hideShareButtons: true
            };
            set(componentConfig, 'ContentHeader.variation', 'TextOverlayWithLogo');
            set(componentConfig, 'ContentHeader.settings', {
                ...contentHeaderSettings,
                ...additionalContentHeaderSettings
            });
        };
        const { hasContentHeaderLogo, isFullBleedVideo } = headerProps;
        // call `setContentHeaderLogoVariationWithLogo`, if `headerProps.hasContentHeaderLogo` is true
        hasContentHeaderLogo && setContentHeaderLogoVariationWithLogo();
        const contributors = hideContributorBio
            ? undefined
            : headerProps.contributors;
        const { hasNativeShareButton, hasNewsletterOnPageTop, hasNewsletterWithoutWrapper, shouldEnableNativeShareOnDesktop, shouldRemoveBackgroundColor, enableEnhancedCartoonExperience, enableEnhancedArticleHeader, enableActionBar, variations, showFullBleedBelow, cneVideoEmbedProps, enableBookmarking } = featureFlags;
        const articlePageContentBackGroundProps = {};
        let paywallCollaboratorProps = {};
        const contentHeaderVariation = get(componentConfig, 'ContentHeader.variation');
        const ArticleIssueDate = () => {
            if (headerProps.issueDate) {
                return (React.createElement(ArticlePageIssueDate, null,
                    intl.formatMessage(translations.publishedInThe),
                    ` ${headerProps.issueDate} `));
            }
            return null;
        };
        const additionalHeaderProps = generateHeaderProps(enableEnhancedArticleHeader, enableActionBar, contentHeaderVariation, {
            showContributorImageOnMobile,
            showEnhancedTextOverlay
        });
        if (isContentHeaderVariationInACDC(contentHeaderVariation) ||
            isContentHeaderTextOverlay(contentHeaderVariation, showEnhancedTextOverlay)) {
            articlePageContentBackGroundProps.hasReducedBackgroundSpacing =
                showIssueDateInArticle;
            paywallCollaboratorProps = {
                ...(showIssueDateInArticle && {
                    articleIssueDateComponent: React.createElement(ArticleIssueDate, null)
                })
            };
        }
        const embedResponsiveCartoonVariation = enableEnhancedCartoonExperience
            ? 'InlineCartoon'
            : responsiveCartoonVariation;
        const GeneralContentWrapper = getContentFooterWrapper(componentConfig, {
            type: 'article'
        });
        const prefetchAccountSignInPage = () => !user.isAuthenticated && user.hasUserAuthCheck;
        const isNarrow = get(componentConfig, 'ChunkedArticleContent.variation') ===
            'OneColumnNarrow';
        const DisclaimerWrapper = Grid.DynamicGrid({
            startColumn: 2,
            endColumn: 12
        });
        const showChannelCloud = () => get(componentConfig, 'ChannelCloud.settings.shouldShowChannelCloud', false) && channelCloudData?.channels?.length > 0;
        const recircListElements = recircs.map((list, i) => {
            const ConfiguredRecircList = asConfiguredComponent(RecircList, list.displayName);
            const heading = list.heading || '';
            const { results, destinationPage, location, recommendedClickout, recommendedType } = list;
            return hasRecircDriver && destinationPage ? (React.createElement(SummaryCollectionSplitColumns, { key: `SummaryCollectionSplitColumns${i}`, recommendedItems: {
                    items: results,
                    recommendedType,
                    recommendedClickout
                }, guideItem: [destinationPage], location: location, shouldAppendReadMoreLinkForDek: true })) : (React.createElement(ConnectedErrorBoundary, { key: `ConnectedErrorBoundary${i}` },
                React.createElement(ConfiguredRecircList, { related: list.related, heading: heading, dividerColor: borderColorTheme, shouldEnableFullArticleInverted: shouldEnableFullArticleInverted })));
        });
        const togglePaddingTop = contentHeaderVariation === articleVariationForXlargePaddingTop &&
            xlargePaddingTop
            ? xlargePaddingTop
            : paddingTop;
        const beOpAccountID = beOp?.accountID || '';
        const isBeOpEnable = beOp?.isEnabled || false;
        const additionalNavigation = hasChannelNavigation && React.createElement(ChannelNavigation, null);
        const isadRail = get(componentConfig, 'ChunkedArticleContent.variation') === 'WithAdRail';
        /* eslint-disable-next-line react/prop-types */
        const ContentWrapper = ({ children }) => (React.createElement(ContentWrapperGrid, { isadRail: isadRail, as: GeneralContentWrapper },
            React.createElement("div", { className: "body body__container" },
                React.createElement("div", { className: "container container--body" },
                    React.createElement("div", { className: "container--body-inner" }, children)))));
        const shouldOverrideContentHeader = getOverrideBehaviour(interactiveOverride) === 'articleheader';
        const sponsoredProps = get(headerProps, 'sponsoredContentHeaderProps');
        return (React.createElement(ArticlePageBase, { additionalNavigation: additionalNavigation, attributes: attributes, shouldEnableFullArticleInverted: shouldEnableFullArticleInverted, channelMap: channelMap, className: classnames('page--article', className), config: config, featureFlags: featureFlags, hideNav: hideNav, hasContentHeaderLogo: hasContentHeaderLogo, hasEventBannerHidden: hasEventBannerHidden, hasInvertedHeadertheme: hasInvertedHeadertheme, hasFooterAdsMargins: true, interactiveOverride: interactiveOverride, isHeroAdVisible: isHeroAdVisible, hasBaseAds: true, user: user, lang: lang, customHeading: customHeading, shouldHideBaseTopPadding: shouldHideBaseTopPadding, shouldPrioritizeSeriesPagination: shouldPrioritizeSeriesPagination, pageBackgroundTheme: pageBackgroundColor, hasLinkbannerCrossSlideAnimation: (isContentHeaderTextOverlay(contentHeaderVariation, showEnhancedTextOverlay) ||
                isContentHeaderVariationInACDC(contentHeaderVariation)) &&
                hasLinkbannerCrossSlideAnimation },
            isBeOpEnable && React.createElement(BeopScript, { accountId: beOpAccountID }),
            React.createElement(I18nProvider, { locale: lang, translations: langTranslations },
                showBookmark && React.createElement(SignInModal, null),
                disclaimerPosition === 'top' && showDisclaimer && (React.createElement(Row, null,
                    React.createElement(DisclaimerWrapper, null,
                        React.createElement(Disclaimer, { disclaimerHtml: disclaimer, hasTopRule: false, contentAlign: "center" })))),
                showBreadcrumbTrail && (React.createElement(BreadcrumbTrail, { hierarchy: hierarchy, shouldRemoveBackgroundColor: shouldRemoveBackgroundColor })),
                React.createElement("article", { className: classnames('article main-content', {
                        'article--inherited-dropcaps': shouldInheritDropcapColor
                    }), lang: lang },
                    hasNewsletterOnPageTop && newsletter && (React.createElement(ConnectedNewsletterSubscribeForm, { ...newsletter, position: "article-page-top" })),
                    headerProps.sponsoredContentHeaderProps && (React.createElement(SponsoredContentHeader, { ...headerProps.sponsoredContentHeaderProps, className: "light-theme" })),
                    shouldOverrideContentHeader ? (React.createElement("div", { className: "interactive-override-container interactive-override-container--content_header", dangerouslySetInnerHTML: {
                            __html: interactiveOverride.markup
                        } })) : (React.createElement(ArticlePageLedeBackground, { ref: this.pageContentEl },
                        React.createElement(GrowthBookReadyContext, null, ({ isGBInitialized }) => {
                            const finalHeader = () => renderHeader(headerComponent, {
                                oneCover,
                                headerProps,
                                type: 'article',
                                additionalHeaderProps,
                                enableEnhancedArticleHeader,
                                hasNativeShareButton,
                                shouldEnableNativeShareOnDesktop,
                                isFullBleedVideo,
                                hasLightbox,
                                interactiveOverride,
                                metadataVideo,
                                showBreadCrumb: showBreadcrumbTrail
                            });
                            return renderHeaderOrPlaceholder({
                                showExperimentPlaceholder,
                                renderHeader: finalHeader,
                                isGBInitialized
                            });
                        }))),
                    !shouldHideSeriesNavigation &&
                        !shouldShowSeriesNavigationInFooter && (React.createElement(SeriesNavigation, { className: "article__series-navigation", pageBackgroundTheme: pageBackgroundColor, dividerColor: borderColorTheme })),
                    React.createElement(ArticlePageContentBackGround, { togglePaddingTop: togglePaddingTop, isMobileTruncated: this.state.isMobileTruncated, cartoonVariation: cartoonVariation, "data-attribute-verso-pattern": "article-body", enableActionBar: enableActionBar, className: "article-body__content", ...articlePageContentBackGroundProps, ref: this.articleWrapperRef },
                        enableActionBar && actionBarButtons && (React.createElement(PhotoBookmarkingProvider, { isPhotoBookmarkingEnabled: enableBookmarking, theme: "standard" },
                            React.createElement(ActionBarWrapper, { actionBarLargeScreenVariation: actionBarLargeScreenVariation, actionBarMobileScreenVariation: actionBarMobileScreenVariation, isActionBarStickyLargeScreen: isActionBarStickyLargeScreen, actionBarButtons: actionBarButtons, articleLength: articleLength, showActionBar: enableActionBar, shouldEnableBookmarkDrawers: enableBookmarkDrawers, image: headerProps.lede }))),
                        hasTruncationOnMobile && this.state.isMobileTruncated && (React.createElement(ArticlePageBodyMobileTruncatedBtn, { inputKind: "button", label: intl.formatMessage(translations.truncatedButtonLabel), onClickHandler: this.onTruncationDismiss })),
                        showChannelCloud() && (React.createElement(Grid.ContentWithAdRailNarrow, null,
                            React.createElement("div", null,
                                React.createElement(ChannelCloud, { ...channelCloudData, ...get(componentConfig, 'ChannelCloud.settings') })))),
                        body && (React.createElement(PaywallCollaborator, { body: body, linkList: linkList, isLinkStackEnabled: isLinkStackEnabled && showLinkStackInsideContentBody, isMobileDevice: isMobileDevice, component: this.TruncatedChunkedArticleContent, contributors: contributors, hasTopSpacing: !!headerProps.lede, interlude: interlude, isAffiliateLinksDisabled: isAffiliateLinksDisabled, name: "chunked-article-content", shouldUsePersistentAd: shouldUsePersistentAd, recircMostPopularVariationOnMobile: recircMostPopularVariationOnMobile, hideRecircMostPopular: hideRecircMostPopular, shouldEnableArticleBackground: shouldEnableArticleBackground, shouldEnableFullArticleInverted: shouldEnableFullArticleInverted, pageBackgroundTheme: pageBackgroundColor, dividerColor: borderColorTheme, recircMostPopular: recircMostPopular, showFirstRailRecirc: showFirstRailRecirc, tagCloud: tagCloud, responsiveCartoonVariation: embedResponsiveCartoonVariation, hasCartoonFullWidth: enableEnhancedCartoonExperience, setCartoonLinkedGalleries: this.setCartoonLinkedGalleries, hasAffiliateLinks: hasAffiliateLinks, ...paywallCollaboratorProps, showDisclaimer: showDisclaimer, disclaimer: disclaimer, disclaimerPosition: disclaimerPosition, shouldHideInlineRecirc: shouldHideInlineRecirc, visualStoryBanner: visualStoryBanner, ...(shouldShowMidArticleRecirc && {
                                midRecircItems,
                                minWordCountForMidRecirc
                            }) })),
                        body && (React.createElement(ContentWrapper, null,
                            React.createElement(InlineBarrier, null)))),
                    !shouldHideSeriesRecirc && (React.createElement(SeriesRecirc, { ContentWrapper: ContentWrapper }))),
                isBeOpEnable && (React.createElement(ContentWrapper, null,
                    React.createElement("div", { className: "BeOpWidget" }))),
                showFullBleedBelow && (React.createElement(React.Fragment, null,
                    React.createElement(ContentHeader
                    // eslint-disable-next-line react/forbid-component-props
                    , { 
                        // eslint-disable-next-line react/forbid-component-props
                        variations: variations, isFullBleedVideo: showFullBleedBelow, cneVideoEmbedProps: cneVideoEmbedProps }))),
                disclaimerPosition === 'bottom' && showDisclaimer && (React.createElement(ArticlePageDisclaimerGrid, { as: GeneralContentWrapper },
                    React.createElement(ArticlePageDisclaimer, { disclaimerHtml: disclaimer, hasTopRule: false }))),
                Object.keys(productCarousel).length > 0 && (React.createElement(MultiPackageRow, { key: "articleCarouselProduct", dataJourneyHook: "row-content" },
                    React.createElement(VersoFilterableSummaryList, { isUpcEnabled: isUpcEnabled, ...productCarousel, hasAffiliateLinkDisabled: hasAffiliateLinkDisabled, copilotId: id }))),
                enableCommunityExperience && (React.createElement(Commenting, { hed: headerProps.dangerousHed, id: id })),
                React.createElement(ArticlePageContentFooterGrid, { as: ContentFooter, className: classnames('article-body__footer', {
                        'content-footer--mobile-truncated': this.state.isMobileTruncated
                    }), channelMap: channelMap, consumerMarketing: { position: 'article-footer' }, shouldEnableFullArticleInverted: shouldEnableFullArticleInverted, ContentWrapper: GeneralContentWrapper, contributors: contributors, contributorSpotlight: contributorSpotLightProps, showWriterBio: showWriterBio, hideContributorBio: hideContributorBio, showContributorSpotlight: showContributorSpotlight, showContributor: showContributor, hideRecircList: hideRecircList, hasNewsletterWithoutWrapper: hasNewsletterWithoutWrapper, isLicensedPartner: isLicensedPartner, isLinkStackEnabled: isLinkStackEnabled && !showLinkStackInsideContentBody, isNarrow: isNarrow, isAdRail: isadRail, licensedPartnerLink: licensedPartnerLink, linkList: linkList, magazineDisclaimer: magazineDisclaimer, newsletter: user.isAuthenticated ? this.state.newsletterData : newsletter, recircs: recircs, recircListElements: recircListElements, dividerColor: borderColorTheme, related: related, recircRelated: recircRelated, relatedVideo: relatedVideo, showNewsletter: shouldShowFooterNewsletter || !shouldHideNewsletter, showHotelRecirc: showHotelRecirc, signageConfig: signageConfig, tagCloud: tagCloud, shouldEnableVMG: shouldEnableVMG, cnCoupons: cnCoupons, sponsoredProps: sponsoredProps, hasDynamicDisclaimer: hasDynamicDisclaimer, shouldShowSeriesNavigationInFooter: !shouldHideSeriesNavigation && shouldShowSeriesNavigationInFooter, pageBackgroundTheme: pageBackgroundColor, currentPage: "article" }),
                showAgeGate && React.createElement(AgeGate, { content: { contentWarnings } }),
                prefetchAccountSignInPage() && (React.createElement(ResourceHint, { as: "document", hint: "prefetch", href: "/account/sign-in" }))),
            enableEnhancedCartoonExperience && (React.createElement(GenericModal, { closeModalText: intl.formatMessage(translations.backToArticle) },
                React.createElement(GalleryCarousel, { id: this.state.sliderData.id, items: this.state.sliderData.items, showPublishedDate: showGalleryCartoonPublishedDate, responsiveCartoonVariation: "SliderCartoon", title: this.state.sliderData?.source?.hed, titleLinkURL: this.state.sliderData?.url, shouldUseModalStyle: true, carouselPlacedIn: "modal", showHeadRecirc: true, showNewsletter: true }))),
            React.createElement(ArticlePageGlobalStyle, { pageBackgroundTheme: pageBackgroundColor, dividerColor: borderColorTheme, shouldEnableFullArticleInverted: shouldEnableFullArticleInverted, hideSideBySideViewOnMobile: hideSideBySideViewOnMobile, isUpcEnabled: isUpcEnabled })));
    }
}
ArticlePage.propTypes = {
    actionBarButtons: PropTypes.arrayOf(PropTypes.oneOf(['audio', 'bookmark', 'comments'])),
    actionBarLargeScreenVariation: PropTypes.oneOf(getVariationNames(ActionBar)),
    actionBarMobileScreenVariation: PropTypes.oneOf(getVariationNames(ActionBar)),
    article: PropTypes.shape({
        body: PropTypes.array,
        channelCloudData: PropTypes.object,
        cnCoupons: PropTypes.array,
        contributorSpotLightProps: PropTypes.object,
        hasAffiliateLinks: PropTypes.boolean,
        channelMap: PropTypes.object,
        contentWarnings: PropTypes.array,
        customHeading: PropTypes.object,
        disclaimerText: PropTypes.string,
        disclaimerPosition: PropTypes.string,
        hasAffiliateLinkDisabled: PropTypes.bool,
        hasEventBannerHidden: PropTypes.bool,
        hasInvertedHeadertheme: PropTypes.bool,
        hasNewsletterInBody: PropTypes.bool,
        hasTruncationOnMobile: PropTypes.bool,
        headerProps: PropTypes.object.isRequired,
        hideContributorBio: PropTypes.bool,
        hideRecircList: PropTypes.bool,
        hideRecircMostPopular: PropTypes.bool,
        hierarchy: PropTypes.array,
        id: PropTypes.string,
        interactiveOverride: PropTypes.shape({
            markup: PropTypes.string,
            behavior: PropTypes.string
        }),
        interlude: PropTypes.shape({
            ...CNEInterludeEmbed.propTypes,
            isRailEligible: PropTypes.boolean
        }),
        isAffiliateLinksDisabled: PropTypes.bool,
        isHeroAdVisible: PropTypes.bool.isRequired,
        isLicensedPartner: PropTypes.bool,
        isLinkStackEnabled: PropTypes.bool,
        isUpcEnabled: PropTypes.bool,
        lang: PropTypes.string,
        langTranslations: PropTypes.object,
        licensedPartnerLink: PropTypes.string,
        lightboxImages: PropTypes.array.isRequired,
        magazineDisclaimer: PropTypes.shape({
            issueDate: PropTypes.string.isRequired,
            issueLink: PropTypes.string.isRequired,
            originalHed: PropTypes.string
        }),
        midRecircItems: PropTypes.array,
        newsletter: PropTypes.object,
        newsletterModules: PropTypes.array,
        paddingTop: PropTypes.oneOf(['large']),
        pageStructure: PropTypes.array,
        recircs: PropTypes.array,
        recircMostPopular: PropTypes.array,
        recircRelated: PropTypes.array,
        relatedVideo: PropTypes.shape({
            brand: PropTypes.string,
            related: PropTypes.any,
            useRelatedVideo: PropTypes.bool
        }),
        shouldPrioritizeSeriesPagination: PropTypes.bool,
        shouldShowFooterNewsletter: PropTypes.bool,
        shouldUsePersistentAd: PropTypes.bool,
        shouldEnableVMG: PropTypes.bool,
        showAgeGate: PropTypes.bool,
        showBookmark: PropTypes.bool,
        showBreadcrumbTrail: PropTypes.bool,
        showDisclaimer: PropTypes.bool,
        showHotelRecirc: PropTypes.bool,
        signageConfig: PropTypes.object,
        tagCloud: PropTypes.shape({
            tags: PropTypes.arrayOf(PropTypes.shape({
                tag: PropTypes.string.isRequired,
                url: PropTypes.string
            }))
        })
    }).isRequired,
    articleVariationForXlargePaddingTop: PropTypes.string,
    attributes: PropTypes.object,
    beOp: PropTypes.shape({
        accountID: PropTypes.string,
        isEnabled: PropTypes.boolean
    }),
    cartoonVariation: PropTypes.oneOf(['default', 'card']),
    className: PropTypes.string,
    communityExperience: PropTypes.shape({
        enableCommunityExperience: PropTypes.bool
    }),
    componentConfig: PropTypes.object,
    config: PropTypes.object,
    dividerColor: PropTypes.string,
    featureFlags: PropTypes.object,
    hasChannelNavigation: PropTypes.bool,
    hasDynamicDisclaimer: PropTypes.bool,
    hasDynamicNewsletterSignup: PropTypes.bool,
    hasLightbox: PropTypes.bool,
    hasLinkbannerCrossSlideAnimation: PropTypes.bool,
    hasNewsletterForABTest: PropTypes.bool,
    hasRecircDriver: PropTypes.bool,
    hasSlideShow: PropTypes.bool,
    headerComponent: PropTypes.string,
    hideNav: PropTypes.bool,
    hideSideBySideViewOnMobile: PropTypes.bool,
    intl: PropTypes.object,
    isActionBarStickyLargeScreen: PropTypes.bool,
    isMobileDevice: PropTypes.bool,
    linkList: PropTypes.object,
    metadataVideo: PropTypes.shape({
        isLive: PropTypes.bool,
        premiereDate: PropTypes.string,
        series: PropTypes.string,
        videoLength: PropTypes.number,
        premiereGap: PropTypes.number
    }),
    minWordCountForMidRecirc: PropTypes.number,
    oneCover: OneCoverConfigPropTypes,
    pageBackgroundTheme: PropTypes.string,
    productCarousel: PropTypes.object,
    recircMostPopularVariationOnMobile: PropTypes.oneOf(getVariationNames(RecircMostPopular)),
    related: PropTypes.array,
    responsiveCartoonVariation: PropTypes.oneOf(getVariationNames(ResponsiveCartoon)),
    reviewerInfoText: PropTypes.string,
    shouldEnableArticleBackground: PropTypes.bool,
    shouldEnableFullArticleInverted: PropTypes.bool,
    shouldHideBaseTopPadding: PropTypes.bool,
    shouldHideInlineRecirc: PropTypes.bool,
    shouldHideSeriesNavigation: PropTypes.bool,
    shouldHideSeriesRecirc: PropTypes.bool,
    shouldInheritDropcapColor: PropTypes.bool,
    shouldShowMidArticleRecirc: PropTypes.bool,
    shouldShowSeriesNavigationInFooter: PropTypes.bool,
    showContributor: PropTypes.bool,
    showContributorImageOnMobile: PropTypes.bool,
    showContributorSpotlight: PropTypes.bool,
    showEnhancedTextOverlay: PropTypes.bool,
    showExperimentPlaceholder: PropTypes.string,
    showFirstRailRecirc: PropTypes.bool,
    showGalleryCartoonPublishedDate: PropTypes.bool,
    showIssueDateInArticle: PropTypes.bool,
    showLinkStackInsideContentBody: PropTypes.bool,
    showWriterBio: PropTypes.bool,
    signInHed: PropTypes.string,
    signInHedSpanTag: PropTypes.string,
    signInMessage: PropTypes.string,
    slideShowVariation: PropTypes.string,
    user: PropTypes.object,
    userPlatform: PropTypes.object,
    visualStoryBanner: PropTypes.object,
    xlargePaddingTop: PropTypes.string
};
ArticlePage.displayName = 'ArticlePage';
module.exports = connector(injectIntl(ArticlePage), {
    keysToPluck: [
        'article',
        'beOp',
        'componentConfig',
        'config',
        'featureFlags',
        'linkList',
        'metadataVideo',
        'productCarousel',
        'related',
        'showFirstRailRecirc',
        'user',
        'userPlatform',
        'communityExperience',
        'visualStoryBanner'
    ]
});
//# sourceMappingURL=ArticlePage.js.map

/***/ }),

/***/ 19266:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const ArticlePage = __webpack_require__(70935);
const { asConfiguredComponent } = __webpack_require__(12892);
module.exports = asConfiguredComponent(ArticlePage, 'ArticlePage');
//# sourceMappingURL=index.js.map

/***/ }),

/***/ 17848:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const react_intl_1 = __webpack_require__(46984);
exports.A = (0, react_intl_1.defineMessages)({
    truncatedButtonLabel: {
        id: 'ArticlePage.TruncatedButtonLabel',
        defaultMessage: 'Read Full Story',
        description: 'ArticlePage component truncated button label'
    },
    backToArticle: {
        id: 'ArticlePage.Back to article',
        defaultMessage: 'Back to article',
        description: 'Gallery slider back button text'
    },
    publishedInThe: {
        id: 'ArticlePage.From the issue of',
        defaultMessage: 'From the issue of',
        description: 'Article page date text'
    },
    defaultDisclaimer: {
        id: 'ArticlePage.DefaultDisclaimer',
        defaultMessage: 'All products are independently selected by our editors. If you buy something, we may earn an affiliate commission.',
        description: 'Default disclaimer for Article page'
    }
});
//# sourceMappingURL=translations.js.map

/***/ }),

/***/ 63155:
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
const article_page_1 = __importDefault(__webpack_require__(19266));
const bootstrap_client_app_entry_1 = __importDefault(__webpack_require__(41782));
(0, bootstrap_client_app_entry_1.default)(article_page_1.default);
//# sourceMappingURL=client.entry.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__webpack_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__webpack_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__webpack_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			8659: 0
/******/ 		};
/******/ 		
/******/ 		// no chunk on demand loading
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		__webpack_require__.O.j = (chunkId) => (installedChunks[chunkId] === 0);
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 			return __webpack_require__.O(result);
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = globalThis["webpackChunkverso"] = globalThis["webpackChunkverso"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/nonce */
/******/ 	(() => {
/******/ 		__webpack_require__.nc = undefined;
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 	var __webpack_exports__ = __webpack_require__.O(undefined, [3796,2181,2641,2439,531,1782,1063,4721,6667], () => (__webpack_require__(63155)))
/******/ 	__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 	
/******/ })()
;