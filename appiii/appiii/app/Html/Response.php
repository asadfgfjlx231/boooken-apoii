<?php

namespace App\Html;

class Response
{
    public static function ok(array $data = []): void {
        self::send($data, 200);
    }

    public static function created(array $data = []): void {
        self::send($data, 201);
    }

    public static function error(string $message, int $code = 400): void {
        self::send(['error' => $message], $code);
    }
       public static function deleted(): void {
    self::send([], 204);
}


    private static function send(array $data, int $code): void {
        http_response_code($code);
        header('Content-Type: application/json');
        echo json_encode(['code' => $code] + $data, JSON_THROW_ON_ERROR);
        exit;
    }
    public static function notFound(string $message = 'Not Found'): void {
    self::send(['error' => $message], 404);
}
public static function accepted(array $data = [], string $location = ''): void 
{
    // Ha van megadott URI/jövőbeli lekérdezési cím
    if (!empty($location)) {
        header("Location: $location");
    }

    self::send($data, 202);
}


}