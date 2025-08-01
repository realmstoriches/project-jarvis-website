// main-site/script.js - FINAL, WITH HANDSHAKE PROTOCOL

'use strict';

document.addEventListener('DOMContentLoaded', function() {
    console.log('[MAIN-SITE] script.js loaded. Initializing freemium model.');

    // --- Configuration Constants ---
    const POPUP_FADE_DURATION_MS = 300;
    const POPUP_TRANSITION_DELAY_MS = 50;
    const LEAD_FORM_SUCCESS_MESSAGE_DURATION_MS = 2000;
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
    // --- CORE HANDLER FUNCTIONS (UNCHANGED) ---
    // =========================================================================
    const handleLeadFormSuccess = (response) => { if (!formMessage) return; formMessage.style.color = '#28a745'; formMessage.textContent = 'Thank you! We\'ve received your submission.'; setTimeout(hidePopup, LEAD_FORM_SUCCESS_MESSAGE_DURATION_MS); };
    const handleLeadFormFailure = (error) => { if (error) console.error('[MAIN-SITE] Lead capture form submission error:', error); if (!formMessage) return; formMessage.style.color = '#dc3545'; formMessage.textContent = 'Oops! There was a problem submitting the form.'; };
    const handleLeadFormSubmit = async(event) => { event.preventDefault(); try { const formData = new FormData(event.target); const response = await fetch(leadCaptureForm.action, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' }, }); if (response.ok) { handleLeadFormSuccess(response); } else { handleLeadFormFailure(); } } catch (error) { handleLeadFormFailure(error); } };
    const showPopup = (contentToShow) => { if (!mainPopupContainer) return; if (cookieConsentContent) cookieConsentContent.style.display = 'none'; if (leadCaptureContent) leadCaptureContent.style.display = 'none'; if (contentToShow === 'cookie' && cookieConsentContent) { cookieConsentContent.style.display = 'block'; } else if (contentToShow === 'lead' && leadCaptureContent) { leadCaptureContent.style.display = 'block'; } mainPopupContainer.style.display = 'flex'; setTimeout(() => mainPopupContainer.classList.add('visible'), POPUP_TRANSITION_DELAY_MS); };
    const hidePopup = () => { if (!mainPopupContainer) return; mainPopupContainer.classList.remove('visible'); setTimeout(() => { mainPopupContainer.style.display = 'none'; if (cookieConsentContent) cookieConsentContent.style.display = 'none'; if (leadCaptureContent) leadCaptureContent.style.display = 'none'; }, POPUP_FADE_DURATION_MS); };
    const handleLeadCaptureDisplay = () => { const hasAcceptedCookies = localStorage.getItem('cookiesAccepted') === 'true'; const hasCapturedLeadThisSession = sessionStorage.getItem('leadCapturedThisSession') === 'true'; if (hasAcceptedCookies && !hasCapturedLeadThisSession) { showPopup('lead'); sessionStorage.setItem('leadCapturedThisSession', 'true'); } else { hidePopup(); } };
    const handleAcceptCookies = () => { localStorage.setItem('cookiesAccepted', 'true'); hidePopup(); setTimeout(handleLeadCaptureDisplay, POPUP_FADE_DURATION_MS); };

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
        if (!bootOverlay || !bootTextElement || !jarvisIframe || !bootCursor) { console.error('[MAIN-SITE] Critical boot sequence elements are missing.'); return; }
        jarvisIframe.style.display = 'none'; bootOverlay.style.display = 'flex'; bootTextElement.innerHTML = ''; bootCursor.style.display = 'inline-block';
        let sequenceIndex = 0;
        const typeNextLine = () => { if (sequenceIndex >= BOOT_SEQUENCE.length) { finishBootSequence(); return; } const currentLine = BOOT_SEQUENCE[sequenceIndex]; bootTextElement.innerHTML += currentLine.text + '\n'; sequenceIndex++; setTimeout(typeNextLine, currentLine.delay); };
        const finishBootSequence = () => {
            bootCursor.style.display = 'none';
            setTimeout(() => {
                bootOverlay.style.opacity = '0';
                bootOverlay.style.transition = `opacity ${BOOT_FADE_OUT_DURATION_MS}ms ease-out`;
                setTimeout(() => {
                    bootOverlay.style.display = 'none';
                    // --- REMOVED ONLOAD HANDLER to prevent race condition
                    // jarvisIframe.onload = sendAuthStatusToIframe; 
                    jarvisIframe.src = '/jarvis-app/index.html';
                    jarvisIframe.style.display = 'block';
                    console.log('[MAIN-SITE] Boot sequence complete. Iframe loaded.');
                }, BOOT_FADE_OUT_DURATION_MS);
            }, BOOT_FADE_OUT_DURATION_MS);
        };
        typeNextLine();
    };

    const checkUserAuthentication = () => { const authToken = localStorage.getItem('authToken'); return !!authToken; };
    const checkUsageLimit = () => { const limitReached = sessionStorage.getItem('usageLimitReached'); return limitReached === 'true'; };
    
    const sendAuthStatusToIframe = () => {
        const jarvisIframe = document.getElementById('jarvis-iframe');
        if (!jarvisIframe || !jarvisIframe.contentWindow) { console.error('[MAIN-SITE] Cannot send message: J.A.R.V.I.S. iframe not ready.'); return; }
        const authPayload = { type: 'AUTH_STATUS_FROM_PARENT', isAuthenticated: checkUserAuthentication(), isUsageLimitReached: checkUsageLimit(), };
        console.log('[PARENT] Responding to ready signal. Sending payload:', authPayload);
        jarvisIframe.contentWindow.postMessage(authPayload, IFRAME_TARGET_ORIGIN);
    };

    /**
     * --- NEW: Listens for the "ready" message from the iframe before sending data.
     */
    const setupParentMessageListener = () => {
        window.addEventListener('message', (event) => {
            // Security: Ensure the message is from our iframe's origin
            if (event.origin !== IFRAME_TARGET_ORIGIN) {
                return;
            }
            // Check for the specific "ready" message from the iframe
            if (event.data && event.data.type === 'IFRAME_APP_READY') {
                console.log('[PARENT] Received ready signal from iframe.');
                sendAuthStatusToIframe();
            }
        });
    };

    const initializePopups = () => { if (localStorage.getItem('cookiesAccepted')) { handleLeadCaptureDisplay(); } else { showPopup('cookie'); } if (acceptCookiesBtn) { acceptCookiesBtn.addEventListener('click', handleAcceptCookies); } if (closeLeadFormBtn) { closeLeadFormBtn.addEventListener('click', hidePopup); } if (leadCaptureForm) { leadCaptureForm.addEventListener('submit', handleLeadFormSubmit); } };

    // =========================================================================
    // --- SCRIPT ENTRY POINT ---
    // =========================================================================
    setupParentMessageListener(); // Start listening for the iframe immediately.
    initializePopups();
    loadJarvisApp();
});