<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Resident;
use App\Models\DocumentType;
use App\Models\User;

class DocumentRequest extends Model
{
    protected $fillable = [
    'resident_id',
    'document_type_id',
    'purpose',
    'status',
    'staff_remarks',
    'processed_by',
    'released_at',
];

protected function casts(): array
{
    return [
        'released_at' => 'datetime',
    ];
}

public function resident()
{
    return $this->belongsTo(Resident::class);
}

public function documentType()
{
    return $this->belongsTo(DocumentType::class);
}

public function processor()
{
    return $this->belongsTo(User::class, 'processed_by');
}
}
