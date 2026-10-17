<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Resident;
use App\Models\User;

class CommunityConcern extends Model
{
    protected $fillable = [
    'resident_id',
    'title',
    'description',
    'category',
    'status',
    'staff_remarks',
    'assigned_to',
    'resolved_at',
];

protected function casts(): array
{
    return [
        'resolved_at' => 'datetime',
    ];
}

public function resident()
{
    return $this->belongsTo(Resident::class);
}

public function assignee()
{
    return $this->belongsTo(User::class, 'assigned_to');
}
}
