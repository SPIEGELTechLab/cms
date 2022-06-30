<?php

namespace Statamic\Providers;

use Statamic\Statamic;
use Statamic\Facades\User;
use Illuminate\Support\ServiceProvider;

class CollaborationServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->app->booted(function () {
            $variables = $this->enabled() ? $this->variables() : ['enabled' => false];
            Statamic::provideToScript(['collaboration' => $variables]);
        });
    }

    protected function variables()
    {
        return [
            'enabled' => true,
            'provider' => [
                'type' => config('statamic.collaboration.default'),
                'url' => config('statamic.collaboration.providers')[config('statamic.collaboration.default')]['url']
            ],
        ];
    }

    protected function enabled(): bool
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
