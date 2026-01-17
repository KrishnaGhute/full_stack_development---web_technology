/* booking.js - reusable booking form logic for static pages

   How to use:
   - Place this file in your frontend folder (e.g. `truck_frontend/booking.js`).
   - Include it on the booking HTML page (we replaced `signup.html` earlier):
       <script src="booking.js"></script>
   - Customize the constants below:
       - BOOKING_ENDPOINT: path to your backend booking API (POST)
       - THANKYOU_PAGE: URL or page to redirect to on success (or leave empty to show message)
   - Optionally populate the truck list dynamically by calling `populateTrucks()`.

   Expected backend request format (JSON):
   {
     "customerName": "John Doe",
     "email": "john@example.com",
     "phone": "9912345678",
     "address": "...",
     "truck": "tata-prima",
     "downPayment": 50000,
     "bookingDate": "2025-12-10",
     "comments": "..."
   }

   Expected backend response (JSON):
   Success: { success: true, bookingId: "ABC123", message: "Booked" }
   Error:   { success: false, error: "Reason for failure" }

   Notes:
   - This script performs front-end validation and sends a JSON POST.
   - Adjust validation rules to match your backend requirements.
*/

// ---------- Configuration (customize) ----------
const BOOKING_ENDPOINT = '/backend/booking.php'; // <-- backend booking endpoint (absolute path from site root)
const THANKYOU_PAGE = 'thankyouPage';     // <-- replace with the real thank-you page path, e.g. 'booking-thanks.html'
// Use fetchOptions for extra settings (headers, credentials, etc.)
const fetchOptionsDefaults = { credentials: 'same-origin' };

// ---------- Helpers ----------
function qs(sel) { return document.querySelector(sel); }
function qsa(sel) { return Array.from(document.querySelectorAll(sel)); }

function formatError(el, message) {
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
}

function clearErrors(form) {
    qsa('.form-error', form).forEach(e => e.classList.remove('show'));
    qsa('.form-input', form).forEach(i => i.classList.remove('error'));
}

function showAlert(message, type = 'success') {
    const alertDiv = qs('#alertMessage');
    if (!alertDiv) return;
    alertDiv.textContent = message;
    alertDiv.className = `alert show alert-${type === 'error' ? 'error' : 'success'}`;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    // basic phone validation: digits, spaces, +, -, parentheses allowed
    return /^[+]?([0-9\s\-()]){7,20}$/.test(phone);
}

// ---------- Main booking handler ----------
async function handleBookingSubmit(ev) {
    ev.preventDefault();
    const form = ev.target;

    clearErrors(form);

    // fields
    const nameEl = qs('#customerName');
    const emailEl = qs('#email');
    const phoneEl = qs('#phone');
    const addressEl = qs('#address');
    const truckEl = qs('#truckSelect');
    const downEl = qs('#downPayment');
    const dateEl = qs('#bookingDate');
    const commentsEl = qs('#comments');
    const submitBtn = qs('#bookingBtn');

    const name = nameEl ? nameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const address = addressEl ? addressEl.value.trim() : '';
    const truck = truckEl ? truckEl.value : '';
    const downPayment = downEl ? parseFloat(downEl.value) : 0;
    const bookingDate = dateEl ? dateEl.value : '';
    const comments = commentsEl ? commentsEl.value.trim() : '';

    let hasError = false;

    if (!name) { formatError(qs('#customerNameError'), 'Full name is required'); hasError = true; }
    if (!email || !validateEmail(email)) { formatError(qs('#emailError'), 'Valid email is required'); hasError = true; }
    if (!phone || !validatePhone(phone)) { formatError(qs('#phoneError'), 'Valid phone number is required'); hasError = true; }
    if (!truck) { formatError(qs('#truckSelectError'), 'Please select a truck'); hasError = true; }
    if (downEl && downEl.value && isNaN(downPayment)) { formatError(qs('#downPaymentError'), 'Enter a valid amount'); hasError = true; }

    // optional booking date validation: ensure not in past
    if (bookingDate) {
        const selected = new Date(bookingDate + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        if (selected < today) { formatError(qs('#bookingDateError'), 'Booking date cannot be in the past'); hasError = true; }
    }

    if (hasError) {
        showAlert('Please fix validation errors and try again.', 'error');
        return;
    }

    // prepare payload
    const payload = {
        customerName: name,
        email: email,
        phone: phone,
        address: address,
        truck: truck,
        downPayment: isNaN(downPayment) ? 0 : downPayment,
        bookingDate: bookingDate,
        comments: comments
    };

    try {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading"></span>Submitting...';
        }

        const options = Object.assign({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }, fetchOptionsDefaults);

        const resp = await fetch(BOOKING_ENDPOINT, options);
        const data = await resp.json();

        if (resp.ok && data && data.success) {
            // success
            if (THANKYOU_PAGE) {
                // optionally append booking id
                const url = new URL(THANKYOU_PAGE, window.location.href);
                if (data.bookingId) url.searchParams.set('bid', data.bookingId);
                window.location.href = url.toString();
            } else {
                showAlert(data.message || 'Booking successful', 'success');
                // optionally show booking id
                if (data.bookingId) {
                    const note = document.createElement('div');
                    note.style.marginTop = '12px';
                    note.innerHTML = `<strong>Booking ID:</strong> ${data.bookingId}`;
                    const alertDiv = qs('#alertMessage');
                    if (alertDiv) alertDiv.appendChild(note);
                }
            }
        } else {
            const err = (data && (data.error || data.message)) || `Server returned ${resp.status}`;
            showAlert(err, 'error');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Submit Booking'; }
        }

    } catch (networkErr) {
        console.error('Booking network error:', networkErr);
        showAlert('Network error while submitting booking. Please try again.', 'error');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Submit Booking'; }
    }
}

// Optional: populate truck select dynamically
function populateTrucks(trucks) {
    const select = qs('#truckSelect');
    if (!select || !Array.isArray(trucks)) return;
    // clear existing options except placeholder
    const placeholder = select.querySelector('option[value=""]');
    select.innerHTML = '';
    if (placeholder) select.appendChild(placeholder);
    trucks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id || t.value || t.code || t.slug;
        opt.textContent = t.name || t.label || t.title || opt.value;
        select.appendChild(opt);
    });
}

// Init: attach submit handler
function initBookingForm() {
    const form = qs('#bookingForm');
    if (!form) return;
    form.addEventListener('submit', handleBookingSubmit);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initBookingForm);
else initBookingForm();
