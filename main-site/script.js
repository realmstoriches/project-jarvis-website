// main-site/script.js - FINAL MERGED VERSION

// Wait for the entire HTML document to be ready before running any scripts.
document.addEventListener("DOMContentLoaded", function() {
    console.log("script.js loaded");

    // --- Get all necessary elements from the page ---
    const mainPopupContainer = document.getElementById("main-popup-container");
    const formMessage = document.getElementById("form-message");
    const cookieConsentContent = document.getElementById("cookie-consent-content");
    const acceptCookiesBtn = document.getElementById("accept-cookies");
    const leadCaptureContent = document.getElementById("lead-capture-content");
    const closeLeadFormBtn = document.getElementById("close-lead-form");
    const leadCaptureForm = document.getElementById("lead-capture-form") || document.getElementById("lead-capture-form-main");

    // --- Pop-up and Cookie Consent Functions ---
    const showPopup = (contentToShow) => {
        if (mainPopupContainer) {
            if (cookieConsentContent) {
                cookieConsentContent.style.display = "none";
            }
            if (leadCaptureContent) {
                leadCaptureContent.style.display = "none";
            }
            if (contentToShow === "cookie" && cookieConsentContent) {
                cookieConsentContent.style.display = "block";
            } else if (contentToShow === "lead" && leadCaptureContent) {
                leadCaptureContent.style.display = "block";
            }
            mainPopupContainer.style.display = "flex";
            setTimeout(() => {
                mainPopupContainer.classList.add("visible");
            }, 50);
        }
    };

    const hidePopup = () => {
        if (mainPopupContainer) {
            mainPopupContainer.classList.remove("visible");
            setTimeout(() => {
                mainPopupContainer.style.display = "none";
                if (cookieConsentContent) {
                    cookieConsentContent.style.display = "none";
                }
                if (leadCaptureContent) {
                    leadCaptureContent.style.display = "none";
                }
            }, 300);
        }
    };

    const handleLeadCaptureDisplay = () => {
        if (localStorage.getItem("cookiesAccepted") === "true" && !sessionStorage.getItem("leadCapturedThisSession")) {
            showPopup("lead");
            sessionStorage.setItem("leadCapturedThisSession", "true");
        } else {
            hidePopup();
        }
    };

    const initializePopups = () => {
        if (localStorage.getItem("cookiesAccepted")) {
            handleLeadCaptureDisplay();
        } else {
            showPopup("cookie");
        }
    };

    // --- Pop-up Event Listeners ---
    if (acceptCookiesBtn) {
        acceptCookiesBtn.addEventListener("click", () => {
            localStorage.setItem("cookiesAccepted", "true");
            hidePopup();
            setTimeout(handleLeadCaptureDisplay, 300);
        });
    }
    if (closeLeadFormBtn) {
        closeLeadFormBtn.addEventListener("click", hidePopup);
    }
    if (leadCaptureForm) {
        leadCaptureForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const formData = new FormData(event.target);
            try {
                const response = await fetch(leadCaptureForm.action, {
                    method: "POST",
                    body: formData,
                    headers: { "Accept": "application/json" }
                });
                if (formMessage) {
                    if (response.ok) {
                        formMessage.style.color = "#28a745";
                        formMessage.textContent = "Thank you! We've received your submission.";
                        setTimeout(() => {
                            hidePopup();
                        }, 2000);
                    } else {
                        formMessage.style.color = "#dc3545";
                        formMessage.textContent = "Oops! There was a problem.";
                    }
                }
            } catch (error) {
                if (formMessage) {
                    formMessage.style.color = "#dc3545";
                    formMessage.textContent = "Oops! There was a problem submitting the form.";
                }
            }
        });
    }

    // --- Initial Call for pop-up logic ---
    initializePopups();

    // =========================================================================
    // --- NEW: LOGIN BUTTON LOGIC ---
    // =========================================================================
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', (event) => {
            event.preventDefault();
            const jarvisIframe = document.getElementById('jarvis-iframe');
            const pricingTable = document.querySelector('stripe-pricing-table');
            const customerPortalSection = document.getElementById('customer-portal');
            console.log("Login button clicked. Loading auth screen.");

            if (pricingTable) pricingTable.style.display = 'none';
            if (customerPortalSection) customerPortalSection.style.display = 'none';
            
            if (jarvisIframe) {
                jarvisIframe.src = '/jarvis-app/index.html#/login';
                jarvisIframe.style.display = 'block';
            }
        });
    }

    /* ==========================================================================
       IFRAME AUTHENTICATION AND LOADING LOGIC
       ========================================================================== */
    const jarvisIframe = document.getElementById('jarvis-iframe');
    const pricingTable = document.querySelector('stripe-pricing-table');
    const customerPortalSection = document.getElementById('customer-portal');

    // --- REPLACED loadJarvisApp WITH THE "OMG" BOOT SEQUENCE VERSION ---
    const loadJarvisApp = () => {
        const bootOverlay = document.getElementById('jarvis-boot-overlay');
        const bootTextElement = document.getElementById('boot-text');
        const bootCursor = document.getElementById('boot-cursor');

        const bootSequence = [
            "Initializing cognitive core...", 500,
            "Calibrating neural matrix...", 700,
            "Quantum processors spooling...", 400,
            "Establishing secure comms link...", 800,
            "Welcome, Administrator.", 1000
        ];

        if (!bootOverlay || !bootTextElement || !jarvisIframe || !bootCursor) return;

        if (pricingTable) pricingTable.style.display = 'none';
        if (customerPortalSection) customerPortalSection.style.display = 'none';
        jarvisIframe.style.display = 'none';

        bootOverlay.style.display = 'flex';
        bootTextElement.innerHTML = '';
        bootCursor.style.display = 'inline-block';

        let i = 0;
        const typeWriter = () => {
            if (i < bootSequence.length) {
                const item = bootSequence[i];
                if (typeof item === 'string') {
                    bootTextElement.innerHTML += item + '\n';
                }
                const delay = typeof item === 'number' ? item : 200;
                i++;
                setTimeout(typeWriter, delay);
            } else {
                bootCursor.style.display = 'none';
                setTimeout(() => {
                    bootOverlay.style.opacity = '0';
                    bootOverlay.style.transition = 'opacity 0.5s ease-out';
                    setTimeout(() => {
                        bootOverlay.style.display = 'none';
                        jarvisIframe.src = '/jarvis-app/index.html';
                        jarvisIframe.style.display = 'block';
                    }, 500);
                }, 500);
            }
        };
        typeWriter();
    };

    const showSalesPage = () => {
        if (pricingTable) {
            pricingTable.style.display = 'block';
        }
        if (customerPortalSection) {
            customerPortalSection.style.display = 'block';
        }
        if (jarvisIframe) {
            jarvisIframe.style.display = 'none';
            jarvisIframe.src = 'about:blank';
        }
    };

    // --- The Main Authentication Check (Now calls the new loadJarvisApp) ---
    const authToken = localStorage.getItem('userAuthToken');
    if (authToken) {
        console.log("Authentication token found. Loading Jarvis app.");
        loadJarvisApp();
    } else {
        console.log("No authentication token found. Showing sales page.");
        showSalesPage();
    }
});