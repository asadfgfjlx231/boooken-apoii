export class BookService {
    constructor(client) {
        this.client = client;
    }

    async getAll() {
        return this.client.get('/books');
    }

    async getById(id) {
        return this.client.get(`/books/${id}`);
    }

    async create(data) {
        return this.client.post('/books', data);
    }

    async update(id, data) {
        return this.client.put(`/books/${id}`, data);
    }

    async delete(id) {
        return this.client.delete(`/books/${id}`);
    }
}