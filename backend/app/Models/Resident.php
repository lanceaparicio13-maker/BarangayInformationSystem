<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\DocumentRequest;
use App\Models\CommunityConcern;

class Resident extends Model
{
    protected $fillable = [
    'user_id',
    'first_name',
    'middle_name',
    'last_name',
    'birth_date',
    'gender',
    'civil_status',
    'phone',
    'address',
    'purok',
];

public function user()
{
    return $this->belongsTo(User::class);
}

public function documentRequests()
{
    return $this->hasMany(DocumentRequest::class);
}

public function communityConcerns()
{
    return $this->hasMany(CommunityConcern::class);
}
}
