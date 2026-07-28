#!/bin/bash
# ============================================
# SCRIPT DE SETUP - ALMANAQUE COMUNIDADE
# Fase 1 (Login/Perfil) + Fase 2 (Fórum)
# ============================================

set -e

echo "🌱 Almanaque Comunidade - Setup Automático"
echo "============================================"

if [ -d "app" ] || [ -d "components" ]; then
    echo "⚠️  Já existe uma estrutura de projeto aqui."
    read -p "Queres continuar e sobrescrever? (s/N): " confirm
    if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
        echo "❌ Cancelado."
        exit 1
    fi
fi

echo ""
echo "📁 A criar pastas..."
mkdir -p "app/(auth)/login"
mkdir -p "app/(auth)/registo"
mkdir -p "app/perfil/editar"
mkdir -p "app/forum/[slug]"
mkdir -p "app/forum/topico/[id]"
mkdir -p "app/forum/pesquisa"
mkdir -p "components/ui"
mkdir -p "components/auth"
mkdir -p "components/profile"
mkdir -p "components/forum"
mkdir -p "lib/supabase"
mkdir -p "lib/utils"
mkdir -p "types"
mkdir -p "public"
echo "✅ Pastas criadas"

echo ""
echo "⚙️  A criar ficheiros de configuração..."

cat > package.json << 'PKGEOF'
{
  "name": "almanaque-comunidade",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/ssr": "^0.4.0",
    "@supabase/supabase-js": "^2.44.0",
    "lucide-react": "^0.400.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "typescript": "^5.5.2",
    "@types/node": "^20.14.9",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.4",
    "postcss": "^8.4.38",
    "autoprefixer": "^10.4.19"
  }
}
PKGEOF

cat > next.config.js << 'NCEOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;
NCEOF

cat > tailwind.config.ts << 'TWEOF'
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terra: {
          50: "#f7f5f0",
          100: "#efeadd",
          200: "#e0d5bc",
          300: "#cebb94",
          400: "#bfa070",
          500: "#a68552",
          600: "#8c6b40",
          700: "#6b5033",
          800: "#4d3a28",
          900: "#33261e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
TWEOF

cat > postcss.config.js << 'PCEOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
PCEOF

cat > .env.local.example << 'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=https://<seu-projeto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-anon-key>
ENVEOF

cat > tsconfig.json << 'TSEOF'
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
TSEOF

cat > middleware.ts << 'MDEOF'
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
MDEOF

echo "✅ Configurações criadas"

echo ""
echo "🔧 A criar lib/..."

cat > lib/utils.ts << 'UTEOF'
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
UTEOF

cat > lib/supabase/client.ts << 'SCEOF'
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
SCEOF

cat > lib/supabase/server.ts << 'SSEOF'
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {}
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {}
        },
      },
    }
  );
}
SSEOF

cat > lib/supabase/middleware.ts << 'MIEEOF'
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  await supabase.auth.getUser();
  return response;
}
MIEEOF

cat > lib/utils/slug.ts << 'SLEOF'
export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function generateSlug(title: string, id?: number): string {
  const base = slugify(title);
  return id ? `${base}-${id}` : `${base}-${Date.now()}`;
}
SLEOF

echo "✅ lib/ criada"

echo ""
echo "🎨 A criar components/ui/..."

cat > components/ui/button.tsx << 'BUFEOF'
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terra-400 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-terra-600 text-white hover:bg-terra-700",
        outline: "border-2 border-terra-600 text-terra-600 hover:bg-terra-50",
        ghost: "hover:bg-terra-100 text-terra-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
BUFEOF

cat > components/ui/input.tsx << 'INPEOF'
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm placeholder:text-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
INPEOF

cat > components/ui/card.tsx << 'CRDEEOF'
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border border-terra-200 bg-white text-terra-900 shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-terra-600", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
CRDEEOF

echo "✅ components/ui/ criada"

echo ""
echo "🔐 A criar components/auth/..."

