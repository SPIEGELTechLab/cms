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
        $provider = config('statamic.collaboration.default');

        return [
            'enabled' => true,
            'provider' => [
                'type' => config('statamic.collaboration.default'),
                'url' => config('statamic.collaboration.providers')[$provider]['url'],
                'connected_keyword' => config('statamic.collaboration.providers')[$provider]['connected_keyword'],
                'synced_keyword' => config('statamic.collaboration.providers')[$provider]['synced_keyword'],
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
