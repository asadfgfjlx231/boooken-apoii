import { ApiClient } from './api-client.js';
import { AuthorService } from './authors.js';
import { BookService } from './books.js';
import { CategoryService } from './categories.js';
import { PublisherService } from './publishers.js';

const client    = new ApiClient('http://localhost:6363');
const author    = new AuthorService(client);
const book      = new BookService(client);
const category  = new CategoryService(client);
const publisher = new PublisherService(client);

const content    = document.getElementById('content');
const modal      = document.getElementById('modal');
const appSection = document.getElementById('appSection');

// ── Toast ──────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = type === 'success' ? 'toast-success' : 'toast-error';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

// ── Helpers ────────────────────────────────────────────
function showError(message) {
    content.innerHTML = `<div class="empty-state" style="color:var(--danger)">⚠️ Hiba: ${message}</div>`;
}

function showLoading() {
    content.innerHTML = `<div class="loader"><div class="spinner"></div> Betöltés...</div>`;
}

// API returns {code:200, 0:{...}, 1:{...}, ...}
function extractList(data) {
    return Object.entries(data)
        .filter(([key]) => !isNaN(key))
        .map(([, val]) => val);
}

function closeModal() {
    modal.innerHTML = '';
    modal.classList.add('hidden');
}

function setActiveNav(btnId) {
    appSection.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    document.getElementById(btnId)?.classList.add('active');
}

// ── Generic modal form ─────────────────────────────────
function openCrudModal(title, fields, existingData = {}, onSubmit) {
    modal.innerHTML = `
        <div class="modal-box">
            <h2>${title}</h2>
            <form id="crudForm">
                ${fields.map(f => `
                    <div class="form-group">
                        <label>${f.label}</label>
                        ${f.type === 'textarea'
                            ? `<textarea name="${f.name}" rows="3" placeholder="${f.placeholder || ''}">${existingData[f.name] ?? ''}</textarea>`
                            : `<input type="${f.type || 'text'}" name="${f.name}"
                               value="${existingData[f.name] ?? ''}"
                               placeholder="${f.placeholder || ''}"
                               ${f.required ? 'required' : ''}>`
                        }
                    </div>
                `).join('')}
                <div id="formError" style="color:var(--danger);font-size:0.82rem;min-height:1.2rem;"></div>
                <div class="modal-actions">
                    <button type="button" id="cancelForm" class="btn-secondary">Mégse</button>
                    <button type="submit" class="btn-primary">Mentés</button>
                </div>
            </form>
        </div>`;
    modal.classList.remove('hidden');
    modal.querySelector('#crudForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        try {
            await onSubmit(data);
            closeModal();
        } catch (err) {
            modal.querySelector('#formError').textContent = err.message || 'Hiba történt';
        }
    });
    modal.querySelector('#cancelForm').addEventListener('click', closeModal);
}

function bindTableActions(service, loadFn, fields, entityLabel) {
    content.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm(`Biztosan törlöd ezt a(z) ${entityLabel}?`)) return;
            try {
                await service.delete(btn.dataset.id);
                showToast(`${entityLabel} törölve!`);
                await loadFn();
            } catch (err) { showToast(err.message, 'error'); }
        });
    });
    content.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            try {
                const existing = await service.getById(btn.dataset.id);
                openCrudModal(`✏️ ${entityLabel} szerkesztése`, fields, existing, async (data) => {
                    await service.update(btn.dataset.id, data);
                    showToast(`${entityLabel} frissítve!`);
                    await loadFn();
                });
            } catch (err) { showToast(err.message, 'error'); }
        });
    });
}

// ── AUTHORS ────────────────────────────────────────────
// DB: id, name, bio
const authorFields = [
    { name: 'name', label: 'Név',  required: true },
    { name: 'bio',  label: 'Életrajz', type: 'textarea' },
];

async function loadAuthors() {
    showLoading();
    try {
        const list = extractList(await author.getAll());
        content.innerHTML = `
            <div class="section-header">
                <h2>👤 Szerzők</h2>
                <button id="newAuthorBtn" class="btn-primary">+ Új szerző</button>
            </div>
            <table class="data-table">
                <thead><tr>
                    <th>ID</th><th>Név</th><th>Életrajz</th><th>Műveletek</th>
                </tr></thead>
                <tbody>
                    ${list.map(a => `
                        <tr>
                            <td>${a.id}</td>
                            <td>${a.name ?? '—'}</td>
                            <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.bio ?? '—'}</td>
                            <td style="display:flex;gap:0.4rem;">
                                <button class="btn-secondary btn-sm edit-btn" data-id="${a.id}">✏️</button>
                                <button class="btn-danger btn-sm delete-btn" data-id="${a.id}">🗑</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
        document.getElementById('newAuthorBtn').addEventListener('click', () => {
            openCrudModal('➕ Új szerző', authorFields, {}, async (data) => {
                await author.create(data);
                showToast('Szerző létrehozva!');
                await loadAuthors();
            });
        });
        bindTableActions(author, loadAuthors, authorFields, 'szerző');
    } catch (err) { showError(err.message); }
}

