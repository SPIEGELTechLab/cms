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

    'enabled' => env('STATAMIC_COLLABORATION_ENABLED', false),

    'default' => env('STATAMIC_COLLABORATION_PROVIDER', 'peer_to_peer'),

    'providers' => [
        'peer_to_peer' => [
            'url' => env('STATAMIC_COLLABORATION_URL', 'wss://signaling.yjs.dev'),
        ],
        'websocket' => [
            'url' => env('STATAMIC_COLLABORATION_URL', 'wss://demos.yjs.dev'),
        ]
    ]

];
