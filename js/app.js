const API_URL = "http://localhost:3000/api/flowers";

let useFallback = false;

async function customFetch(urlStr) {
	if (!useFallback && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
		try {
			return await axios.get(urlStr);
		} catch (e) {
			console.warn("Local json-server not reachable, switching to client-side fallback using db.json.", e.message);
			useFallback = true;
		}
	}

	// Fetch database file directly from current web server root
	const dbResponse = await axios.get("./db.json");
	const allFlowers = dbResponse.data.flowers || [];

	const url = new URL(urlStr, window.location.origin);
	const category = url.searchParams.get("category");
	const q = url.searchParams.get("q");
	const sort = url.searchParams.get("_sort");
	const page = parseInt(url.searchParams.get("_page"));
	const limit = parseInt(url.searchParams.get("_per_page"));

	// 1. Filter by category
	let filtered = allFlowers;
	if (category) {
		filtered = filtered.filter(f => f.category === category);
	}

	// 2. Filter by search query
	if (q) {
		const query = q.toLowerCase();
		filtered = filtered.filter(f => f.title.toLowerCase().includes(query) || f.desc.toLowerCase().includes(query));
	}

	// 3. Sort
	if (sort) {
		const isDesc = sort.startsWith("-");
		const field = isDesc ? sort.substring(1) : sort;
		filtered.sort((a, b) => {
			let valA = a[field];
			let valB = b[field];
			if (typeof valA === "string") {
				return isDesc ? valB.localeCompare(valA) : valA.localeCompare(valB);
			}
			return isDesc ? valB - valA : valA - valB;
		});
	}

	// 4. Paginate
	if (!isNaN(page) && !isNaN(limit)) {
		const startIndex = (page - 1) * limit;
		const endIndex = startIndex + limit;
		const pageData = filtered.slice(startIndex, endIndex);
		const totalPages = Math.ceil(filtered.length / limit);
		const hasNext = page < totalPages;

		return {
			data: {
				data: pageData,
				first: 1,
				prev: page > 1 ? page - 1 : null,
				next: hasNext ? page + 1 : null,
				last: totalPages,
				pages: totalPages,
				items: filtered.length
			}
		};
	}

	return {
		data: filtered
	};
}


const bestsellersListEl = document.querySelector(".bestsellers-list");
const bouquetsListEl = document.querySelector(".bouquets-list");

// Modal elements
const productBackdrop = document.getElementById("product-backdrop");
const productCloseBtn = document.getElementById("product-close-btn");
const productModalImg = document.getElementById("product-modal-img");
const productModalTitle = document.getElementById("product-modal-title");
const productModalPrice = document.getElementById("product-modal-price");
const productModalDesc = document.getElementById("product-modal-desc");

let allFlowers = [];

// Placeholder SVG for broken images (inline data URI)
const PLACEHOLDER_IMG =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='302' height='320' viewBox='0 0 302 320'%3E%3Crect width='302' height='320' fill='%23f4f6f5'/%3E%3Ctext x='151' y='160' font-family='sans-serif' font-size='14' fill='%23999' text-anchor='middle' dominant-baseline='middle'%3EImage not available%3C/text%3E%3C/svg%3E";

/**
 * Normalises the image path returned by json-server so it resolves
 * relative to the HTML page served by Live Server (or any other static server).
 *
 * - Paths that already start with "http://" or "https://" are left as-is.
 * - Relative paths like "./images/flowers/..." are kept as-is (they resolve
 *   relative to the HTML page, which is what we want when images are local).
 */
function resolveImgPath(img) {
	if (!img) return PLACEHOLDER_IMG;
	// If it's an absolute URL, keep it
	if (img.startsWith("http://") || img.startsWith("https://")) return img;
	// Relative path – strip leading "./" if present for consistency
	return img;
}

