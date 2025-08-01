// main-site/script.js - FINAL, PRODUCTION-READY & FULLY CORRECTED

'use strict';

document.addEventListener('DOMContentLoaded', function() {
    console.log('[MAIN-SITE] script.js loaded. Initializing freemium model.');

    // --- Configuration Constants ---
    const POPUP_FADE_DURATION_MS = 300;
    const POPUP_TRANSITION_DELAY_MS = 50;
    const LEAD_FORM_SUCCESS_MESSAGE_DURATION_MS = 2000;
    const GUEST_USAGE_LIMIT = 25; // The single source of truth for the usage limit
    const IFRAME_TARGET_ORIGIN = window.origin;

    // --- DOM Element References ---
    const mainPopupContainer = document.getElementById('main-popup-container');
    const formMessage = document.getElementById('form-message');
    const cookieConsentContent = document.getElementById('cookie-consent-content');
    const acceptCookiesBtn = document.getElementById('accept-cookies');
    const leadCaptureContent = document.getElementById('lead-capture-content');
    const closeLeadFormBtn = document.getElementById('close-lead-form');
    const leadCaptureForm = document.getElementById('lead-capture-form-main');

    // =========================================================================
    // --- POP-UP & FORM HANDLER FUNCTIONS ---
    // =========================================================================

    const handleLeadFormSuccess = () => {
        if (formMessage) {
            formMessage.style.color = '#28a745';
            formMessage.textContent = 'Thank you! We\'ve received your submission.';
            setTimeout(hidePopup, LEAD_FORM_SUCCESS_MESSAGE_DURATION_MS);
        }
    };

    const handleLeadFormFailure = (error) => {
        if (error) {
            console.error('[MAIN-SITE] Lead capture form submission error:', error);
        }
        if (formMessage) {
            formMessage.style.color = '#dc3545';
            formMessage.textContent = 'Oops! There was a problem submitting the form.';
        }
    };

    const handleLeadFormSubmit = async(event) => {
        event.preventDefault();
        try {
            const formData = new FormData(event.target);
            const response = await fetch(leadCaptureForm.action, {
                method: 'POST', body: formData, headers: { 'Accept': 'application/json' },
            });
            if (response.ok) {
                handleLeadFormSuccess();
            } else {
                handleLeadFormFailure();
            }
        } catch (error) {
            handleLeadFormFailure(error);
        }
    };

    const showPopup = (contentToShow) => {
        if (mainPopupContainer) {
            if (cookieConsentContent) { cookieConsentContent.style.display = 'none'; }
            if (leadCaptureContent) { leadCaptureContent.style.display = 'none'; }
            if (contentToShow === 'cookie' && cookieConsentContent) {
                cookieConsentContent.style.display = 'block';
            } else if (contentToShow === 'lead' && leadCaptureContent) {
                leadCaptureContent.style.display = 'block';
            }
            mainPopupContainer.style.display = 'flex';
            setTimeout(() => {
                if (mainPopupContainer) {
                    mainPopupContainer.classList.add('visible');
                }
            }, POPUP_TRANSITION_DELAY_MS);
        }
    };

    const hidePopup = () => {
        if (mainPopupContainer) {
            mainPopupContainer.classList.remove('visible');
            setTimeout(() => {
                if (mainPopupContainer) {
                    mainPopupContainer.style.display = 'none';
                }
                if (cookieConsentContent) { cookieConsentContent.style.display = 'none'; }
                if (leadCaptureContent) { leadCaptureContent.style.display = 'none'; }
            }, POPUP_FADE_DURATION_MS);
        }
    };

    const handleLeadCaptureDisplay = () => {
        const hasAcceptedCookies = localStorage.getItem('cookiesAccepted') === 'true';
        const hasCapturedLeadThisSession = sessionStorage.getItem('leadCapturedThisSession') === 'true';
        if (hasAcceptedCookies && !hasCapturedLeadThisSession) {
            showPopup('lead');
            sessionStorage.setItem('leadCapturedThisSession', 'true');
        } else {
            hidePopup();
        }
    };

    const handleAcceptCookies = () => {
        localStorage.setItem('cookiesAccepted', 'true');
        hidePopup();
        setTimeout(handleLeadCaptureDisplay, POPUP_FADE_DURATION_MS);
    };

    // =========================================================================
    // --- JARVIS & IFRAME COMMUNICATION ---
    // =========================================================================

    const loadJarvisApp = () => {
        console.log('[MAIN-SITE] loadJarvisApp called. Starting boot sequence.');
        const BOOT_SEQUENCE = [ { text: 'Initializing cognitive core...', delay: 500 }, { text: 'Calibrating neural matrix...', delay: 700 }, { text: 'Quantum processors spooling...', delay: 400 }, { text: 'Establishing secure comms link...', delay: 800 }, { text: 'Welcome, Administrator.', delay: 1000 }, ];
        const BOOT_FADE_OUT_DURATION_MS = 500;
        const jarvisIframe = document.getElementById('jarvis-iframe');
        const bootOverlay = document.getElementById('jarvis-boot-overlay');
        const bootTextElement = document.getElementById('boot-text');
        const bootCursor = document.getElementById('boot-cursor');

        if (!bootOverlay || !bootTextElement || !jarvisIframe || !bootCursor) {
            console.error('[MAIN-SITE] Critical boot sequence elements are missing.');
            return;
        }

        jarvisIframe.style.display = 'none';
        bootOverlay.style.display = 'flex';
        bootTextElement.innerHTML = '';
        bootCursor.style.display = 'inline-block';

        let sequenceIndex = 0;
        const typeNextLine = () => {
            if (sequenceIndex >= BOOT_SEQUENCE.length) {
                finishBootSequence();
                return;
            }
            const currentLine = BOOT_SEQUENCE[sequenceIndex];
            bootTextElement.innerHTML += currentLine.text + '\n';
            sequenceIndex++;
            setTimeout(typeNextLine, currentLine.delay);
        };

        const finishBootSequence = () => {
            bootCursor.style.display = 'none';
            setTimeout(() => {
                bootOverlay.style.opacity = '0';
                bootOverlay.style.transition = `opacity ${BOOT_FADE_OUT_DURATION_MS}ms ease-out`;
                setTimeout(() => {
                    bootOverlay.style.display = 'none';
                    jarvisIframe.src = '/jarvis-app/index.html';
                    jarvisIframe.style.display = 'block';
                    console.log('[MAIN-SITE] Boot sequence complete. Iframe loaded.');
                }, BOOT_FADE_OUT_DURATION_MS);
            }, BOOT_FADE_OUT_DURATION_MS);
        };
        typeNextLine();
    };

    const checkUserAuthentication = () => !!localStorage.getItem('authToken');

    const checkUsageLimit = () => {
        const storedCount = sessionStorage.getItem('guestUsageCount');
        const count = parseInt(storedCount || '0', 10);
        return (isNaN(count) ? 0 : count) >= GUEST_USAGE_LIMIT;
    };
    
    const sendAuthStatusToIframe = () => {
        const jarvisIframe = document.getElementById('jarvis-iframe');
        if (jarvisIframe && jarvisIframe.contentWindow) {
            const authPayload = {
                type: 'AUTH_STATUS_FROM_PARENT',
                isAuthenticated: checkUserAuthentication(),
                isUsageLimitReached: checkUsageLimit(),
            };
            console.log('[PARENT] Responding to signal. Sending payload:', authPayload);
            jarvisIframe.contentWindow.postMessage(authPayload, IFRAME_TARGET_ORIGIN);
        } else {
            console.error('[MAIN-SITE] Cannot send message: J.A.R.V.I.S. iframe not ready.');
        }
    };

    const handleGuestMessage = () => {
        const storedCount = sessionStorage.getItem('guestUsageCount');
        let count = parseInt(storedCount || '0', 10);
        count = isNaN(count) ? 0 : count;
        count++;
        sessionStorage.setItem('guestUsageCount', count.toString());
        console.log(`[PARENT] Guest message count incremented to: ${count}`);
        sendAuthStatusToIframe();
    };

    const setupParentMessageListener = () => {
        window.addEventListener('message', (event) => {
            if (event.origin !== IFRAME_TARGET_ORIGIN) {
                return;
            }
            if (event.data) {
                switch (event.data.type) {
                    case 'IFRAME_APP_READY':
                        console.log('[PARENT] Received ready signal from iframe.');
                        sendAuthStatusToIframe();
                        break;
                    case 'GUEST_MESSAGE_SENT':
                        console.log('[PARENT] Received guest message signal from iframe.');
                        handleGuestMessage();
                        break;
                    default:
                        break;
                }
            }
        });
    };

    const initializePopups = () => {
        if (localStorage.getItem('cookiesAccepted')) {
            handleLeadCaptureDisplay();
        } else {
            showPopup('cookie');
        }
        if (acceptCookiesBtn) {
            acceptCookiesBtn.addEventListener('click', handleAcceptCookies);
        }
        if (closeLeadFormBtn) {
            closeLeadFormBtn.addEventListener('click', hidePopup);
        }
        if (leadCaptureForm) {
            leadCaptureForm.addEventListener('submit', handleLeadFormSubmit);
        }
    };

    // =========================================================================
    // --- SCRIPT ENTRY POINT ---
    // =========================================================================
    setupParentMessageListener();
    initializePopups();
    loadJarvisApp();
});