// ── BOOKS ──────────────────────────────────────────────
// DB: id, name, isbn, price, description, author_id, publisher_id, category_id, ratings

function openBookModal(title, existingData = {}, authors, categories, publishers, onSubmit) {
    const authorOptions   = authors.map(a => `<option value="${a.id}" ${existingData.author_id == a.id ? 'selected' : ''}>${a.name}</option>`).join('');
    const categoryOptions = categories.map(c => `<option value="${c.id}" ${existingData.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    const publisherOptions= publishers.map(p => `<option value="${p.id}" ${existingData.publisher_id == p.id ? 'selected' : ''}>${p.name}</option>`).join('');

    modal.innerHTML = `
        <div class="modal-box" style="max-height:90vh;overflow-y:auto;">
            <h2>${title}</h2>
            <form id="crudForm">
                <div class="form-group">
                    <label>Cím</label>
                    <input type="text" name="name" value="${existingData.name ?? ''}" required>
                </div>
                <div class="form-group">
                    <label>ISBN</label>
                    <input type="text" name="isbn" value="${existingData.isbn ?? ''}">
                </div>
                <div class="form-group">
                    <label>Ár</label>
                    <input type="number" name="price" value="${existingData.price ?? ''}">
                </div>
                <div class="form-group">
                    <label>Leírás</label>
                    <textarea name="description" rows="3">${existingData.description ?? ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Szerző</label>
                    <select name="author_id"><option value="">— válassz —</option>${authorOptions}</select>
                </div>
                <div class="form-group">
                    <label>Kiadó</label>
                    <select name="publisher_id"><option value="">— válassz —</option>${publisherOptions}</select>
                </div>
                <div class="form-group">
                    <label>Kategória</label>
                    <select name="category_id"><option value="">— válassz —</option>${categoryOptions}</select>
                </div>
                <div class="form-group">
                    <label>Értékelés</label>
                    <input type="number" name="ratings" value="${existingData.ratings ?? ''}">
                </div>
                <div id="formError" style="color:var(--danger);font-size:0.82rem;min-height:1.2rem;"></div>
                <div class="modal-actions">
                    <button type="button" id="cancelForm" class="btn-secondary">Mégse</button>
                    <button type="submit" class="btn-primary">Mentés</button>
                </div>
            </form>
        </div>`;
    modal.classList.remove('hidden');
    modal.querySelector('#crudForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        try {
            await onSubmit(data);
            closeModal();
        } catch (err) {
            modal.querySelector('#formError').textContent = err.message || 'Hiba történt';
        }
    });
    modal.querySelector('#cancelForm').addEventListener('click', closeModal);
}

async function loadBooks() {
    showLoading();
    try {
        const [books, authorsRaw, categoriesRaw, publishersRaw] = await Promise.all([
            book.getAll(),
            author.getAll(),
            category.getAll(),
            publisher.getAll(),
        ]);
        const list      = extractList(books);
        const authors   = extractList(authorsRaw);
        const categories= extractList(categoriesRaw);
        const publishers= extractList(publishersRaw);

        const authorMap   = Object.fromEntries(authors.map(a => [a.id, a.name]));
        const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
        const publisherMap= Object.fromEntries(publishers.map(p => [p.id, p.name]));

        content.innerHTML = `
            <div class="section-header">
                <h2>📖 Könyvek</h2>
                <button id="newBookBtn" class="btn-primary">+ Új könyv</button>
            </div>
            <table class="data-table">
                <thead><tr>
                    <th>ID</th><th>Cím</th><th>ISBN</th><th>Ár</th><th>Szerző</th><th>Kiadó</th><th>Kategória</th><th>Értékelés</th><th>Műveletek</th>
                </tr></thead>
                <tbody>
                    ${list.map(b => `
                        <tr>
                            <td>${b.id}</td>
                            <td>${b.name ?? '—'}</td>
                            <td>${b.isbn ?? '—'}</td>
                            <td>${b.price ?? '—'}</td>
                            <td>${authorMap[b.author_id] ?? '—'}</td>
                            <td>${publisherMap[b.publisher_id] ?? '—'}</td>
                            <td>${categoryMap[b.category_id] ?? '—'}</td>
                            <td>${b.ratings ?? '—'}</td>
                            <td style="display:flex;gap:0.4rem;">
                                <button class="btn-secondary btn-sm edit-btn" data-id="${b.id}">✏️</button>
                                <button class="btn-danger btn-sm delete-btn" data-id="${b.id}">🗑</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;

        // New book
        document.getElementById('newBookBtn').addEventListener('click', () => {
            openBookModal('➕ Új könyv', {}, authors, categories, publishers, async (data) => {
                await book.create(data);
                showToast('Könyv létrehozva!');
                await loadBooks();
            });
        });

        // Delete
        content.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Biztosan törlöd ezt a könyvet?')) return;
                try {
                    await book.delete(btn.dataset.id);
                    showToast('Könyv törölve!');
                    await loadBooks();
                } catch (err) { showToast(err.message, 'error'); }
            });
        });

        // Edit with dropdowns
        content.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                try {
                    const existing = await book.getById(btn.dataset.id);
                    openBookModal('✏️ Könyv szerkesztése', existing, authors, categories, publishers, async (data) => {
                        await book.update(btn.dataset.id, data);
                        showToast('Könyv frissítve!');
                        await loadBooks();
                    });
                } catch (err) { showToast(err.message, 'error'); }
            });
        });

    } catch (err) { showError(err.message); }
}

// ── CATEGORIES ─────────────────────────────────────────
// DB: id, name
const categoryFields = [
    { name: 'name', label: 'Kategória neve', required: true },
];

async function loadCategories() {
    showLoading();
    try {
        const list = extractList(await category.getAll());
        content.innerHTML = `
            <div class="section-header">
                <h2>🗂 Kategóriák</h2>
                <button id="newCategoryBtn" class="btn-primary">+ Új kategória</button>
            </div>
            <table class="data-table">
                <thead><tr>
                    <th>ID</th><th>Név</th><th>Műveletek</th>
                </tr></thead>
                <tbody>
                    ${list.map(c => `
                        <tr>
                            <td>${c.id}</td>
                            <td>${c.name ?? '—'}</td>
                            <td style="display:flex;gap:0.4rem;">
                                <button class="btn-secondary btn-sm edit-btn" data-id="${c.id}">✏️</button>
                                <button class="btn-danger btn-sm delete-btn" data-id="${c.id}">🗑</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
        document.getElementById('newCategoryBtn').addEventListener('click', () => {
            openCrudModal('➕ Új kategória', categoryFields, {}, async (data) => {
                await category.create(data);
                showToast('Kategória létrehozva!');
                await loadCategories();
            });
        });
        bindTableActions(category, loadCategories, categoryFields, 'kategória');
    } catch (err) { showError(err.message); }
}

// ── PUBLISHERS ─────────────────────────────────────────
// DB: id, name
const publisherFields = [
    { name: 'name', label: 'Kiadó neve', required: true },
];

async function loadPublishers() {
    showLoading();
    try {
        const list = extractList(await publisher.getAll());
        content.innerHTML = `
            <div class="section-header">
                <h2>🏢 Kiadók</h2>
                <button id="newPublisherBtn" class="btn-primary">+ Új kiadó</button>
            </div>
            <table class="data-table">
                <thead><tr>
                    <th>ID</th><th>Név</th><th>Műveletek</th>
                </tr></thead>
                <tbody>
                    ${list.map(p => `
                        <tr>
                            <td>${p.id}</td>
                            <td>${p.name ?? '—'}</td>
                            <td style="display:flex;gap:0.4rem;">
                                <button class="btn-secondary btn-sm edit-btn" data-id="${p.id}">✏️</button>
                                <button class="btn-danger btn-sm delete-btn" data-id="${p.id}">🗑</button>
                            </td>
                        </tr>`).join('')}
                </tbody>
            </table>`;
        document.getElementById('newPublisherBtn').addEventListener('click', () => {
            openCrudModal('➕ Új kiadó', publisherFields, {}, async (data) => {
                await publisher.create(data);
                showToast('Kiadó létrehozva!');
                await loadPublishers();
            });
        });
        bindTableActions(publisher, loadPublishers, publisherFields, 'kiadó');
    } catch (err) { showError(err.message); }
}

// ── Init ───────────────────────────────────────────────
appSection.style.display = 'flex';
document.getElementById('authSection').style.display = 'none';
document.getElementById('loginSection').style.display = 'none';
content.innerHTML = `
    <div class="welcome-screen">
        <div class="big-icon">📚</div>
        <h2>Könyv REST API</h2>
        <p>Válassz a bal oldali menüből az adatok kezeléséhez.</p>
    </div>`;

// ── Nav bindings ───────────────────────────────────────
document.getElementById('listAuthors')?.addEventListener('click',    () => { setActiveNav('listAuthors');    loadAuthors(); });
document.getElementById('listBooks')?.addEventListener('click',      () => { setActiveNav('listBooks');      loadBooks(); });
document.getElementById('listCategories')?.addEventListener('click', () => { setActiveNav('listCategories'); loadCategories(); });
document.getElementById('listPublishers')?.addEventListener('click', () => { setActiveNav('listPublishers'); loadPublishers(); });