cat > components/auth/login-form.tsx << 'LGFEOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email ou palavra-passe incorretos"
        : "Ocorreu um erro. Tenta novamente.");
    } else {
      router.push("/perfil");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Entra na comunidade do Almanaque</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="o.teu@email.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Palavra-passe</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
LGFEOF

cat > components/auth/register-form.tsx << 'RGFEOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    setLoading(false);

    if (error) {
      setError(
        error.message.includes("already registered")
          ? "Este email ja esta registado"
          : "Ocorreu um erro. Tenta novamente."
      );
    } else {
      router.push("/perfil");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Criar conta</CardTitle>
        <CardDescription>Junta-te a comunidade do Almanaque</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">Nome de utilizador</label>
            <Input
              id="username"
              placeholder="joao_agricultor"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="o.teu@email.pt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Palavra-passe</label>
            <Input
              id="password"
              type="password"
              placeholder="Minimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A criar conta..." : "Criar conta"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
RGFEOF

cat > components/auth/logout-button.tsx << 'LGBEOF'
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleLogout}>
      Sair
    </Button>
  );
}
LGBEOF

echo "✅ components/auth/ criada"

echo ""
echo "👤 A criar components/profile/..."

cat > components/profile/profile-form.tsx << 'PFRMEOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Profile {
  username: string;
  display_name: string | null;
  bio: string | null;
  location: string | null;
}

