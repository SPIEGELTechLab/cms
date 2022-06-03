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
        ]]);
    }

    private function isCollaborationEnabled(): bool
    {
        if (! Statamic::pro()) {
            return false;
        }

        if (User::query()->count() <= 1) {
            return false;
        }

        return config('statamic.collaboration.enabled', true);
    }
}
