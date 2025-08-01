// main-site/script.js - FINAL, REFACTORED, PRODUCTION-READY VERSION

'use strict';

/**
 * @file Manages the main website's client-side functionality.
 * @description This script handles the pop-up system, initializes the J.A.R.V.I.S.
 * application, and communicates authentication status to the iframe via postMessage.
 * It has been refactored to use standalone handler functions for all event listeners,
 * eliminating nested logic and ensuring compliance with strict, production-level
 * linting standards.
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('[MAIN-SITE] script.js loaded. Initializing freemium model.');

    // --- Configuration Constants ---
    const POPUP_FADE_DURATION_MS = 300;
    const POPUP_TRANSITION_DELAY_MS = 50;
    const LEAD_FORM_SUCCESS_MESSAGE_DURATION_MS = 2000;
    // The origin of the iframe content. Use window.origin if they are the same.
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
    // --- CORE HANDLER FUNCTIONS ---
    // =========================================================================

    /**
     * Handles the successful submission of the lead capture form.
     * @param {Response} response - The response object from the fetch call.
     */
    const handleLeadFormSuccess = (response) => {
        // GUARD CLAUSE: Exit if the message element doesn't exist.
        if (!formMessage) {
            return;
        }
        formMessage.style.color = '#28a745';
        formMessage.textContent = 'Thank you! We\'ve received your submission.';
        setTimeout(hidePopup, LEAD_FORM_SUCCESS_MESSAGE_DURATION_MS);
    };

    /**
     * Handles a failed submission of the lead capture form.
     * @param {Error} [error] - An optional error object from a thrown exception.
     */
    const handleLeadFormFailure = (error) => {
        if (error) {
            console.error('[MAIN-SITE] Lead capture form submission error:', error);
        }
        // GUARD CLAUSE: Exit if the message element doesn't exist.
        if (!formMessage) {
            return;
        }
        formMessage.style.color = '#dc3545';
        formMessage.textContent = 'Oops! There was a problem submitting the form.';
    };

    /**
     * An async function that manages the submission of the lead capture form.
     * @param {Event} event - The form submission event.
     */
    const handleLeadFormSubmit = async(event) => {
        event.preventDefault();
        try {
            const formData = new FormData(event.target);
            const response = await fetch(leadCaptureForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' },
            });

            if (response.ok) {
                handleLeadFormSuccess(response);
            } else {
                handleLeadFormFailure();
            }
        } catch (error) {
            handleLeadFormFailure(error);
        }
    };

    /**
     * Displays a specific pop-up content window (e.g., 'cookie' or 'lead').
     * @param {'cookie' | 'lead'} contentToShow - The type of content to display.
     */
    const showPopup = (contentToShow) => {
        if (!mainPopupContainer) {
            return;
        }
        if (cookieConsentContent) {
            cookieConsentContent.style.display = 'none';
        }
        if (leadCaptureContent) {
            leadCaptureContent.style.display = 'none';
        }
        if (contentToShow === 'cookie' && cookieConsentContent) {
            cookieConsentContent.style.display = 'block';
        } else if (contentToShow === 'lead' && leadCaptureContent) {
            leadCaptureContent.style.display = 'block';
        }
        mainPopupContainer.style.display = 'flex';
        setTimeout(() => mainPopupContainer.classList.add('visible'), POPUP_TRANSITION_DELAY_MS);
    };

    /**
     * Hides the main pop-up container with a fade-out animation.
     */
    const hidePopup = () => {
        if (!mainPopupContainer) {
            return;
        }
        mainPopupContainer.classList.remove('visible');
        setTimeout(() => {
            mainPopupContainer.style.display = 'none';
            if (cookieConsentContent) {
                cookieConsentContent.style.display = 'none';
            }
            if (leadCaptureContent) {
                leadCaptureContent.style.display = 'none';
            }
        }, POPUP_FADE_DURATION_MS);
    };

    /**
     * Determines whether to show the lead capture pop-up.
     */
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

    /**
     * Handles the click event for the 'Accept Cookies' button.
     */
    const handleAcceptCookies = () => {
        localStorage.setItem('cookiesAccepted', 'true');
        hidePopup();
        setTimeout(handleLeadCaptureDisplay, POPUP_FADE_DURATION_MS);
    };

    /**
     * Manages the boot-up animation and loads the Jarvis React application.
     */
    const loadJarvisApp = () => {
        console.log('[MAIN-SITE] loadJarvisApp called. Starting boot sequence.');
        const BOOT_SEQUENCE = [
            { text: 'Initializing cognitive core...', delay: 500 },
            { text: 'Calibrating neural matrix...', delay: 700 },
            { text: 'Quantum processors spooling...', delay: 400 },
            { text: 'Establishing secure comms link...', delay: 800 },
            { text: 'Welcome, Administrator.', delay: 1000 },
        ];
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
                    
                    // --- MODIFICATION: ATTACH ONLOAD HANDLER ---
                    // This ensures the auth status is sent only after the iframe is fully loaded.
                    jarvisIframe.onload = sendAuthStatusToIframe;

                    jarvisIframe.style.display = 'block';
                    console.log('[MAIN-SITE] Boot sequence complete. Iframe loaded.');
                }, BOOT_FADE_OUT_DURATION_MS);
            }, BOOT_FADE_OUT_DURATION_MS);
        };

        typeNextLine();
    };

    // --- NEW: AUTHENTICATION & IFRAME COMMUNICATION ---

    /**
     * [PLACEHOLDER] Checks the user's authentication status.
     * @returns {boolean} True if the user is authenticated, otherwise false.
     * @description **IMPORTANT**: Replace the logic inside this function with your
     * actual method for verifying a user's session (e.g., checking for a
     * valid JWT in localStorage or a secure HTTP-only cookie).
     */
    const checkUserAuthentication = () => {
        // Example: Check for a token in localStorage.
        const authToken = localStorage.getItem('authToken');
        return !!authToken; // Returns true if token exists, false otherwise.
    };

    /**
     * [PLACEHOLDER] Checks if the user has reached their usage limit.
     * @returns {boolean} True if the limit is reached, otherwise false.
     * @description **IMPORTANT**: Replace this with your actual logic for tracking
     * anonymous or free-tier usage (e.g., counting messages in sessionStorage).
     */
    const checkUsageLimit = () => {
        // Example: Check for a flag in sessionStorage.
        const limitReached = sessionStorage.getItem('usageLimitReached');
        return limitReached === 'true';
    };

    /**
     * Constructs and sends the authentication status payload to the J.A.R.V.I.S. iframe.
     */
    const sendAuthStatusToIframe = () => {
        const jarvisIframe = document.getElementById('jarvis-iframe');

        // Guard clause: Ensure the iframe and its contentWindow are available.
        if (!jarvisIframe || !jarvisIframe.contentWindow) {
            console.error('[MAIN-SITE] Cannot send message: J.A.R.V.I.S. iframe not ready.');
            return;
        }

        const authPayload = {
            type: 'AUTH_STATUS_FROM_PARENT', // A unique identifier for our message type.
            isAuthenticated: checkUserAuthentication(),
            isUsageLimitReached: checkUsageLimit(),
        };

        // Post the message to the iframe's window.
        jarvisIframe.contentWindow.postMessage(authPayload, IFRAME_TARGET_ORIGIN);
        console.log('[MAIN-SITE] Sent authentication status to J.A.R.V.I.S. iframe.', authPayload);
    };

    /**
     * Initializes the entire pop-up system on page load.
     */
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
    initializePopups();
    loadJarvisApp();
});