function createProductCardMarkup({ id, img, title, desc, price }) {
	const resolvedImg = resolveImgPath(img);
	return `
    <li class="bestsellers-item">
      <article class="product-card" data-id="${id}">
        <img
          loading="lazy"
          class="product-card-image"
          src="${resolvedImg}"
          srcset="${resolvedImg} 1x, ${resolvedImg} 2x"
          width="302"
          height="320"
          alt="${title} bouquet"
          onerror="this.onerror=null;this.srcset='';this.src='${PLACEHOLDER_IMG}';"
        />
        <h3 class="product-card-title">${title}</h3>
        <p class="product-card-text">${desc}</p>
        <p class="product-card-price">$${price}</p>
      </article>
    </li>
  `;
}

function createBouquetCardMarkup({ id, img, title, desc, price }) {
	const resolvedImg = resolveImgPath(img);
	return `
    <li class="bouquets-item">
      <article class="product-card" data-id="${id}">
        <img
          loading="lazy"
          class="product-card-image"
          src="${resolvedImg}"
          srcset="${resolvedImg} 1x, ${resolvedImg} 2x"
          width="302"
          height="320"
          alt="${title} bouquet"
          onerror="this.onerror=null;this.srcset='';this.src='${PLACEHOLDER_IMG}';"
        />
        <h3 class="product-card-title">${title}</h3>
        <p class="product-card-text">${desc}</p>
        <p class="product-card-price">$${price}</p>
      </article>
    </li>
  `;
}

function renderBestsellers(items) {
	bestsellersListEl.innerHTML = "";
	const markup = items.map(createProductCardMarkup).join("");
	bestsellersListEl.insertAdjacentHTML("beforeend", markup);

	const dotsContainer = document.querySelector(".bestsellers-dots");
	if (dotsContainer) {
		dotsContainer.innerHTML = items
			.map(
				(_, index) =>
					`<li><span class="bestsellers-dot ${index === 0 ? "is-active" : ""}" data-index="${index}"></span></li>`,
			)
			.join("");
	}
}

let currentBouquetsPage = 1;
const BOUQUETS_LIMIT = 4;
let currentSearch = "";
let currentSort = "";

async function fetchBestsellers() {
	try {
		const response = await customFetch(`${API_URL}?category=top`);
		const itemsArray = Array.isArray(response.data)
			? response.data
			: response.data.data || [];

		const newItems = itemsArray.filter(
			(newItem) => !allFlowers.some((existing) => existing.id === newItem.id),
		);
		allFlowers = [...allFlowers, ...newItems];

		renderBestsellers(itemsArray);
	} catch (error) {
		console.error("Error fetching bestsellers:", error.message);
		bestsellersListEl.innerHTML =
			'<li class="error-message">Failed to load bestsellers. Please try again later.</li>';
	}
}

async function fetchBouquetsPage(page = 1) {
	try {
		const url = new URL(API_URL);
		url.searchParams.append("category", "standart");
		url.searchParams.append("_page", page);
		url.searchParams.append("_per_page", BOUQUETS_LIMIT);

		if (currentSearch) {
			url.searchParams.append("q", currentSearch);
		}

		if (currentSort) {
			const [sortField, sortOrder] = currentSort.split("_");
			if (sortOrder === "desc") {
				url.searchParams.append("_sort", `-${sortField}`);
			} else {
				url.searchParams.append("_sort", sortField);
			}
		}

		const response = await customFetch(url.href);
		const itemsArray = Array.isArray(response.data)
			? response.data
			: response.data.data || [];

		const newItems = itemsArray.filter(
			(newItem) => !allFlowers.some((existing) => existing.id === newItem.id),
		);
		allFlowers = [...allFlowers, ...newItems];

		if (page === 1) {
			bouquetsListEl.innerHTML = "";
		}

		const markup = itemsArray.map(createBouquetCardMarkup).join("");
		bouquetsListEl.insertAdjacentHTML("beforeend", markup);

		const loadMoreBtn = document.getElementById("load-more-bouquets");
		if (loadMoreBtn) {
			const hasNextPage =
				response.data &&
				response.data.next !== null &&
				response.data.next !== undefined;

			if (
				itemsArray.length < BOUQUETS_LIMIT ||
				(response.data.data && !hasNextPage)
			) {
				loadMoreBtn.style.display = "none";
			} else {
				loadMoreBtn.style.display = "block";
			}
		}
	} catch (error) {
		console.error("Error fetching bouquets:", error.message);
		if (page === 1) {
			bouquetsListEl.innerHTML =
				'<li class="error-message">Failed to load bouquets. Please try again later.</li>';
		}
	}
}

