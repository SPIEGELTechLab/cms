<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Collaboration
    |--------------------------------------------------------------------------
    |
    | Whether the Collaboration should be enabled, which is the default.
    |
    | If NOT using the Statamic pro version, it will automatically be
    | disabled. How do you want to use collaboration with only one
    | user anyways? That does sound pretty lonely waiting for
    | others to join, if they can't in the first place.
    |
    */

    'enabled' => env('COLLABORATION_ENABLED', false),

    'websocket' => [
        'url' => env('COLLABORATION_WS_URL', 'wss://demos.yjs.dev'),
    ],

];
