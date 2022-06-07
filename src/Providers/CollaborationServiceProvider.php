<?php

namespace Statamic\Providers;

use Statamic\Statamic;
use Statamic\Facades\User;
use Illuminate\Support\ServiceProvider;

class CollaborationServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Statamic::provideToScript(['collaboration' => [
            'enabled' => $this->isCollaborationEnabled(),
            'websocket' => [
                'url' => config('statamic.collaboration.websocket.url'),
            ]
        ]]);
    }

    private function isCollaborationEnabled(): bool
    {
        if (! Statamic::pro()) {
            return false;
        }

        // TODO: Calling the User Facade does fail tests.
        // if (User::query()->count() <= 1) {
        //     return false;
        // }

        return config('statamic.collaboration.enabled', true);
    }
}