// Modal logic
function openProductModal(flower) {
	const resolvedImg = resolveImgPath(flower.img);
	productModalImg.src = resolvedImg;
	productModalImg.srcset = `${resolvedImg} 1x, ${resolvedImg} 2x`;
	productModalImg.alt = `${flower.title} bouquet`;
	productModalImg.onerror = function () {
		this.onerror = null;
		this.srcset = "";
		this.src = PLACEHOLDER_IMG;
	};
	productModalTitle.textContent = flower.title;
	productModalPrice.textContent = `$${flower.price}`;
	productModalDesc.textContent = flower.desc;

	productBackdrop.classList.add("is-open");
	document.body.style.overflow = "hidden";
}

function closeProductModal() {
	productBackdrop.classList.remove("is-open");
	document.body.style.overflow = "";
}

function handleProductClick(e) {
	const card = e.target.closest(".product-card");
	if (!card) return;

	const id = card.dataset.id;
	const flower = allFlowers.find((item) => String(item.id) === String(id));
	if (flower) {
		openProductModal(flower);
	}
}

bestsellersListEl.addEventListener("click", handleProductClick);
bouquetsListEl.addEventListener("click", handleProductClick);

if (productCloseBtn) {
	productCloseBtn.addEventListener("click", closeProductModal);
}

if (productBackdrop) {
	productBackdrop.addEventListener("click", (e) => {
		if (e.target === productBackdrop) {
			closeProductModal();
		}
	});
}

document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && productBackdrop?.classList.contains("is-open")) {
		closeProductModal();
	}
});

const filterForm = document.getElementById("bouquets-filter-form");
const loadMoreBtn = document.getElementById("load-more-bouquets");

if (filterForm) {
	filterForm.addEventListener("submit", (e) => {
		e.preventDefault();
		currentSearch = filterForm.search.value.trim();
		currentSort = filterForm.sort.value;
		currentBouquetsPage = 1;
		fetchBouquetsPage(currentBouquetsPage);
	});

	filterForm.addEventListener("reset", () => {
		currentSearch = "";
		currentSort = "";
		currentBouquetsPage = 1;
		setTimeout(() => {
			fetchBouquetsPage(currentBouquetsPage);
		}, 0);
	});
}

if (loadMoreBtn) {
	loadMoreBtn.addEventListener("click", (e) => {
		e.preventDefault();
		currentBouquetsPage++;
		fetchBouquetsPage(currentBouquetsPage);
	});
}

fetchBestsellers();
fetchBouquetsPage(currentBouquetsPage);

// ==============================
// Slider Logic for Bestsellers (with infinite loop)
// ==============================
const bestsellersSection = document.querySelector(".bestsellers");
const bestsellersPrevBtn = bestsellersSection
	? bestsellersSection.querySelector('button[aria-label="Previous slide"]')
	: null;
const bestsellersNextBtn = bestsellersSection
	? bestsellersSection.querySelector('button[aria-label="Next slide"]')
	: null;
const dotsContainer = document.querySelector(".bestsellers-dots");

let currentBestsellersIndex = 0;

function getBestsellersCount() {
	return bestsellersListEl.querySelectorAll(".bestsellers-item").length;
}

function getBestsellersItemWidth() {
	return (
		bestsellersListEl.querySelector(".bestsellers-item")?.offsetWidth || 300
	);
}

function getBestsellersGap() {
	return parseInt(window.getComputedStyle(bestsellersListEl).gap) || 24;
}

