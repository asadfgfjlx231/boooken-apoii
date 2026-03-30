export class UserService {
    constructor(client) {
        this.client = client;
    }

    async login(email, password) {
        return this.client.post('/login', { email, password });
    }

    async register(name, email, password) {
        return this.client.post('/register', { name, email, password });
    }

    async getAll() {
        return this.client.get('/users');
    }
}