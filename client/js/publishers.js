export class PublisherService {
    constructor(client) {
        this.client = client;
    }

    async getAll() {
        return this.client.get('/publishers');
    }

    async getById(id) {
        return this.client.get(`/publishers/${id}`);
    }

    async create(data) {
        return this.client.post('/publishers', data);
    }

    async update(id, data) {
        return this.client.put(`/publishers/${id}`, data);
    }

    async delete(id) {
        return this.client.delete(`/publishers/${id}`);
    }
}