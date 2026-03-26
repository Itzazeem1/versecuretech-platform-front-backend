import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0a0a0a;color:#fff;font-family:monospace;font-size:14px;letter-spacing:0.1em;">
      <div style="text-align:center">
        <div style="margin-bottom:16px;font-size:24px;">✓</div>
        <div>Authentication complete. Closing window...</div>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  ngOnInit() {
    // Exchange the OAuth code for a session
    const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        // Notify the parent window
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: 'SUPABASE_AUTH_SIGNED_IN', user: session.user },
            window.location.origin
          );
        }
        // Close this popup
        setTimeout(() => window.close(), 500);
      }
    });

    // Also try session exchange immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: 'SUPABASE_AUTH_SIGNED_IN', user: session.user },
            window.location.origin
          );
        }
        setTimeout(() => window.close(), 100);
      }
    });

    // Fallback: Force close after 2 seconds regardless of status
    setTimeout(() => {
      if (!window.closed) window.close();
    }, 2000);
  }
}
