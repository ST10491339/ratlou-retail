/* main.js
   Adds:
   - form validation (enquiry + contact)
   - dynamic product rendering + search/filter
   - image lightbox/modal
   - small accordion component
*/

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  initForms();
  initProducts();
  initLightbox();
  initAccordion();
});

/* ===== Forms (enquiry + contact) ===== */
function initForms() {
  const enquiryForm = document.querySelector('form[data-form="enquiry"]');
  const contactForm = document.querySelector('form[data-form="contact"]');

  if (enquiryForm) setupFormValidation(enquiryForm);
  if (contactForm) setupFormValidation(contactForm);

  // Pre-fill product if query string present (from Buy Now)
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('productId');
  if (productId) {
    const select = document.getElementById('product-select');
    if (select) {
      const p = PRODUCTS.find(p => String(p.id) === String(productId));
      if (p) {
        // add option and select it
        const opt = document.createElement('option');
        opt.value = p.title;
        opt.textContent = p.title;
        opt.selected = true;
        select.prepend(opt);
      }
    }
  }
}

function setupFormValidation(form) {
  form.addEventListener('submit', e => {
    const isValid = validateForm(form);
    if (!isValid) {
      e.preventDefault();
      const firstInvalid = form.querySelector('.invalid');
      if (firstInvalid) firstInvalid.focus();
    }
  });

  form.addEventListener('input', (e) => {
    validateField(e.target);
  });
}

function validateForm(form) {
  let ok = true;
  const fields = Array.from(form.querySelectorAll('input[required], textarea[required], select[required]'));
  fields.forEach(field => {
    const valid = validateField(field);
    if (!valid) ok = false;
  });
  return ok;
}

function validateField(field) {
  if (!field) return true;
  const val = field.value.trim();
  const type = field.getAttribute('type') || field.tagName.toLowerCase();
  let valid = true;
  let message = '';

  if (field.hasAttribute('required') && val === '') {
    valid = false;
    message = 'This field is required.';
  } else if (type === 'email' && val !== '') {
    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!valid) message = 'Please enter a valid email.';
  } else if (field.name === 'phone' && val !== '') {
    valid = /^[+\d][\d\s\-]{7,}$/.test(val);
    if (!valid) message = 'Please enter a valid phone number.';
  }

  toggleFieldState(field, valid, message);
  return valid;
}

function toggleFieldState(field, valid, message) {
  let msg = field.parentElement.querySelector('.field-error');
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'field-error';
    field.parentElement.appendChild(msg);
  }
  msg.textContent = valid ? '' : message;

  if (valid) {
    field.classList.remove('invalid');
    field.classList.add('valid');
    field.setAttribute('aria-invalid', 'false');
  } else {
    field.classList.remove('valid');
    field.classList.add('invalid');
    field.setAttribute('aria-invalid', 'true');
  }
}

/* ===== Products: dynamic load + search/filter ===== */
const PRODUCTS = [
  { id: 1, title: "Casual T-shirt", price: 120, desc: "Comfortable cotton t-shirt", img: "images/Black-T-shirt.webp" },
  { id: 2, title: "Stylish Hoodie", price: 350, desc: "Warm trendy hoodie", img: "images/Hoodie.jpeg" },
  { id: 3, title: "T-shirt", price: 250, desc: "High-quality t-shirt", img: "images/tshirt1.webp" },
  { id: 4, title: "Classic Sneakers", price: 500, desc: "Everyday sneakers", img: "images/sneakers-sustainability-voguebus-janine-abrenilla-jan-21-promo.webp" },
  { id: 5, title: "Track suit", price: 700, desc: "Comfortable tracksuit", img: "images/track suit.jpg" },
  { id: 6, title: "Stylish Tracksuit", price: 900, desc: "Trendy tracksuit", img: "images/Tracksuit Black.jpeg" },
  { id: 7, title: "Best sneakers", price: 1000, desc: "Long lasting sneakers", img: "images/IMG_COLLECTION.webp" },
  { id: 8, title: "School T-shirt", price: 300, desc: "School T-shirt", img: "images/school tshirt.jpeg" },
  { id: 9, title: "School Trouser", price: 400, desc: "Reliable trousers", img: "images/school trousers.jpeg" },
  { id: 10, title: "School Shoes", price: 600, desc: "Comfortable school shoes", img: "images/School shoes.jpeg" },
  { id: 11, title: "Suit", price: 2000, desc: "Quality suit for occasions", img: "images/suit.webp" }
];

function initProducts() {
  const container = document.querySelector('.product-grid');
  if (!container) return;

  const searchWrap = document.createElement('div');
  searchWrap.className = 'product-search';
  searchWrap.innerHTML = `
    <input type="search" id="product-search" placeholder="Search products (name, price)..." aria-label="Search products">
    <select id="price-filter" aria-label="Filter by price">
      <option value="">All prices</option>
      <option value="under500">Under R500</option>
      <option value="500to1000">R500 - R1000</option>
      <option value="1000plus">R1000+</option>
    </select>
  `;
  container.parentElement.insertBefore(searchWrap, container);

  renderProducts(PRODUCTS);

  const searchInput = document.getElementById('product-search');
  const priceFilter = document.getElementById('price-filter');

  searchInput.addEventListener('input', () => applyFilter());
  priceFilter.addEventListener('change', () => applyFilter());
}

