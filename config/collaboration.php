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

    /*
    |--------------------------------------------------------------------------
    | Default Provider
    |--------------------------------------------------------------------------
    |
    | Collaboration does offer multiple providers to sync between clients.
    |
    | Peer to peer collaboration is the default, as it only requires one
    | signaling server which syncs all changes directly between clients.
    | This solution is great for smaller teams on normal web projects.
    |
    | The websocket connection does require a websocket server, which
    | is in need of more resources to run. The actual state will be 
    | saved on the websocket server directly and is a great option
    | for sites with many users, as a websocket does scale well.
    | 
    | Available: `peer_to_peer` or `websocket`
    |
    */

    'default' => env('STATAMIC_COLLABORATION_PROVIDER', 'peer_to_peer'),

    /*
    |--------------------------------------------------------------------------
    | Providers
    |--------------------------------------------------------------------------
    |
    | Here are each of the provider connections setup for your application.
    |
    */

    'providers' => [

        'peer_to_peer' => [
            'url' => env('STATAMIC_COLLABORATION_URL', 'wss://signaling.yjs.dev'),
            'connected_keyword' => 'connected',
            'synced_keyword' => null,
        ],

        'websocket' => [
            'url' => env('STATAMIC_COLLABORATION_URL', 'wss://demos.yjs.dev'),
            'connected_keyword' => 'wsconnected',
            'synced_keyword' => 'synced',
        ],

    ],

];
