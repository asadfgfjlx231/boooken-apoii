export class CategoryBooksService {
    constructor(client) {
        this.client = client;
    }

    async getBooksByCategory(categoryId) {
        return this.client.get(`/categories/${categoryId}/books`);
    }
}