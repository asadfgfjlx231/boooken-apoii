<?php
namespace App\Repositories;

class BookRepository extends BaseRepository
{
    public string $tableName = 'books';

    /**
     * JOIN-os alap SELECT – minden GET ezt használja
     */
    protected function select(): string
    {
        return "
            SELECT 
                books.id,
                books.name,
                books.isbn,
                books.price,
                books.description,
                books.cover_url,
                books.ratings,

                authors.id AS author_id,
                authors.name AS author,

                publishers.id AS publisher_id,
                publishers.name AS publisher,

                categories.id AS category_id,
                categories.name AS category

            FROM books
            JOIN authors ON authors.id = books.author_id
            JOIN publishers ON publishers.id = books.publisher_id
            JOIN categories ON categories.id = books.category_id
        ";
    }

    /**
     * CREATE – ID-kat várunk
     */
    public function create(array $data): ?int
    {
        if (!isset($data['category_id'], $data['author_id'], $data['publisher_id'])) {
            throw new \Exception("BookRepository error: author_id, publisher_id, category_id are required.");
        }

        return parent::create($data);
    }

    /**
     * Könyvek kategória szerint
     */
    public function getBooksByCategory(int $categoryId): array
    {
        $sql = $this->select() . " WHERE categories.id = $categoryId";
        return $this->mysqli->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Könyvek szerző szerint
     */
    public function getBooksByAuthor(int $authorId): array
    {
        $sql = $this->select() . " WHERE authors.id = $authorId";
        return $this->mysqli->query($sql)->fetch_all(MYSQLI_ASSOC);
    }

    /**
     * Könyvek kiadó szerint
     */
    public function getBooksByPublisher(int $publisherId): array
    {
        $sql = $this->select() . " WHERE publishers.id = $publisherId";
        return $this->mysqli->query($sql)->fetch_all(MYSQLI_ASSOC);
    }
}
