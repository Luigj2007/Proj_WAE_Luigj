<script>
	import { resolve } from '$app/paths';

	let { form } = $props();
</script>

<svelte:head>
	<title>Login | Image Blog</title>
</svelte:head>

<main class="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
	<form
		action="?/login"
		method="POST"
		class="w-full max-w-md space-y-5 rounded-lg border border-app-line bg-app-surface p-6 shadow-app-soft sm:p-8"
	>
		<div>
			<p class="text-xs font-bold text-app-primary uppercase">Welcome back</p>
			<h1 class="mt-2 text-3xl font-black text-app-ink">Login</h1>
			<p class="mt-2 text-sm text-app-muted">
				Continue to your profile and manage your image posts.
			</p>
		</div>

		{#if form?.message}
			<p class="rounded-md bg-red-50 px-4 py-3 text-sm font-semibold text-app-danger">
				{form.message}
			</p>
		{/if}

		<div>
			<label for="username" class="mb-1 block text-sm font-semibold text-app-ink">Username</label>
			<input
				type="text"
				id="username"
				name="username"
				placeholder="Enter your username"
				required
				class="w-full rounded-md border-app-line bg-white p-3 text-app-ink transition focus:border-app-primary focus:ring-app-primary"
			/>
		</div>

		<div>
			<label for="password" class="mb-1 block text-sm font-semibold text-app-ink">Password</label>
			<input
				type="password"
				id="password"
				name="password"
				placeholder="Enter your password"
				required
				class="w-full rounded-md border-app-line bg-white p-3 text-app-ink transition focus:border-app-primary focus:ring-app-primary"
			/>
		</div>

		<button
			type="submit"
			class="w-full rounded-md bg-app-primary px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-app-primary-dark hover:shadow-md"
		>
			Login
		</button>

		<div class="flex flex-wrap items-center justify-between gap-3 text-sm">
			<a
				href={resolve('/')}
				class="font-semibold text-app-muted transition hover:text-app-primary hover:underline"
				>Home</a
			>
			<a
				href={resolve('/register')}
				class="font-semibold text-app-primary transition hover:text-app-primary-dark hover:underline"
			>
				Create account
			</a>
		</div>
	</form>
</main>