function renderProducts(list) {
  const container = document.querySelector('.product-grid');
  container.innerHTML = '';
  list.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <h3>${escapeHtml(p.title)}</h3>
      <img src="${escapeHtml(p.img)}" alt="${escapeHtml(p.title)}" data-id="${p.id}" class="product-image" loading="lazy" />
      <p>${escapeHtml(p.desc)}</p>
      <p class="price">R${p.price}</p>
      <button class="buy-button" data-id="${p.id}">Buy Now</button>
    `;
    container.appendChild(card);
  });

  $$('.product-card .buy-button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      window.location.href = `enquiry.html?productId=${encodeURIComponent(id)}`;
    });
  });

  $$('.product-image').forEach(img => {
    img.addEventListener('click', e => {
      openLightbox(e.currentTarget.src, e.currentTarget.alt);
    });
  });
}

function applyFilter() {
  const q = (document.getElementById('product-search')?.value || '').trim().toLowerCase();
  const price = document.getElementById('price-filter')?.value || '';

  const filtered = PRODUCTS.filter(p => {
    const textMatch = p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q) || String(p.price).includes(q);
    let priceMatch = true;
    if (price === 'under500') priceMatch = p.price < 500;
    if (price === '500to1000') priceMatch = p.price >= 500 && p.price <= 1000;
    if (price === '1000plus') priceMatch = p.price > 1000;
    return textMatch && priceMatch;
  });

  renderProducts(filtered);
}



/* ===== Lightbox + Product Slideshow (Buttons Under Image) ===== */
let currentIndex = 0;

function initLightbox() {
  if ($('#lightbox-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'lightbox-modal';
  modal.innerHTML = `
    <div class="lb-overlay" tabindex="-1">
      <button class="lb-close" aria-label="Close image">&times;</button>

      <div class="lb-content" role="dialog" aria-modal="true">

        <img src="" alt="" class="lb-image" />

        <div class="lb-controls">
          <button class="lb-prev" aria-label="Previous image">&#10094; Prev</button>
          <button class="lb-next" aria-label="Next image">Next &#10095;</button>
        </div>

        <p class="lb-caption"></p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('.lb-close').addEventListener('click', closeLightbox);

  modal.querySelector('.lb-overlay').addEventListener('click', e => {
    if (e.target === modal.querySelector('.lb-overlay')) closeLightbox();
  });

  modal.querySelector('.lb-prev').addEventListener('click', showPrevImage);
  modal.querySelector('.lb-next').addEventListener('click', showNextImage);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrevImage();
    if (e.key === 'ArrowRight') showNextImage();
  });
}

function openLightbox(src, alt) {
  const modal = $('#lightbox-modal');
  currentIndex = PRODUCTS.findIndex(p => p.img === src);

  modal.querySelector('.lb-image').src = src;
  modal.querySelector('.lb-caption').textContent = alt || '';
  modal.style.display = 'block';
}

function closeLightbox() {
  $('#lightbox-modal').style.display = 'none';
}

function showNextImage() {
  currentIndex = (currentIndex + 1) % PRODUCTS.length;
  updateSlideshow();
}

function showPrevImage() {
  currentIndex = (currentIndex - 1 + PRODUCTS.length) % PRODUCTS.length;
  updateSlideshow();
}

function updateSlideshow() {
  const modal = $('#lightbox-modal');
  const img = modal.querySelector('.lb-image');

  img.classList.add('fade');
  setTimeout(() => {
    img.src = PRODUCTS[currentIndex].img;
    modal.querySelector('.lb-caption').textContent = PRODUCTS[currentIndex].title;
    img.classList.remove('fade');
  }, 200);
}


/* ===== Accordion (small enhancement component) ===== */
function initAccordion() {
  $$('.accordion .accordion-head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.parentElement;
      const open = item.classList.toggle('open');
      const panel = item.querySelector('.accordion-panel');
      if (open) {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        head.setAttribute('aria-expanded', 'true');
      } else {
        panel.style.maxHeight = null;
        head.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

/* ===== Utilities ===== */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}
// Accordion toggle functionality
document.addEventListener("DOMContentLoaded", function() {
  const accordions = document.querySelectorAll(".accordion-head");

  accordions.forEach(button => {
    button.addEventListener("click", function() {
      const panel = this.nextElementSibling;

      // Close all open panels (optional)
      document.querySelectorAll(".accordion-panel").forEach(p => {
        if (p !== panel) {
          p.style.maxHeight = null;
        }
      });

      // Toggle this panel
      if (panel.style.maxHeight) {
        panel.style.maxHeight = null;
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });
});
/* ===== Thankyou page: populate submission details from querystring ===== */
function populateThankyou() {
  if (!document.getElementById('submission-content')) return;
  const params = new URLSearchParams(window.location.search);
  const fieldsToShow = ['name','email','phone','product','message'];

  // Build content
  let html = '<ul>';
  let any = false;
  fieldsToShow.forEach(k => {
    if (params.has(k) && params.get(k).trim() !== '') {
      any = true;
      const label = k === 'product' ? 'Product' : k.charAt(0).toUpperCase() + k.slice(1);
      html += `<li><strong>${label}:</strong> ${escapeHtml(params.get(k))}</li>`;
    }
  });
  html += '</ul>';

  if (any) {
    document.getElementById('submission-content').innerHTML = html;
    document.getElementById('submission-details').style.display = 'block';
    // Friendly message
    const namePart = params.get('name') ? (' ' + escapeHtml(params.get('name'))) : '';
    document.getElementById('thankyou-message').textContent = `Thank you${namePart}. We received your submission and will respond shortly.`;
  } else {
    // default message remains
  }
}

// run on load
document.addEventListener('DOMContentLoaded', () => {
  try { populateThankyou(); } catch (e) { /* ignore if not on thankyou.html */ }
});
 
/* ===== Real Time Clock ===== */
function startClock() {
  const el = document.getElementById("clock");
  if (!el) return;

  setInterval(() => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString();
  }, 1000);
}

document.addEventListener("DOMContentLoaded", startClock);

