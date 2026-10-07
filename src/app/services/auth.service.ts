import { Injectable, effect, inject, signal } from "@angular/core";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../services/supabase.client";
import { TaskStore } from "../services/task-store.service";

@Injectable({providedIn:'root'})
export class AuthService{
    private readonly store = inject(TaskStore);
    private receivedAuthEvent = false;
    private resolveInitialized!: () => void;

    readonly session = signal<Session | null>(null);
    readonly initialized = new Promise<void>(resolve => {
        this.resolveInitialized = resolve;
    });

    constructor(){
        supabase.auth.onAuthStateChange((_, session) => {
            this.receivedAuthEvent = true;
            this.session.set(session);
            this.resolveInitialized();
        });

        void supabase.auth.getSession().then(({data, error}) => {
            if (!this.receivedAuthEvent && !error) {
                this.session.set(data.session);
            }
            this.resolveInitialized();
        }).catch(() => this.resolveInitialized());

        effect(()=> {
            this.store.setUser(this.session()?.user.id);
        });
    }

    login(){
        return supabase.auth.signInWithOAuth({
            provider: 'github',
            options: {
                redirectTo: `${window.location.origin}/board`,
            },
        });
    }

    logout(){
        return supabase.auth.signOut();
    }
}
