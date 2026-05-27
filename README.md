# Flora — Flower Bouquets Delivery Service

Практичний випускний проєкт, реалізований за сучасними стандартами веброзмітки та клієнтської логіки.

## 🔗 Посилання на проєкт

*   **Жива сторінка (GitHub Pages):** [https://w33nden.github.io/UMT-markup-practice-Uzhvenko-Denys/](https://w33nden.github.io/UMT-markup-practice-Uzhvenko-Denys/)

---

## 🛠️ Як запустити проєкт локально

Будь ласка, виконайте такі кроки для запуску локального оточення:

1.  **Клонуйте репозиторій:**
    ```bash
    git clone https://github.com/W33nDen/UMT-markup-practice-Uzhvenko-Denys.git
    cd UMT-markup-practice-Uzhvenko-Denys
    ```

2.  **Встановіть залежності:**
    ```bash
    npm install
    ```

3.  **Запустіть локальний backend (json-server):**
    ```bash
    npm run server
    ```
    *Ця команда підніме `json-server` на порту `3001` (база даних `db.json`), який роздає дані про букети.*

4.  **Запустіть статичний сервер для клієнтської частини:**
    *   Відкрийте `index.html` за допомогою плагіна **Live Server** у VS Code (або запустіть будь-який інший статичний веб-сервер у колі проєкту, наприклад, `npx live-server` чи `python -m http.server`).
    *   Сайт автоматично розпізнає локальний сервер на порту `3001` та буде надсилати реальні API-запити через `axios`.
