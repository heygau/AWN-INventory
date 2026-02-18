'use client';

import { useState, type FormEvent } from 'react';
import { createClient as createSupabaseClient } from '../../utils/supabase/client';

export default function Page() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setError('Email is required.');
      return;
    }

    if (!trimmedEmail.endsWith('@awn.net')) {
      setError('Email must end with @awn.net');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    try {
      const supabase = createSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError('Something went wrong while signing in. Please try again.');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F6F9',
        margin: 0,
        padding: 0,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <section
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: 40,
          width: '100%',
          maxWidth: 420,
          boxSizing: 'border-box',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 10,
              backgroundColor: '#1B2B4B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 1,
            }}
          >
            AWN
          </div>
          <div
            style={{
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                margin: 0,
                marginBottom: 8,
                color: '#1B2B4B',
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              Asset Portal
            </h1>
            <p
              style={{
                margin: 0,
                color: '#6B7280',
                fontSize: 14,
              }}
            >
              Sign in with your AWN email address
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              marginBottom: 12,
            }}
          >
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 14,
                color: '#1B2B4B',
                fontWeight: 500,
              }}
            >
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@awn.net"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontSize: 14,
                color: '#1B2B4B',
                fontWeight: 500,
              }}
            >
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </label>
          </div>

          {error && (
            <div
              style={{
                marginBottom: 12,
                color: '#DC2626',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 8,
              border: 'none',
              backgroundColor: '#1B2B4B',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Sign In
          </button>
        </form>

        <p
          style={{
            marginTop: 16,
            marginBottom: 0,
            fontSize: 12,
            color: '#9CA3AF',
            textAlign: 'center',
          }}
        >
          Restricted to @awn.net email addresses only
        </p>
      </section>
    </main>
  );
}