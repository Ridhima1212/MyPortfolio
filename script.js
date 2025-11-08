// === MAIN ENTRY ===
document.addEventListener("DOMContentLoaded", () => {
  setupMenu();
  loadProjects();
  // setupTestimonials(); // <-- This old function is no longer needed
  setupTypewriter();
  setupScrollSpy();

  // --- NEW SUPABASE FUNCTIONS ---
  loadTestimonials(); // Load reviews from Supabase
  setupReviewForm();  // Set up the form and stars
  setupShowAllButton(); // Set up the new "Show All" button
});

// === NAVBAR / HAMBURGER ===
function setupMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const navbar = document.getElementById("navbar");
  const navLinks = document.querySelectorAll(".navbar a");

  if (!menuToggle || !navbar) return;

  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active");
    navbar.classList.toggle("active");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.classList.remove("active");
      navbar.classList.remove("active");
    });
  });
}

// === LOAD PROJECTS FROM JSON ===
async function loadProjects() {
  const container = document.querySelector(".services-container");
  if (!container) return;

  try {
    const response = await fetch("projects.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const projects = await response.json();

    container.innerHTML = "";

    projects.forEach((project) => {
      const box = document.createElement("div");
      box.className = "service-box";
      box.innerHTML = `
        <div class="service-icon"><i class="bx ${escapeHtml(project.icon)}"></i></div>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <a href="${escapeHtml(project.link)}" class="btn">Read More</a>
      `;
      container.appendChild(box);
    });
  } catch (err) {
    console.error("Error loading projects:", err);
    container.innerHTML = `<p style="color:red;text-align:center;">Failed to load projects.</p>`;
  }
}

// -----------------------------------------------------------------
// 1. CONNECT TO SUPABASE
// -----------------------------------------------------------------

// Your keys are already here!
const SUPABASE_URL = "https://nfrkgjiaydplkunihkdu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcmtnamlheWRwbGt1bmloa2R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MTQ2MjksImV4cCI6MjA3Nzk5MDYyOX0.d_Bv2ia4oSZ2rXzO0pDbwAlBAhJsqg-uO0MuhKEXSdI";

// This creates the connection
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// -----------------------------------------------------------------
// 2. GET YOUR HTML ELEMENTS
// -----------------------------------------------------------------

const testimonialList = document.getElementById("testimonialList");
const reviewForm = document.getElementById("reviewForm");
const reviewMsg = document.getElementById("reviewMsg");
const showAllReviewsBtn = document.getElementById("showAllReviewsBtn"); // <-- NEW
let selectedRating = 0; // This will hold the star rating

// --- stars helper ---
function generateStarsHtml(n) {
  const c = Math.max(0, Math.min(5, Number(n) || 0));
  return "★".repeat(c) + "☆".repeat(5 - c);
}

// -----------------------------------------------------------------
// 3. LOAD REVIEWS FROM SUPABASE (*** MODIFIED ***)
// -----------------------------------------------------------------

async function loadTestimonials() {
  if (!testimonialList || !showAllReviewsBtn) return; // Don't run if elements don't exist

  // This one line gets all reviews from your "testimonials" table
  const { data, error } = await sb.from("testimonials").select("*");

  if (error) {
    console.error("Error loading testimonials:", error);
    testimonialList.innerHTML = "<p>Error loading reviews.</p>";
    return;
  }
  
  // --- NEW: Sort data by message length (descending) ---
  // (Uses `|| ''` to prevent errors if a message is null)
  data.sort((a, b) => (b.message || '').length - (a.message || '').length);

  // Clear the list so we don't get duplicates
  testimonialList.innerHTML = "";
  
  // --- NEW: Show/Hide "Show All" button based on count ---
  if (data.length > 5) {
    showAllReviewsBtn.style.display = "inline-block";
  } else {
    showAllReviewsBtn.style.display = "none";
  }

  // Loop through the SORTED data and build the HTML
  data.forEach((review, index) => {
    const reviewElement = document.createElement("div");
    reviewElement.classList.add("testimonial-box"); // Add your CSS class

    // --- NEW: Hide reviews after the 5th one ---
    if (index >= 5) {
      reviewElement.classList.add("review-hidden");
    }

    // This creates the star HTML (e.g., ★★★★☆)
    const starsHtml = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
    const initial = String(review.name).charAt(0).toUpperCase();

    // Customize this HTML to match your portfolio's design
    reviewElement.innerHTML = `
      <div class="testimonial-content">
        <div class="testimonial-img">
          <div class="avatar">${initial}</div>
        </div>
        <div class="testimonial-text">
          <i class="bx bxs-quote-alt-left quote-icon"></i>
          <p>${escapeHtml(review.message)}</p>
          <i class="bx bxs-quote-alt-right quote-icon"></i>
        </div>
      </div>
      <div class="testimonial-info">
        <h4>${escapeHtml(review.name)}</h4>
        <p>${escapeHtml(review.occupation)}</p>
        <div class="testimonial-stars">${starsHtml}</div>
      </div>
    `;

    testimonialList.appendChild(reviewElement);
  });
}

// -----------------------------------------------------------------
// 4. SET UP THE "SHOW ALL" BUTTON (*** NEW ***)
// -----------------------------------------------------------------

function setupShowAllButton() {
  if (!showAllReviewsBtn) return;

  showAllReviewsBtn.addEventListener("click", () => {
    // Find all reviews that are currently hidden
    const hiddenReviews = document.querySelectorAll(".testimonial-box.review-hidden");
    
    // Loop through them and remove the .review-hidden class
    hiddenReviews.forEach(review => {
      review.classList.remove("review-hidden");
    });

    // Hide the "Show All" button itself
    showAllReviewsBtn.style.display = "none";
  });
}

// -----------------------------------------------------------------
// 5. SET UP THE REVIEW FORM (SUBMIT + STARS)
// -----------------------------------------------------------------

function setupReviewForm() {
  if (!reviewForm) return; // Don't run if the form doesn't exist

  // --- Handle Star Clicks ---
  const stars = reviewForm.querySelectorAll(".rating-stars .star");
  stars.forEach((star) => {
    star.addEventListener("click", () => {
      selectedRating = parseInt(star.dataset.value, 10);
      // Loop through all stars to update their 'active' class
      stars.forEach((s, i) => {
        s.classList.toggle("active", i < selectedRating);
      });
    });
  });

  // --- Handle Form Submission ---
  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault(); // Stop the page from reloading

    // Get the values from the form
    const reviewerName = document.getElementById("reviewerName").value;
    const reviewerRole = document.getElementById("reviewerRole").value;
    const reviewMessage = document.getElementById("reviewMessage").value;

    // Check that all fields are filled
    if (!reviewerName || !reviewerRole || !reviewMessage || selectedRating === 0) {
      alert("Please fill all fields and select a rating.");
      return;
    }
    
    reviewMsg.textContent = "Submitting...";

    // This one line inserts the new review into your Supabase table
    const { data, error } = await sb.from("testimonials").insert([
      {
        name: reviewerName,
        occupation: reviewerRole,
        message: reviewMessage,
        rating: selectedRating, // Use the rating from the stars
      },
    ]);

    if (error) {
      console.error("Error submitting review:", error);
      reviewMsg.textContent = "Error. Please try again.";
    } else {
      reviewMsg.textContent = "Thank you for your review!";
      reviewForm.reset(); // Clear the form
      
      // Reset the stars
      selectedRating = 0;
      stars.forEach(s => s.classList.remove("active"));
      
      // Reload the testimonials to show the new one instantly
      // This will re-run the sort and limit logic automatically
      loadTestimonials();
    }
  });
}


