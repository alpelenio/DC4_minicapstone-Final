<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create($request->validated() + ['role' => 'resident']);
        $token = $user->createToken('barangaybook-web')->plainTextToken;

        return response()->json(['token' => $token, 'user' => UserResource::make($user)], 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->validated('email'))->first();
        if (!$user || !Hash::check($request->validated('password'), $user->password)) {
            throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
        }

        $token = $user->createToken('barangaybook-web')->plainTextToken;

        return response()->json(['token' => $token, 'user' => UserResource::make($user)]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->noContent();
    }

    public function user(Request $request)
    {
        return UserResource::make($request->user());
    }
}