function scrollBestsellersTo(index) {
	const total = getBestsellersCount();
	if (total === 0) return;

	// Wrap around for infinite loop
	if (index < 0) index = total - 1;
	if (index >= total) index = 0;

	currentBestsellersIndex = index;
	const itemWidth = getBestsellersItemWidth() + getBestsellersGap();
	bestsellersListEl.scrollTo({
		left: index * itemWidth,
		behavior: "smooth",
	});

	updateBestsellersDots(index);
}

function updateBestsellersDots(activeIndex) {
	const dots = document.querySelectorAll(".bestsellers-dot");
	dots.forEach((dot, i) => {
		if (i === activeIndex) {
			dot.classList.add("is-active");
		} else {
			dot.classList.remove("is-active");
		}
	});
}

if (bestsellersPrevBtn && bestsellersNextBtn) {
	bestsellersPrevBtn.addEventListener("click", () => {
		scrollBestsellersTo(currentBestsellersIndex - 1);
	});

	bestsellersNextBtn.addEventListener("click", () => {
		scrollBestsellersTo(currentBestsellersIndex + 1);
	});
}

// Sync dots when user scrolls manually
bestsellersListEl.addEventListener("scroll", () => {
	const itemWidth = getBestsellersItemWidth() + getBestsellersGap();
	const scrollLeft = bestsellersListEl.scrollLeft;
	const index = Math.round(scrollLeft / itemWidth);

	if (index !== currentBestsellersIndex) {
		currentBestsellersIndex = index;
		updateBestsellersDots(index);
	}
});

if (dotsContainer) {
	dotsContainer.addEventListener("click", (e) => {
		if (e.target.classList.contains("bestsellers-dot")) {
			const index = parseInt(e.target.dataset.index);
			if (!isNaN(index)) {
				scrollBestsellersTo(index);
			}
		}
	});
}

// ==============================
// Slider Logic for Testimonials
// ==============================
const testimonialsSection = document.querySelector(".testimonials");
const testimonialsList = document.querySelector(".testimonials-list");
const testimonialsPrevBtn = testimonialsSection
	? testimonialsSection.querySelector('button[aria-label="Previous slide"]')
	: null;
const testimonialsNextBtn = testimonialsSection
	? testimonialsSection.querySelector('button[aria-label="Next slide"]')
	: null;

let currentTestimonialsIndex = 0;

function getTestimonialsCount() {
	return testimonialsList.querySelectorAll(".testimonials-item").length;
}

function getTestimonialsItemWidth() {
	return (
		testimonialsList.querySelector(".testimonials-item")?.offsetWidth || 300
	);
}

function getTestimonialsGap() {
	return parseInt(window.getComputedStyle(testimonialsList).gap) || 24;
}

function scrollTestimonialsTo(index) {
	const total = getTestimonialsCount();
	if (total === 0) return;

	// Wrap around for infinite loop
	if (index < 0) index = total - 1;
	if (index >= total) index = 0;

	currentTestimonialsIndex = index;
	const itemWidth = getTestimonialsItemWidth() + getTestimonialsGap();
	testimonialsList.scrollTo({
		left: index * itemWidth,
		behavior: "smooth",
	});
}

if (testimonialsPrevBtn && testimonialsNextBtn && testimonialsList) {
	testimonialsPrevBtn.addEventListener("click", () => {
		scrollTestimonialsTo(currentTestimonialsIndex - 1);
	});

	testimonialsNextBtn.addEventListener("click", () => {
		scrollTestimonialsTo(currentTestimonialsIndex + 1);
	});
}

// Sync index when user scrolls testimonials manually
if (testimonialsList) {
	testimonialsList.addEventListener("scroll", () => {
		const itemWidth = getTestimonialsItemWidth() + getTestimonialsGap();
		const scrollLeft = testimonialsList.scrollLeft;
		currentTestimonialsIndex = Math.round(scrollLeft / itemWidth);
	});
}
