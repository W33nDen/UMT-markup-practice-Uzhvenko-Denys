// AOS (Animate On Scroll) initialization
window.addEventListener("load", () => {
	AOS.init({ duration: 800, once: true });
});

// Mobile Menu Toggle
const mobileMenu = document.getElementById("mobile-menu");
const openBtn = document.querySelector(".header-menu-button");
const closeBtn = document.getElementById("menu-close-btn");
const navLinks = document.querySelectorAll(
	".mobile-nav-link, #mobile-home-btn",
);

function openMenu() {
	mobileMenu.classList.add("is-open");
	document.body.style.overflow = "hidden";
}

function closeMenu() {
	mobileMenu.classList.remove("is-open");
	document.body.style.overflow = "";
}

openBtn.addEventListener("click", openMenu);
closeBtn.addEventListener("click", closeMenu);

navLinks.forEach((link) => {
	link.addEventListener("click", closeMenu);
});

// Order Modal
const backdrop = document.getElementById("order-backdrop");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalOpenBtns = document.querySelectorAll("[data-modal-open]");

function openModal() {
	mobileMenu.classList.remove("is-open");
	backdrop.classList.add("is-open");
	document.body.style.overflow = "hidden";
}

function closeModal() {
	backdrop.classList.remove("is-open");
	document.body.style.overflow = "";
}

modalOpenBtns.forEach((btn) => {
	btn.addEventListener("click", openModal);
});

modalCloseBtn.addEventListener("click", closeModal);

backdrop.addEventListener("click", (e) => {
	if (e.target === backdrop) {
		closeModal();
	}
});

document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && backdrop.classList.contains("is-open")) {
		closeModal();
	}
});

// Footer subscription form handler
const subscribeForm = document.querySelector(".footer-subscribe-form");
if (subscribeForm) {
	subscribeForm.addEventListener("submit", (e) => {
		e.preventDefault();
		const email = subscribeForm.querySelector("#footer-email").value;
		alert(`Thank you for subscribing with: ${email}`);
		subscribeForm.reset();
	});
}
