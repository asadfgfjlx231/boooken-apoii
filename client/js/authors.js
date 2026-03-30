export class AuthorService {
    constructor(client) {
        this.client = client;
    }

    async getAll() {
        return this.client.get('/authors');
    }

    async getById(id) {
        return this.client.get(`/authors/${id}`);
    }

    async create(data) {
        return this.client.post('/authors', data);
    }

    async update(id, data) {
        return this.client.put(`/authors/${id}`, data);
    }

    async delete(id) {
        return this.client.delete(`/authors/${id}`);
    }
}