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
	return `
    <li class="bestsellers-item">
      <article class="product-card" data-id="${id}">
        <img
          loading="lazy"
          class="product-card-image"
          src="${img}"
          width="405"
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
	return `
    <li class="bouquets-item">
      <article class="product-card" data-id="${id}">
        <img
          loading="lazy"
          class="product-card-image"
          src="${img}"
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
}

function renderBouquets(items) {
	bouquetsListEl.innerHTML = "";
	const markup = items.map(createBouquetCardMarkup).join("");
	bouquetsListEl.insertAdjacentHTML("beforeend", markup);
}

async function fetchFlowers() {
	try {
		const { data } = await axios.get(API_URL);
		allFlowers = data;

		const bestsellers = data.filter((flower) => flower.category === "top");
		const bouquets = data.filter((flower) => flower.category === "standart");

		renderBestsellers(bestsellers);
		renderBouquets(bouquets);
	} catch (error) {
		console.error("Error fetching flowers:", error.message);
		bestsellersListEl.innerHTML =
			'<li class="error-message">Failed to load bestsellers. Please try again later.</li>';
		bouquetsListEl.innerHTML =
			'<li class="error-message">Failed to load bouquets. Please try again later.</li>';
	}
}

// Modal logic
function openProductModal(flower) {
	productModalImg.src = flower.img;
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

fetchFlowers();
