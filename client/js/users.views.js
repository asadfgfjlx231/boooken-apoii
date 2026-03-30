export function renderLoginForm() {
    return `
        <div class="modal-box">
            <h2>🔐 Bejelentkezés</h2>
            <form id="loginFormElement">
                <div class="form-group">
                    <label for="email">Email</label>
                    <input type="email" name="email" id="email" placeholder="pelda@email.com" required>
                </div>
                <div class="form-group">
                    <label for="password">Jelszó</label>
                    <input type="password" name="password" id="password" placeholder="••••••••" required>
                </div>
                <div id="loginError" style="color: var(--danger); font-size: 0.82rem; min-height: 1.2rem;"></div>
                <div class="modal-actions">
                    <button type="button" id="cancelLogin" class="btn-secondary">Mégse</button>
                    <button type="submit" class="btn-primary">Bejelentkezés</button>
                </div>
            </form>
        </div>
    `;
}

export function renderUsersTable(users) {
    if (!users || users.length === 0) {
        return `<div class="empty-state">Nincs felhasználó.</div>`;
    }
    return `
        <div class="section-header">
            <h2>👥 Felhasználók</h2>
        </div>
        <table class="data-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Név</th>
                    <th>Email</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(u => `
                    <tr>
                        <td>${u.id}</td>
                        <td>${u.name}</td>
                        <td>${u.email}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}