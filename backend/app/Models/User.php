<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Resident;
use App\Models\DocumentRequest;
use App\Models\CommunityConcern;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function resident()
    {
        return $this->hasOne(Resident::class);
    }

    public function processedRequests()
    {
        return $this->hasMany(DocumentRequest::class, 'processed_by');
    }

    public function assignedConcerns()
    {
        return $this->hasMany(CommunityConcern::class, 'assigned_to');
    }
}