export function ProfileForm({
  initialProfile,
  userId,
}: {
  initialProfile: Profile | null;
  userId: string;
}) {
  const [form, setForm] = useState({
    username: initialProfile?.username || "",
    display_name: initialProfile?.display_name || "",
    bio: initialProfile?.bio || "",
    location: initialProfile?.location || "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        username: form.username,
        display_name: form.display_name || null,
        bio: form.bio || null,
        location: form.location || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setLoading(false);

    if (error) {
      setMessage("Erro ao guardar. O nome de utilizador pode ja existir.");
    } else {
      setMessage("Perfil atualizado com sucesso!");
      router.refresh();
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Editar Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome de utilizador</label>
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome a mostrar</label>
            <Input
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="Como queres ser chamado?"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Localizacao</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Concelho ou freguesia"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Conta-nos um pouco sobre ti..."
              rows={4}
              className="flex w-full rounded-lg border border-terra-200 bg-white px-3 py-2 text-sm placeholder:text-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-400 focus:border-transparent"
            />
          </div>
          {message && (
            <p className={`text-sm p-3 rounded-lg ${
              message.includes("sucesso")
                ? "text-green-700 bg-green-50"
                : "text-red-600 bg-red-50"
            }`}>
              {message}
            </p>
          )}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : "Guardar"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.push("/perfil")}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
PFRMEOF

echo "✅ components/profile/ criada"

echo ""
echo "💬 A criar components/forum/..."

cat > components/forum/category-card.tsx << 'CCARDEOF'
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  thread_count?: number;
}

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/forum/${category.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">{category.icon}</span>
            <div>
              <h3 className="font-semibold text-terra-800">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-terra-600 mt-1">{category.description}</p>
              )}
              {category.thread_count !== undefined && (
                <p className="text-xs text-terra-400 mt-2">
                  {category.thread_count} topico{category.thread_count !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
CCARDEOF

cat > components/forum/thread-list.tsx << 'TLISTEOF'
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Pin, Lock } from "lucide-react";

interface Thread {
  id: number;
  title: string;
  slug: string;
  author: { username: string };
  replies_count: number;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  last_post_at: string;
  created_at: string;
}

export function ThreadList({ threads }: { threads: Thread[] }) {
  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <Link key={thread.id} href={`/forum/topico/${thread.id}`}>
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {thread.is_pinned && <Pin className="w-4 h-4 text-terra-500 flex-shrink-0" />}
                {thread.is_locked && <Lock className="w-4 h-4 text-terra-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-terra-800 truncate">{thread.title}</h4>
                  <p className="text-sm text-terra-500">
                    por {thread.author.username} · {new Date(thread.created_at).toLocaleDateString("pt-PT")}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-terra-500 flex-shrink-0">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    {thread.replies_count}
                  </span>
                  <span>{thread.views} vistas</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
TLISTEOF

cat > components/forum/post-item.tsx << 'PITEMEOF'
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Post {
  id: number;
  content: string;
  author: { id: string; username: string; reputation: number };
  created_at: string;
  updated_at: string;
  is_first_post: boolean;
}

export function PostItem({ post, currentUserId }: { post: Post; currentUserId?: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const isAuthor = currentUserId === post.author.id;

  async function handleSave() {
    setSaving(true);
    await supabase.from("posts").update({ content }).eq("id", post.id);
    setSaving(false);
    setIsEditing(false);
  }

  return (
    <Card className={post.is_first_post ? "border-terra-300" : ""}>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-32">
            <div className="w-12 h-12 rounded-full bg-terra-200 flex items-center justify-center text-xl font-bold text-terra-700">
              {post.author.username[0].toUpperCase()}
            </div>
            <p className="font-medium text-terra-800 mt-2 text-sm">{post.author.username}</p>
            <p className="text-xs text-terra-500">Reputacao: {post.author.reputation}</p>
          </div>
          <div className="flex-1">
            <div className="text-xs text-terra-400 mb-2">
              {new Date(post.created_at).toLocaleString("pt-PT")}
              {post.updated_at !== post.created_at && " (editado)"}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-terra-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "A guardar..." : "Guardar"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-terra max-w-none">
                <p className="whitespace-pre-wrap">{post.content}</p>
              </div>
            )}
            {isAuthor && !isEditing && (
              <div className="mt-4">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
PITEMEOF

cat > components/forum/new-thread-form.tsx << 'NTFEOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateSlug } from "@/lib/utils/slug";

export function NewThreadForm({ categoryId }: { categoryId: number }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const slug = generateSlug(title);

    const { data: thread, error: threadError } = await supabase
      .from("threads")
      .insert({ category_id: categoryId, title, slug })
      .select()
      .single();

    if (threadError || !thread) {
      setError("Erro ao criar topico. Tenta novamente.");
      setLoading(false);
      return;
    }

    const { error: postError } = await supabase.from("posts").insert({
      thread_id: thread.id,
      content,
      is_first_post: true,
    });

    setLoading(false);

    if (postError) {
      setError("Erro ao criar post. Tenta novamente.");
    } else {
      router.push(`/forum/topico/${thread.id}`);
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Tópico</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Título</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Quando plantar tomates no Alentejo?"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Mensagem</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Descreve a tua duvida ou partilha o teu conhecimento..."
              required
              className="w-full rounded-lg border border-terra-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? "A publicar..." : "Publicar topico"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
NTFEOF

cat > components/forum/reply-form.tsx << 'RPFEOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ReplyForm({ threadId }: { threadId: number }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    const { error } = await supabase.from("posts").insert({
      thread_id: threadId,
      content: content.trim(),
    });

    setLoading(false);

    if (!error) {
      setContent("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Escreve a tua resposta..."
        required
        className="w-full rounded-lg border border-terra-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-terra-400"
      />
      <Button type="submit" disabled={loading}>
        {loading ? "A responder..." : "Responder"}
      </Button>
    </form>
  );
}
RPFEOF

cat > components/forum/search-bar.tsx << 'SBRFEOF'
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/forum/pesquisa?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terra-400" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Pesquisar no forum..."
        className="pl-10"
      />
    </form>
  );
}
SBRFEOF

echo "✅ components/forum/ criada"

echo ""
echo "📄 A criar paginas..."

cat > app/globals.css << 'GCSSEOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-terra-50 text-terra-900 antialiased;
  }
}
GCSSEOF

cat > app/layout.tsx << 'LAYEOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Almanaque da Comunidade",
  description: "A comunidade portuguesa da terra",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
LAYEOF

cat > app/page.tsx << 'HPEOF'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MessageSquare, ShoppingBag, Calendar, BookOpen } from "lucide-react";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-terra-800">Almanaque</h1>
          {user ? (
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/forum">Fórum</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/perfil">Perfil</Link>
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link href="/registo">Criar conta</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div className="text-center py-16">
          <h2 className="text-5xl font-bold text-terra-900 mb-4">
            Comunidade do Almanaque
          </h2>
          <p className="text-xl text-terra-600 max-w-2xl mx-auto mb-8">
            A comunidade portuguesa que partilha conhecimento sobre hortas,
            jardins, animais e tradições da terra.
          </p>
          {user ? (
            <Button asChild size="lg">
              <Link href="/forum">Ir para o Fórum</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/registo">Comecar agora — e gratis</Link>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="Fórum"
            description="Pergunta, responde e partilha conhecimento sobre cultivo."
            href="/forum"
          />
          <FeatureCard
            icon={<ShoppingBag className="w-8 h-8" />}
            title="Feira da Terra"
            description="Compra, vende ou troca produtos locais."
            href="#"
            comingSoon
          />
          <FeatureCard
            icon={<Calendar className="w-8 h-8" />}
            title="Calendário"
            description="Calendário agrícola personalizado para a tua regiao."
            href="#"
            comingSoon
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Almanaque"
            description="Artigos e guias sobre culturas e tradições."
            href="#"
            comingSoon
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  href,
  comingSoon,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  comingSoon?: boolean;
}) {
  return (
    <Link href={href} className={comingSoon ? "pointer-events-none" : ""}>
      <div className={`p-6 rounded-xl border bg-white ${comingSoon ? "opacity-60" : "hover:shadow-md transition-shadow"}`}>
        <div className="text-terra-600 mb-4">{icon}</div>
        <h3 className="font-semibold text-terra-800 mb-2 flex items-center gap-2">
          {title}
          {comingSoon && (
            <span className="text-xs bg-terra-100 text-terra-600 px-2 py-0.5 rounded-full">Brevemente</span>
          )}
        </h3>
        <p className="text-sm text-terra-500">{description}</p>
      </div>
    </Link>
  );
}
HPEOF

cat > "app/(auth)/layout.tsx" << 'ALAYEOF'
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
ALAYEOF

cat > "app/(auth)/login/page.tsx" << 'ALPEOF'
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <LoginForm />
      <p className="text-center text-sm text-terra-600">
        Ainda nao tens conta?{" "}
        <Link href="/registo" className="font-medium text-terra-700 hover:underline">
          Regista-te aqui
        </Link>
      </p>
    </div>
  );
}
ALPEOF

cat > "app/(auth)/registo/page.tsx" << 'ARPEOF'
import { RegisterForm } from "@/components/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <RegisterForm />
      <p className="text-center text-sm text-terra-600">
        Ja tens conta?{" "}
        <Link href="/login" className="font-medium text-terra-700 hover:underline">
          Entra aqui
        </Link>
      </p>
    </div>
  );
}
ARPEOF

cat > app/perfil/page.tsx << 'PPPEOF'
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/auth/logout-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bell, MessageSquare, Heart } from "lucide-react";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-terra-800">Almanaque</Link>
          <div className="flex items-center gap-3">
            <Link href="/forum" className="text-terra-600 hover:text-terra-800">
              <MessageSquare className="w-5 h-5" />
            </Link>
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfil</CardTitle>
                <CardDescription>As tuas informacoes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-terra-600">Nome de utilizador</p>
                    <p className="font-medium">{profile?.username || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-terra-600">Nome</p>
                    <p className="font-medium">{profile?.display_name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-terra-600">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-terra-600">Localizacao</p>
                    <p className="font-medium">{profile?.location || "—"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-terra-600">Bio</p>
                  <p className="font-medium">{profile?.bio || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-terra-500" />
                  <span className="text-sm text-terra-600">Reputacao: {profile?.reputation || 0}</span>
                </div>
                <Button asChild variant="outline">
                  <Link href="/perfil/editar">Editar perfil</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-terra-700">0</p>
                    <p className="text-sm text-terra-500">Tópicos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-terra-700">0</p>
                    <p className="text-sm text-terra-500">Respostas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-terra-700">0</p>
                    <p className="text-sm text-terra-500">Favoritos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificacoes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="p-3 bg-terra-50 rounded-lg text-sm">
                        <p className="text-terra-800">{notif.message}</p>
                        <p className="text-xs text-terra-400 mt-1">
                          {new Date(notif.created_at).toLocaleDateString("pt-PT")}
                        </p>
                        {notif.link && (
                          <Link href={notif.link} className="text-xs text-terra-600 hover:underline mt-1 block">
                            Ver
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-terra-500 text-sm text-center py-4">Sem notificacoes novas</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
PPPEOF

cat > app/perfil/editar/page.tsx << 'PEPEOF'
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function EditProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-terra-800">Editar Perfil</h1>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto p-6">
        <ProfileForm initialProfile={profile} userId={user.id} />
      </main>
    </div>
  );
}
PEPEOF

cat > app/forum/page.tsx << 'FPPEOF'
import { createClient } from "@/lib/supabase/server";
import { CategoryCard } from "@/components/forum/category-card";
import { SearchBar } from "@/components/forum/search-bar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function FórumPage() {
  const supabase = createClient();

  const { data: mainCategories } = await supabase
    .from("categories")
    .select(`
      *,
      children:categories!parent_id(id, name, slug, description, icon),
      threads:threads(count)
    `)
    .is("parent_id", null)
    .eq("type", "forum")
    .order("sort_order");

  const categoriesWithCount = mainCategories?.map((cat: any) => ({
    ...cat,
    thread_count: cat.threads?.[0]?.count || 0,
  }));

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-terra-800">Almanaque</Link>
            <span className="text-terra-300">/</span>
            <span className="text-terra-600">Fórum</span>
          </div>
          <div className="flex items-center gap-3">
            <SearchBar />
            <Button asChild variant="outline">
              <Link href="/perfil">Perfil</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-terra-900 mb-2">Fórum</h1>
        <p className="text-terra-600 mb-8">Partilha conhecimento, faz perguntas e aprende com a comunidade.</p>

        {categoriesWithCount?.map((category: any) => (
          <div key={category.id} className="mb-8">
            <h2 className="text-xl font-semibold text-terra-800 mb-4 flex items-center gap-2">
              <span>{category.icon}</span>
              {category.name}
            </h2>
            {category.description && <p className="text-sm text-terra-500 mb-3">{category.description}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.children?.map((sub: any) => (
                <CategoryCard key={sub.id} category={{ ...sub, thread_count: 0 }} />
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
FPPEOF

cat > "app/forum/[slug]/page.tsx" << 'FSCPEOF'
import { createClient } from "@/lib/supabase/server";
import { ThreadList } from "@/components/forum/thread-list";
import { NewThreadForm } from "@/components/forum/new-thread-form";
import { SearchBar } from "@/components/forum/search-bar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!category) {
    return <div className="p-8 text-center">Categoria nao encontrada</div>;
  }

  const { data: threads } = await supabase
    .from("threads")
    .select(`
      *,
      author:profiles(username)
    `)
    .eq("category_id", category.id)
    .order("is_pinned", { ascending: false })
    .order("last_post_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/forum" className="text-terra-600 hover:text-terra-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-xl font-bold text-terra-800">
              {category.icon} {category.name}
            </span>
          </div>
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        {category.description && <p className="text-terra-600 mb-6">{category.description}</p>}

        {user ? (
          <div className="mb-8">
            <NewThreadForm categoryId={category.id} />
          </div>
        ) : (
          <div className="mb-8 p-4 bg-terra-100 rounded-lg text-center">
            <p className="text-terra-700">
              <Link href="/login" className="font-medium underline">Entra</Link>{" "}
              ou{" "}
              <Link href="/registo" className="font-medium underline">regista-te</Link>{" "}
              para criar um topico.
            </p>
          </div>
        )}

        <h2 className="text-lg font-semibold text-terra-800 mb-4">
          Tópicos ({threads?.length || 0})
        </h2>

        {threads && threads.length > 0 ? (
          <ThreadList threads={threads as any} />
        ) : (
          <p className="text-terra-500 text-center py-12">
            Ainda nao ha topicos nesta categoria. Se o primeiro a criar!
          </p>
        )}
      </main>
    </div>
  );
}
FSCPEOF

cat > "app/forum/topico/[id]/page.tsx" << 'FTCPEOF'
import { createClient } from "@/lib/supabase/server";
import { PostItem } from "@/components/forum/post-item";
import { ReplyForm } from "@/components/forum/reply-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function ThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: thread } = await supabase
    .from("threads")
    .select(`
      *,
      category:categories(name, slug),
      author:profiles(username)
    `)
    .eq("id", Number(params.id))
    .single();

  if (!thread) {
    return <div className="p-8 text-center">Tópico nao encontrado</div>;
  }

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, username, reputation)
    `)
    .eq("thread_id", Number(params.id))
    .order("created_at");

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/forum/${thread.category.slug}`} className="text-terra-600 hover:text-terra-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-sm text-terra-500">{thread.category.name}</span>
              <h1 className="text-xl font-bold text-terra-800">{thread.title}</h1>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/perfil">Perfil</Link>
          </Button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <div className="space-y-4 mb-8">
          {posts?.map((post) => (
            <PostItem
              key={post.id}
              post={post as any}
              currentUserId={user?.id}
            />
          ))}
        </div>

        {user ? (
          thread.is_locked ? (
            <div className="p-4 bg-terra-100 rounded-lg text-center text-terra-600">
              Este topico esta fechado. Não e possivel responder.
            </div>
          ) : (
            <ReplyForm threadId={Number(params.id)} />
          )
        ) : (
          <div className="p-4 bg-terra-100 rounded-lg text-center">
            <p className="text-terra-700">
              <Link href="/login" className="font-medium underline">Entra</Link>{" "}
              para responder a este topico.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
FTCPEOF

cat > "app/forum/pesquisa/page.tsx" << 'FPSPEOF'
import { createClient } from "@/lib/supabase/server";
import { ThreadList } from "@/components/forum/thread-list";
import { SearchBar } from "@/components/forum/search-bar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const query = searchParams.q || "";

  let threads = null;

  if (query) {
    const { data } = await supabase
      .from("threads")
      .select(`
        *,
        author:profiles(username)
      `)
      .textSearch("search_vector", query, {
        type: "websearch",
        config: "portuguese",
      })
      .order("last_post_at", { ascending: false });

    if (!data || data.length === 0) {
      const { data: fallback } = await supabase
        .from("threads")
        .select(`
          *,
          author:profiles(username)
        `)
        .ilike("title", `%${query}%`)
        .order("last_post_at", { ascending: false });
      threads = fallback;
    } else {
      threads = data;
    }
  }

  return (
    <div className="min-h-screen bg-terra-50">
      <nav className="bg-white border-b border-terra-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/forum" className="text-terra-600 hover:text-terra-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <SearchBar />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-terra-900 mb-6">
          Resultados para "{query}"
        </h1>

        {threads && threads.length > 0 ? (
          <ThreadList threads={threads as any} />
        ) : query ? (
          <p className="text-terra-500 text-center py-12">
            Nenhum topico encontrado para "{query}".
          </p>
        ) : (
          <p className="text-terra-500 text-center py-12">
            Escreve algo na barra de pesquisa para encontrar topicos.
          </p>
        )}
      </main>
    </div>
  );
}
FPSPEOF

echo ""
echo "✅ Todas as paginas criadas!"
echo ""
echo "============================================"
echo "🎉 Setup completo!"
echo "============================================"
echo ""
echo "Proximos passos:"
echo ""
echo "1. Copia .env.local.example para .env.local"
echo "   cp .env.local.example .env.local"
echo ""
echo "2. Preenche as credenciais do Supabase em .env.local"
echo ""
echo "3. Instala as dependencias:"
echo "   npm install"
echo ""
echo "4. Corre o projeto:"
echo "   npm run dev"
echo ""
echo "5. Abre http://localhost:3000"
echo ""
echo "6. No Supabase, corre o SQL das Fases 1 e 2"
echo ""
echo "============================================"