// === TYPEWRITER EFFECT ===
function setupTypewriter() {
  const typedTextSpan = document.getElementById("typewriter");
  if (!typedTextSpan) return;

  typedTextSpan.textContent = "";

  const textArray = [
    "Full Stack Developer",
    "Programmer",
    "Data adjusting",
  ];

  const typingSpeed = 100;
  const erasingSpeed = 60;
  const newTextDelay = 1000;

  let textArrayIndex = 0;
  let charIndex = 0;

  function type() {
    if (charIndex < textArray[textArrayIndex].length) {
      typedTextSpan.textContent += textArray[textArrayIndex].charAt(charIndex);
      charIndex++;
      requestAnimationFrame(() => setTimeout(type, typingSpeed));
    } else {
      setTimeout(erase, newTextDelay);
    }
  }

  function erase() {
    if (charIndex > 0) {
      typedTextSpan.textContent = textArray[textArrayIndex].substring(
        0,
        charIndex - 1
      );
      charIndex--;
      requestAnimationFrame(() => setTimeout(erase, erasingSpeed));
    } else {
      textArrayIndex = (textArrayIndex + 1) % textArray.length;
      setTimeout(type, 400);
    }
  }
  setTimeout(type, 1000);
}

// === SCROLLSPY (ACTIVE NAV LINK ON SCROLL) ===
function setupScrollSpy() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".navbar a");
  const header = document.querySelector(".header");

  if (!sections.length || !navLinks.length || !header) return;

  const headerHeight = header.offsetHeight;

  function updateActiveLink() {
    const scrollY = window.scrollY;
    let currentSectionId = "";

    // Find the current section
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - headerHeight - 1; // -1 to be precise
      if (scrollY >= sectionTop) {
        currentSectionId = section.getAttribute("id");
      }
    });

    // Update the nav links
    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${currentSectionId}`) {
        link.classList.add("active");
      }
    });
  }

  window.addEventListener("scroll", updateActiveLink);
  updateActiveLink(); // Run once on page load
}

// === HELPERS ===
function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}