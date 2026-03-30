export class CategoryService {
    constructor(client) {
        this.client = client;
    }

    async getAll() {
        return this.client.get('/categories');
    }

    async getById(id) {
        return this.client.get(`/categories/${id}`);
    }

    async create(data) {
        return this.client.post('/categories', data);
    }

    async update(id, data) {
        return this.client.put(`/categories/${id}`, data);
    }

    async delete(id) {
        return this.client.delete(`/categories/${id}`);
    }
}