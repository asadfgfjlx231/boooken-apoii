<?php
namespace App\Repositories;

use App\Database\DatabaseConnection;
use App\Interfaces\RepositoryInterface;
use Exception;

abstract class BaseRepository extends DatabaseConnection implements RepositoryInterface
{
    public string $tableName = '';

    public function __construct(
        $host = self::HOST,
        $user = self::USER,
        $password = self::PASSWORD,
        $database = self::DATABASE
    ) {
        parent::__construct($host, $user, $password, $database);

        if (empty($this->tableName)) {
            throw new Exception("Repository error: tableName must be defined in child class.");
        }
    }

    public function create(array $data): ?int
    {
        $fields = implode(',', array_keys($data));
        $values = implode(',', array_map(fn($v) => "'$v'", $data));

        $sql = sprintf("INSERT INTO `%s` (%s) VALUES (%s)", $this->tableName, $fields, $values);
        $this->mysqli->query($sql);

        $lastInserted = $this->mysqli->query("SELECT LAST_INSERT_ID() id;")->fetch_assoc();
        return $lastInserted['id'] ?? null;
    }

  public function find(int $id): array
{
    $query = $this->select() . "WHERE {$this->tableName}.id = $id";
    return $this->mysqli->query($query)->fetch_assoc() ?? [];
}


    public function getAll(): array
    {
        $query = $this->select() . "ORDER BY name";
        return $this->mysqli->query($query)->fetch_all(MYSQLI_ASSOC);
    }

    public function update(int $id, array $data)
    {
        $set = implode(', ', array_map(fn($f, $v) => "$f = '$v'", array_keys($data), $data));
$query = sprintf(
    "UPDATE `%s` SET %s WHERE `%s`.id = %d",
    $this->tableName,
    $set,
    $this->tableName,
    $id
);
        $this->mysqli->query($query);

        return $this->find($id);
    }

    public function delete(int $id)
    {
        $query = sprintf("DELETE FROM `%s` WHERE `%s`.id = %d", $this->tableName, $this->tableName, $id);
        return $this->mysqli->query($query);
    }

    protected function select(): string
    {
        return "SELECT * FROM `{$this->tableName}` ";
    }
}