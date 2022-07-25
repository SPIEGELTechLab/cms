<?php

namespace Statamic\Fieldtypes;

use Statamic\Facades\GraphQL;
use Statamic\Fields\Fieldtype;
use Statamic\GraphQL\Types\TableRowType;

class Table extends Fieldtype
{
    protected $categories = ['structured'];
    protected $collaborationType = 'single-value';

    public function toGqlType()
    {
        return GraphQL::listOf(GraphQL::type(TableRowType::NAME));
    }
}
