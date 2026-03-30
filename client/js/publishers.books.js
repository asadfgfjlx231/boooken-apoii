export class PublisherBooksService {
    constructor(client) {
        this.client = client;
    }

    async getBooksByPublisher(publisherId) {
        return this.client.get(`/publishers/${publisherId}/books`);
    }
}