const API_URL = "http://localhost:3001/flowers";

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

function createProductCardMarkup({ id, img, title, desc, price }) {
	const img2x = img.replace(".png", "@2x.png").replace(".webp", "@2x.webp");
	return `
    <li class="bestsellers-item">
      <article class="product-card" data-id="${id}">
        <img
          loading="lazy"
          class="product-card-image"
          src="${img}"
          srcset="${img} 1x, ${img2x} 2x"
          width="302"
          height="320"
          alt="${title} bouquet"
        />
        <h3 class="product-card-title">${title}</h3>
        <p class="product-card-text">${desc}</p>
        <p class="product-card-price">$${price}</p>
      </article>
    </li>
  `;
}

function createBouquetCardMarkup({ id, img, title, desc, price }) {
	const img2x = img.replace(".png", "@2x.png").replace(".webp", "@2x.webp");
	return `
    <li class="bouquets-item">
      <article class="product-card" data-id="${id}">
        <img
          loading="lazy"
          class="product-card-image"
          src="${img}"
          srcset="${img} 1x, ${img2x} 2x"
          width="302"
          height="320"
          alt="${title} bouquet"
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
					`<li><span class="bestsellers-dot ${index === 0 ? "is-active" : ""}" data-index="${index}"></span></li>`
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
		const response = await axios.get(`${API_URL}?category=top`);
		const itemsArray = Array.isArray(response.data) ? response.data : (response.data.data || []);
		
		const newItems = itemsArray.filter(
			(newItem) => !allFlowers.some((existing) => existing.id === newItem.id)
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
		url.searchParams.append("_per_page", BOUQUETS_LIMIT); // For json-server v1+

		if (currentSearch) {
			url.searchParams.append("q", currentSearch); // json-server v1+ full-text search
		}

		if (currentSort) {
			const [sortField, sortOrder] = currentSort.split("_");
			if (sortOrder === "desc") {
				url.searchParams.append("_sort", `-${sortField}`); // json-server v1+ desc
			} else {
				url.searchParams.append("_sort", sortField); // json-server v1+ asc
			}
		}

		const response = await axios.get(url.href);
		const itemsArray = Array.isArray(response.data) ? response.data : (response.data.data || []);

		const newItems = itemsArray.filter(
			(newItem) => !allFlowers.some((existing) => existing.id === newItem.id)
		);
		allFlowers = [...allFlowers, ...newItems];

		if (page === 1) {
			bouquetsListEl.innerHTML = "";
		}

		const markup = itemsArray.map(createBouquetCardMarkup).join("");
		bouquetsListEl.insertAdjacentHTML("beforeend", markup);

		const loadMoreBtn = document.getElementById("load-more-bouquets");
		if (loadMoreBtn) {
			// json-server v1 returns "next" property for pagination if there's a next page
			const hasNextPage = response.data && response.data.next !== null && response.data.next !== undefined;
			
			if (itemsArray.length < BOUQUETS_LIMIT || (response.data.data && !hasNextPage)) {
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
	const img2x = flower.img.replace(".png", "@2x.png").replace(".webp", "@2x.webp");
	productModalImg.src = flower.img;
	productModalImg.srcset = `${flower.img} 1x, ${img2x} 2x`;
	productModalImg.alt = `${flower.title} bouquet`;
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

// Slider Logic for Top-Selling Bouquets
const prevSlideBtn = document.querySelector('button[aria-label="Previous slide"]');
const nextSlideBtn = document.querySelector('button[aria-label="Next slide"]');
const dotsContainer = document.querySelector(".bestsellers-dots");

function getBestsellersItemWidth() {
	return bestsellersListEl.querySelector(".bestsellers-item")?.offsetWidth || 300;
}

function getBestsellersGap() {
	return parseInt(window.getComputedStyle(bestsellersListEl).gap) || 24;
}

if (prevSlideBtn && nextSlideBtn) {
	prevSlideBtn.addEventListener("click", () => {
		bestsellersListEl.scrollBy({ left: -(getBestsellersItemWidth() + getBestsellersGap()), behavior: "smooth" });
	});

	nextSlideBtn.addEventListener("click", () => {
		bestsellersListEl.scrollBy({ left: getBestsellersItemWidth() + getBestsellersGap(), behavior: "smooth" });
	});
}

bestsellersListEl.addEventListener("scroll", () => {
	const itemWidth = getBestsellersItemWidth() + getBestsellersGap();
	const scrollLeft = bestsellersListEl.scrollLeft;
	const index = Math.round(scrollLeft / itemWidth);

	const dots = document.querySelectorAll(".bestsellers-dot");
	dots.forEach((dot, i) => {
		if (i === index) {
			dot.classList.add("is-active");
		} else {
			dot.classList.remove("is-active");
		}
	});
});

if (dotsContainer) {
	dotsContainer.addEventListener("click", (e) => {
		if (e.target.classList.contains("bestsellers-dot")) {
			const index = parseInt(e.target.dataset.index);
			if (!isNaN(index)) {
				const itemWidth = getBestsellersItemWidth() + getBestsellersGap();
				bestsellersListEl.scrollTo({ left: index * itemWidth, behavior: "smooth" });
			}
		}
	});
}
