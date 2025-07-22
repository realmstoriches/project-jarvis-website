// Wait for the entire HTML document to be ready before running any scripts.
// This is a crucial performance best practice.
document.addEventListener("DOMContentLoaded", function() {
    console.log("script.js loaded");

    // --- Get all necessary elements from the page ---
    const mainPopupContainer = document.getElementById("main-popup-container");
    const formMessage = document.getElementById("form-message");
    const cookieConsentContent = document.getElementById("cookie-consent-content");
    const acceptCookiesBtn = document.getElementById("accept-cookies");
    const leadCaptureContent = document.getElementById("lead-capture-content");
    const closeLeadFormBtn = document.getElementById("close-lead-form");
    
    // This safely finds the form on any page it exists on.
    const leadCaptureForm = document.getElementById("lead-capture-form") || document.getElementById("lead-capture-form-main");

    /**
     * Shows a specific pop-up ('cookie' or 'lead') and hides the other.
     * @param {string} contentToShow - The type of content to display.
     */
    function showPopup(contentToShow) {
        if (mainPopupContainer) {
            // Hide all pop-up content first to prevent overlap
            if (cookieConsentContent) cookieConsentContent.style.display = "none";
            if (leadCaptureContent) leadCaptureContent.style.display = "none";

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
    }

    /**
     * Hides the main pop-up container with a fade-out effect.
     */
    function hidePopup() {
        if (mainPopupContainer) {
            mainPopupContainer.classList.remove("visible");
            // Wait for the CSS transition to finish before setting display to none
            setTimeout(() => {
                mainPopupContainer.style.display = "none";
                if (cookieConsentContent) cookieConsentContent.style.display = "none";
                if (leadCaptureContent) leadCaptureContent.style.display = "none";
            }, 300);
        }
    }

    /**
     * This is the master function that decides what to do on page load.
     * It checks for cookie consent FIRST.
     */
    function initializePopups() {
        if (localStorage.getItem("cookiesAccepted")) {
            // If cookies are already accepted, check if we should show the lead form.
            handleLeadCaptureDisplay();
        } else {
            // If cookies are NOT accepted, show the cookie consent pop-up.
            showPopup("cookie");
        }
    }

    /**
     * This function runs ONLY after cookie consent is given.
     * It checks if the lead capture form should be shown for this session.
     */
    function handleLeadCaptureDisplay() {
        if (localStorage.getItem("cookiesAccepted") === "true" && !sessionStorage.getItem("leadCapturedThisSession")) {
            // If cookies are accepted AND the form hasn't been shown this session, show it.
            showPopup("lead");
            sessionStorage.setItem("leadCapturedThisSession", "true");
        } else {
            // Otherwise, make sure everything is hidden.
            hidePopup();
        }
    }

    // --- Event Listeners ---
    // NOTE: The "passive listeners" warning does not apply to 'click' or 'submit' events.
    // It is for scrolling events like 'touchstart', 'touchmove', or 'wheel', which are not used here.
    // Therefore, no changes are needed for these listeners.

    // 1. Listen for the "Accept Cookies" button click.
    if (acceptCookiesBtn) {
        acceptCookiesBtn.addEventListener("click", function() {
            localStorage.setItem("cookiesAccepted", "true");
            hidePopup();
            // After hiding, wait a moment then run the logic to check for the lead form.
            setTimeout(handleLeadCaptureDisplay, 300);
        });
    }

    // 2. Listen for the close button ('x') on the lead capture form.
    if (closeLeadFormBtn) {
        closeLeadFormBtn.addEventListener("click", hidePopup);
    }

    // 3. Listen for the submission of the lead capture form.
    if (leadCaptureForm) {
        leadCaptureForm.addEventListener("submit", async function(event) {
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

    // --- Initial Call ---
    // This is the first and only function that needs to be called when the page loads.
    initializePopups();

});