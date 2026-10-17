<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\DocumentRequest;

class DocumentType extends Model
{
    protected $fillable = [
    'name',
    'description',
    'fee',
    'is_active',
];

protected function casts(): array
{
    return [
        'fee' => 'decimal:2',
        'is_active' => 'boolean',
    ];
}

public function documentRequests()
{
    return $this->hasMany(DocumentRequest::class);
}
}
