<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_resident_can_register_successfully(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Test Resident',
            'email' => 'newresident@example.com',
            'password' => 'ResidentPass123!',
            'password_confirmation' => 'ResidentPass123!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Registration successful.')
            ->assertJsonPath('user.name', 'Test Resident')
            ->assertJsonPath('user.email', 'newresident@example.com')
            ->assertJsonPath('user.role', 'resident')
            ->assertJsonStructure([
                'message',
                'user',
                'token',
            ]);

        $this->assertDatabaseHas('users', [
            'name' => 'Test Resident',
            'email' => 'newresident@example.com',
            'role' => 'resident',
        ]);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_registration_requires_valid_input(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'password_confirmation' => 'different',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'email',
                'password',
            ]);

        $this->assertDatabaseCount('users', 0);
    }

    public function test_registration_rejects_an_existing_email(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
            'role' => 'resident',
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Another Resident',
            'email' => 'existing@example.com',
            'password' => 'ResidentPass123!',
            'password_confirmation' => 'ResidentPass123!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('users', 1);
    }

    public function test_user_can_log_in_with_valid_credentials(): void
    {
        User::factory()->create([
            'name' => 'Login Resident',
            'email' => 'loginresident@example.com',
            'password' => 'ResidentPass123!',
            'role' => 'resident',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'loginresident@example.com',
            'password' => 'ResidentPass123!',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Login successful.')
            ->assertJsonPath('user.email', 'loginresident@example.com')
            ->assertJsonStructure([
                'message',
                'user',
                'token',
            ]);

        $this->assertDatabaseCount('personal_access_tokens', 1);
    }

    public function test_login_rejects_incorrect_credentials(): void
    {
        User::factory()->create([
            'email' => 'loginresident@example.com',
            'password' => 'ResidentPass123!',
            'role' => 'resident',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'loginresident@example.com',
            'password' => 'WrongPassword123!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_authenticated_user_can_view_their_account(): void
    {
        $user = User::factory()->create([
            'name' => 'Current User',
            'email' => 'currentuser@example.com',
            'role' => 'resident',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/user');

        $response
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('name', 'Current User')
            ->assertJsonPath('email', 'currentuser@example.com')
            ->assertJsonPath('role', 'resident');
    }

    public function test_guest_cannot_view_the_current_user_endpoint(): void
    {
        $this->getJson('/api/user')
            ->assertUnauthorized();
    }

    public function test_resident_cannot_access_staff_only_endpoint(): void
    {
        $resident = User::factory()->create([
            'role' => 'resident',
        ]);

        $this->actingAs($resident)
            ->getJson('/api/staff-test')
            ->assertForbidden();
    }

    public function test_staff_can_access_staff_only_endpoint(): void
    {
        $staff = User::factory()->create([
            'name' => 'Test Staff',
            'role' => 'staff',
        ]);

        $this->actingAs($staff)
            ->getJson('/api/staff-test')
            ->assertOk()
            ->assertJsonPath('message', 'Staff access granted!')
            ->assertJsonPath('user', 'Test Staff');
    }

    public function test_admin_can_access_staff_only_endpoint(): void
    {
        $admin = User::factory()->create([
            'name' => 'Test Admin',
            'role' => 'admin',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/staff-test')
            ->assertOk()
            ->assertJsonPath('message', 'Staff access granted!')
            ->assertJsonPath('user', 'Test Admin');
    }

    public function test_user_can_log_out_and_the_token_becomes_invalid(): void
    {
        User::factory()->create([
            'email' => 'logoutuser@example.com',
            'password' => 'ResidentPass123!',
            'role' => 'resident',
        ]);

        // Log in to obtain a real Sanctum token.
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'logoutuser@example.com',
            'password' => 'ResidentPass123!',
        ]);

        $loginResponse->assertOk();

        $token = $loginResponse->json('token');

        // Confirm the token was created.
        $this->assertDatabaseCount('personal_access_tokens', 1);

        // Log out using that token.
        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logout successful.');

        // Verify the token was actually deleted.
        $this->assertDatabaseCount('personal_access_tokens', 0);

        // Clear cached authentication state before checking the token again.
        Auth::forgetGuards();

        // The revoked token should no longer authenticate the user.
        $this->withToken($token)
            ->getJson('/api/user')
            ->assertUnauthorized();
    }
}
