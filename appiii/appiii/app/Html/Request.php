<?php

namespace App\Html;

use App\Repositories\BaseRepository;
use App\Repositories\BookRepository;
use App\Repositories\AuthorRepository;
use App\Repositories\CategoryRepository;
use App\Repositories\PublisherRepository;

class Request
{
    
    static array $acceptedRoutes = [
        'POST' => [
            '/books',
            '/authors',
            '/categories',      
            '/publishers'
            
        ],
        'GET' => [
            '/books',
            '/books/{id}',
            '/authors',
            '/authors/{id}/books',
            '/authors/{id}',
            '/categories',    
            '/categories/{id}/books',
            '/publishers',
            '/publishers/{id}/books'
        ],
        'PUT' => [
            '/books/{id}',
            '/authors/{id}',
            '/categories/{id}',      
            '/publishers/{id}'
        ],
        'DELETE' => [
            '/books/{id}',
            '/authors/{id}',
            '/categories/{id}',      
            '/publishers/{id}'
        ],
    ];

   

    public static function handle()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

        if (!self::isRouteAllowed($method, $uri, self::$acceptedRoutes)) {
            Response::error("Hibás route", 400);
            return;
        }

        $data = self::getRequestData();
        $uriData = self::requestUriToArray($uri);

        match ($method) {
            'GET' => self::getRequest(
                $uriData['resourceName'],
                $uriData['resourceId'],
                $uriData['childResourceName']
            ),
            'POST' => self::postRequest(
                $uriData['resourceName'],
                $data
            ),
            'PUT' => self::putRequest(
                $uriData['resourceName'],
                $uriData['resourceId'],
                $data
            ),
            'DELETE' => self::deleteRequest(
                $uriData['resourceName'],
                $uriData['resourceId']
            ),
            default => Response::error("Nem támogatott metódus", 400)
        };
    }

    

    private static function getRequestData(): ?array
    {
        return json_decode(file_get_contents('php://input'), true);
    }

    private static function requestUriToArray(string $uri): array
    {
        $parts = explode('/', trim($uri, '/'));

        return [
            'resourceName' => $parts[0] ?? null,
            'resourceId' => isset($parts[1]) ? (int)$parts[1] : null,
            'childResourceName' => $parts[2] ?? null,
            'childResourceId' => isset($parts[3]) ? (int)$parts[3] : null,
        ];
    }

    private static function isRouteMatch(string $route, string $uri): bool
    {
        $r = explode('/', trim($route, '/'));
        $u = explode('/', trim($uri, '/'));

        if (count($r) !== count($u)) {
            return false;
        }

        foreach ($r as $i => $part) {
            if (preg_match('/^{.*}$/', $part)) {
                continue;
            }
            if ($part !== $u[$i]) {
                return false;
            }
        }

        return true;
    }

    private static function isRouteAllowed(string $method, string $uri, array $routes): bool
    {
        if (!isset($routes[$method])) {
            return false;
        }

        foreach ($routes[$method] as $route) {
            if (self::isRouteMatch($route, $uri)) {
                return true;
            }
        }

        return false;
    }

    private static function getRepository(string $resource): ?BaseRepository
    {
        return match ($resource) {
            'books' => new BookRepository(),
            'authors' => new AuthorRepository(),
            'categories' => new CategoryRepository(),
            'publishers' => new PublisherRepository(),
            default => null
        };
    }

    
    private static function getRequest($resource, $id = null, $child = null)
{
    if ($child === 'books' && $id) {
        $bookRepo = new BookRepository();

        match ($resource) {
            'categories' => Response::ok($bookRepo->getBooksByCategory($id)),
            'authors' => Response::ok($bookRepo->getBooksByAuthor($id)),
            'publishers' => Response::ok($bookRepo->getBooksByPublisher($id)),
            default => Response::error("Nem támogatott szűrés", 400)
        };

        return;
    }

    $repo = self::getRepository($resource);
    if (!$repo) {
        Response::error("Hibás erőforrás", 400);
        return;
    }

    if ($id) {
        $entity = $repo->find($id);
        if (!$entity) {
            Response::notFound("Nem található");
            return;
        }
        Response::ok($entity);
        return;
    }

    Response::ok($repo->getAll());
}


   
        private static function postRequest($resourceName, $requestData)
    {
       

        // Általános CRUD POST
        $repository = self::getRepository($resourceName);
        if (!$repository) {
            Response::error("Couldn't get repository", 400);
            return;
        }

        $newId = $repository->create($requestData);
        if ($newId) {
            Response::created(['id' => $newId]); // 201 Created
            return;
        }

        Response::error("Bad request", 400);
    }
  
    private static function putRequest($resource, $id, $data)
    {
        $repo = self::getRepository($resource);
        if (!$repo || !$repo->find($id)) {
            Response::notFound("Nem található");
            return;
        }

        $repo->update($id, $data);
        Response::accepted();
    }

  
   private static function deleteRequest($resource, $id)
{
    $repo = self::getRepository($resource);

    if (!$repo) {
        Response::notFound("Nem található");
        return;
    }

    // kapcsolódó könyvek törlése
    $bookRepo = new BookRepository();

    if ($resource === 'authors') {
        foreach ($bookRepo->getBooksByAuthor($id) as $book) {
            $bookRepo->delete($book['id']);
        }
    }

    if ($resource === 'publishers') {
        foreach ($bookRepo->getBooksByPublisher($id) as $book) {
            $bookRepo->delete($book['id']);
        }
    }

    if ($resource === 'categories') {
        foreach ($bookRepo->getBooksByCategory($id) as $book) {
            $bookRepo->delete($book['id']);
        }
    }

    if (!$repo->delete($id)) {
        Response::notFound("Nem található");
        return;
    }

    Response::deleted();
}


}
