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

    // --- Pop-up and Cookie Consent Functions (Corrected to use Function Expressions) ---

    /**
     * Shows a specific pop-up ('cookie' or 'lead') and hides the other.
     * @param {string} contentToShow - The type of content to display.
     */
    const showPopup = (contentToShow) => {
        if (mainPopupContainer) {
            // Hide all pop-up content first to prevent overlap
            if (cookieConsentContent) {
                cookieConsentContent.style.display = "none";
            }
            if (leadCaptureContent) {
                leadCaptureContent.style.display = "none";
            }

            // Show the requested content
            if (contentToShow === "cookie" && cookieConsentContent) {
                cookieConsentContent.style.display = "block";
            } else if (contentToShow === "lead" && leadCaptureContent) {
                leadCaptureContent.style.display = "block";
            }

            // Make the main overlay container visible with a fade-in effect
            mainPopupContainer.style.display = "flex";
            setTimeout(() => {
                mainPopupContainer.classList.add("visible");
            }, 50);
        }
    };

    /**
     * Hides the main pop-up container with a fade-out effect.
     */
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

    /**
     * This function runs ONLY after cookie consent is given.
     * It checks if the lead capture form should be shown for this session.
     */
    const handleLeadCaptureDisplay = () => {
        if (localStorage.getItem("cookiesAccepted") === "true" && !sessionStorage.getItem("leadCapturedThisSession")) {
            // If cookies are accepted AND the form hasn't been shown this session, show it.
            showPopup("lead");
            sessionStorage.setItem("leadCapturedThisSession", "true");
        } else {
            // Otherwise, make sure everything is hidden.
            hidePopup();
        }
    };

    /**
     * This is the master function that decides what to do on page load.
     * It checks for cookie consent FIRST.
     */
    const initializePopups = () => {
        if (localStorage.getItem("cookiesAccepted")) {
            // If cookies are already accepted, check if we should show the lead form.
            handleLeadCaptureDisplay();
        } else {
            // If cookies are NOT accepted, show the cookie consent pop-up.
            showPopup("cookie");
        }
    };

    // --- Pop-up Event Listeners ---

    if (acceptCookiesBtn) {
        acceptCookiesBtn.addEventListener("click", () => {
            localStorage.setItem("cookiesAccepted", "true");
            hidePopup();
            // After hiding, wait a moment then run the logic to check for the lead form.
            setTimeout(handleLeadCaptureDisplay, 300);
        });
    }

    if (closeLeadFormBtn) {
        closeLeadFormBtn.addEventListener("click", hidePopup);
    }

    if (leadCaptureForm) {
        leadCaptureForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Stop the form from reloading the page
            const formData = new FormData(event.target);
            try {
                const response = await fetch(leadCaptureForm.action, {
                    method: "POST",
                    body: formData,
                    headers: { "Accept": "application/json" }
                });

                if (formMessage) {
                    if (response.ok) {
                        // On SUCCESS, show a thank you message.
                        formMessage.style.color = "#28a745"; // Green color
                        formMessage.textContent = "Thank you! We've received your submission.";
                        
                        // After 2 seconds, automatically close the pop-up.
                        setTimeout(() => {
                            hidePopup();
                        }, 2000); 

                    } else {
                        // On FAILURE, show an error message.
                        formMessage.style.color = "#dc3545"; // Red color
                        formMessage.textContent = "Oops! There was a problem.";
                    }
                }
            } catch (error) {
                if (formMessage) {
                    formMessage.style.color = "#dc3545"; // Red color
                    formMessage.textContent = "Oops! There was a problem submitting the form.";
                }
            }
        });
    }

    // --- Initial Call for pop-up logic ---
    initializePopups();

    /* ==========================================================================
       NEW IFRAME AUTHENTICATION AND LOADING LOGIC
       This code runs after the pop-up logic and controls the Jarvis App.
       ========================================================================== */
    
    // 1. Get references to the elements we need to control.
    const jarvisIframe = document.getElementById('jarvis-iframe');
    const pricingTable = document.querySelector('stripe-pricing-table');
    const customerPortalSection = document.getElementById('customer-portal');

    // 2. This function shows the Jarvis App and hides the sales content.
    const loadJarvisApp = () => {
        // CORRECTED: Added curly braces for clarity and best practice.
        if (pricingTable) {
            pricingTable.style.display = 'none';
        }
        if (customerPortalSection) {
            customerPortalSection.style.display = 'none';
        }
        
        if (jarvisIframe) {
            jarvisIframe.src = '/jarvis-app/index.html'; 
            jarvisIframe.style.display = 'block';
        }
    };

    // 3. This function shows the sales content and hides the Jarvis App.
    const showSalesPage = () => {
        // CORRECTED: Added curly braces for clarity and best practice.
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

    // 4. --- The Main Authentication Check ---
    const authToken = localStorage.getItem('userAuthToken');

    // CORRECTED: Added curly braces for clarity and best practice.
    if (authToken) {
        // A token exists. We should ideally verify it with the backend first.
        console.log("Authentication token found. Loading Jarvis app.");
        loadJarvisApp();
    } else {
        // No token was found. Show the public-facing sales content.
        console.log("No authentication token found. Showing sales page.");
        showSalesPage();
    }
});