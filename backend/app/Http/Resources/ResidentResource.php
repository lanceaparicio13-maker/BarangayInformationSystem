<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResidentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'full_name' => collect([
                $this->first_name,
                $this->middle_name,
                $this->last_name,
            ])->filter()->implode(' '),
            'birth_date' => $this->birth_date?->toDateString(),
            'gender' => $this->gender,
            'civil_status' => $this->civil_status,
            'phone' => $this->phone,
            'address' => $this->address,
            'purok' => $this->purok,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            'user' => $this->whenLoaded('user', function () {
                return $this->user ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'role' => $this->user->role,
                ] : null;
            }),
        ];
    }
}
